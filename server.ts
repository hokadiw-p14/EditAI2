import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// Server-side Gemini Client with thinking model gemini-4-argon
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// 1. Deep Code / Ren'Py / APK Analysis using gemini-4-argon with ThinkingLevel.HIGH
app.post('/api/ai/deep-analysis', async (req, res) => {
  try {
    const { code, fileName, userPrompt, context } = req.body;

    const systemInstruction = `You are an elite Senior Ren'Py Game Engine Architect, Python Bytecode Engineer, and Android APK Reverse Engineering Expert.
Your role is to deeply analyze Ren'Py scripts (.rpy, .rpyc), Python logic, AndroidManifest.xml, and APK structures.
Always respond in fluent, professional Thai (with standard English technical terms).
Identify architectural flaws, syntax errors, rollback issues, indentation problems, variable scoping pitfalls, or Android packaging/signature constraints.
Provide clear code solutions, step-by-step guidance, and explanations of why the issue occurs.`;

    const promptText = `
Context: ${context || 'Ren\'Py / Code / APK Studio Analysis'}
File: ${fileName || 'script.rpy'}
User Request / Query: ${userPrompt || 'Analyze this code, find any bugs or syntax issues, and suggest improvements.'}

--- CODE START ---
${code || ''}
--- CODE END ---
`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-argon',
      contents: promptText,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    res.json({
      success: true,
      result: response.text || '',
    });
  } catch (error: any) {
    console.error('Error in /api/ai/deep-analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process AI analysis',
    });
  }
});

// 2. Syntax Fixer & Explainer using gemini-4-argon with ThinkingLevel.HIGH
app.post('/api/ai/fix-syntax', async (req, res) => {
  try {
    const { code, diagnostics } = req.body;

    const systemInstruction = `You are a specialized Ren'Py syntax validator and debugger.
Given a Ren'Py script with syntax errors, return a JSON object with:
1. "fixedCode": The complete corrected Ren'Py code with all syntax, indentation, and quotation errors fixed.
2. "fixesApplied": An array of short explanations in Thai for what was fixed and why.
3. "recommendations": Key recommendations in Thai for avoiding these errors in Ren'Py development.`;

    const promptText = `
Here is the Ren'Py code that has syntax issues:

--- CURRENT CODE ---
${code}
--- END CODE ---

Known Diagnostics detected by local checker:
${JSON.stringify(diagnostics || [], null, 2)}

Please fix all syntax and formatting errors while keeping the logic and story intact.
Return valid JSON adhering strictly to:
{
  "fixedCode": "...",
  "fixesApplied": ["..."],
  "recommendations": ["..."]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-argon',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Error in /api/ai/fix-syntax:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate syntax fix',
    });
  }
});

// 3. Batch Dialogue Translation using gemini-4-argon with ThinkingLevel.HIGH
app.post('/api/ai/translate-dialogue', async (req, res) => {
  try {
    const { dialogues, targetLanguage = 'Thai', tone = 'Natural Visual Novel' } = req.body;

    const systemInstruction = `You are a professional Visual Novel and Game Localizer specializing in Japanese/English to Thai translation for Ren'Py.
Translate the provided dialogue lines into natural, emotive Thai suitable for Visual Novels.
CRITICAL RULES:
- Preserved all Ren'Py formatting and wait tags intact: {b}, {/b}, {i}, {/i}, {w}, {p}, {fast}, {nw}, {size=...}, {color=...}.
- Preserved all variable substitutions: [player_name], [hero_name], etc.
- Keep character names consistent.
- Return ONLY valid JSON format with an array of objects matching each input dialogue ID.`;

    const promptText = `
Target Language: ${targetLanguage}
Tone: ${tone}

Dialogues to Translate:
${JSON.stringify(dialogues, null, 2)}

Return JSON adhering to:
{
  "translations": [
    {
      "id": "dialogue-id",
      "translatedText": "ข้อความภาษาไทย"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-argon',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      translations: parsed.translations || [],
    });
  } catch (error: any) {
    console.error('Error in /api/ai/translate-dialogue:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to translate dialogue',
    });
  }
});

// 4. Mod & Cheat Generator using gemini-4-argon with ThinkingLevel.HIGH
app.post('/api/ai/generate-mod', async (req, res) => {
  try {
    const { options, gameDetails } = req.body;

    const systemInstruction = `You are a Ren'Py modding guru. Generate clean, drop-in Ren'Py (.rpy) code files that work on both PC and Android APKs.`;

    const prompt = `
Create a comprehensive Ren'Py mod script (e.g. 00_mod_cheat_menu.rpy) based on these requested features:
${JSON.stringify(options, null, 2)}
Game details: ${gameDetails || 'Standard Ren\'Py Visual Novel'}

Include:
1. init python block with config.developer, config.console, rollback, fast skipping.
2. Custom cheat screen with clean GUI (unlock gallery, infinite stats, jump to any label).
3. Android touch-friendly button to trigger the mod menu.
4. Comments in Thai explaining how to drop it into game/ or assets/x-game/game/ in an APK.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-argon',
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    res.json({
      success: true,
      code: response.text || '',
    });
  } catch (error: any) {
    console.error('Error in /api/ai/generate-mod:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate mod script',
    });
  }
});

// 5. Connectors Status (Gemini, OpenAI, Codex, GitHub)
app.get('/api/connectors/status', (_req, res) => {
  res.json({
    gemini: {
      name: 'Google Gemini (gemini-4-argon)',
      connected: true,
      thinkingLevel: 'HIGH',
      description: 'เอนจินหลักสำหรับการวิเคราะห์เชิงลึก, แก้ไขไวยากรณ์, และแปลบทสนทนา Ren\'Py',
    },
    openai: {
      name: 'OpenAI & Codex (GPT-4o / o3-mini)',
      connected: Boolean(process.env.OPENAI_API_KEY),
      hasCustomKey: Boolean(process.env.OPENAI_API_KEY),
      description: 'เอนจิน Codex สำหรับสร้างโค้ด Python, Refactoring, และแปลงโครงสร้างเกม',
    },
    github: {
      name: 'GitHub Repository & Gist Connector',
      connected: true,
      hasToken: Boolean(process.env.GITHUB_TOKEN),
      description: 'นำเข้าสคริปต์ Ren\'Py, Mod, และ APK assets จาก GitHub repository และ Gist โดยตรง',
    },
  });
});

// 6. OpenAI / Codex Code Generation & Debugging endpoint
app.post('/api/ai/openai-codex', async (req, res) => {
  try {
    const { prompt, code, mode, customApiKey } = req.body;
    const apiKey = customApiKey || process.env.OPENAI_API_KEY;

    const fullPrompt = `You are OpenAI Codex and a Senior Ren'Py Game Engine Architect.
Task: ${mode || 'Code Generation & Optimization'}
Context code:
${code || '(None)'}

User Request:
${prompt}

Provide clean, robust Ren'Py 8.x / Python code with explanation in Thai.`;

    if (apiKey) {
      // Direct call to OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an elite Codex and Ren\'Py Game Engine programming assistant. Output working Ren\'Py and Python code with clear explanations in Thai.',
            },
            { role: 'user', content: fullPrompt },
          ],
          temperature: 0.2,
        }),
      });

      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        return res.json({
          success: true,
          provider: 'OpenAI GPT-4o (Codex Engine)',
          result: data.choices[0].message.content,
        });
      }
    }

    // High-performance fallback using gemini-4-argon with thinking mode
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-4-argon',
      contents: fullPrompt,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    res.json({
      success: true,
      provider: 'Gemini 4 Argon (Codex High-Thinking Engine)',
      result: aiResponse.text || '',
      note: apiKey ? undefined : 'รันผ่าน Gemini 4 Argon ในโหมดจำลอง Codex Thinking High',
    });
  } catch (error: any) {
    console.error('Error in /api/ai/openai-codex:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to call OpenAI Codex',
    });
  }
});

// 7. GitHub Repository Importer endpoint
app.post('/api/github/import-repo', async (req, res) => {
  try {
    const { repoUrl, branch = 'main' } = req.body;
    if (!repoUrl) {
      return res.status(400).json({ success: false, error: 'Repository URL is required' });
    }

    // Extract owner and repo: e.g. "https://github.com/owner/repo" or "owner/repo"
    const cleaned = repoUrl.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
    const parts = cleaned.split('/');
    if (parts.length < 2) {
      return res.status(400).json({ success: false, error: 'Invalid GitHub repository format (use owner/repo)' });
    }
    const [owner, repo] = [parts[0], parts[1]];

    const headers: Record<string, string> = {
      'User-Agent': 'Renpy-APK-Studio',
      'Accept': 'application/vnd.github.v3+json',
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    // Try specified branch, then fallback to master
    let treeData: any = null;
    let targetBranch = branch;
    for (const b of [branch, 'main', 'master']) {
      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${b}?recursive=1`, { headers });
      if (treeRes.ok) {
        treeData = await treeRes.json();
        targetBranch = b;
        break;
      }
    }

    if (!treeData || !treeData.tree) {
      return res.status(404).json({ success: false, error: `Could not fetch repository tree for ${owner}/${repo}` });
    }

    // Filter relevant game & code files (.rpy, .py, .xml, .json, .txt)
    const allowedExts = ['.rpy', '.py', '.xml', '.json', '.txt', '.md', '.yaml', '.yml'];
    const matchedFiles = treeData.tree.filter((item: any) =>
      item.type === 'blob' && allowedExts.some((ext) => item.path.toLowerCase().endsWith(ext))
    );

    // Limit to top 25 files to avoid hitting rate limits
    const filesToFetch = matchedFiles.slice(0, 25);
    const downloadedFiles = await Promise.all(
      filesToFetch.map(async (item: any) => {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${targetBranch}/${item.path}`;
          const contentRes = await fetch(rawUrl, { headers: { 'User-Agent': 'Renpy-APK-Studio' } });
          const text = await contentRes.text();
          return {
            name: item.path.split('/').pop() || item.path,
            path: item.path,
            content: text,
            isBinary: false,
            modified: false,
          };
        } catch {
          return null;
        }
      })
    );

    const validFiles = downloadedFiles.filter(Boolean);

    res.json({
      success: true,
      repo: `${owner}/${repo}`,
      branch: targetBranch,
      totalFound: matchedFiles.length,
      importedCount: validFiles.length,
      files: validFiles,
    });
  } catch (error: any) {
    console.error('Error in /api/github/import-repo:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to import repository from GitHub',
    });
  }
});

// 8. GitHub Gist Exporter endpoint
app.post('/api/github/export-gist', async (req, res) => {
  try {
    const { files, description = 'Ren\'Py Script Export from Ren\'Py & APK Studio', isPublic = false } = req.body;
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return res.json({
        success: false,
        error: 'No GITHUB_TOKEN configured on server. You can export as local ZIP or copy code directly.',
      });
    }

    const gistFiles: Record<string, { content: string }> = {};
    (files || []).forEach((f: any) => {
      if (!f.isBinary && f.content) {
        // Gist doesn't support slash in filename, replace with underscore
        const safeName = f.path.replace(/\//g, '_');
        gistFiles[safeName] = { content: f.content };
      }
    });

    const response = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `token ${token}`,
        'User-Agent': 'Renpy-APK-Studio',
      },
      body: JSON.stringify({
        description,
        public: isPublic,
        files: gistFiles,
      }),
    });

    const data = await response.json();
    if (data.html_url) {
      res.json({ success: true, gistUrl: data.html_url });
    } else {
      res.status(400).json({ success: false, error: data.message || 'Failed to create Gist' });
    }
  } catch (error: any) {
    console.error('Error in /api/github/export-gist:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start Express server and connect Vite in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
