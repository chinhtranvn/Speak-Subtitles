# Speak Subtitles

## Vietnamese Text-to-Speech via Google API

This extension now supports reading subtitles in natural Vietnamese using Google Cloud Text-to-Speech.

### Setup
1. Create a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Text-to-Speech API** for the project.
3. Generate an API key and copy it.
4. Open YouTube in Chrome and run the following in the developer console:
   ```js
   localStorage.setItem('google_tts_api_key', 'YOUR_API_KEY');
   ```
5. Reload the extension or the YouTube page. When subtitles are in Vietnamese, the extension will use the Google voice instead of the browser voice.

### Notes
- The API key is stored in `localStorage` and can be removed with `localStorage.removeItem('google_tts_api_key');`.
- If the API call fails, the extension falls back to the browser's default speech synthesis.
