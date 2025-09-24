document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveButton = document.getElementById('saveKey');

  // Load the saved API key when the popup opens
  chrome.storage.sync.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
    }
  });

  // Save the API key when the save button is clicked
  saveButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
        console.log('Gemini API key saved.');
        window.close(); // Close the popup after saving
      });
    }
  });
});
