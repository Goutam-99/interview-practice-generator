// server.js
require('dotenv').config(); // must be first
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// App setup
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Multer + pdf-parse
const multer = require('multer');
let pdfParse = require('pdf-parse');
// Normalize default export if needed (ESM interop)
if (pdfParse && typeof pdfParse !== 'function' && pdfParse.default) {
  pdfParse = pdfParse.default;
}
const upload = multer({ storage: multer.memoryStorage() });

console.log('Gemini API key present?', !!process.env.GEMINI_API_KEY);
console.log('pdfParse type:', typeof pdfParse);

// ----- Helper: call Gemini with retries + fallback models -----
async function callGeminiGenerate(resumeText, preferredModels = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash']) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY in environment');
  }

  // Call one model once
  async function callOnce(modelName) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const prompt = `You are an AI interview assistant. Based on the resume below, generate exactly 10 interview questions with detailed answers.
IMPORTANT: Return ONLY a single JSON array (no surrounding text, no markdown, no backticks) in this exact format:
[
  {"question":"Question text","answer":"Detailed answer"}
]
Escape internal double quotes as \\" and backslashes as \\\\. Replace literal newlines in answers with \\n.

Resume:
${resumeText}`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.0, maxOutputTokens: 8192 } // INCREASED FROM 2048
    };

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    let data = null;
    try {
      data = await resp.json();
    } catch (e) {
      data = null;
    }
    return { resp, data };
  }

  const maxRetries = 3;
  for (const modelName of preferredModels) {
    let attempt = 0;
    let backoff = 500;
    while (attempt < maxRetries) {
      attempt++;
      try {
        const { resp, data } = await callOnce(modelName);
        const status = resp?.status || (data && data.error && data.error.code) || 0;

        // success
        if (resp && resp.ok) {
          return { resp, data, modelUsed: modelName };
        }

        // transient: retry
        if (status === 429 || status === 503 || (status >= 500 && status < 600)) {
          console.warn(`Transient error from ${modelName} (status ${status}) — retry ${attempt}/${maxRetries} after ${backoff}ms`);
          await new Promise(r => setTimeout(r, backoff));
          backoff *= 2;
          continue;
        }

        // non-transient: return so caller can show details
        return { resp, data, modelUsed: modelName };
      } catch (err) {
        console.warn(`Exception calling ${modelName}:`, err.message || err);
        await new Promise(r => setTimeout(r, backoff));
        backoff *= 2;
      }
    }
    console.warn(`Exhausted retries for ${modelName}, trying next model if available.`);
  }

  throw new Error('All model attempts failed after retries. Try again later.');
}

// ----- Utility: extract JSON array from model output reliably -----
function extractJsonArrayFromText(text) {
  if (!text || typeof text !== 'string') return { error: 'No text provided' };

  const cleaned = text.replace(/```json|```/g, '').trim();
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) return { error: 'No JSON array found', cleaned };

  let candidate = match[0];

  // Try direct parse
  try {
    const parsed = JSON.parse(candidate);
    return { parsed };
  } catch (err) {
    // Mild cleanup: smart quotes, stray backslashes, newlines inside strings, trailing commas
    let attempt = candidate
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'");
    attempt = attempt.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
    attempt = attempt.replace(/\r\n|\r|\n/g, '\\n');
    attempt = attempt.replace(/,\s*([\]}])/g, '$1');

    try {
      const parsed = JSON.parse(attempt);
      return { parsed, cleanedAttempt: attempt };
    } catch (err2) {
      return { error: 'JSON.parse failed after cleanup', cleaned: attempt, parseError: err2.message };
    }
  }
}

// ----- Endpoint: upload file and generate questions (recommended) -----
app.post('/api/upload-and-generate', upload.single('file'), async (req, res) => {
  try {
    console.log('--- upload-and-generate called ---');
    console.log('req.file present?', !!req.file);

    if (!req.file) {
      console.log('req.body keys:', Object.keys(req.body || {}));
      return res.status(400).json({ error: 'No file uploaded. Client must send FormData with field "file".' });
    }

    // Log info & save debug copy
    console.log('uploaded file originalname:', req.file.originalname);
    console.log('uploaded file mimetype:', req.file.mimetype);
    console.log('uploaded file size (bytes):', req.file.size);

    const debugDir = path.join(__dirname, 'uploads_debug');
    if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir);
    const saved = path.join(debugDir, `${Date.now()}-${req.file.originalname}`);
    fs.writeFileSync(saved, req.file.buffer);
    console.log('Saved uploaded PDF to:', saved);

    // Extract with pdf-parse
    let resumeText = '';
    try {
      const pdfData = await pdfParse(req.file.buffer);
      resumeText = String(pdfData.text || '').trim();
      console.log('pdf-parse extracted length:', resumeText.length);
      console.log('Resume preview:', resumeText.slice(0, 400).replace(/\s+/g, ' '));
    } catch (pdfErr) {
      console.error('pdf-parse error:', pdfErr && (pdfErr.message || pdfErr));
      return res.status(500).json({
        error: 'Failed to extract text from PDF',
        details: String(pdfErr.message || pdfErr).slice(0, 1000),
        savedFile: saved
      });
    }

    if (!resumeText) {
      return res.status(400).json({
        error: 'PDF had no extractable text (may be a scanned image PDF). OCR required.',
        savedFile: saved
      });
    }

    // Call Gemini (with retries/fallback)
    const { resp, data, modelUsed } = await callGeminiGenerate(resumeText);
    console.log('Used model:', modelUsed, 'status:', resp?.status);
    console.log('Raw API Response (preview):', JSON.stringify(data).slice(0, 3000));

    // Locate text in response
    const candidateText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.output ||
      (typeof data?.candidates?.[0] === 'string' ? data.candidates[0] : '') ||
      '';

    if (!candidateText) {
      console.log('--- Gemini raw data structure ---');
      console.log(JSON.stringify(data, null, 2));
      return res.status(500).json({
        error: 'No text returned from model',
        details: 'See server console for raw Gemini response preview'
      });
    }

    // Extract JSON array and return
    const extracted = extractJsonArrayFromText(candidateText);
    if (extracted.error) {
      console.error('Parsing error:', extracted);
      return res.status(500).json({ error: 'Could not parse questions from model output', details: extracted });
    }

    if (!Array.isArray(extracted.parsed)) {
      return res.status(500).json({ error: 'Parsed content is not an array', parsedPreview: extracted.parsed });
    }

    return res.json({ questions: extracted.parsed });
  } catch (err) {
    console.error('upload-and-generate top-level error:', err);
    return res.status(500).json({ error: String(err.message || err) });
  }
});

// ----- Fallback endpoint: accept resumeText directly -----
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { resumeText } = req.body || {};
    if (!resumeText || !resumeText.trim()) {
      return res.status(400).json({ error: 'Missing resumeText in request body' });
    }

    const { resp, data, modelUsed } = await callGeminiGenerate(resumeText);
    console.log('Used model:', modelUsed, 'status:', resp?.status);
    console.log('Raw API Response (preview):', JSON.stringify(data).slice(0, 3000));

    const candidateText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.output ||
      (typeof data?.candidates?.[0] === 'string' ? data.candidates[0] : '') ||
      '';

    if (!candidateText) {
      console.log('--- Gemini raw data structure ---');
      console.log(JSON.stringify(data, null, 2));
      return res.status(500).json({ error: 'No text returned from model', details: 'See server console' });
    }

    const extracted = extractJsonArrayFromText(candidateText);
    if (extracted.error) {
      console.error('Parsing error:', extracted);
      return res.status(500).json({ error: 'Could not parse questions from model output', details: extracted });
    }

    if (!Array.isArray(extracted.parsed)) {
      return res.status(500).json({ error: 'Parsed content is not an array', parsedPreview: extracted.parsed });
    }

    return res.json({ questions: extracted.parsed });
  } catch (err) {
    console.error('generate-questions error:', err);
    return res.status(500).json({ error: String(err.message || err) });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
