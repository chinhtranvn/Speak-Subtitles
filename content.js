const storage = import(chrome.runtime.getURL("storage.js"));

async function fetchConfig() {
  const { getConfig } = await storage;
  return getConfig();
}

let queue = [];
let playing = false;
let lastEnd = 0;
let enabled = false;
let audioCtx;
let currentSrc;

chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === "toggle") {
    enabled = msg.enabled;
    if (enabled) {
      init();
    } else {
      queue = [];
      playing = false;
      if (currentSrc) currentSrc.stop();
      if (audioCtx) audioCtx.close();
      const video = document.querySelector("video");
      if (video) video.playbackRate = 1;
    }
  }
});

(async () => {
  const cfg = await fetchConfig();
  enabled = cfg.enabled;
  if (enabled) init();
})();

async function init() {
  const cfg = await fetchConfig();
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

  const cfg = await fetchConfig();
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

  audioCtx = new AudioContext();
  currentSrc = audioCtx.createBufferSource();
  currentSrc.buffer = audioBuffer;
  currentSrc.playbackRate.value = rate / cfg.speechRate;
  currentSrc.connect(audioCtx.destination);
  currentSrc.onended = playNext;
  video.playbackRate = rate;
  currentSrc.start();
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
