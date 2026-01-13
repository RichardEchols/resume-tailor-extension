// Resume Tailor - Background Service Worker

// Import ExtPay for payment handling
importScripts('ExtPay.js');

// Initialize ExtensionPay with your extension ID
const extpay = ExtPay('resume-tailor');
extpay.startBackground();

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Resume Tailor extension installed');
    // Initialize usage tracking on install
    initializeUsageTracking();
  } else if (details.reason === 'update') {
    console.log('Resume Tailor extension updated to version', chrome.runtime.getManifest().version);
  }
});

// Initialize usage tracking for new installs
async function initializeUsageTracking() {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;

  const existing = await chrome.storage.local.get(['usageData']);
  if (!existing.usageData) {
    await chrome.storage.local.set({
      usageData: {
        currentMonth: monthKey,
        generationsThisMonth: 0
      }
    });
  }
}

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
    return true;
  }

  // Handle payment status check
  if (request.action === 'checkPaymentStatus') {
    extpay.getUser().then(user => {
      sendResponse({
        paid: user.paid,
        email: user.email,
        paidAt: user.paidAt,
        subscriptionStatus: user.subscriptionStatus
      });
    }).catch(error => {
      console.error('Error checking payment status:', error);
      sendResponse({ paid: false, error: error.message });
    });
    return true;
  }

  // Handle opening payment page
  if (request.action === 'openPaymentPage') {
    extpay.openPaymentPage(request.plan || null);
    sendResponse({ success: true });
    return true;
  }

  // Handle opening login page for existing customers
  if (request.action === 'openLoginPage') {
    extpay.openLoginPage();
    sendResponse({ success: true });
    return true;
  }
});

// Listen for payment completion
extpay.onPaid.addListener(user => {
  console.log('Payment received!', user.email);
  // Notify any open popups about the payment
  chrome.runtime.sendMessage({ action: 'paymentCompleted', user });
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
    chrome.action.openPopup();
  }
});
