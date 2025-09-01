(function(){
  const API_KEY = ""; // Add your Google Cloud TTS API key here
  const GOOGLE_VOICE_URI_PREFIX = "google-voice:";

  const customVoices = [
    {voiceURI: GOOGLE_VOICE_URI_PREFIX + "en-US-Wavenet-D", name: "Google Wavenet D (en-US)", lang: "en-US", localService: false, default: false},
    {voiceURI: GOOGLE_VOICE_URI_PREFIX + "vi-VN-Wavenet-A", name: "Google Wavenet A (vi-VN)", lang: "vi-VN", localService: false, default: false}
  ];

  const synth = window.speechSynthesis;

  const originalGetVoices = synth.getVoices.bind(synth);
  synth.getVoices = function(){
    return originalGetVoices().concat(customVoices);
  };

  try {
    synth.dispatchEvent(new Event("voiceschanged"));
    if (typeof synth.onvoiceschanged === "function") {
      synth.onvoiceschanged();
    }
  } catch (e) {
    console.warn("Unable to dispatch voiceschanged event", e);
  }

  const originalSpeak = synth.speak.bind(synth);
  const originalCancel = synth.cancel.bind(synth);
  const originalPause = synth.pause.bind(synth);
  const originalResume = synth.resume.bind(synth);
  const proto = Object.getPrototypeOf(synth) || SpeechSynthesis.prototype;
  const speakingDesc = Object.getOwnPropertyDescriptor(proto, "speaking");
  const pausedDesc = Object.getOwnPropertyDescriptor(proto, "paused");

  let currentAudio = null;
  let currentUtterance = null;
  let googleSpeaking = false;

  Object.defineProperty(synth, "speaking", {
    get(){
      return googleSpeaking || (speakingDesc && speakingDesc.get.call(synth));
    }
  });

  Object.defineProperty(synth, "paused", {
    get(){
      return (currentAudio ? currentAudio.paused : false) || (pausedDesc && pausedDesc.get.call(synth));
    }
  });

  synth.speak = function(utterance){
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
          currentAudio = audio;
          currentUtterance = utterance;
          if (typeof utterance.onstart === "function") {
            utterance.onstart();
          }
          audio.addEventListener("ended", () => {
            googleSpeaking = false;
            currentAudio = null;
            if (typeof utterance.onend === "function") {
              utterance.onend();
            }
          });
          audio.addEventListener("error", (e) => {
            googleSpeaking = false;
            console.error("Audio playback failed", e);
            if (typeof utterance.onerror === "function") {
              utterance.onerror(e);
            }
          });
          audio.play().then(() => {
            googleSpeaking = true;
          }).catch(err => {
            googleSpeaking = false;
            console.error("Audio play promise rejected", err);
          });
        } else {
          console.error("No audioContent in TTS response", j);
          originalSpeak(utterance);
        }
      })
      .catch(err => {
        console.error("Google TTS request failed", err);
        originalSpeak(utterance);
      });
    } else {
      originalSpeak(utterance);
    }
  };

  synth.cancel = function(){
    if(currentAudio){
      currentAudio.pause();
      currentAudio.currentTime = 0;
      googleSpeaking = false;
      if(currentUtterance && typeof currentUtterance.onend === "function"){
        currentUtterance.onend();
      }
      currentAudio = null;
      currentUtterance = null;
    }
    originalCancel();
  };

  synth.pause = function(){
    if(currentAudio && !currentAudio.paused){
      currentAudio.pause();
      googleSpeaking = false;
      if(currentUtterance && typeof currentUtterance.onpause === "function"){
        currentUtterance.onpause();
      }
    } else {
      originalPause();
    }
  };

  synth.resume = function(){
    if(currentAudio && currentAudio.paused){
      currentAudio.play().then(() => {
        googleSpeaking = true;
        if(currentUtterance && typeof currentUtterance.onresume === "function"){
          currentUtterance.onresume();
        }
      }).catch(err => {
        console.error("Resume play failed", err);
      });
    } else {
      originalResume();
    }
  };
})();

