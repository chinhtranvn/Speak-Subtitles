(function(){
  const API_KEY = ""; // Add your Google Cloud TTS API key here
  const GOOGLE_VOICE_URI_PREFIX = "google-voice:";

  const customVoices = [
    {voiceURI: GOOGLE_VOICE_URI_PREFIX + "en-US-Wavenet-D", name: "Google Wavenet D (en-US)", lang: "en-US"},
    {voiceURI: GOOGLE_VOICE_URI_PREFIX + "vi-VN-Wavenet-A", name: "Google Wavenet A (vi-VN)", lang: "vi-VN"}
  ];

  const originalGetVoices = window.speechSynthesis.getVoices.bind(window.speechSynthesis);
  window.speechSynthesis.getVoices = function(){
    return originalGetVoices().concat(customVoices);
  };

  // Notify any listeners that the available voices list changed so the
  // injected Google voices show up in selection dropdowns.
  try {
    window.speechSynthesis.dispatchEvent(new Event("voiceschanged"));
    if (typeof window.speechSynthesis.onvoiceschanged === "function") {
      window.speechSynthesis.onvoiceschanged();
    }
  } catch (e) {
    console.warn("Unable to dispatch voiceschanged event", e);
  }

  const originalSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
  window.speechSynthesis.speak = function(utterance){
    const voice = utterance.voice;
    if(voice && voice.voiceURI && voice.voiceURI.startsWith(GOOGLE_VOICE_URI_PREFIX)){
      if(!API_KEY){
        console.warn("Google TTS API key is not set.");
        originalSpeak(utterance);
        return;
      }
      const voiceName = voice.voiceURI.substring(GOOGLE_VOICE_URI_PREFIX.length);
      const data = {
        input: {text: utterance.text},
        voice: {languageCode: utterance.lang || voice.lang || "en-US", name: voiceName},
        audioConfig: {audioEncoding: "MP3"}
      };
      fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
      })
      .then(r => r.json())
      .then(j => {
        if(j.audioContent){
          const audio = new Audio(`data:audio/mpeg;base64,${j.audioContent}`);
          if (typeof utterance.onstart === "function") {
            utterance.onstart();
          }
          audio.addEventListener('ended', () => {
            if (typeof utterance.onend === "function") {
              utterance.onend();
            }
          });
          audio.addEventListener('error', (e) => {
            console.error('Audio playback failed', e);
            if (typeof utterance.onerror === "function") {
              utterance.onerror(e);
            }
          });
          audio.play().catch(err => {
            console.error('Audio play promise rejected', err);
          });
        } else {
          console.error('No audioContent in TTS response', j);
          originalSpeak(utterance);
        }
      })
      .catch(err => {
        console.error('Google TTS request failed', err);
        originalSpeak(utterance);
      });
    } else {
      originalSpeak(utterance);
    }
  };
})();
