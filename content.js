let processedLinks = new Set();

// Function to find and log new, unique video links
const findAndLogVideoLinks = () => {
  const videoElements = document.querySelectorAll('a#video-title-link, a.yt-simple-endpoint.style-scope.ytd-grid-video-renderer, a.yt-simple-endpoint.style-scope.ytd-compact-video-renderer');

  videoElements.forEach(el => {
    // Ensure it is a valid, unique video link
    if (el.href && el.href.includes('/watch?v=') && !processedLinks.has(el.href)) {
      processedLinks.add(el.href);
      console.log('Found new video:', el.href);

      // Send the link to the background for processing
      chrome.runtime.sendMessage({ action: "analyzeVideo", videoUrl: el.href }, (response) => {
        if (chrome.runtime.lastError) {
          // Ignore errors from the tab being closed
          return;
        }
        console.log('Background response:', response);
      });
    }
  });
};

// --- Observers to handle YouTube's dynamic loading ---

// This observer watches for new elements being added to the page
const contentObserver = new MutationObserver(findAndLogVideoLinks);

// This observer detects page navigation by watching for a change in the page title
const titleObserver = new MutationObserver(() => {
  console.log('Navigation detected. Resetting link list.');
  processedLinks.clear();
  findAndLogVideoLinks();
});

// --- Initial Setup ---

// Run the function once on initial load
findAndLogVideoLinks();

// Start observing the page body for changes
contentObserver.observe(document.body, { childList: true, subtree: true });

// Start observing the title for navigation
const titleElement = document.querySelector('title');
if (titleElement) {
  titleObserver.observe(titleElement, { childList: true });
}
