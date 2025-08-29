export async function synthesize(text, cfg) {
  const url =
    "https://texttospeech.googleapis.com/v1/text:synthesize?key=" +
    cfg.apiKey;

  const body = {
    input: { text },
    voice: { languageCode: cfg.language, name: cfg.voice },
    audioConfig: {
      audioEncoding: "MP3",
      pitch: cfg.pitch,
      speakingRate: cfg.speechRate,
      volumeGainDb: (cfg.volume - 1) * 10
    }
  };

  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body)
  });

  const { audioContent } = await res.json();
  const array = Uint8Array.from(atob(audioContent), c => c.charCodeAt(0));
  const audioBuffer = await new AudioContext().decodeAudioData(array.buffer);
  return { audioBuffer };
}
