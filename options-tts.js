// Options page helper for managing Google TTS API key and voices

document.addEventListener('DOMContentLoaded', () => {
  const keyInput = document.getElementById('google-api-key');
  const saveBtn = document.getElementById('save-google-key');
  const loadBtn = document.getElementById('load-google-voices');
  const voiceList = document.getElementById('google-voice-list');

  chrome.storage.sync.get(['googleApiKey', 'googleVoices'], (res) => {
    if (res.googleApiKey) keyInput.value = res.googleApiKey;
    if (Array.isArray(res.googleVoices)) populateVoices(res.googleVoices);
  });

  saveBtn.addEventListener('click', () => {
    chrome.storage.sync.set({ googleApiKey: keyInput.value });
  });

  loadBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'tts-fetch-voices' }, (res) => {
      if (res && res.ok && Array.isArray(res.voices)) {
        populateVoices(res.voices);
      } else {
        console.error(res && res.error);
      }
    });
  });

  function populateVoices(voices) {
    voiceList.innerHTML = '';
    voices.forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v.name;
      const lang = (v.languageCodes || []).join(',');
      opt.textContent = `${v.name} (${lang})`;
      voiceList.appendChild(opt);
    });
  }
});

