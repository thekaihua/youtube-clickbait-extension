# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Code Architecture

This is a Chrome extension that detects and flags clickbait videos on YouTube.

- `manifest.json`: Defines the extension's permissions, background scripts, content scripts, and popup.
- `background.js`: A service worker that runs in the background. It listens for messages from the content script and calls the Gemini API to analyze video titles.
- `content.js`: Injected into YouTube pages. It finds video links, sends them to `background.js` for analysis, and adds a "clickbait" ribbon to videos that are flagged.
- `popup.html`/`popup.js`: The extension's popup, which allows the user to enter their Gemini API key.

## Common Commands

There are no build, linting, or testing commands in this project. To test the extension, you need to load it into Chrome as an unpacked extension.

To do this:

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable "Developer mode".
3.  Click "Load unpacked".
4.  Select the directory containing this codebase.
