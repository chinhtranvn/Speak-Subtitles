import { getConfig } from "./storage.js";

let queue = [];
let playing = false;
let lastEnd = 0;
let enabled = false;

chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === "toggle") {
    enabled = msg.enabled;
    if (enabled) init();
    else queue = [];
  }
});

async function init() {
  const cfg = await getConfig();
  if (!cfg.enabled || !enabled) return;

  const subs = await fetchSubtitles();
  subs.forEach(enqueue);
}

function enqueue(sub) {
  if (sub.end <= lastEnd) return; // prevent repeats
  queue.push(sub);
  lastEnd = sub.end;
  if (!playing) playNext();
}

async function playNext() {
  if (!queue.length) {
    playing = false;
    return;
  }
  playing = true;

  const cfg = await getConfig();
  const sub = queue.shift();
  let text = sub.text;

  if (cfg.translate && sub.lang !== cfg.language) {
    text = await translate(text, cfg.language, cfg.apiKey);
  }

  const { audioBuffer } = await chrome.runtime.sendMessage({
    type: "tts",
    text,
    settings: cfg
  });

  const video = document.querySelector("video");
  const subtitleDuration = sub.end - sub.start;
  const audioDuration = audioBuffer.duration;

  let rate = cfg.speechRate;
  if (audioDuration > subtitleDuration) {
    while (audioDuration / rate > subtitleDuration && rate > cfg.minRate) {
      rate -= 0.05;
    }
  } else {
    while (audioDuration / rate < subtitleDuration && rate < cfg.maxRate) {
      rate += 0.05;
    }
  }

  const ctx = new AudioContext();
  const src = ctx.createBufferSource();
  src.buffer = audioBuffer;
  src.playbackRate.value = rate / cfg.speechRate;
  src.connect(ctx.destination);
  src.onended = playNext;
  video.playbackRate = rate;
  src.start();
}

async function fetchSubtitles() {
  const player = document.querySelector("ytd-player");
  const track = player?.querySelector("track[kind='captions']");
  if (!track) return [];

  const res = await fetch(track.src);
  const xml = new DOMParser().parseFromString(await res.text(), "text/xml");
  return [...xml.getElementsByTagName("text")].map(t => ({
    start: parseFloat(t.getAttribute("start")),
    end:
      parseFloat(t.getAttribute("start")) +
      parseFloat(t.getAttribute("dur")),
    text: t.textContent.trim(),
    lang: track.srclang
  }));
}

async function translate(text, target, apiKey) {
  const url =
    "https://translation.googleapis.com/language/translate/v2?key=" + apiKey;
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify({ q: text, target })
  });
  const data = await res.json();
  return data.data.translations[0].translatedText;
}
