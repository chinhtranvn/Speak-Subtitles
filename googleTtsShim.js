// Override Web Speech API to use Google TTS
(function() {
  const synth = window.speechSynthesis;
  const msgQueue = [];
  let current = null;
  let paused = false;
  let voices = [];

  function loadVoices() {
    chrome.storage.local.get(['googleVoices'], (res) => {
      const list = res.googleVoices || [];
      voices = list.map((v, i) => ({
        voiceURI: v.name,
        name: v.name,
        lang: (v.languageCodes && v.languageCodes[0]) || 'en-US',
        localService: false,
        default: i === 0,
      }));
      synth.onvoiceschanged && synth.onvoiceschanged();
      window.dispatchEvent(new Event('voiceschanged'));
    });
  }

  function base64ToUrl(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'audio/mp3' });
    return URL.createObjectURL(blob);
  }

  function playNext() {
    if (current || paused) return;
    const item = msgQueue.shift();
    if (!item) return;
    const { utt, audio64 } = item;
    const url = base64ToUrl(audio64);
    const audio = new Audio(url);
    current = { audio, utt };
    audio.addEventListener('ended', () => {
      utt.onend && utt.onend();
      current = null;
      playNext();
    });
    audio.addEventListener('play', () => {
      utt.onstart && utt.onstart();
    });
    audio.play().catch((err) => {
      console.error(err);
      utt.onerror && utt.onerror(err);
      current = null;
      playNext();
    });
  }

  synth.speak = function(utt) {
    chrome.runtime.sendMessage({
      type: 'tts-synthesize',
      text: utt.text,
      opts: {
        voiceName: utt.voice && utt.voice.name,
        languageCode: utt.lang,
        rate: utt.rate,
        pitch: utt.pitch,
        volumeGainDb: (utt.volume - 1) * 6,
      },
    }, (res) => {
      if (res && res.ok && res.audio) {
        msgQueue.push({ utt, audio64: res.audio });
        playNext();
      } else {
        console.error(res && res.error);
        utt.onerror && utt.onerror(res && res.error);
      }
    });
  };

  synth.pause = function() {
    if (current) {
      current.audio.pause();
      paused = true;
    }
  };

  synth.resume = function() {
    if (current && paused) {
      current.audio.play();
      paused = false;
    }
  };

  synth.cancel = function() {
    msgQueue.length = 0;
    if (current) {
      current.audio.pause();
      current = null;
    }
    paused = false;
  };

  Object.defineProperty(synth, 'speaking', {
    get() { return !!current && !current.audio.paused; }
  });

  synth.getVoices = function() {
    return voices;
  };

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.googleVoices) {
      loadVoices();
    }
  });

  loadVoices();
})();
