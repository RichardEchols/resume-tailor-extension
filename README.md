# Resume Tailor - Chrome Extension

Generate ATS-friendly resumes tailored to any job posting using AI. Works on LinkedIn, Indeed, Glassdoor, and more.

## Features

### Core Features
- **One-Click Resume Generation**: Extract job descriptions automatically from job posting pages
- **AI-Powered Tailoring**: Uses Claude AI to create customized, ATS-optimized resumes
- **Works Everywhere**: Supports LinkedIn, Indeed, Glassdoor, and generic job pages
- **Save Your Background**: Enter your work history once, use it for every application
- **Easy Export**: Copy to clipboard or download as PDF

### Match Score
- **Before/After Comparison**: See your match percentage before and after tailoring
- **Visual Progress**: Circular progress indicators show the improvement
- **Proof It Works**: Quantified improvement percentage displayed prominently

### Cover Letter Generator
- **One-Click Generation**: Generate a tailored cover letter after creating your resume
- **Context-Aware**: Uses your resume and job description for personalized letters
- **Copy to Clipboard**: Easy one-click copy functionality

### Interview Prep
- **5 Likely Questions**: AI generates role-specific interview questions
- **Based on Job Description**: Questions tailored to what they'll actually ask
- **Prepare Effectively**: Know what to expect before the interview

### Resume History
- **Saves Last 10**: Access your previous tailored resumes anytime
- **Quick Recall**: One click to load any previous resume
- **Complete Data**: Includes resume, cover letter, keywords, and scores

### Keywords Highlight
- **Visual Tags**: See which keywords from the job were added to your resume
- **ATS Optimization**: Know your resume includes the right terms
- **Clean Display**: Keywords shown as attractive tags

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the `resume-tailor-extension` folder
5. The extension icon will appear in your toolbar

### From Chrome Web Store

Coming soon!

## Setup

1. Click the Resume Tailor extension icon
2. Enter your Claude API key (get one at [console.anthropic.com](https://console.anthropic.com))
3. Paste your background information:
   - Work history with dates and accomplishments
   - Skills and technologies
   - Education and certifications
   - Any other relevant information
4. Click "Save & Continue"

## Usage

1. Navigate to a job posting on LinkedIn, Indeed, Glassdoor, or any job site
2. Click the Resume Tailor extension icon
3. See your initial match score before tailoring
4. Click "Generate Tailored Resume"
5. View:
   - **Match Score Improvement**: Before vs After comparison
   - **Keywords Added**: Tags showing incorporated keywords
   - **Resume Tab**: Your tailored resume with copy/download options
   - **Cover Letter Tab**: Generate a matching cover letter
   - **Interview Prep Tab**: 5 likely interview questions
6. Access your history anytime via the clock icon

## Supported Job Sites

- **LinkedIn Jobs** - linkedin.com/jobs/*
- **Indeed** - indeed.com/*
- **Glassdoor** - glassdoor.com/*
- **Generic Job Pages** - Any page with job-related content

## Tips for Best Results

1. **Be detailed in your background**: Include specific achievements, metrics, and technologies
2. **Keep it organized**: Use bullet points and clear formatting in your background info
3. **Update regularly**: Add new skills and experience as you gain them
4. **Review the output**: Always proofread and personalize the generated resume
5. **Use the match score**: Aim for 80%+ match after tailoring

## Privacy

- Your API key and background information are stored locally in your browser
- Resume history is stored locally (last 10 entries)
- No data is sent to any server except the Claude API for content generation
- You can clear all data anytime from the Settings menu

## Troubleshooting

**"Could not detect job posting"**
- Make sure you're on a job posting page, not a job search results page
- Try scrolling down to load the full job description
- Refresh the page and try again

**"Invalid API key"**
- Verify your API key at console.anthropic.com
- Make sure you've copied the full key including the "sk-ant-" prefix

**Resume generation fails**
- Check your internet connection
- Verify your API key has available credits
- Try again in a few moments (rate limiting may apply)

**Low match score**
- Add more relevant experience to your background info
- Include specific technologies and skills mentioned in jobs you're targeting
- Update your background with keywords from your target industry

## License

MIT License - Feel free to modify and distribute.

## Credits

Built with Claude AI by Anthropic.
