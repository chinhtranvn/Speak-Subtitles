// Google Text-to-Speech helper functions and message handling
// This file runs in the extension service worker

const TTS_VOICE_URL = 'https://texttospeech.googleapis.com/v1/voices';
const TTS_SYNTHESIZE_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// Simple in-memory cache for synthesized audio
const audioCache = new Map();

async function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['googleApiKey'], (res) => {
      resolve(res.googleApiKey || '');
    });
  });
}

async function fetchVoices() {
  const key = await getApiKey();
  if (!key) throw new Error('Missing API key');
  const resp = await fetch(`${TTS_VOICE_URL}?key=${key}`);
  if (!resp.ok) throw new Error(`Voice list error: ${resp.status}`);
  const data = await resp.json();
  const voices = data.voices || [];
  // Store voices for popup usage
  await new Promise((resolve) => chrome.storage.local.set({ googleVoices: voices }, resolve));
  return voices;
}

async function synthesize(text, opts = {}) {
  const key = await getApiKey();
  if (!key) throw new Error('Missing API key');
  const cacheKey = JSON.stringify({ text, ...opts });
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey);
  }
  const body = {
    input: { text },
    voice: { languageCode: opts.languageCode || 'en-US', name: opts.voiceName },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: opts.rate || 1,
      pitch: opts.pitch || 0,
      volumeGainDb: opts.volumeGainDb || 0,
    },
  };
  const resp = await fetch(`${TTS_SYNTHESIZE_URL}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`Synthesize error: ${resp.status}`);
  const data = await resp.json();
  const audio = data.audioContent || null;
  audioCache.set(cacheKey, audio);
  return audio;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return;
  (async () => {
    try {
      switch (msg.type) {
        case 'tts-fetch-voices':
          const voices = await fetchVoices();
          sendResponse({ ok: true, voices });
          break;
        case 'tts-synthesize':
          const audio = await synthesize(msg.text, msg.opts);
          sendResponse({ ok: true, audio });
          break;
        default:
          sendResponse({ ok: false, error: 'Unknown message type' });
      }
    } catch (err) {
      sendResponse({ ok: false, error: err.message });
    }
  })();
  // return true to indicate async response
  return true;
});

