let processedLinks = new Set();
let activeElements = [];

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
        
        // Log the full analysis object for debugging
        console.log('Analysis for', el.href, 'received:', response);

        if (response.status === "success") {
          // Check the probability score
          if (response.analysis && response.analysis.clickbait_probability_score >= 80) {
            console.log(`%cClickbait DETECTED (Score: ${response.analysis.clickbait_probability_score})`, 'color: red; font-weight: bold;', el.href);
            addRibbon(el, response.analysis);
          }
        } else {
          console.error('Analysis failed for', el.href, ':', response.message);
        }
      });
    }
  });
};

// Function to add the ribbon UI to a video element
const addRibbon = (videoElement, analysis) => {
  // Find the thumbnail container. The selector needs to be robust for different video types (grid, list, etc.).
  const thumbnail = videoElement.closest('ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer');
  if (!thumbnail || thumbnail.dataset.clickbaitRibbonAdded) {
    // If we can't find the thumbnail or a ribbon has already been added, do nothing.
    return;
  }
  thumbnail.dataset.clickbaitRibbonAdded = 'true';

  // Create the ribbon element
  const ribbon = document.createElement('div');
  ribbon.textContent = 'Suspected Clickbait';
  ribbon.className = 'clickbait-ribbon';
  Object.assign(ribbon.style, {
    position: 'absolute',
    top: '10px',
    left: '-34px',
    width: '160px',
    padding: '4px 0',
    background: 'linear-gradient(45deg, #ff416c, #ff4b2b)',
    color: 'white',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    transform: 'rotate(-45deg)',
    zIndex: '999',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
    border: '1px solid white',
  });

  // Create the tooltip but append it to the body to avoid being cut off
  const tooltip = document.createElement('span');
  tooltip.textContent = analysis.reasoning;
  tooltip.className = 'clickbait-tooltip';
  document.body.appendChild(tooltip);

  Object.assign(tooltip.style, {
    visibility: 'hidden',
    position: 'absolute',
    width: '220px',
    backgroundColor: 'black',
    color: 'white',
    textAlign: 'center',
    borderRadius: '6px',
    padding: '8px',
    zIndex: '99999',
    fontSize: '13px',
    transform: 'none',
  });

  // Show/hide and position tooltip on hover
  ribbon.addEventListener('mouseenter', () => {
    const rect = ribbon.getBoundingClientRect();
    tooltip.style.left = `${rect.left + window.scrollX + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
    tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 5}px`;
    tooltip.style.visibility = 'visible';
  });

  ribbon.addEventListener('mouseleave', () => {
    tooltip.style.visibility = 'hidden';
  });

  document.body.appendChild(ribbon);
  activeElements.push(ribbon, tooltip);

  // Position the ribbon over the thumbnail
  const thumbRect = thumbnail.getBoundingClientRect();
  ribbon.style.top = `${thumbRect.top + window.scrollY + 10}px`;
  ribbon.style.left = `${thumbRect.left + window.scrollX - 34}px`;
};


// --- Observers to handle YouTube's dynamic loading ---

// This observer watches for new elements being added to the page
const contentObserver = new MutationObserver(findAndLogVideoLinks);

// This observer detects page navigation by watching for a change in the page title
const titleObserver = new MutationObserver(() => {
  console.log('Navigation detected. Resetting link list.');
  for (const el of activeElements) {
    el.remove();
  }
  activeElements = [];
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
