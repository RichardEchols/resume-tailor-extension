// =============================================================================
// CONFIGURATION
// =============================================================================
const USE_BACKEND = true;
const API_BASE_URL = 'https://resume-tailor-api.richardechols92.workers.dev';

// =============================================================================
// DOM Elements
// =============================================================================
const setupView = document.getElementById('setupView');
const profilesView = document.getElementById('profilesView');
const profileEditorView = document.getElementById('profileEditorView');
const mainView = document.getElementById('mainView');
const settingsView = document.getElementById('settingsView');
const historyView = document.getElementById('historyView');
const settingsBtn = document.getElementById('settingsBtn');
const historyBtn = document.getElementById('historyBtn');
const backBtn = document.getElementById('backBtn');
const historyBackBtn = document.getElementById('historyBackBtn');

// Setup elements
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const phoneNumberInput = document.getElementById('phoneNumber');
const linkedinUrlInput = document.getElementById('linkedinUrl');
const saveSetupBtn = document.getElementById('saveSetupBtn');

// Profile elements
const profilesList = document.getElementById('profilesList');
const addProfileBtn = document.getElementById('addProfileBtn');
const continueToMainBtn = document.getElementById('continueToMainBtn');
const profileEditorBackBtn = document.getElementById('profileEditorBackBtn');
const profileEditorTitle = document.getElementById('profileEditorTitle');
const profileNameInput = document.getElementById('profileName');
const profileBackgroundInput = document.getElementById('profileBackground');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const deleteProfileBtn = document.getElementById('deleteProfileBtn');

// Settings elements
const settingsFullNameInput = document.getElementById('settingsFullName');
const settingsPhoneInput = document.getElementById('settingsPhone');
const settingsLinkedinInput = document.getElementById('settingsLinkedin');
const settingsBackgroundInput = document.getElementById('settingsBackground');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const clearDataBtn = document.getElementById('clearDataBtn');

// Main view elements
const activeProfileSelect = document.getElementById('activeProfile');
const manageProfilesBtn = document.getElementById('manageProfilesBtn');
const jobStatus = document.getElementById('jobStatus');
const jobPreview = document.getElementById('jobPreview');
const jobTitle = document.getElementById('jobTitle');
const jobCompany = document.getElementById('jobCompany');
const jobDescriptionPreview = document.getElementById('jobDescriptionPreview');
const initialMatchScore = document.getElementById('initialMatchScore');
const generateBtn = document.getElementById('generateBtn');
const loadingState = document.getElementById('loadingState');
const loadingText = document.getElementById('loadingText');
const resultView = document.getElementById('resultView');
const resumeContent = document.getElementById('resumeContent');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');

// Match score elements
const beforeScoreValue = document.getElementById('beforeScoreValue');
const afterScoreValue = document.getElementById('afterScoreValue');
const beforeProgress = document.getElementById('beforeProgress');
const afterProgress = document.getElementById('afterProgress');
const matchImprovement = document.getElementById('matchImprovement');

// Keywords elements
const keywordsSection = document.getElementById('keywordsSection');
const keywordsList = document.getElementById('keywordsList');

// Tab elements
const tabBtns = document.querySelectorAll('.tab-btn');
const resumeTab = document.getElementById('resumeTab');
const coverLetterTab = document.getElementById('coverLetterTab');
const interviewTab = document.getElementById('interviewTab');
const coverLetterContent = document.getElementById('coverLetterContent');
const interviewQuestions = document.getElementById('interviewQuestions');
const generateCoverLetterBtn = document.getElementById('generateCoverLetterBtn');
const copyCoverLetterBtn = document.getElementById('copyCoverLetterBtn');

// History elements
const historyList = document.getElementById('historyList');

// Toast
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// =============================================================================
// State
// =============================================================================
let currentJobData = null;
let generatedResume = null;
let generatedCoverLetter = null;
let generatedInterviewQuestions = null;
let matchScores = { before: 0, after: 0 };
let addedKeywords = [];
let editingProfileId = null;

// =============================================================================
// Initialize
// =============================================================================
document.addEventListener('DOMContentLoaded', init);

async function init() {
  const { contactInfo, profiles, activeProfileId } = await chrome.storage.local.get(['contactInfo', 'profiles', 'activeProfileId']);

  if (!contactInfo || !contactInfo.fullName) {
    showView('setup');
  } else if (!profiles || profiles.length === 0) {
    showView('profiles');
  } else {
    showView('main');
    loadProfileSelector();
    detectJobPosting();
  }

  // Setup tab navigation
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Download button - directly downloads as DOCX
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadAsDocx);
  }
}

// =============================================================================
// View Management
// =============================================================================
function showView(view) {
  setupView.classList.add('hidden');
  profilesView.classList.add('hidden');
  profileEditorView.classList.add('hidden');
  mainView.classList.add('hidden');
  settingsView.classList.add('hidden');
  historyView.classList.add('hidden');

  switch (view) {
    case 'setup':
      setupView.classList.remove('hidden');
      loadContactInfo();
      break;
    case 'profiles':
      profilesView.classList.remove('hidden');
      loadProfilesList();
      break;
    case 'profileEditor':
      profileEditorView.classList.remove('hidden');
      break;
    case 'main':
      mainView.classList.remove('hidden');
      break;
    case 'settings':
      settingsView.classList.remove('hidden');
      loadSettingsData();
      break;
    case 'history':
      historyView.classList.remove('hidden');
      loadHistory();
      break;
  }
}

async function loadContactInfo() {
  // First check for draft data (unsaved form data), then fall back to saved contact info
  const { contactInfo, setupDraft } = await chrome.storage.local.get(['contactInfo', 'setupDraft']);

  // Use draft if available, otherwise use saved contactInfo
  const data = setupDraft || contactInfo || {};

  if (fullNameInput) fullNameInput.value = data.fullName || '';
  if (emailInput) emailInput.value = data.email || '';
  if (phoneNumberInput) phoneNumberInput.value = data.phoneNumber || '';
  if (linkedinUrlInput) linkedinUrlInput.value = data.linkedinUrl || '';
}

// Auto-save form data as user types (so it persists if popup closes)
function saveSetupDraft() {
  const draft = {
    fullName: fullNameInput?.value || '',
    email: emailInput?.value || '',
    phoneNumber: phoneNumberInput?.value || '',
    linkedinUrl: linkedinUrlInput?.value || ''
  };
  chrome.storage.local.set({ setupDraft: draft });
}

async function loadSettingsData() {
  const { contactInfo } = await chrome.storage.local.get(['contactInfo']);
  if (contactInfo) {
    if (settingsFullNameInput) settingsFullNameInput.value = contactInfo.fullName || '';
    if (settingsPhoneInput) settingsPhoneInput.value = contactInfo.phoneNumber || '';
    if (settingsLinkedinInput) settingsLinkedinInput.value = contactInfo.linkedinUrl || '';
  }
}

// Tab Navigation
function switchTab(tabName) {
  tabBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  resumeTab.classList.toggle('hidden', tabName !== 'resume');
  coverLetterTab.classList.toggle('hidden', tabName !== 'cover-letter');
  interviewTab.classList.toggle('hidden', tabName !== 'interview');
}

// =============================================================================
// Event Listeners
// =============================================================================
settingsBtn.addEventListener('click', () => showView('settings'));
historyBtn.addEventListener('click', () => showView('history'));
backBtn.addEventListener('click', () => {
  showView('main');
  if (!currentJobData) detectJobPosting();
});
historyBackBtn.addEventListener('click', () => {
  showView('main');
  if (!currentJobData) detectJobPosting();
});

saveSetupBtn.addEventListener('click', saveSetup);

// Auto-save setup form fields as user types
if (fullNameInput) fullNameInput.addEventListener('input', saveSetupDraft);
if (emailInput) emailInput.addEventListener('input', saveSetupDraft);
if (phoneNumberInput) phoneNumberInput.addEventListener('input', saveSetupDraft);
if (linkedinUrlInput) linkedinUrlInput.addEventListener('input', saveSetupDraft);

// Profile management
addProfileBtn.addEventListener('click', () => openProfileEditor(null));
continueToMainBtn.addEventListener('click', async () => {
  const { profiles } = await chrome.storage.local.get(['profiles']);
  if (profiles && profiles.length > 0) {
    showView('main');
    loadProfileSelector();
    detectJobPosting();
  }
});
profileEditorBackBtn.addEventListener('click', () => showView('profiles'));
saveProfileBtn.addEventListener('click', saveProfile);
deleteProfileBtn.addEventListener('click', deleteProfile);

if (manageProfilesBtn) manageProfilesBtn.addEventListener('click', () => showView('profiles'));

if (activeProfileSelect) {
  activeProfileSelect.addEventListener('change', async (e) => {
    await chrome.storage.local.set({ activeProfileId: e.target.value });
    updateGenerateButton();
  });
}

saveSettingsBtn.addEventListener('click', saveSettings);
clearDataBtn.addEventListener('click', clearAllData);

generateBtn.addEventListener('click', generateResume);
regenerateBtn.addEventListener('click', generateResume);
retryBtn.addEventListener('click', generateResume);

copyBtn.addEventListener('click', copyToClipboard);

generateCoverLetterBtn.addEventListener('click', generateCoverLetter);
copyCoverLetterBtn.addEventListener('click', copyCoverLetterToClipboard);

// Edit background button
const editBackgroundBtn = document.getElementById('editBackgroundBtn');
if (editBackgroundBtn) {
  editBackgroundBtn.addEventListener('click', () => showView('profiles'));
}

// =============================================================================
// Setup Functions
// =============================================================================
async function saveSetup() {
  const fullName = fullNameInput.value.trim();
  const email = emailInput.value.trim();
  const phoneNumber = phoneNumberInput.value.trim();
  const linkedinUrl = linkedinUrlInput.value.trim();

  if (!fullName) {
    showToast('Please enter your full name', 'error');
    return;
  }

  if (!email) {
    showToast('Please enter your email', 'error');
    return;
  }

  if (!phoneNumber) {
    showToast('Please enter your phone number', 'error');
    return;
  }

  const contactInfo = { fullName, email, phoneNumber, linkedinUrl };
  await chrome.storage.local.set({ contactInfo });

  // Clear the draft since the data was successfully saved
  await chrome.storage.local.remove(['setupDraft']);

  showToast('Contact info saved!', 'success');
  showView('profiles');
}

// =============================================================================
// Profile Functions
// =============================================================================
async function loadProfilesList() {
  const { profiles = [] } = await chrome.storage.local.get(['profiles']);

  if (profiles.length === 0) {
    profilesList.innerHTML = '<div class="empty-profiles">No profiles yet. Create your first profile to get started.</div>';
    continueToMainBtn.disabled = true;
  } else {
    profilesList.innerHTML = profiles.map(profile => `
      <div class="profile-card" data-id="${profile.id}">
        <div>
          <div class="profile-name">${profile.name}</div>
          <div class="profile-preview">${truncateText(profile.background, 50)}</div>
        </div>
        <svg class="edit-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    `).join('');

    document.querySelectorAll('.profile-card').forEach(card => {
      card.addEventListener('click', () => openProfileEditor(card.dataset.id));
    });

    continueToMainBtn.disabled = false;
  }
}

async function loadProfileSelector() {
  const { profiles = [], activeProfileId } = await chrome.storage.local.get(['profiles', 'activeProfileId']);

  if (activeProfileSelect) {
    activeProfileSelect.innerHTML = '<option value="">Select a profile...</option>' +
      profiles.map(p => `<option value="${p.id}" ${p.id === activeProfileId ? 'selected' : ''}>${p.name}</option>`).join('');
  }

  updateGenerateButton();
}

async function openProfileEditor(profileId) {
  editingProfileId = profileId;

  if (profileId) {
    const { profiles = [] } = await chrome.storage.local.get(['profiles']);
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      profileEditorTitle.textContent = 'Edit Profile';
      profileNameInput.value = profile.name;
      profileBackgroundInput.value = profile.background;
      deleteProfileBtn.classList.remove('hidden');
    }
  } else {
    profileEditorTitle.textContent = 'New Profile';
    profileNameInput.value = '';
    profileBackgroundInput.value = '';
    deleteProfileBtn.classList.add('hidden');

    // Check if we have imported LinkedIn data to pre-fill
    const { importedLinkedInBackground, importedLinkedInHeadline } = await chrome.storage.local.get([
      'importedLinkedInBackground',
      'importedLinkedInHeadline'
    ]);

    if (importedLinkedInBackground) {
      profileBackgroundInput.value = importedLinkedInBackground;
      // Use headline as suggested profile name if available
      if (importedLinkedInHeadline) {
        // Try to extract a short role name from headline
        const headline = importedLinkedInHeadline;
        if (headline.toLowerCase().includes('security') || headline.toLowerCase().includes('cyber')) {
          profileNameInput.value = 'Cyber Security';
        } else if (headline.toLowerCase().includes('data')) {
          profileNameInput.value = 'Data Analytics';
        } else if (headline.toLowerCase().includes('manager') || headline.toLowerCase().includes('scrum')) {
          profileNameInput.value = 'Project Management';
        } else if (headline.toLowerCase().includes('engineer') || headline.toLowerCase().includes('developer')) {
          profileNameInput.value = 'Software Engineering';
        } else {
          profileNameInput.value = 'General';
        }
      }
      // Clear the imported data after using it
      await chrome.storage.local.remove(['importedLinkedInBackground', 'importedLinkedInHeadline']);
      showToast('LinkedIn data pre-filled! Edit as needed.', 'info');
    }
  }

  showView('profileEditor');
}

async function saveProfile() {
  const name = profileNameInput.value.trim();
  const background = profileBackgroundInput.value.trim();

  if (!name) {
    showToast('Please enter a profile name', 'error');
    return;
  }

  if (!background) {
    showToast('Please enter your resume content', 'error');
    return;
  }

  const { profiles = [] } = await chrome.storage.local.get(['profiles']);

  if (editingProfileId) {
    // Update existing profile
    const index = profiles.findIndex(p => p.id === editingProfileId);
    if (index !== -1) {
      profiles[index] = { ...profiles[index], name, background };
    }
  } else {
    // Create new profile
    profiles.push({
      id: Date.now().toString(),
      name,
      background,
      createdAt: new Date().toISOString()
    });
  }

  await chrome.storage.local.set({ profiles });
  showToast('Profile saved!', 'success');
  showView('profiles');
}

async function deleteProfile() {
  if (!editingProfileId) return;

  if (!confirm('Are you sure you want to delete this profile?')) return;

  const { profiles = [], activeProfileId } = await chrome.storage.local.get(['profiles', 'activeProfileId']);
  const newProfiles = profiles.filter(p => p.id !== editingProfileId);

  const updates = { profiles: newProfiles };
  if (activeProfileId === editingProfileId) {
    updates.activeProfileId = null;
  }

  await chrome.storage.local.set(updates);
  showToast('Profile deleted', 'success');
  showView('profiles');
}

async function updateGenerateButton() {
  const { activeProfileId } = await chrome.storage.local.get(['activeProfileId']);
  const hasProfile = activeProfileId && activeProfileSelect && activeProfileSelect.value;
  const hasJob = currentJobData !== null;

  generateBtn.disabled = !(hasProfile && hasJob);
}

// =============================================================================
// Settings Functions
// =============================================================================
async function saveSettings() {
  const fullName = settingsFullNameInput.value.trim();
  const phoneNumber = settingsPhoneInput.value.trim();
  const linkedinUrl = settingsLinkedinInput.value.trim();

  if (!fullName) {
    showToast('Please enter your full name', 'error');
    return;
  }

  if (!phoneNumber) {
    showToast('Please enter your phone number', 'error');
    return;
  }

  const { contactInfo = {} } = await chrome.storage.local.get(['contactInfo']);
  await chrome.storage.local.set({
    contactInfo: { ...contactInfo, fullName, phoneNumber, linkedinUrl }
  });

  showToast('Settings saved!', 'success');
  showView('main');
  detectJobPosting();
}

async function clearAllData() {
  if (confirm('Are you sure you want to clear all your data? This cannot be undone.')) {
    await chrome.storage.local.clear();
    showToast('All data cleared', 'success');
    showView('setup');
  }
}

// =============================================================================
// Job Detection
// =============================================================================
async function detectJobPosting() {
  updateJobStatus('detecting');
  hideResults();

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      updateJobStatus('not-found', 'No active tab found');
      return;
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    } catch (e) {
      // Script might already be injected
    }

    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractJobData' });

    if (response && response.success && response.data) {
      currentJobData = response.data;
      updateJobStatus('found', 'Job posting detected');
      showJobPreview(currentJobData);
      updateGenerateButton();

      const { profiles = [], activeProfileId } = await chrome.storage.local.get(['profiles', 'activeProfileId']);
      const activeProfile = profiles.find(p => p.id === activeProfileId);
      if (activeProfile) {
        const initialScore = calculateMatchScore(activeProfile.background, currentJobData.description);
        matchScores.before = initialScore;
        showInitialMatchScore(initialScore);
      }
    } else {
      updateJobStatus('not-found', response?.message || 'No job posting detected on this page');
      generateBtn.disabled = true;
    }
  } catch (error) {
    console.error('Detection error:', error);
    updateJobStatus('not-found', 'Could not detect job posting. Try refreshing the page.');
    generateBtn.disabled = true;
  }
}

function calculateMatchScore(text, jobDescription) {
  const jobKeywords = extractKeywords(jobDescription);
  const textLower = text.toLowerCase();

  let matches = 0;
  jobKeywords.forEach(keyword => {
    if (textLower.includes(keyword.toLowerCase())) {
      matches++;
    }
  });

  return Math.min(Math.round((matches / jobKeywords.length) * 100), 100);
}

function extractKeywords(text) {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'our', 'your', 'their', 'its', 'as', 'if', 'from', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'etc', 'via']);

  const words = text.toLowerCase()
    .replace(/[^a-zA-Z0-9\s\-\+\#\.]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  const freq = {};
  words.forEach(word => {
    freq[word] = (freq[word] || 0) + 1;
  });

  const techTerms = new Set(['javascript', 'python', 'java', 'react', 'node', 'aws', 'docker', 'kubernetes', 'sql', 'nosql', 'mongodb', 'postgresql', 'redis', 'graphql', 'rest', 'api', 'agile', 'scrum', 'ci', 'cd', 'devops', 'typescript', 'angular', 'vue', 'html', 'css', 'git', 'linux', 'machine', 'learning', 'ai', 'ml', 'data', 'cloud', 'azure', 'gcp', 'microservices', 'serverless', 'terraform', 'ansible', 'jenkins', 'github', 'jira', 'confluence', 'figma', 'design', 'ux', 'ui', 'product', 'management', 'leadership', 'communication', 'collaboration', 'cybersecurity', 'security', 'penetration', 'cissp', 'ceh']);

  const keywords = Object.entries(freq)
    .filter(([word, count]) => count >= 2 || techTerms.has(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word]) => word);

  return keywords;
}

function showInitialMatchScore(score) {
  initialMatchScore.classList.remove('hidden');
  initialMatchScore.querySelector('.score-value').textContent = `${score}%`;
}

function updateJobStatus(status, message) {
  const statusIcon = jobStatus.querySelector('.status-icon');
  const statusLabel = jobStatus.querySelector('.status-label');

  statusIcon.className = 'status-icon ' + status;

  if (status === 'detecting') {
    statusIcon.innerHTML = '<div class="spinner"></div>';
    statusLabel.textContent = 'Detecting job posting...';
  } else if (status === 'found') {
    statusIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    statusLabel.textContent = message || 'Job posting detected';
  } else {
    statusIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 8V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>`;
    statusLabel.textContent = message || 'No job posting detected';
  }
}

function showJobPreview(data) {
  jobTitle.textContent = data.title || 'Job Position';
  jobCompany.textContent = data.company || 'Company';
  jobDescriptionPreview.textContent = truncateText(data.description, 150);
  jobPreview.classList.remove('hidden');
}

function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

function hideResults() {
  jobPreview.classList.add('hidden');
  loadingState.classList.add('hidden');
  resultView.classList.add('hidden');
  errorState.classList.add('hidden');
  initialMatchScore.classList.add('hidden');
}

// =============================================================================
// Resume Generation
// =============================================================================
async function generateResume() {
  if (!currentJobData) {
    showToast('No job data available', 'error');
    return;
  }

  const { contactInfo, profiles, activeProfileId } = await chrome.storage.local.get(['contactInfo', 'profiles', 'activeProfileId']);
  const activeProfile = profiles?.find(p => p.id === activeProfileId);

  if (!contactInfo || !activeProfile) {
    showToast('Please complete setup first', 'error');
    showView('setup');
    return;
  }

  generateBtn.classList.add('hidden');
  loadingState.classList.remove('hidden');
  loadingText.textContent = 'Crafting your perfect resume...';
  resultView.classList.add('hidden');
  errorState.classList.add('hidden');

  try {
    const jobKeywords = extractKeywords(currentJobData.description);
    const result = await callBackendForResume(activeProfile.background, currentJobData, jobKeywords, contactInfo);

    generatedResume = result.resume;
    matchScores.after = result.afterScore;
    addedKeywords = result.keywords;
    generatedInterviewQuestions = result.interviewQuestions;

    loadingState.classList.add('hidden');
    resumeContent.textContent = generatedResume;

    updateMatchScoreDisplay();
    displayKeywords(addedKeywords);
    displayInterviewQuestions(generatedInterviewQuestions);

    generatedCoverLetter = null;
    coverLetterContent.innerHTML = `
      <div class="generate-prompt">
        <p>Generate a tailored cover letter for this position</p>
        <button id="generateCoverLetterBtn" class="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Generate Cover Letter</span>
        </button>
      </div>
    `;
    document.getElementById('generateCoverLetterBtn').addEventListener('click', generateCoverLetter);

    switchTab('resume');
    resultView.classList.remove('hidden');

    await saveToHistory({
      jobTitle: currentJobData.title,
      company: currentJobData.company,
      profileName: activeProfile.name,
      resume: generatedResume,
      coverLetter: null,
      interviewQuestions: generatedInterviewQuestions,
      beforeScore: matchScores.before,
      afterScore: matchScores.after,
      keywords: addedKeywords,
      date: new Date().toISOString(),
      url: currentJobData.url
    });

  } catch (error) {
    console.error('Generation error:', error);
    loadingState.classList.add('hidden');
    errorMessage.textContent = error.message || 'Failed to generate resume. Please try again.';
    errorState.classList.remove('hidden');
    generateBtn.classList.remove('hidden');
  }
}

async function callBackendForResume(backgroundInfo, jobData, jobKeywords, contactInfo) {
  const response = await fetch(`${API_BASE_URL}/api/generate-resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ backgroundInfo, jobData, jobKeywords, contactInfo })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Server error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to generate resume');
  }

  try {
    const result = JSON.parse(data.content);
    return {
      resume: result.resume,
      afterScore: result.afterScore || 85,
      keywords: result.keywordsAdded || [],
      interviewQuestions: result.interviewQuestions || []
    };
  } catch (e) {
    return {
      resume: data.content,
      afterScore: 85,
      keywords: [],
      interviewQuestions: []
    };
  }
}

function updateMatchScoreDisplay() {
  beforeScoreValue.textContent = `${matchScores.before}%`;
  afterScoreValue.textContent = `${matchScores.after}%`;

  const circumference = 2 * Math.PI * 15.9155;
  const beforeDasharray = `${(matchScores.before / 100) * circumference} ${circumference}`;
  const afterDasharray = `${(matchScores.after / 100) * circumference} ${circumference}`;

  beforeProgress.style.strokeDasharray = beforeDasharray;
  afterProgress.style.strokeDasharray = afterDasharray;

  const improvement = matchScores.after - matchScores.before;
  matchImprovement.querySelector('.improvement-value').textContent = `+${improvement}%`;
}

function displayKeywords(keywords) {
  if (keywords && keywords.length > 0) {
    keywordsSection.classList.remove('hidden');
    keywordsList.innerHTML = keywords
      .map(keyword => `<span class="keyword-tag">${keyword}</span>`)
      .join('');
  } else {
    keywordsSection.classList.add('hidden');
  }
}

function displayInterviewQuestions(questions) {
  if (questions && questions.length > 0) {
    interviewQuestions.innerHTML = questions
      .map((q, i) => `
        <div class="interview-question">
          <span class="question-number">${i + 1}</span>
          <span class="question-text">${q}</span>
        </div>
      `)
      .join('');
  } else {
    interviewQuestions.innerHTML = '<p class="empty-state">No interview questions generated</p>';
  }
}

// =============================================================================
// Cover Letter Generation
// =============================================================================
async function generateCoverLetter() {
  if (!currentJobData || !generatedResume) {
    showToast('Generate a resume first', 'error');
    return;
  }

  const { contactInfo, profiles, activeProfileId } = await chrome.storage.local.get(['contactInfo', 'profiles', 'activeProfileId']);
  const activeProfile = profiles?.find(p => p.id === activeProfileId);

  coverLetterContent.innerHTML = `
    <div class="loading-state" style="padding: 20px;">
      <div class="loading-animation" style="margin-bottom: 12px;">
        <div class="loading-bar"></div>
      </div>
      <p class="loading-text">Generating cover letter...</p>
    </div>
  `;

  try {
    const coverLetter = await callBackendForCoverLetter(activeProfile.background, currentJobData, generatedResume);
    generatedCoverLetter = coverLetter;
    coverLetterContent.textContent = coverLetter;
    await updateHistoryWithCoverLetter(coverLetter);
  } catch (error) {
    console.error('Cover letter error:', error);
    coverLetterContent.innerHTML = `
      <div class="error-state" style="padding: 20px;">
        <p>${error.message || 'Failed to generate cover letter'}</p>
        <button id="retryCoverLetterBtn" class="btn btn-secondary">Try Again</button>
      </div>
    `;
    document.getElementById('retryCoverLetterBtn').addEventListener('click', generateCoverLetter);
  }
}

async function callBackendForCoverLetter(backgroundInfo, jobData, resume) {
  const response = await fetch(`${API_BASE_URL}/api/generate-cover-letter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ backgroundInfo, jobData, resume })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Server error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to generate cover letter');
  }

  return data.content;
}

// =============================================================================
// History Functions
// =============================================================================
async function saveToHistory(entry) {
  const { resumeHistory = [] } = await chrome.storage.local.get(['resumeHistory']);
  resumeHistory.unshift(entry);
  if (resumeHistory.length > 10) {
    resumeHistory.pop();
  }
  await chrome.storage.local.set({ resumeHistory });
}

async function updateHistoryWithCoverLetter(coverLetter) {
  const { resumeHistory = [] } = await chrome.storage.local.get(['resumeHistory']);
  if (resumeHistory.length > 0) {
    resumeHistory[0].coverLetter = coverLetter;
    await chrome.storage.local.set({ resumeHistory });
  }
}

async function loadHistory() {
  const { resumeHistory = [] } = await chrome.storage.local.get(['resumeHistory']);

  if (resumeHistory.length === 0) {
    historyList.innerHTML = '<p class="empty-state">No saved resumes yet</p>';
    return;
  }

  historyList.innerHTML = resumeHistory.map((entry, index) => `
    <div class="history-item" data-index="${index}">
      <div class="history-info">
        <div class="history-title">${entry.jobTitle || 'Job Position'}</div>
        <div class="history-meta">
          <span>${entry.company || 'Company'}</span>
          <span>${entry.profileName || ''}</span>
          <span>${formatDate(entry.date)}</span>
        </div>
      </div>
      <div class="history-score">${entry.afterScore}%</div>
    </div>
  `).join('');

  document.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => loadHistoryEntry(parseInt(item.dataset.index)));
  });
}

async function loadHistoryEntry(index) {
  const { resumeHistory = [] } = await chrome.storage.local.get(['resumeHistory']);
  const entry = resumeHistory[index];

  if (!entry) return;

  generatedResume = entry.resume;
  generatedCoverLetter = entry.coverLetter;
  generatedInterviewQuestions = entry.interviewQuestions;
  matchScores = { before: entry.beforeScore, after: entry.afterScore };
  addedKeywords = entry.keywords || [];

  currentJobData = {
    title: entry.jobTitle,
    company: entry.company,
    url: entry.url
  };

  resumeContent.textContent = generatedResume;
  updateMatchScoreDisplay();
  displayKeywords(addedKeywords);
  displayInterviewQuestions(generatedInterviewQuestions);

  if (generatedCoverLetter) {
    coverLetterContent.textContent = generatedCoverLetter;
  } else {
    coverLetterContent.innerHTML = `
      <div class="generate-prompt">
        <p>Generate a tailored cover letter for this position</p>
        <button id="generateCoverLetterBtn" class="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Generate Cover Letter</span>
        </button>
      </div>
    `;
    document.getElementById('generateCoverLetterBtn').addEventListener('click', generateCoverLetter);
  }

  jobStatus.classList.add('hidden');
  jobPreview.classList.add('hidden');
  generateBtn.classList.add('hidden');

  resultView.classList.remove('hidden');
  switchTab('resume');

  showView('main');
  showToast('Loaded from history', 'success');
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// =============================================================================
// Copy and Download Functions
// =============================================================================
async function copyToClipboard() {
  if (!generatedResume) {
    showToast('No resume to copy', 'error');
    return;
  }

  try {
    await navigator.clipboard.writeText(generatedResume);
    showToast('Resume copied!', 'success');
  } catch (error) {
    showToast('Failed to copy', 'error');
  }
}

async function copyCoverLetterToClipboard() {
  if (!generatedCoverLetter) {
    showToast('No cover letter to copy', 'error');
    return;
  }

  try {
    await navigator.clipboard.writeText(generatedCoverLetter);
    showToast('Cover letter copied!', 'success');
  } catch (error) {
    showToast('Failed to copy', 'error');
  }
}

function downloadAsDocx() {
  if (!generatedResume) {
    showToast('No resume to download', 'error');
    return;
  }

  // Format the resume content for Word
  const formattedContent = formatResumeForDocx(generatedResume);

  // Create a styled HTML document for Word
  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Resume</title>
      <style>
        body {
          font-family: Calibri, sans-serif;
          font-size: 11pt;
          line-height: 1.5;
          color: #1a1a1a;
        }
        .section-title {
          font-size: 12pt;
          font-weight: bold;
          color: #2c3e50;
          text-transform: uppercase;
          margin-top: 14pt;
          margin-bottom: 6pt;
          border-bottom: 1px solid #bdc3c7;
          padding-bottom: 2pt;
        }
        ul {
          margin-left: 18pt;
        }
        li {
          margin-bottom: 4pt;
        }
      </style>
    </head>
    <body>
      <div style="white-space: pre-wrap;">${formattedContent}</div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Resume_${currentJobData?.company || 'Tailored'}_${new Date().toISOString().split('T')[0]}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('Resume downloaded!', 'success');
}

function formatResumeForDocx(content) {
  let html = escapeHtml(content);

  // Style section headers
  const sectionPatterns = [
    /^(PROFESSIONAL SUMMARY|SUMMARY|PROFILE|OBJECTIVE)/gim,
    /^(EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT|WORK HISTORY)/gim,
    /^(EDUCATION|ACADEMIC BACKGROUND)/gim,
    /^(SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|KEY SKILLS)/gim,
    /^(CERTIFICATIONS|CERTIFICATES|LICENSES)/gim,
    /^(PROJECTS|KEY PROJECTS)/gim,
    /^(ACHIEVEMENTS|ACCOMPLISHMENTS|AWARDS)/gim
  ];

  sectionPatterns.forEach(pattern => {
    html = html.replace(pattern, '<div class="section-title">$1</div>');
  });

  // Convert bullet points
  html = html.replace(/^[•\-\*]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  return html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// =============================================================================
// Toast Notification
// =============================================================================
function showToast(message, type = 'info') {
  toastMessage.textContent = message;
  toast.className = 'toast ' + type;

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}
