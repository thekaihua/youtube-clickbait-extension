// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeVideo") {
    // 1. Get the saved API key
    chrome.storage.sync.get(['geminiApiKey'], (result) => {
      if (result.geminiApiKey) {
        // 2. If key exists, call the Gemini API
        callGeminiApi(request.videoUrl, result.geminiApiKey, sendResponse);
      } else {
        // 3. If no key, send an error back
        sendResponse({ status: "error", message: "API key not set." });
      }
    });

    // Return true to indicate that we will send a response asynchronously
    return true;
  }
});

// Function to call the Gemini API
async function callGeminiApi(videoUrl, apiKey, sendResponse) {
  const prompt = `
    Analyze the content of the YouTube video at this URL: ${videoUrl}
    Based on the video's transcript, please provide the following as a JSON object:
    1. A one-sentence summary of the video.
    2. A "confidence_score" (0-100) of how likely the video is to be clickbait, by comparing the summary to the video's title.
    3. A brief "reasoning" for your score.

    Your response must be a single, valid JSON object with the keys "summary", "confidence_score", and "reasoning".
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // The Gemini response is often wrapped in markdown, so we need to clean it
    const rawText = data.candidates[0].content.parts[0].text;
    const jsonText = rawText.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(jsonText);

    sendResponse({ status: "success", analysis: analysis });

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    sendResponse({ status: "error", message: error.message });
  }
}
