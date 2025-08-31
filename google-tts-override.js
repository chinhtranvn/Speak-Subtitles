(()=>{
  class SpeechSynthesisUtterance {
    constructor(text=""){ this.text = text; }
  }

  async function speak(utterance){
    const apiKey = await new Promise(res=>{
      if(!chrome?.storage?.sync){ res(""); return; }
      chrome.storage.sync.get("googleApiKey", d=>res(d.googleApiKey||""));
    });
    if(!apiKey){
      console.warn("Google API key not configured; speech disabled");
      return;
    }
    try{
      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          input:{text:utterance.text},
          voice:{languageCode:"vi-VN", ssmlGender:"FEMALE"},
          audioConfig:{audioEncoding:"MP3"}
        })
      });
      if(!response.ok){
        console.error("Google TTS request failed", response.status);
        return;
      }
      const data = await response.json();
      if(!data.audioContent){
        console.error("No audioContent returned from Google TTS");
        return;
      }
      const audio = new Audio("data:audio/mp3;base64,"+data.audioContent);
      await audio.play();
    }catch(err){
      console.error("Google TTS error", err);
    }
  }

  window.SpeechSynthesisUtterance = SpeechSynthesisUtterance;
  window.speechSynthesis = {
    speak,
    cancel: ()=>{}
  };
})();
