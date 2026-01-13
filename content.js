// Resume Tailor - Content Script
// Extracts job posting data from various job sites

(function () {
  // Prevent multiple injections
  if (window.resumeTailorInjected) return;
  window.resumeTailorInjected = true;

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractJobData') {
      const jobData = extractJobData();
      sendResponse(jobData);
    } else if (request.action === 'extractLinkedInProfile') {
      const profileData = extractLinkedInProfile();
      sendResponse(profileData);
    }
    return true;
  });

  // Extract LinkedIn Profile Data (for importing user's own profile)
  function extractLinkedInProfile() {
    try {
      const hostname = window.location.hostname;
      if (!hostname.includes('linkedin.com')) {
        return { success: false, message: 'Not on LinkedIn' };
      }

      // Check if we're on a profile page
      const isProfilePage = window.location.pathname.includes('/in/');
      if (!isProfilePage) {
        return { success: false, message: 'Not on a LinkedIn profile page' };
      }

      // Name selectors for profile page
      const nameSelectors = [
        'h1.text-heading-xlarge',
        '.pv-top-card--list h1',
        '.pv-text-details__left-panel h1',
        'h1[class*="break-words"]',
        '.ph5 h1',
        'section.pv-top-card h1',
        'h1'
      ];

      // Headline/title selectors
      const headlineSelectors = [
        '.text-body-medium.break-words',
        '.pv-top-card--list .text-body-medium',
        '.pv-text-details__left-panel .text-body-medium',
        '[data-generated-suggestion-target]'
      ];

      // Location selectors
      const locationSelectors = [
        '.text-body-small.inline.t-black--light.break-words',
        '.pv-top-card--list-bullet .text-body-small',
        '.pb2.pv-text-details__left-panel .text-body-small'
      ];

      // About section selectors
      const aboutSelectors = [
        '#about ~ div .inline-show-more-text',
        'section.pv-about-section .pv-about__summary-text',
        '[data-generated-suggestion-target="urn:li:fsu_profileActionDelegate"] span[aria-hidden="true"]',
        '.pv-shared-text-with-see-more span[aria-hidden="true"]'
      ];

      // Experience section - try to get all experience items
      const experienceSection = document.querySelector('#experience') ||
                                document.querySelector('section[id*="experience"]') ||
                                document.querySelector('[data-field="experience_collection"]');

      let experienceText = '';
      if (experienceSection) {
        const expContainer = experienceSection.closest('section') || experienceSection.parentElement;
        if (expContainer) {
          experienceText = expContainer.innerText || '';
        }
      }

      // Skills section
      const skillsSection = document.querySelector('#skills') ||
                           document.querySelector('section[id*="skills"]');
      let skillsText = '';
      if (skillsSection) {
        const skillsContainer = skillsSection.closest('section') || skillsSection.parentElement;
        if (skillsContainer) {
          skillsText = skillsContainer.innerText || '';
        }
      }

      // Education section
      const educationSection = document.querySelector('#education') ||
                              document.querySelector('section[id*="education"]');
      let educationText = '';
      if (educationSection) {
        const eduContainer = educationSection.closest('section') || educationSection.parentElement;
        if (eduContainer) {
          educationText = eduContainer.innerText || '';
        }
      }

      const name = findText(nameSelectors);
      const headline = findText(headlineSelectors);
      const location = findText(locationSelectors);
      const about = findText(aboutSelectors);

      // Build a comprehensive background from all sections
      let background = '';
      if (headline) background += `Current Role: ${cleanText(headline)}\n\n`;
      if (location) background += `Location: ${cleanText(location)}\n\n`;
      if (about) background += `About:\n${cleanText(about)}\n\n`;
      if (experienceText) background += `Experience:\n${cleanText(experienceText)}\n\n`;
      if (skillsText) background += `Skills:\n${cleanText(skillsText)}\n\n`;
      if (educationText) background += `Education:\n${cleanText(educationText)}\n\n`;

      return {
        success: true,
        data: {
          name: cleanText(name) || '',
          headline: cleanText(headline) || '',
          location: cleanText(location) || '',
          about: cleanText(about) || '',
          background: background.trim(),
          url: window.location.href.split('?')[0] // Clean URL without query params
        }
      };
    } catch (error) {
      console.error('LinkedIn profile extraction error:', error);
      return {
        success: false,
        message: 'Error extracting profile: ' + error.message
      };
    }
  }

  function extractJobData() {
    const hostname = window.location.hostname;

    try {
      if (hostname.includes('linkedin.com')) {
        return extractLinkedIn();
      } else if (hostname.includes('indeed.com')) {
        return extractIndeed();
      } else if (hostname.includes('glassdoor.com')) {
        return extractGlassdoor();
      } else {
        return extractGeneric();
      }
    } catch (error) {
      console.error('Resume Tailor extraction error:', error);
      return {
        success: false,
        message: 'Error extracting job data: ' + error.message
      };
    }
  }

  // LinkedIn Extraction
  function extractLinkedIn() {
    // Job title - multiple selectors for different LinkedIn layouts
    const titleSelectors = [
      '.job-details-jobs-unified-top-card__job-title h1',
      '.job-details-jobs-unified-top-card__job-title',
      '.jobs-unified-top-card__job-title',
      '.t-24.job-details-jobs-unified-top-card__job-title',
      'h1.topcard__title',
      '.jobs-details-top-card__job-title',
      'h1[class*="job-title"]',
      '.job-view-layout h1',
      '.jobs-details h1',
      'h1.t-24',
      'h1'
    ];

    // Company name selectors
    const companySelectors = [
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name',
      '.topcard__org-name-link',
      '.jobs-details-top-card__company-url',
      'a[class*="company-name"]',
      '.job-details-jobs-unified-top-card__primary-description-container a',
      '.jobs-details a[href*="/company/"]',
      'a[data-tracking-control-name*="company"]'
    ];

    // Job description selectors
    const descriptionSelectors = [
      '.jobs-description-content__text',
      '.jobs-box__html-content',
      '.jobs-description__content',
      '#job-details',
      '.jobs-description',
      '[class*="description__text"]',
      '.job-view-layout [class*="description"]',
      '.jobs-description-content',
      'article[class*="jobs"]',
      '.jobs-box__html-content'
    ];

    const title = findText(titleSelectors);
    const company = findText(companySelectors);
    let description = findText(descriptionSelectors);

    // If still no description, try to find any large text block on the page
    if (!description || description.length < 50) {
      // Look for the job details section by scrolling patterns
      const possibleContainers = document.querySelectorAll('[class*="jobs-"], [class*="job-details"], [id*="job"]');
      for (const container of possibleContainers) {
        const text = container.innerText || '';
        if (text.length > 200 && text.toLowerCase().includes('experience')) {
          description = text;
          break;
        }
      }
    }

    // Last resort: get main content area
    if (!description || description.length < 50) {
      const main = document.querySelector('main') || document.querySelector('[role="main"]');
      if (main) {
        description = main.innerText;
      }
    }

    if (!description || description.length < 50) {
      return {
        success: false,
        message: 'Could not find job description. Try scrolling down to load the full job posting, then try again.'
      };
    }

    return {
      success: true,
      data: {
        title: cleanText(title) || 'Job Position',
        company: cleanText(company) || 'Company',
        description: cleanText(description),
        source: 'LinkedIn',
        url: window.location.href
      }
    };
  }

  // Indeed Extraction
  function extractIndeed() {
    const titleSelectors = [
      '.jobsearch-JobInfoHeader-title',
      'h1.icl-u-xs-mb--xs',
      '[data-testid="jobsearch-JobInfoHeader-title"]',
      '.jobsearch-JobInfoHeader h1',
      'h1[class*="JobTitle"]'
    ];

    const companySelectors = [
      '[data-testid="inlineHeader-companyName"]',
      '.jobsearch-InlineCompanyRating-companyHeader',
      '.icl-u-lg-mr--sm',
      '[data-company-name="true"]',
      '.jobsearch-CompanyInfoContainer a'
    ];

    const descriptionSelectors = [
      '#jobDescriptionText',
      '.jobsearch-jobDescriptionText',
      '[data-testid="jobDescriptionText"]',
      '.jobDescription',
      '#jobDescription'
    ];

    const title = findText(titleSelectors);
    const company = findText(companySelectors);
    const description = findText(descriptionSelectors);

    if (!description || description.length < 50) {
      return {
        success: false,
        message: 'Could not find job description. Make sure you\'re on a job posting page.'
      };
    }

    return {
      success: true,
      data: {
        title: cleanText(title) || 'Job Position',
        company: cleanText(company) || 'Company',
        description: cleanText(description),
        source: 'Indeed',
        url: window.location.href
      }
    };
  }

  // Glassdoor Extraction
  function extractGlassdoor() {
    const titleSelectors = [
      '[data-test="job-title"]',
      '.css-1vg6q84',
      '.job-title',
      'h1.heading',
      '.JobDetails h1'
    ];

    const companySelectors = [
      '[data-test="employer-name"]',
      '.css-87ung5',
      '.employer-name',
      '.employerName',
      '.JobDetails [class*="employer"]'
    ];

    const descriptionSelectors = [
      '.jobDescriptionContent',
      '[data-test="job-description"]',
      '.desc',
      '.JobDetails [class*="description"]',
      '.job-description'
    ];

    const title = findText(titleSelectors);
    const company = findText(companySelectors);
    const description = findText(descriptionSelectors);

    if (!description || description.length < 50) {
      return {
        success: false,
        message: 'Could not find job description. Make sure you\'re on a job posting page.'
      };
    }

    return {
      success: true,
      data: {
        title: cleanText(title) || 'Job Position',
        company: cleanText(company) || 'Company',
        description: cleanText(description),
        source: 'Glassdoor',
        url: window.location.href
      }
    };
  }

  // Generic Extraction (for other job sites)
  function extractGeneric() {
    // Try to find job-related content using common patterns
    const title = findJobTitle();
    const company = findCompanyName();
    const description = findJobDescription();

    if (!description || description.length < 100) {
      return {
        success: false,
        message: 'Could not detect a job posting on this page. Try LinkedIn, Indeed, or Glassdoor.'
      };
    }

    return {
      success: true,
      data: {
        title: cleanText(title) || 'Job Position',
        company: cleanText(company) || 'Company',
        description: cleanText(description),
        source: 'Generic',
        url: window.location.href
      }
    };
  }

  function findJobTitle() {
    // Look for h1 tags first
    const h1 = document.querySelector('h1');
    if (h1 && h1.textContent.trim().length > 3 && h1.textContent.trim().length < 200) {
      return h1.textContent;
    }

    // Look for elements with job/title in class or id
    const titlePatterns = [
      '[class*="job-title"]',
      '[class*="jobTitle"]',
      '[class*="position-title"]',
      '[id*="job-title"]',
      '[data-testid*="title"]',
      'h1[class*="title"]',
      'h2[class*="title"]'
    ];

    return findText(titlePatterns);
  }

  function findCompanyName() {
    const companyPatterns = [
      '[class*="company-name"]',
      '[class*="companyName"]',
      '[class*="employer"]',
      '[class*="organization"]',
      '[data-testid*="company"]',
      '[itemprop="hiringOrganization"]',
      '[class*="company"] a'
    ];

    return findText(companyPatterns);
  }

  function findJobDescription() {
    const descPatterns = [
      '[class*="job-description"]',
      '[class*="jobDescription"]',
      '[class*="description-content"]',
      '[id*="job-description"]',
      '[id*="jobDescription"]',
      '[data-testid*="description"]',
      '[itemprop="description"]',
      'article',
      '.job-details',
      '.posting-content'
    ];

    // First try specific patterns
    let description = findText(descPatterns);

    // If no description found, look for the largest text block on the page
    if (!description || description.length < 100) {
      description = findLargestTextBlock();
    }

    return description;
  }

  function findLargestTextBlock() {
    const textElements = document.querySelectorAll('div, article, section, main');
    let largestText = '';
    let largestLength = 0;

    textElements.forEach(el => {
      // Skip hidden elements
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;

      // Skip navigation, header, footer
      const tagName = el.tagName.toLowerCase();
      if (['nav', 'header', 'footer'].includes(tagName)) return;

      const text = el.innerText || '';
      // Look for elements that seem like job descriptions (200+ chars)
      if (text.length > 200 && text.length > largestLength && text.length < 20000) {
        // Check if it contains job-related keywords
        const lowerText = text.toLowerCase();
        const jobKeywords = ['experience', 'requirements', 'responsibilities', 'qualifications', 'skills', 'about the role', 'job description', 'what you\'ll do', 'we\'re looking for'];
        const hasJobKeywords = jobKeywords.some(keyword => lowerText.includes(keyword));

        if (hasJobKeywords) {
          largestText = text;
          largestLength = text.length;
        }
      }
    });

    return largestText;
  }

  // Utility Functions
  function findText(selectors) {
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.innerText || element.textContent;
          if (text && text.trim().length > 0) {
            return text;
          }
        }
      } catch (e) {
        // Selector might be invalid, continue to next
      }
    }
    return null;
  }

  function cleanText(text) {
    if (!text) return '';

    return text
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n')  // Limit consecutive newlines
      .trim();
  }
})();
