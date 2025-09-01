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

  const originalSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
  window.speechSynthesis.speak = function(utterance){
    const voice = utterance.voice;
    if(voice && voice.voiceURI && voice.voiceURI.startsWith(GOOGLE_VOICE_URI_PREFIX)){
      if(!API_KEY){
        console.warn("Google TTS API key is not set.");
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
      }).then(r => r.json()).then(j => {
        if(j.audioContent){
          const audio = new Audio(`data:audio/mp3;base64,${j.audioContent}`);
          audio.play();
        }
      });
    } else {
      originalSpeak(utterance);
    }
  };
})();
