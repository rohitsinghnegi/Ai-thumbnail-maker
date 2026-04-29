const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const Groq = require('groq-sdk');
const Replicate = require('replicate');

dotenv.config();

// ─── Validate API keys at startup ─────────────────────────────────────────────
if (!process.env.PIXAZO_API_KEY) {
    console.error('❌ PIXAZO_API_KEY is missing from .env — server cannot start.');
    process.exit(1);
}
if (!process.env.GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY is missing from .env — server cannot start.');
    process.exit(1);
}
if (!process.env.REPLICATE_API_TOKEN) {
    console.warn('⚠️  REPLICATE_API_TOKEN not set — face photo feature will be disabled.');
}

const app = express();
app.use(cors({ origin: 'http://localhost:5173', methods: ['GET', 'POST', 'PUT', 'DELETE'] }));
app.use(express.json({ limit: '10mb' }));

const uploadsDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadsDir);
app.use('/images', express.static(uploadsDir));

// ─── Multer: store uploaded face photos in memory (convert to base64 for Replicate) ─
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed.'));
    }
});

// ─── Replicate client (only instantiated if token is present) ───────────────────
const replicate = process.env.REPLICATE_API_TOKEN
    ? new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
    : null;

const dbFile = path.join(__dirname, 'db.json');
if (!fs.existsSync(dbFile)) fs.writeJsonSync(dbFile, []);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── In-flight guards ─────────────────────────────────────────────────────────
let isFaceGenerating = false;

// ─── In-flight guard for standard pipeline ──────────────────────────────────
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
// STAGE 1: Groq (llama-3.3-70b-versatile) — Generate expert Flux Schnell prompt
// Ultra-fast inference, excellent instruction-following
// ============================================================
async function generateThumbnailPrompt(topic, constraintBlock) {
    const userMsg = `Topic: "${topic}"${constraintBlock ? '\nUser selections: ' + constraintBlock : ''}`;

    const systemInstruction = [
        '=== ROLE ===',
        'You are a world-class YouTube thumbnail prompt engineer with deep expertise in:',
        '  • YouTube SEO and CTR optimization science',
        '  • Flux 1 Schnell text-to-image model capabilities',
        '  • Visual psychology and attention engineering',
        'Your sole output is a Flux 1 Schnell image generation prompt that produces a thumbnail proven to maximize clicks and search visibility.',
        '',
        '=== ABSOLUTE OUTPUT RULES ===',
        '1. Output ONLY the raw image prompt. No intro, no explanation, no labels, no markdown.',
        '2. Length: 150–200 words. Flux Schnell needs rich multi-layered descriptions to produce quality output.',
        '3. ENGLISH ONLY — every single word in the prompt must be English. Never use or imply any non-English script, characters, or language. This is non-negotiable.',
        '4. Never use placeholder brackets like [text] or [title]. Write the real thing or omit it.',
        '5. Do NOT start with "A", "An", or "The". Begin with the subject directly or a punchy adjective.',
        '',
        '=== YOUTUBE SEO THUMBNAIL SCIENCE (apply all of these) ===',
        'RULE 1 — FACE-FORWARD CLOSE-UP: Thumbnails with a human face in the foreground get 38% more clicks. The face must fill at least 40% of the left or center frame. Expression must be extreme — open mouth, wide eyes, raised eyebrows.',
        'RULE 2 — EMOTION PRECISION: Use only these proven high-CTR emotions: SHOCK, DISBELIEF, JOY, FEAR, DETERMINATION, or EXCITEMENT. Name it explicitly in the prompt (e.g. "face frozen in pure disbelief").',
        'RULE 3 — MOBILE-FIRST CLARITY: YouTube thumbnails display at 168x94px on mobile. Use ONE dominant subject with zero visual clutter. Background must be simple and blurred so the subject pops.',
        'RULE 4 — CONTRAST ENGINEERING: Place warm foreground against cool background, or bright subject against dark background. Opposite color contrast doubles visual pop at small sizes.',
        'RULE 5 — CURIOSITY GAP: The image must imply something surprising or incomplete — a reaction to something off-screen, a shocking result, a before/after moment. Viewer must wonder "what happened?"',
        'RULE 6 — COLOR SCIENCE: Use maximum 2–3 dominant colors from complementary or triadic palettes. Avoid muddy or desaturated palettes. Neon accents or high-saturation focal colors outperform muted tones by 60%.',
        'RULE 7 — VISUAL HIERARCHY: Eyes → Face → Action → Background. Describe elements in this priority order so the composition naturally guides the viewer\'s eye.',
        '',
        '=== FLUX 1 SCHNELL PROMPT ARCHITECTURE ===',
        'Build the prompt in this exact layered order:',
        '',
        'LAYER 1 — SUBJECT (40% of prompt):',
        'Exact description of main human subject: gender, approximate age, skin tone, hair, outfit color and style. Expression must use clinical precision — "jaw dropped, eyes stretched wide, brows raised in pure disbelief." Specify that subject occupies left-center frame.',
        '',
        'LAYER 2 — GESTURE & BODY LANGUAGE:',
        'Dynamic pose that communicates urgency or reaction: "arm outstretched pointing right at glowing result", "hands framing the face in shock". Body language should drive curiosity.',
        '',
        'LAYER 3 — BACKGROUND & ENVIRONMENT:',
        'Specific but simple setting relevant to the topic. Must be heavily blurred (bokeh) to keep subject dominant. One environmental storytelling element that reinforces the topic (e.g., glowing monitors for tech, stacked cash for finance, scoreboard for gaming).',
        '',
        'LAYER 4 — CINEMATIC LIGHTING:',
        'Name the lighting setup explicitly: "dramatic three-point studio lighting", "neon rim backlight in electric blue", "golden hour key light from left with deep purple shadow fill". Include lens effects: anamorphic lens flare, god rays, shallow depth of field.',
        '',
        'LAYER 5 — COLOR GRADING:',
        'State the exact color grade: "vibrant orange and electric blue contrast grade", "punchy red and black high-contrast grade". Match to user\'s selected color and mood.',
        '',
        'LAYER 6 — TECHNICAL TAIL (always end with this exact phrase):',
        '"sharp focus, ultra-detailed, 8K resolution, photorealistic, hyperrealistic, cinematic composition, award-winning photography, 16:9 aspect ratio, Flux Schnell render, professional studio, no watermarks"',
        '',
        '=== FLUX SCHNELL POWER WORDS (weave in naturally, do not list) ===',
        'photorealistic, hyperrealistic, cinematic, dramatic lighting, volumetric god rays, bokeh background, film grain, color graded, Kodak cinematic, award-winning photography, professional DSLR, f/1.4 aperture, octane render, unreal engine 5, 8K ultra HD.',
        '',
        '=== MANDATORY CONSTRAINT ADHERENCE ===',
        'Every user-selected option (mood, style, theme, color, composition, category) is a HARD visual requirement.',
        'Mood → controls emotional temperature and energy of the scene.',
        'Style → controls rendering technique (photo-real, cartoon, artistic, etc.).',
        'Theme → controls lighting brightness/darkness and color temperature.',
        'Color → must be the dominant accent color visible in lighting, outfit, or background.',
        'Category → defines the environmental context and prop choices.',
        'Composition → defines exactly how the frame is structured and divided.',
        'Ignore NO option. Reflect ALL of them in the prompt.'
    ].join('\n');

    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user',   content: userMsg }
        ],
        temperature: 0.78,
        max_tokens: 400
    });

    return response.choices[0].message.content.trim();
}

// ============================================================
// STAGE 2: Pixazo Flux 1 Schnell — Generate thumbnail (Sync)
// ============================================================
const PIXAZO_GENERATE_URL = 'https://gateway.pixazo.ai/flux-1-schnell/v1/getData';

async function generateThumbnailImage(prompt, filePath) {
    // ── 1. Submit generation request ──
    const submitRes = await fetch(PIXAZO_GENERATE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Ocp-Apim-Subscription-Key': process.env.PIXAZO_API_KEY
        },
        body: JSON.stringify({
            prompt,
            width: 1280,
            height: 720,
            num_images: 1
        })
    });

    const submitData = await submitRes.json();
    if (!submitRes.ok) {
        const msg = submitData.error || submitData.message || JSON.stringify(submitData);
        throw new Error(`Pixazo Flux submit error (${submitRes.status}): ${msg}`);
    }

    const imageUrl = submitData.output;
    if (!imageUrl) throw new Error('Pixazo Flux did not return an output URL');
    console.log(`\n✨ Pixazo Flux completed synchronously — downloading image...`);

    // ── 2. Download image from CDN and save locally ──
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Failed to download image from CDN: ${imgRes.status}`);
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    fs.writeFileSync(filePath, imgBuffer);
    
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

// ============================================================
// FACE GENERATION ENDPOINT  (InstantID via Replicate)
// POST /api/generate-with-face
// Accepts: multipart/form-data  { photo: File, ...same fields as /api/generate }
// ============================================================
app.post('/api/generate-with-face', upload.single('photo'), async (req, res) => {
    if (!replicate) {
        return res.status(503).json({ error: 'REPLICATE_API_TOKEN is not configured on the server.' });
    }
    if (isFaceGenerating) {
        return res.status(429).json({ error: 'A face generation is already in progress. Please wait.' });
    }

    const { description } = req.body;
    if (!description || !description.trim()) {
        return res.status(400).json({ error: 'description is required.' });
    }
    if (!req.file) {
        return res.status(400).json({ error: 'photo file is required for face generation.' });
    }

    isFaceGenerating = true;
    try {
        const {
            style, mood, category, theme, primaryColor,
            includeText, textStyle, thumbnailTemplate, customPrompt
        } = req.body;

        // Build constraint block (same as standard pipeline)
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

        console.log('\n📋 Face-Gen Constraints:', constraintBlock || '(none)');

        // Stage 1 — generate expert prompt via Groq (same as standard)
        console.log('\n🧠 Stage 1: Groq llama-3.3-70b generating face-aware prompt...');
        const cookedPrompt = await generateThumbnailPrompt(description.trim(), constraintBlock);
        console.log('\n✨ Expert prompt:', cookedPrompt);

        // Jitter
        await jitter();

        // Stage 2 — convert uploaded photo to data URI for Replicate
        console.log('\n🎨 Stage 2: InstantID (Replicate) — preserving real face features...');
        const mimeType = req.file.mimetype;
        const base64Image = req.file.buffer.toString('base64');
        const dataUri = `data:${mimeType};base64,${base64Image}`;

        // Call Replicate InstantID — preserves 100% of real face identity
        const output = await replicate.run(
            'zsxkib/instant-id:491ddf5be6b827f8931f088ef10c6d015f6d99685e6454e6f04ab4e62f0af37c',
            {
                input: {
                    image:                        dataUri,
                    prompt:                       cookedPrompt,
                    negative_prompt:             'blurry, deformed, ugly, bad anatomy, extra limbs, watermark, text, nsfw',
                    width:                        1080,
                    height:                       720,
                    num_outputs:                  1,
                    guidance_scale:               5,
                    num_inference_steps:          30,
                    ip_adapter_scale:             0.8,
                    controlnet_conditioning_scale: 0.8,
                    enhance_nonface_region:       true,
                }
            }
        );

        // Replicate returns an array of URLs
        const replicateUrl = Array.isArray(output) ? output[0] : output;
        if (!replicateUrl) throw new Error('Replicate InstantID returned no output URL');
        console.log(`\n✨ InstantID completed — downloading image...`);

        // Download and save locally (same pattern as Pixazo)
        const imgRes = await fetch(replicateUrl);
        if (!imgRes.ok) throw new Error(`Failed to download image from Replicate CDN: ${imgRes.status}`);
        const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
        const fileName = `face_thumbnail_${Date.now()}.png`;
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, imgBuffer);
        const imageUrl = `http://localhost:${process.env.PORT || 5000}/images/${fileName}`;
        console.log('✅ Face thumbnail saved:', fileName);

        // Persist to DB
        const db = fs.readJsonSync(dbFile);
        const entry = {
            id:               Date.now().toString(),
            description:      description.trim(),
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
            generatedWithFace: true,
            createdAt:        new Date().toISOString()
        };
        db.unshift(entry);
        if (db.length > 100) db.splice(100);
        fs.writeJsonSync(dbFile, db, { spaces: 2 });

        res.json(entry);
    } catch (error) {
        console.error('\n❌ Face-Gen Error:', error.message);
        res.status(500).json({ error: error.message });
    } finally {
        isFaceGenerating = false;
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
    res.json({
        status: 'ok',
        model_prompt:  'groq-llama-3.3-70b',
        model_image:   'pixazo-flux-1-schnell',
        model_face:    replicate ? 'replicate-instant-id' : 'disabled',
        timestamp:     new Date().toISOString()
    })
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 ThumbCraft Backend on http://localhost:${PORT}`);
    console.log('🧠 Stage 1: Groq llama-3.3-70b-versatile  →  Expert prompt');
    console.log('🎨 Stage 2: Pixazo Flux 1 Schnell         →  1280x720 thumbnail');
    console.log('🧑 Face Mode: Replicate InstantID          →  Identity-preserved face thumbnail\n');
});
