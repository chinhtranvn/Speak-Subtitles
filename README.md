# Speak-Subtitles

A Chrome Extension (Manifest V3) that reads YouTube subtitles using the Google
Cloud Text-to-Speech API. Subtitles are queued and spoken in order, with audio
playback synchronized to the video's timeline. If the subtitle language differs
from the configured language, the text can be translated automatically before
synthesis.

## Features
- Toolbar icon toggles the add-on on/off and stores state in `chrome.storage`.
- Settings popup for API key, language, translation, voice, pitch, volume and
  speech rate (with min/max constraints).
- Content script fetches YouTube captions even when the CC button is off,
  prevents duplicates and maintains a queue.
- Google Cloud TTS + Web Audio API produce audio; playback rate adjusts to keep
  subtitles, speech and video aligned.

## Usage
1. Obtain a Google Cloud API key with Text-to-Speech and Translation APIs
   enabled.
2. Load this folder as an unpacked extension from `chrome://extensions`.
3. Open a YouTube video, enable the extension via the toolbar icon and provide
   settings through the popup.
