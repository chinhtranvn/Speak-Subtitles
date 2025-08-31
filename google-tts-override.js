(()=>{
  const originalSpeak = window.speechSynthesis?.speak.bind(window.speechSynthesis);
  async function googleSpeak(utterance){
    const apiKey = await new Promise(res=>{
      if (!chrome?.storage?.sync){ res(''); return; }
      chrome.storage.sync.get('googleApiKey', data=>res(data.googleApiKey||''));
    });
    if(!apiKey){
      console.warn('Google API key not configured; falling back to Web Speech API');
      return originalSpeak(utterance);
    }
    try{
      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          input:{text:utterance.text},
          voice:{languageCode:'vi-VN', ssmlGender:'FEMALE'},
          audioConfig:{audioEncoding:'MP3'}
        })
      });
      if(!response.ok){
        console.error('Google TTS request failed', response.status);
        return originalSpeak(utterance);
      }
      const data = await response.json();
      if(!data.audioContent){
        console.error('No audioContent returned from Google TTS');
        return originalSpeak(utterance);
      }
      const audio = new Audio('data:audio/mp3;base64,'+data.audioContent);
      audio.play();
    }catch(err){
      console.error('Google TTS error', err);
      originalSpeak(utterance);
    }
  }
  if(window.speechSynthesis && originalSpeak){
    window.speechSynthesis.speak = function(utterance){
      googleSpeak(utterance);
    };
  }
})();
