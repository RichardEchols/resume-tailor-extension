/**
 * Resume Tailor API - Cloudflare Worker
 *
 * This worker proxies requests to Claude API, keeping your API key secure.
 * Deploy to Cloudflare Workers and set CLAUDE_API_KEY as an environment secret.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // Route handlers
      if (path === '/api/generate-resume') {
        return await handleGenerateResume(request, env);
      } else if (path === '/api/generate-cover-letter') {
        return await handleGenerateCoverLetter(request, env);
      } else if (path === '/api/health') {
        return new Response(JSON.stringify({ status: 'ok' }), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
  },
};

async function handleGenerateResume(request, env) {
  const { backgroundInfo, jobData, jobKeywords, contactInfo } = await request.json();

  if (!backgroundInfo || !jobData) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // Build contact header info
  const fullName = contactInfo?.fullName || 'Candidate';
  const phoneNumber = contactInfo?.phoneNumber || '';
  const linkedinUrl = contactInfo?.linkedinUrl || '';
  const jobTitle = jobData.title || 'Professional';

  const prompt = `You are an expert resume writer specializing in ATS-optimized resumes. Your task is to create a tailored resume and analyze keyword matching.

## Candidate Contact Information:
- Full Name: ${fullName}
- Phone: ${phoneNumber}
- LinkedIn: ${linkedinUrl || 'Not provided'}

## Candidate Background:
${backgroundInfo}

## Job Posting Details:
Title: ${jobData.title || 'Not specified'}
Company: ${jobData.company || 'Not specified'}

Description:
${jobData.description}

## Key Job Keywords Detected:
${jobKeywords ? jobKeywords.join(', ') : 'N/A'}

## Instructions:
Create a professional, ATS-friendly resume AND provide analysis in the following JSON format:

{
  "resume": "THE FULL RESUME TEXT HERE",
  "afterScore": 85,
  "keywordsAdded": ["keyword1", "keyword2", "keyword3"],
  "interviewQuestions": [
    "Question 1 about the role?",
    "Question 2 about experience?",
    "Question 3 about skills?",
    "Question 4 about challenges?",
    "Question 5 about goals?"
  ]
}

Resume FORMAT requirements:
1. Start with a HEADER containing:
   - The candidate's full name (${fullName}) in large/prominent format
   - The job title they're applying for ("${jobTitle}") as their professional title
   - Phone number: ${phoneNumber}
   - LinkedIn URL: ${linkedinUrl || 'omit if not provided'}
2. Follow the header with sections: PROFESSIONAL SUMMARY, EXPERIENCE, SKILLS, EDUCATION

Resume CONTENT requirements:
1. Tailor specifically to this job posting
2. Use keywords from the job description naturally
3. Highlight relevant experience and skills
4. Use bullet points with strong action verbs
5. Quantify achievements where possible
6. Keep it concise (1-2 pages worth)
7. Do NOT make up experience or skills - only use what's in the background

Analysis requirements:
- afterScore: Estimate the match percentage (0-100) after optimization
- keywordsAdded: List 5-10 key terms from the job that are now incorporated
- interviewQuestions: Generate 5 likely interview questions for this specific role

IMPORTANT: Return ONLY valid JSON, no other text.`;

  const response = await callClaude(env.CLAUDE_API_KEY, prompt, 4096);

  return new Response(JSON.stringify(response), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

async function handleGenerateCoverLetter(request, env) {
  const { backgroundInfo, jobData, resume } = await request.json();

  if (!backgroundInfo || !jobData) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const prompt = `You are an expert cover letter writer. Create a compelling, personalized cover letter.

## Candidate Background:
${backgroundInfo}

## Job Details:
Title: ${jobData.title || 'Not specified'}
Company: ${jobData.company || 'Not specified'}
Description: ${jobData.description}

## Tailored Resume (for reference):
${resume || 'Not provided'}

## Instructions:
1. Write a professional cover letter (3-4 paragraphs)
2. Address the hiring manager or team professionally
3. Open with a strong hook mentioning the specific role
4. Highlight 2-3 key qualifications that match the job
5. Show enthusiasm for the company and role
6. End with a clear call to action
7. Keep it concise (about 300-400 words)
8. Do NOT include contact information or date
9. Make it feel genuine and personalized, not generic

Write the cover letter now:`;

  const response = await callClaude(env.CLAUDE_API_KEY, prompt, 2048);

  return new Response(JSON.stringify(response), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

async function callClaude(apiKey, prompt, maxTokens) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Claude API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.content && data.content[0] && data.content[0].text) {
    let content = data.content[0].text;
    // Strip markdown code fences if present
    content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    return { success: true, content };
  }

  throw new Error('Unexpected API response format');
}
