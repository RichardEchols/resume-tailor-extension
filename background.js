// Resume Tailor - Background Service Worker

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Resume Tailor extension installed');
  } else if (details.reason === 'update') {
    console.log('Resume Tailor extension updated to version', chrome.runtime.getManifest().version);
  }
});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTabInfo') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        sendResponse({ url: tabs[0].url, title: tabs[0].title });
      } else {
        sendResponse({ error: 'No active tab found' });
      }
    });
    return true; // Keep the message channel open for async response
  }
});

// Optional: Add context menu for quick access
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'resumeTailor',
    title: 'Generate Resume for This Job',
    contexts: ['page'],
    documentUrlPatterns: [
      '*://*.linkedin.com/jobs/*',
      '*://*.indeed.com/*',
      '*://*.glassdoor.com/*'
    ]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'resumeTailor') {
    // Open the popup (this will trigger the extension popup)
    chrome.action.openPopup();
  }
});
