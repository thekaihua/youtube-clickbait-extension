let processedLinks = new Set();

// Function to find video links and log them to the console
const findAndLogVideoLinks = () => {
  const videoElements = document.querySelectorAll(
    'a#video-title-link, a.yt-simple-endpoint.style-scope.ytd-grid-video-renderer, a.yt-simple-endpoint.style-scope.ytd-compact-video-renderer'
  );

  videoElements.forEach(el => {
    if (el.href && el.href.includes('/watch?v=') && !processedLinks.has(el.href)) {
      processedLinks.add(el.href);
      console.log('Found new video link:', el.href);

      // Send the link to the background script for analysis
      chrome.runtime.sendMessage({ action: "analyzeVideo", videoUrl: el.href }, (response) => {
        if (chrome.runtime.lastError) {
          // This error happens when the page context is invalidated. We can ignore it.
          return;
        }

        if (response.status === "success") {
          // Check the confidence score from the analysis
          if (response.analysis.confidence_score >= 1) {
            console.log(`%cClickbait DETECTED for ${el.href} (Score: ${response.analysis.confidence_score})`, 'color: red; font-weight: bold;');
            addRibbon(el, response.analysis);
          } else {
            console.log(`Video OK: ${el.href} (Score: ${response.analysis.confidence_score})`);
          }
        } else {
          console.error('Analysis failed for', el.href, ':', response.message);
        }
      });
    }
  });
};

// Observer for new videos being added to the page (e.g., infinite scroll)
const contentObserver = new MutationObserver(findAndLogVideoLinks);

// Observer for page navigation (by watching the <title> element)
const titleObserver = new MutationObserver(() => {
  console.log('YouTube navigation detected, resetting processed links.');
  processedLinks.clear(); // Clear the set for the new page
  findAndLogVideoLinks(); // Run detection on the new page content
});

// Initial run when the script is first loaded
findAndLogVideoLinks();

// Start observing the body for dynamically added videos
contentObserver.observe(document.body, { childList: true, subtree: true });

// Start observing the title for page navigations
const titleElement = document.querySelector('title');
if (titleElement) {
  titleObserver.observe(titleElement, { childList: true });
}

// Function to add the ribbon UI to a video element
const addRibbon = (videoElement, analysis) => {
  // Find the thumbnail container. The selector needs to be robust for different video types (grid, list, etc.).
  const thumbnail = videoElement.closest('ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer');
  if (!thumbnail || thumbnail.querySelector('.clickbait-ribbon')) {
    // If we can't find the thumbnail or a ribbon already exists, do nothing.
    return;
  }

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
    backgroundColor: 'red',
    color: 'white',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    transform: 'rotate(-45deg)',
    zIndex: '999',
  });

  // Create the tooltip to show the reasoning on hover
  const tooltip = document.createElement('span');
  tooltip.textContent = analysis.reasoning;
  tooltip.className = 'clickbait-tooltip';
  Object.assign(tooltip.style, {
    visibility: 'hidden', // Initially hidden
    position: 'absolute',
    bottom: '120%', // Position above the ribbon
    left: '50%',
    transform: 'translateX(-50%)',
    width: '220px',
    backgroundColor: 'black',
    color: 'white',
    textAlign: 'center',
    borderRadius: '6px',
    padding: '8px',
    zIndex: '1000',
    fontSize: '13px',
  });

  // Show/hide tooltip on hover
  ribbon.addEventListener('mouseenter', () => { tooltip.style.visibility = 'visible'; });
  ribbon.addEventListener('mouseleave', () => { tooltip.style.visibility = 'hidden'; });

  ribbon.appendChild(tooltip);

  // Find the specific thumbnail element and inject the ribbon
  const thumbnailWrapper = thumbnail.querySelector('#thumbnail');
  if (thumbnailWrapper) {
    thumbnailWrapper.style.overflow = 'hidden'; // Important for the ribbon effect
    thumbnailWrapper.appendChild(ribbon);
  }
};
