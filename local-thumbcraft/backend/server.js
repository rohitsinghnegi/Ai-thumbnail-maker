const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs-extra');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const Groq = require('groq-sdk');

dotenv.config();

// ─── Validate API key at startup ────────────────────────────────────────────
if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is missing from .env — server cannot start.');
    process.exit(1);
}
if (!process.env.GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY is missing from .env — server cannot start.');
    process.exit(1);
}

const app = express();
app.use(cors({ origin: 'http://localhost:5173', methods: ['GET', 'POST'] }));
app.use(express.json({ limit: '2mb' })); // thumbnails are text-only input

const uploadsDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadsDir);
app.use('/images', express.static(uploadsDir));

const dbFile = path.join(__dirname, 'db.json');
if (!fs.existsSync(dbFile)) fs.writeJsonSync(dbFile, []);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── In-flight guard: prevent duplicate concurrent requests ─────────────────
let isGenerating = false;

// ─── Jitter: random 1–2 s pause between Stage 1 → Stage 2 ──────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const jitter = () => sleep(1000 + Math.random() * 1000);

// ============================================================
// VISUAL CONSTRAINT DICTIONARY (compact values — better for Imagen 4)
// ============================================================
const MOOD = {
    'Excited':      'vibrant, high-energy, saturated, electric, dynamic',
    'Serious':      'dramatic, chiaroscuro, desaturated, high-contrast, cinematic tension',
    'Fun':          'playful, bright, cheerful, whimsical, bold pop colors',
    'Professional': 'clean, polished, premium lighting, sophisticated, minimal',
    'Mysterious':   'moody, low-key, fog, dark blues and purples, enigmatic',
    'Energetic':    'hyper-saturated, motion blur, explosive, wide angle, powerful'
};

const STYLE = {
    'Photo-realistic': 'hyperrealistic photography, 8K, DSLR bokeh, studio lighting',
    'Cartoonish':      'stylized illustration, bold outlines, flat vibrant colors, animated',
    'Minimalistic':    'clean, geometric, elegant negative space, minimal clutter',
    'Artistic':        'oil painting, impressionist, painterly, fine art digital',
    'Modern':          'contemporary, glassmorphism, sharp geometry, futuristic tech',
    'Vintage':         'film grain, sepia, retro color grade, nostalgic, aged'
};

const THEME = {
    'Bright':     'high-key, overexposed whites, sunny, brilliant highlights',
    'Dark':       'low-key, deep shadows, noir, dark background, dramatic contrast',
    'Colorful':   'rainbow palette, color-blocking, chromatic vibrancy, bold contrasts',
    'Minimalist': 'monochromatic, single accent color, abundant white space',
    'Gradient':   'smooth gradient, duotone, iridescent, ombre',
    'Neon':       'neon glow, cyberpunk, fluorescent accents, LED aesthetic'
};

const COLOR = {
    'Red':    'crimson and scarlet, red accent lighting, bold red focal point',
    'Blue':   'azure and navy, blue cinematic grade, deep ocean blues',
    'Green':  'emerald, nature-inspired, vibrant lime accents',
    'Purple': 'royal violet, mystical purple lighting, deep amethyst',
    'Orange': 'amber and tangerine, golden hour, warm energetic',
    'Yellow': 'golden tones, sunlit, cheerful golden accent',
    'Pink':   'rose and magenta, soft pastels, vibrant hot-pink accents',
    'Cyan':   'electric teal and cyan, neon aqua, futuristic cyan glow'
};

const CATEGORY = {
    'Tech':          'holographic UI, glowing screens, circuit board motifs, futuristic',
    'Gaming':        'dramatic game scene, explosive VFX, gaming atmosphere',
    'Vlog':          'lifestyle photography, natural authentic light, candid moment',
    'Tutorial':      'clear instructional composition, clean layout, educational',
    'Entertainment': 'showbiz glamour, stage lighting, celebrity-style composition',
    'News':          'breaking news, journalistic photography, broadcast aesthetic'
};

const COMPOSITION = {
    'Face Close-Up':    'extreme close-up portrait, face fills right 70% of frame, left third clear for text, shallow DOF background',
    'Split Screen':     'vertical split-screen, left half vs right half contrasting concepts, bold dividing line',
    'Before & After':   'horizontal split, before top / after bottom, dramatic transformation',
    'Product Showcase': 'hero product centered, spotlight from above, dark vignette background, top clear for title',
    'Action Shot':      'dynamic diagonal, subject lower-left, motion blur, upper-right clear for bold text',
    'Minimal Text':     'bold large-scale typography 60% of frame, strong contrast, poster-style layout',
    'Collage Grid':     '2x2 mosaic grid, thin borders, cohesive palette, title overlaid center',
    'Full Immersive':   'full-bleed cinematic landscape, subject integrated, dark letterbox bands top and bottom'
};

const TEXT_STYLE = {
    'Bold':     'massive bold impact text, heavy letterforms, punchy headline',
    'Minimal':  'clean thin elegant font, understated text',
    'Fancy':    'decorative script, elegant serif, ornate display font',
    'Outlined': 'outlined knockout text, stroke letters, high contrast',
    'Shadow':   'drop shadow text, 3D extruded letterforms',
    'Gradient': 'gradient fill text, iridescent shimmering letters'
};

// ============================================================
// BUILD CONSTRAINT BLOCK — only include what's set
// ============================================================
function buildConstraintBlock(data) {
    const parts = [];
    if (data.mood && MOOD[data.mood])                   parts.push(`mood: ${MOOD[data.mood]}`);
    if (data.style && STYLE[data.style])                parts.push(`style: ${STYLE[data.style]}`);
    if (data.theme && THEME[data.theme])                parts.push(`theme: ${THEME[data.theme]}`);
    if (data.color && COLOR[data.color])                parts.push(`color: ${COLOR[data.color]}`);
    if (data.category && CATEGORY[data.category])       parts.push(`category: ${CATEGORY[data.category]}`);
    if (data.composition && COMPOSITION[data.composition]) parts.push(`composition: ${COMPOSITION[data.composition]}`);
    if (data.includeText === 'Yes') {
        const ts = data.textStyle && TEXT_STYLE[data.textStyle] ? TEXT_STYLE[data.textStyle] : 'bold readable text';
        parts.push(`text: leave clear negative space for title overlay, ${ts}`);
    } else if (data.includeText === 'No') {
        parts.push('text: no text — pure visual composition');
    }
    if (data.customPrompt && data.customPrompt.trim())  parts.push(`extra: ${data.customPrompt.trim()}`);
    return parts.join(' | ');
}

// ============================================================
// STAGE 1: Groq (llama-3.3-70b-versatile) — Generate expert Imagen prompt
// Ultra-fast inference (~0.3s), free tier, excellent instruction-following
// ============================================================
async function generateThumbnailPrompt(topic, constraintBlock) {
    const userMsg = `Topic: ${topic}${constraintBlock ? '\nConstraints: ' + constraintBlock : ''}`;

    const systemInstruction =
        'You are a YouTube thumbnail prompt engineer for Imagen 4. Output ONLY the final image-gen prompt — no labels, preamble, or explanation.\n' +
        'Rules: max 80 words | 16:9 aspect | describe subject (exaggerated expression if human), background, lighting (dramatic high-contrast), composition, dominant colours, any FX/icons | prioritise CTR — bold, eye-catching, emotionally charged | match requested style exactly.';

    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user',   content: userMsg }
        ],
        temperature: 0.75,
        max_tokens: 150
    });

    return response.choices[0].message.content.trim();
}

// ============================================================
// STAGE 2: imagen-4.0-fast-generate-001 — Generate thumbnail
// ============================================================
async function generateThumbnailImage(prompt, filePath) {
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${process.env.GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                instances: [{ prompt }],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: '16:9',
                    safetyFilterLevel: 'block_few',        // reduce over-blocking
                    personGeneration: 'allow_adult'        // allow realistic people
                }
            })
        }
    );

    const data = await res.json();
    if (!res.ok) {
        const msg = data.error?.message || JSON.stringify(data);
        throw new Error(`Imagen API error: ${msg}`);
    }
    if (!data.predictions?.[0]?.bytesBase64Encoded) {
        throw new Error('Imagen returned no image data — prompt may have been blocked');
    }

    fs.writeFileSync(filePath, Buffer.from(data.predictions[0].bytesBase64Encoded, 'base64'));
    return true;
}

// ============================================================
// MAIN GENERATE ENDPOINT
// ============================================================
app.post('/api/generate', async (req, res) => {
    // ── Guard: reject if another generation is already running ──
    if (isGenerating) {
        return res.status(429).json({ error: 'A generation is already in progress. Please wait.' });
    }

    // ── Basic input validation ──
    const { description } = req.body;
    if (!description || typeof description !== 'string' || !description.trim()) {
        return res.status(400).json({ error: 'description is required and must be a non-empty string.' });
    }

    isGenerating = true;
    try {
        const {
            style, mood, category, theme, primaryColor,
            includeText, textStyle, thumbnailTemplate, customPrompt
        } = req.body;

        // Build compact constraint block
        const constraintBlock = buildConstraintBlock({
            mood,
            style: style || 'Photo-realistic',
            theme,
            color: primaryColor,
            category,
            composition: thumbnailTemplate,
            includeText,
            textStyle,
            customPrompt
        });

        console.log('\n📋 Constraints:', constraintBlock || '(none)');

        // Stage 1 — generate expert prompt
        console.log('\n🧠 Stage 1: Groq llama-3.3-70b generating prompt...');
        const cookedPrompt = await generateThumbnailPrompt(description.trim(), constraintBlock);
        console.log('\n✨ Expert prompt:', cookedPrompt);

        // Jitter — prevent per-minute burst
        await jitter();

        // Stage 2 — generate image
        console.log('\n🎨 Stage 2: Imagen 4 Fast generating thumbnail...');
        const fileName = `thumbnail_${Date.now()}.png`;
        const filePath = path.join(uploadsDir, fileName);
        await generateThumbnailImage(cookedPrompt, filePath);
        const imageUrl = `http://localhost:${process.env.PORT || 5000}/images/${fileName}`;
        console.log('✅ Thumbnail saved:', fileName);

        // Persist to DB (FIX: was writing only newEntry, not the full array)
        const db = fs.readJsonSync(dbFile);
        const entry = {
            id: Date.now().toString(),
            description: description.trim(),
            style,
            mood,
            category,
            theme,
            primaryColor,
            thumbnailTemplate,
            includeText,
            textStyle,
            constraintBlock,
            cookedPrompt,
            imageUrl,
            createdAt: new Date().toISOString()
        };
        db.unshift(entry);
        if (db.length > 100) db.splice(100); // cap history at 100
        fs.writeJsonSync(dbFile, db, { spaces: 2 });

        res.json(entry);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    } finally {
        isGenerating = false;
    }
});

app.get('/api/history', (_req, res) => {
    try {
        res.json(fs.readJsonSync(dbFile));
    } catch {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

app.get('/api/health', (_req, res) =>
    res.json({ status: 'ok', model_prompt: 'gemini-2.0-flash-lite', model_image: 'imagen-4.0-fast-generate-001', timestamp: new Date().toISOString() })
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 ThumbCraft Backend on http://localhost:${PORT}`);
    console.log('🧠 Stage 1: Groq llama-3.3-70b-versatile  →  Expert prompt');
    console.log('🎨 Stage 2: Imagen 4 Fast (Gemini)          →  16:9 thumbnail\n');
});
