(function(){
  const API_KEY = localStorage.getItem('google_tts_api_key');
  const originalSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);

  async function googleSpeak(text){
    if(!API_KEY){
      console.error('Google TTS API key not set');
      return;
    }
    try{
      const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key='+API_KEY,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          input:{text},
          voice:{languageCode:'vi-VN', name:'vi-VN-Neural2-D'},
          audioConfig:{audioEncoding:'MP3'}
        })
      });
      const data = await res.json();
      const audio = new Audio('data:audio/mp3;base64,'+data.audioContent);
      await audio.play();
    }catch(err){
      console.error('Google TTS request failed', err);
    }
  }

  window.speechSynthesis.speak = function(utter){
    if(utter?.lang?.startsWith('vi')){
      googleSpeak(utter.text).catch(e=>console.error(e));
    } else {
      originalSpeak(utter);
    }
  };
})();
