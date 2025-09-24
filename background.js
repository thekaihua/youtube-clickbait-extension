let analysisQueue = [];
let isProcessing = false;

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeVideo") {
    // Add the new video and its response function to the queue
    analysisQueue.push({ videoUrl: request.videoUrl, sendResponse });
    // Start processing the queue if it's not already running
    processQueue();
  }
  return true; // Keep the message channel open for the asynchronous response
});

// Helper function to create a delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Processes the queue one by one, with a delay between each call
const processQueue = async () => {
  if (isProcessing) return; // Don't start a new loop if one is already running
  isProcessing = true;

  while (analysisQueue.length > 0) {
    const { videoUrl, sendResponse } = analysisQueue.shift(); // Get the next item

    // 1. Get the API key
    const { geminiApiKey } = await chrome.storage.sync.get(['geminiApiKey']);

    if (!geminiApiKey) {
      sendResponse({ status: "error", message: "API key not set." });
    } else {
      // 2. Call the Gemini API
      try {
        const prompt = `Based on the transcript of the YouTube video at this URL, provide a one-sentence summary: ${videoUrl}`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const summary = data.candidates[0].content.parts[0].text;
        sendResponse({ status: "success", summary: summary });
      } catch (error) {
        console.error("Error calling Gemini API:", error);
        sendResponse({ status: "error", message: error.message });
      }
    }

    // 3. Wait for 1.5 seconds before the next API call to respect rate limits
    await delay(1500);
  }

  isProcessing = false;
};
