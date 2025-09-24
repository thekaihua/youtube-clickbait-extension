// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeVideo") {
    console.log("Received video for analysis:", request.videoUrl);
    // We will add the API call logic here in the next step.
    // For now, send a dummy success response.
    sendResponse({ status: "success", message: "Request received" });
  }
  // Keep the message channel open for the asynchronous response
  return true;
});
