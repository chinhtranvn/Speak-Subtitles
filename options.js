document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('apiKey');
  const status = document.getElementById('status');
  const accessBtn = document.getElementById('requestAccess');
  if(chrome?.storage?.sync){
    chrome.storage.sync.get('googleApiKey', data => {
      if(data.googleApiKey) input.value = data.googleApiKey;
    });
    document.getElementById('save').addEventListener('click', () => {
      const value = input.value.trim();
      chrome.storage.sync.set({ googleApiKey: value }, () => {
        status.textContent = 'Saved';
        setTimeout(() => { status.textContent = ''; }, 1000);
      });
    });
  }
  if(accessBtn && document.requestStorageAccessFor){
    accessBtn.addEventListener('click', async () => {
      try {
        await document.requestStorageAccessFor('https://texttospeech.googleapis.com');
        console.log('Storage access granted.');
      } catch (error) {
        console.error('Storage access denied:', error);
      }
    });
  }
});
