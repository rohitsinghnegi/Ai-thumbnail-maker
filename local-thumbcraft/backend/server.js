const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs-extra');
const path = require('path');

// New Gen AI SDK — required for Nano Banana 2 image generation
const { GoogleGenAI } = require('@google/genai');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const uploadsDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadsDir);
app.use('/images', express.static(uploadsDir));

const dbFile = path.join(__dirname, 'db.json');
if (!fs.existsSync(dbFile)) fs.writeJsonSync(dbFile, []);

// Single client for both models (uses GEMINI_API_KEY env var automatically)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ============================================================
// VISUAL CONSTRAINT DICTIONARY
// Maps quiz answers → professional cinematography / design keywords
// ============================================================
const MOOD_KEYWORDS = {
    'Excited':      'vibrant color grading, high-energy dynamic lighting, explosive visual impact, saturated bold palette, electric atmosphere, kinetic composition',
    'Serious':      'dramatic chiaroscuro lighting, desaturated tones, heavy contrast, authoritative gravitas, cinematic tension, dark vignette edges',
    'Fun':          'playful pastel tones, bright cheerful lighting, dynamic angles, whimsical elements, comic-style pop colors, energetic fun composition',
    'Professional': 'clean corporate aesthetic, premium lighting setup, polished finish, subtle gradients, minimal clutter, sophisticated color grading',
    'Mysterious':   'deep shadow play, moody low-key lighting, enigmatic atmosphere, fog effects, dark blues and purples, cinematic depth',
    'Energetic':    'fast-paced visual language, motion blur accents, hyper-saturated colors, explosive energy, dramatic wide angle, power composition'
};

const STYLE_KEYWORDS = {
    'Photo-realistic': 'hyperrealistic photography, 8K ultra HD, Canon EOS R5 lens quality, studio-grade lighting, DSLR bokeh, photojournalism quality',
    'Cartoonish':      'stylized illustration, bold outlines, vibrant flat colors, comic art style, exaggerated features, animated character design',
    'Minimalistic':    'clean white space, simple geometric forms, sans-serif typography, Swiss design principles, elegant negative space, breathable layout',
    'Artistic':        'oil painting texture, impressionist brushstrokes, painterly light, gallery-quality artwork, fine art digital painting',
    'Modern':          'contemporary design language, glassmorphism effects, sharp geometry, futuristic UI elements, clean lines, tech aesthetic',
    'Vintage':         'film grain overlay, warm sepia tones, retro color grading, aged texture, nostalgic filter, classic film photography style'
};

const THEME_KEYWORDS = {
    'Bright':     'high-key lighting, overexposed whites, sunny cheerful palette, brilliant highlights, airy open atmosphere',
    'Dark':       'low-key dramatic lighting, deep shadows, noir atmosphere, dark background, contrast-heavy composition',
    'Colorful':   'rainbow spectrum palette, color-blocking technique, chromatic vibrancy, multi-hue gradients, bold color contrasts',
    'Minimalist': 'monochromatic palette, single accent color, abundant white space, clean uncluttered layout',
    'Gradient':   'smooth color transitions, duotone gradient overlay, linear color sweep, iridescent sheen, ombre effect',
    'Neon':       'neon glow effects, cyberpunk lighting, fluorescent accents, dark background with glowing elements, LED light aesthetic'
};

const COLOR_KEYWORDS = {
    'Red':    'deep crimson and scarlet tones, warm red accent lighting, bold red focal point, high-energy red palette',
    'Blue':   'cool azure and navy palette, blue cinematic grade, deep ocean blues, calm blue ambient lighting',
    'Green':  'lush emerald tones, nature-inspired green palette, vibrant lime accents, forest green depth',
    'Purple': 'royal violet palette, mystical purple lighting, deep amethyst tones, purple cinematic grade',
    'Orange': 'warm amber and tangerine tones, golden hour lighting, rich orange focal accent, warm energetic palette',
    'Yellow': 'bright golden tones, sunlit yellow atmosphere, cheerful golden accent, warm sunburst colors',
    'Pink':   'rose and magenta palette, soft pink pastel tones, vibrant hot-pink accents, feminine color story',
    'Cyan':   'electric teal and cyan palette, neon aqua accents, cool tech-blue cyan, futuristic cyan glow'
};

const CATEGORY_KEYWORDS = {
    'Tech':          'futuristic interface elements, circuit board motifs, holographic UI, glowing screens, tech product backdrop',
    'Gaming':        'dramatic game scene, controller silhouette, game art aesthetic, explosive visual FX, gaming rig atmosphere',
    'Vlog':          'lifestyle photography feel, natural authentic light, real-world setting, candid moment energy, relatable environment',
    'Tutorial':      'clear instructional composition, step-by-step visual cues, clean layout, educational clarity, diagram-friendly space',
    'Entertainment': 'showbiz glamour, stage lighting, entertainment spectacle, celebrity-style composition, crowd energy',
    'News':          'breaking news urgency, bold headline space, journalistic photography, authoritative factual tone, broadcast aesthetic'
};

const TEXT_STYLE_KEYWORDS = {
    'Bold':     'massive bold impact typography, heavy black letterforms, punchy headline text treatment',
    'Minimal':  'clean thin typography, elegant light-weight font, understated sophisticated text',
    'Fancy':    'decorative script lettering, elegant serif typography, ornate display font',
    'Outlined': 'outlined knockout text, stroke typography, high contrast outlined letters',
    'Shadow':   'drop shadow text treatment, 3D extruded letterforms, depth-layered text',
    'Gradient': 'gradient fill typography, color-flow text, iridescent shimmering letters'
};

const TEMPLATE_COMPOSITIONS = {
    'Face Close-Up':
        'extreme close-up portrait shot, subject face fills 70% of frame on right side, strong emotional expression, left third left clear for text overlay, shallow depth of field background',
    'Split Screen':
        'split-screen composition divided vertically down center, left half shows one concept, right half contrasting concept, bold dividing line, each side independently lit',
    'Before & After':
        'horizontal split composition, top half shows "before" state, bottom half shows dramatic "after" transformation, bold dividing band in center for text',
    'Product Showcase':
        'hero product centered in frame, spotlit from above, dark gradient vignette background, product occupies center 60%, top third clear for title text',
    'Action Shot':
        'dynamic diagonal composition, subject in motion at lower-left, energy trails and motion blur, upper-right corner clear for bold text, wide cinematic aspect ratio',
    'Minimal Text':
        'bold large-scale typography dominates 60% of the image, minimal background illustration, strong contrast between text and background, poster-style graphic design layout',
    'Collage Grid':
        '2x2 grid mosaic of 4 related images stitched together, thin border separating each cell, overall cohesive color palette, title text can overlay grid center',
    'Full Immersive':
        'full-bleed immersive environment shot, subject integrated into epic landscape or scene, text-friendly darkened top and bottom letterbox bands, ultra-wide cinematic composition'
};

// ============================================================
// BUILD CONSTRAINT BLOCK
// Assembles all quiz answers into a structured context string
// ============================================================
function buildConstraintBlock(data) {
    const parts = [];
    if (data.mood && MOOD_KEYWORDS[data.mood])
        parts.push(`Mood & Atmosphere: ${MOOD_KEYWORDS[data.mood]}`);
    if (data.thumbnailStyle && STYLE_KEYWORDS[data.thumbnailStyle])
        parts.push(`Visual Style: ${STYLE_KEYWORDS[data.thumbnailStyle]}`);
    if (data.theme && THEME_KEYWORDS[data.theme])
        parts.push(`Color Theme: ${THEME_KEYWORDS[data.theme]}`);
    if (data.primaryColor && COLOR_KEYWORDS[data.primaryColor])
        parts.push(`Primary Color: ${COLOR_KEYWORDS[data.primaryColor]}`);
    if (data.category && CATEGORY_KEYWORDS[data.category])
        parts.push(`Content Category: ${CATEGORY_KEYWORDS[data.category]}`);
    if (data.thumbnailTemplate && TEMPLATE_COMPOSITIONS[data.thumbnailTemplate])
        parts.push(`Composition Template: ${TEMPLATE_COMPOSITIONS[data.thumbnailTemplate]}`);
    if (data.includeText === 'Yes') {
        const textKw = data.textStyle && TEXT_STYLE_KEYWORDS[data.textStyle]
            ? TEXT_STYLE_KEYWORDS[data.textStyle]
            : 'bold readable text';
        parts.push(`Text Treatment: Leave negative space for title text overlay, ${textKw}`);
    } else if (data.includeText === 'No') {
        parts.push('Text Treatment: No text overlays, pure visual composition');
    }
    if (data.customPrompt && data.customPrompt.trim())
        parts.push(`Additional Requirements: ${data.customPrompt}`);
    return parts.join('\n');
}

// ============================================================
// STAGE 1: GEMINI 3 FLASH — Expert YouTube Thumbnail Prompt Writer
// Uses the exact system instruction provided for maximum CTR
// ============================================================
async function generateThumbnailPrompt(userData, constraintBlock) {
    // Build the structured user input block for the model
    const userInputBlock = `
Topic: ${userData.description || 'General content'}
Target Audience: ${userData.focus || 'General audience'}
Emotion/Hook: ${userData.mood || 'Professional'}
Text on Thumbnail: ${userData.includeText === 'Yes' ? (userData.customPrompt || 'relevant title text') : 'none'}
Style: ${userData.thumbnailStyle || userData.style || 'Photo-realistic'}

Additional context from user preferences:
${constraintBlock || 'No additional constraints'}`.trim();

    const systemInstruction = `You are an expert YouTube thumbnail designer and visual marketing specialist.

Your task is to convert user input into a highly optimized, click-worthy image generation prompt for a YouTube thumbnail.

Instructions:
- Create a single, detailed prompt for an AI image generator.
- Focus on high CTR (click-through rate) design principles.
- Clearly describe:
  - Main subject (person/object)
  - Facial expression (if human, make it exaggerated and emotional)
  - Background (clean but eye-catching)
  - Lighting (dramatic, high contrast)
  - Composition (close-up, centered subject, rule of thirds if needed)
  - Colors (vibrant, contrasting, attention-grabbing)
  - Visual elements (arrows, glow, fire, money, icons if relevant)
- If text is provided, integrate it naturally into the thumbnail design.
- Match the style (e.g., MrBeast, cinematic, minimal, tech, finance, etc.)
- Keep the prompt concise but powerful (max 120 words).
- Avoid unnecessary complexity; prioritize clarity and impact.

Output:
Only return the final image generation prompt. Do not include explanations.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `User Input:\n${userInputBlock}`,
        config: {
            systemInstruction,
            temperature: 0.8,
            maxOutputTokens: 300
        }
    });

    return response.candidates[0].content.parts[0].text.trim();
}

// ============================================================
// STAGE 2: NANO BANANA 2 — High-quality YouTube Thumbnail Image
// Model: gemini-3.1-flash-image-preview | 16:9 | 2K resolution
// ============================================================
async function generateThumbnailImage(prompt, filePath) {
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: prompt,
        config: {
            responseModalities: ['IMAGE'],
            imageConfig: {
                aspectRatio: '16:9',
                imageSize: '2K'
            }
        }
    });

    // Extract the image inline data from the response
    const parts = response.candidates[0].content.parts;
    for (const part of parts) {
        if (part.inlineData) {
            const buffer = Buffer.from(part.inlineData.data, 'base64');
            fs.writeFileSync(filePath, buffer);
            return true;
        }
    }
    throw new Error('Nano Banana 2 did not return an image in the response');
}

// ============================================================
// MAIN GENERATE ENDPOINT
// Flow: Quiz answers → Gemini 3 Flash prompt → Nano Banana 2 image
// ============================================================
app.post('/api/generate', async (req, res) => {
    try {
        const {
            description, style, mood, focus, theme, primaryColor,
            includeText, textStyle, thumbnailStyle, thumbnailTemplate,
            customPrompt
        } = req.body;

        // --- STAGE 1: Build constraint block from quiz answers ---
        const constraintBlock = buildConstraintBlock({
            mood, thumbnailStyle: thumbnailStyle || style, theme,
            primaryColor, category: focus, thumbnailTemplate,
            includeText, textStyle, customPrompt
        });

        console.log('\n📋 Constraint Block:\n', constraintBlock);

        // --- STAGE 2: Gemini 3 Flash generates the expert prompt ---
        console.log('\n🧠 Stage 1: Gemini 3 Flash generating expert thumbnail prompt...');
        const cookedPrompt = await generateThumbnailPrompt(
            { description, style, thumbnailStyle, mood, focus, includeText, customPrompt },
            constraintBlock
        );
        console.log('\n✨ Expert Prompt:\n', cookedPrompt);

        // --- STAGE 3: Nano Banana 2 generates the thumbnail image ---
        console.log('\n🍌🍌 Stage 2: Nano Banana 2 generating thumbnail image...');
        const fileName = `thumbnail_${Date.now()}.png`;
        const filePath = path.join(uploadsDir, fileName);

        await generateThumbnailImage(cookedPrompt, filePath);
        const imageUrl = `http://localhost:${process.env.PORT || 5000}/images/${fileName}`;
        console.log('✅ Nano Banana 2 image generated successfully!');

        // --- Save to local DB ---
        const db = fs.readJsonSync(dbFile);
        const newEntry = {
            id: Date.now().toString(),
            description,
            style: thumbnailStyle || style,
            mood,
            focus,
            theme,
            primaryColor,
            thumbnailTemplate,
            includeText,
            textStyle,
            constraintBlock,
            cookedPrompt,        // ← expert prompt from Gemini 3 Flash
            prompt: cookedPrompt, // ← same prompt sent to Nano Banana 2
            imageUrl,
            createdAt: new Date().toISOString()
        };
        db.unshift(newEntry);
        fs.writeJsonSync(dbFile, newEntry);

        res.json(newEntry);
    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
        res.status(500).json({ error: 'Failed to process request: ' + error.message });
    }
});

app.get('/api/history', (req, res) => {
    try {
        res.json(fs.readJsonSync(dbFile));
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 ThumbCraft Backend running on http://localhost:${PORT}`);
    console.log('📁 Images stored at:', uploadsDir);
    console.log('🧠 Stage 1: Gemini 3 Flash  →  Expert thumbnail prompt');
    console.log('🍌🍌 Stage 2: Nano Banana 2  →  16:9 2K YouTube thumbnail\n');
});
