/**
 * generate_images.cjs
 *
 * Node.js CommonJS port of generate_images.py
 * Generates slide background images using the Gemini API (Imagen 4.0 first,
 * Gemini Flash as fallback, Sharp gradient as final fallback).
 *
 * Usage:
 *   node scripts/generate_images.cjs \
 *     --input output/{run-id}/lecture-spec.json \
 *     --output-dir output/{run-id}/images \
 *     --manifest output/{run-id}/asset-manifest.json
 *
 * Environment:
 *   GEMINI_API_KEY  (required)
 *
 * Dependencies:
 *   @google/generative-ai  (npm install @google/generative-ai)
 *   sharp                  (already in package.json)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Prompt strategy (ported 1-to-1 from Python)
// ---------------------------------------------------------------------------

const COMMON_STYLE =
  'professional business presentation background, dark theme, ' +
  'deep navy blue and charcoal tones with warm gold accents, ' +
  '16:9 aspect ratio widescreen, absolutely NO text NO letters NO numbers NO words, ' +
  'high quality, cinematic lighting, ultra-detailed';

/** @type {Record<string, string>} */
const SLIDE_PROMPTS = {
  title:
    'Abstract network of glowing nodes and connecting lines floating in deep space, ' +
    'deep navy blue gradient background, subtle golden particles drifting upward, ' +
    'soft bokeh light effects, dramatic cinematic atmosphere, futuristic yet warm, ' +
    COMMON_STYLE,

  section:
    'Dramatic section divider presentation background, ' +
    'abstract light burst or radial lens flare from center, ' +
    'dark to golden gradient sweep left-to-right, ' +
    'volumetric light rays, epic cinematic mood, ' +
    COMMON_STYLE,

  two_column:
    'Split dual-tone presentation background, ' +
    'left half cool dark navy blue, right half warm deep gold, ' +
    'smooth gradient blend at the center dividing line, ' +
    'abstract geometric texture, minimalist, clean, ' +
    COMMON_STYLE,

  content_ai:
    'Digital neural network synapses glowing in deep space, ' +
    'electric blue and golden data streams flowing, ' +
    'abstract technology pattern, silicon circuits fading into darkness, ' +
    COMMON_STYLE,

  content_people:
    'Abstract human silhouettes connected by glowing golden threads, ' +
    'warm light radiating from connection points, ' +
    'deep dark background with subtle bokeh, ' +
    'sense of community, trust, and human warmth, ' +
    COMMON_STYLE,

  content_data:
    'Abstract data visualization floating in dark space, ' +
    'glowing bar charts and line graphs as light art, ' +
    'golden and white luminous particles, ' +
    'data flowing upward, sense of growth and insight, ' +
    COMMON_STYLE,

  content_story:
    'Single warm spotlight on a dark stage, ' +
    'dramatic theater lighting, deep shadows, ' +
    'golden light beam cutting through darkness, ' +
    'emotional and intimate atmosphere, ' +
    COMMON_STYLE,

  content_action:
    'Abstract forward momentum: light streaks rushing forward, ' +
    'golden energy trails converging toward a bright horizon, ' +
    'dark background fading into brilliant gold, ' +
    'sense of motion, purpose, and beginning, ' +
    COMMON_STYLE,

  content_default:
    'Abstract professional presentation background, ' +
    'smooth dark gradient with subtle geometric patterns, ' +
    'faint golden grid lines, minimalist and elegant, ' +
    COMMON_STYLE,
};

/** @type {Record<string, string[]>} */
const KEYWORD_MAP = {
  content_ai: [
    'AI', 'GitHub', '오픈클로', '기술', '로봇', '자동화', '대체',
    '알고리즘', '디지털', '카카오', '네이버', '당근',
  ],
  content_people: [
    '신뢰', '관계', '사람', '네트워킹', '네트워크', '인간', '공감',
    'Givers', 'BNI', '추천', '먼저', '소개', '여러분',
  ],
  content_data: [
    '숫자', '통계', '증명', '일자리', '채용', 'LinkedIn', '수익',
    '전환율', '85%', '64%', '무료', '유료',
  ],
  content_story: [
    '형', '같이', '전화', '이야기', '사례', '어려웠을', '대표님',
  ],
  content_action: [
    '투자', '시작', '법칙', '1-1-1', '오늘', '연락', '마중물',
  ],
};

// ---------------------------------------------------------------------------
// Model identifiers
// ---------------------------------------------------------------------------

const IMAGEN_MODEL = 'imagen-4.0-generate-001';
const FLASH_MODEL  = 'gemini-2.5-flash-image';

// ---------------------------------------------------------------------------
// Prompt selection (ported from Python choose_prompt())
// ---------------------------------------------------------------------------

/**
 * Select the best prompt for a slide.
 *
 * @param {Object} slide          - Slide object from lecture-spec.json
 * @param {string} [slide.type]   - Slide type (title | section | two_column | content | ...)
 * @param {string} [slide.title]  - Slide title used for keyword matching
 * @returns {string} Prompt string
 */
function choosePrompt(slide) {
  const slideType = (slide.type || 'content').toLowerCase();
  const title     = slide.title || '';

  if (slideType === 'title')      return SLIDE_PROMPTS.title;
  if (slideType === 'section')    return SLIDE_PROMPTS.section;
  if (slideType === 'two_column') return SLIDE_PROMPTS.two_column;

  for (const [category, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const kw of keywords) {
      if (title.toLowerCase().includes(kw.toLowerCase())) {
        return SLIDE_PROMPTS[category];
      }
    }
  }

  return SLIDE_PROMPTS.content_default;
}

// ---------------------------------------------------------------------------
// Gradient theme colours for Sharp fallback
// ---------------------------------------------------------------------------

/** @type {Record<string, { from: string; to: string; accent: string }>} */
const GRADIENT_THEME = {
  title:           { from: '#0A1628', to: '#1A2F5C', accent: '#C4963C' },
  section:         { from: '#0D1B2A', to: '#8B6914', accent: '#D4A843' },
  two_column:      { from: '#0A1628', to: '#1A1A1A', accent: '#C4963C' },
  content_ai:      { from: '#070D1F', to: '#0D2040', accent: '#4A90D9' },
  content_people:  { from: '#0D1520', to: '#1A2A35', accent: '#C4963C' },
  content_data:    { from: '#070D1F', to: '#0F1A35', accent: '#D4A843' },
  content_story:   { from: '#0A0A0A', to: '#1A1209', accent: '#C4963C' },
  content_action:  { from: '#070D14', to: '#1A2A14', accent: '#C4963C' },
  content_default: { from: '#0A1628', to: '#141E30', accent: '#C4963C' },
};

/**
 * Map a slide to a gradient theme key.
 *
 * @param {Object} slide
 * @returns {string}
 */
function themeKeyForSlide(slide) {
  const slideType = (slide.type || 'content').toLowerCase();
  if (slideType === 'title')      return 'title';
  if (slideType === 'section')    return 'section';
  if (slideType === 'two_column') return 'two_column';

  const title = slide.title || '';
  for (const [category, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const kw of keywords) {
      if (title.toLowerCase().includes(kw.toLowerCase())) {
        return category;
      }
    }
  }
  return 'content_default';
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * Attempt image generation with Imagen 4.0.
 *
 * @param {import('@google/generative-ai').GoogleGenerativeAI} client
 * @param {string} prompt
 * @returns {Promise<Buffer|null>}
 */
async function generateWithImagen(client, prompt) {
  try {
    // The Node SDK exposes imagen via client.models (preview / generative-models)
    // Different minor versions surface this differently; try the most common path.
    const model = client.getGenerativeModel({ model: IMAGEN_MODEL });
    // generateImages is available in @google/generative-ai >= 0.21 preview builds.
    // The response shape mirrors the Python SDK.
    const response = await model.generateImages({
      prompt,
      number_of_images: 1,
      aspect_ratio: '16:9',
      safety_filter_level: 'BLOCK_LOW_AND_ABOVE',
      person_generation: 'DONT_ALLOW',
    });

    const generated = response.images || response.generatedImages || [];
    for (const img of generated) {
      // Different SDK versions use different field names.
      const raw =
        img?.image?.imageBytes ||
        img?.imageBytes ||
        img?.image?.image_bytes ||
        null;
      if (raw) {
        return Buffer.isBuffer(raw) ? raw : Buffer.from(raw, 'base64');
      }
    }
  } catch (err) {
    console.log(`    [Imagen error] ${err.message || err}`);
  }
  return null;
}

/**
 * Attempt image generation with Gemini Flash (responseModalities IMAGE).
 *
 * @param {import('@google/generative-ai').GoogleGenerativeAI} client
 * @param {string} prompt
 * @returns {Promise<Buffer|null>}
 */
async function generateWithGeminiFlash(client, prompt) {
  try {
    const model = client.getGenerativeModel({
      model: FLASH_MODEL,
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    const result = await model.generateContent(prompt);
    const parts  = result?.response?.candidates?.[0]?.content?.parts ?? [];

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        const data = part.inlineData.data;
        return Buffer.isBuffer(data) ? data : Buffer.from(data, 'base64');
      }
    }
  } catch (err) {
    console.log(`    [GeminiFlash error] ${err.message || err}`);
  }
  return null;
}

/**
 * Generate an image using the Gemini API with retry logic.
 * Tries Imagen 4.0 first, falls back to Gemini Flash.
 * Retries up to maxRetries times with exponential backoff (5s × attempt).
 *
 * @param {import('@google/generative-ai').GoogleGenerativeAI} client
 * @param {string} prompt
 * @param {number} [maxRetries=3]
 * @returns {Promise<Buffer|null>}
 */
async function generateImage(client, prompt, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    if (attempt > 1) {
      const wait = 5 * attempt;
      console.log(`    Retry ${attempt}/${maxRetries} (waiting ${wait}s)...`);
      await sleep(wait * 1000);
    }

    const imagenBytes = await generateWithImagen(client, prompt);
    if (imagenBytes) return imagenBytes;

    console.log('    Imagen failed -> Gemini Flash fallback...');
    const flashBytes = await generateWithGeminiFlash(client, prompt);
    if (flashBytes) return flashBytes;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Sharp gradient fallback
// ---------------------------------------------------------------------------

/**
 * Generate a dark gradient PNG using Sharp as a last resort.
 *
 * @param {Object} slide       - Slide object (used to pick theme colours)
 * @param {string} outputPath  - Absolute path for the output PNG
 * @returns {Promise<void>}
 */
async function generateFallbackGradient(slide, outputPath) {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    throw new Error(
      'sharp is not installed. Run: npm install sharp'
    );
  }

  const key    = themeKeyForSlide(slide);
  const theme  = GRADIENT_THEME[key] || GRADIENT_THEME.content_default;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="${theme.from}"/>
      <stop offset="100%" stop-color="${theme.to}"/>
    </linearGradient>
    <radialGradient id="glow" cx="80%" cy="20%" r="50%">
      <stop offset="0%"   stop-color="${theme.accent}" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${theme.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect width="1280" height="720" fill="url(#glow)"/>
  <line x1="0" y1="718" x2="1280" y2="718" stroke="${theme.accent}" stroke-width="2" opacity="0.6"/>
</svg>`.trim();

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await sharp(Buffer.from(svg)).resize(1280, 720).png().toFile(outputPath);
}

// ---------------------------------------------------------------------------
// Asset manifest helpers
// ---------------------------------------------------------------------------

/**
 * Read an existing asset manifest from disk, or return an empty array.
 *
 * @param {string} manifestPath
 * @returns {Object[]}
 */
function readManifest(manifestPath) {
  if (fs.existsSync(manifestPath)) {
    try {
      return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Write the manifest array to disk (pretty-printed JSON).
 *
 * @param {string}   manifestPath
 * @param {Object[]} entries
 */
function writeManifest(manifestPath, entries) {
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(entries, null, 2), 'utf8');
}

/**
 * Upsert a single manifest entry (matched by id).
 *
 * @param {Object[]} entries
 * @param {Object}   entry
 * @returns {Object[]} Updated entries array
 */
function upsertManifestEntry(entries, entry) {
  const idx = entries.findIndex((e) => e.id === entry.id);
  if (idx >= 0) {
    entries[idx] = entry;
  } else {
    entries.push(entry);
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Return a truncated display title for console output.
 *
 * @param {Object} slide
 * @returns {string}
 */
function getShortTitle(slide) {
  const title = (slide.title || 'Untitled').replace(/\n/g, ' ').trim();
  return title.length > 30 ? title.slice(0, 30) + '...' : title;
}

/**
 * Await a fixed number of milliseconds.
 *
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse minimalist CLI arguments (--key value or --flag).
 *
 * @param {string[]} argv  - process.argv.slice(2)
 * @returns {Record<string, string|boolean>}
 */
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key  = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Entry point: generate background images for all slides that need them.
 *
 * @param {Object}  opts
 * @param {string}  opts.input       - Path to lecture-spec.json
 * @param {string}  opts.outputDir   - Directory for PNG output
 * @param {string}  opts.manifest    - Path to asset-manifest.json
 * @param {boolean} [opts.force]     - Regenerate existing images
 * @param {number}  [opts.delay]     - Delay between slides in ms (default 2000)
 * @param {boolean} [opts.verbose]   - Show full prompts
 */
async function run(opts) {
  // ── API key ────────────────────────────────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[ERROR] GEMINI_API_KEY environment variable is not set.');
    console.error('  export GEMINI_API_KEY="your-api-key-here"');
    process.exit(1);
  }

  // ── SDK import ─────────────────────────────────────────────────────────────
  let GoogleGenerativeAI;
  try {
    ({ GoogleGenerativeAI } = require('@google/generative-ai'));
  } catch {
    console.error('[ERROR] @google/generative-ai package is not installed.');
    console.error('  npm install @google/generative-ai');
    process.exit(1);
  }

  // ── Input file ─────────────────────────────────────────────────────────────
  const inputPath = path.resolve(opts.input);
  if (!fs.existsSync(inputPath)) {
    console.error(`[ERROR] Input file not found: ${inputPath}`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  } catch (err) {
    console.error(`[ERROR] Failed to parse input JSON: ${err.message}`);
    process.exit(1);
  }

  const slides = data.slides || [];
  if (slides.length === 0) {
    console.error('[ERROR] No slides found in the input JSON.');
    process.exit(1);
  }

  // ── Output directory ────────────────────────────────────────────────────────
  const outputDir = path.resolve(opts.outputDir);
  fs.mkdirSync(outputDir, { recursive: true });

  // ── Manifest ────────────────────────────────────────────────────────────────
  const manifestPath = path.resolve(opts.manifest);
  let manifestEntries = readManifest(manifestPath);

  // ── API client ──────────────────────────────────────────────────────────────
  const client = new GoogleGenerativeAI(apiKey);

  // ── Options ─────────────────────────────────────────────────────────────────
  const force   = Boolean(opts.force);
  const delay   = typeof opts.delay === 'number' ? opts.delay : 2000;
  const verbose = Boolean(opts.verbose);

  // ── Filter slides that need images ─────────────────────────────────────────
  const targetSlides = slides.filter(
    (slide) => slide.visual && slide.visual.imageNeeded === true
  );

  const total = targetSlides.length;
  console.log(
    `\nGenerating background images for ${total} slide(s) -> ${outputDir}/\n`
  );

  let generated = 0;
  let skipped   = 0;
  let failed    = 0;

  for (let i = 0; i < targetSlides.length; i++) {
    const slide      = targetSlides[i];
    // Use 1-based index within the full slides array for consistent filenames.
    const slideIdx   = slides.indexOf(slide);
    const slideNum   = slideIdx + 1;
    const filename   = `slide-${String(slideNum).padStart(2, '0')}-bg.png`;
    const outputPath = path.join(outputDir, filename);
    const shortTitle = getShortTitle(slide);
    const slideType  = slide.type || 'content';

    const prefix = `[${i + 1}/${total}] ${filename} - "${shortTitle}" (${slideType})`;

    // ── Skip if already exists and --force not set ──────────────────────────
    if (fs.existsSync(outputPath) && !force) {
      console.log(`${prefix} -> skip (already exists)`);
      skipped++;
      continue;
    }

    console.log(prefix);

    // ── Build prompt ────────────────────────────────────────────────────────
    let prompt = choosePrompt(slide);
    if (slide.visual && slide.visual.imageDescription) {
      prompt = `${slide.visual.imageDescription}, ${prompt}`;
    }

    if (verbose) {
      console.log(`    Prompt: ${prompt.slice(0, 120)}...`);
    }

    // ── Try API generation ──────────────────────────────────────────────────
    let imageBytes  = null;
    let isFallback  = false;

    try {
      imageBytes = await generateImage(client, prompt);
    } catch (err) {
      console.log(`    [API error] ${err.message || err}`);
    }

    // ── Sharp gradient fallback ─────────────────────────────────────────────
    if (!imageBytes) {
      console.warn(`    [WARN] API generation failed - using gradient fallback`);
      try {
        await generateFallbackGradient(slide, outputPath);
        isFallback = true;
        imageBytes = fs.readFileSync(outputPath); // re-read for size log
      } catch (err) {
        console.error(`    [ERROR] Fallback gradient also failed: ${err.message}`);
        failed++;
        continue;
      }
    } else {
      // Write API-generated bytes to disk.
      try {
        fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(outputPath, imageBytes);
      } catch (err) {
        console.error(`    [ERROR] Failed to write image: ${err.message}`);
        failed++;
        continue;
      }
    }

    const sizeKb = Math.round(imageBytes.length / 1024);
    console.log(
      `    Saved: ${outputPath} (${sizeKb}KB)${isFallback ? ' [gradient fallback]' : ''}`
    );
    generated++;

    // ── Update manifest ─────────────────────────────────────────────────────
    /** @type {string} Relative path stored in manifest (relative to output-dir parent) */
    const relPath = path.relative(path.dirname(manifestPath), outputPath);

    const entry = {
      id:          `img-slide-${String(slideNum).padStart(2, '0')}`,
      type:        'background-image',
      path:        relPath.replace(/\\/g, '/'), // normalise Windows separators
      slideNumber: slideNum,
      generator:   'image-gen-agent',
      width:       1280,
      height:      720,
      format:      'png',
      prompt:      prompt,
      fallback:    isFallback,
      createdAt:   new Date().toISOString(),
    };

    manifestEntries = upsertManifestEntry(manifestEntries, entry);
    writeManifest(manifestPath, manifestEntries);

    // ── Delay between slides (skip after last one) ──────────────────────────
    if (i < targetSlides.length - 1 && delay > 0) {
      await sleep(delay);
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log(
    `\nDone! ${generated} generated, ${skipped} skipped, ${failed} failed.`
  );
  console.log(`Manifest updated: ${manifestPath}`);
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

(async function main() {
  const raw = parseArgs(process.argv.slice(2));

  // Validate required flags.
  const missing = ['input', 'output-dir', 'manifest'].filter((k) => !raw[k]);
  if (missing.length > 0) {
    console.error(`[ERROR] Missing required flag(s): ${missing.map((k) => `--${k}`).join(', ')}`);
    console.error('');
    console.error('Usage:');
    console.error(
      '  node scripts/generate_images.cjs \\'
    );
    console.error('    --input output/{run-id}/lecture-spec.json \\');
    console.error('    --output-dir output/{run-id}/images \\');
    console.error('    --manifest output/{run-id}/asset-manifest.json');
    console.error('');
    console.error('Optional flags:');
    console.error('  --force          Regenerate images that already exist');
    console.error('  --delay <ms>     Delay between slides in ms (default: 2000)');
    console.error('  --verbose        Show full prompts in console output');
    process.exit(1);
  }

  await run({
    input:     String(raw['input']),
    outputDir: String(raw['output-dir']),
    manifest:  String(raw['manifest']),
    force:     raw['force'] === true,
    delay:     raw['delay'] !== undefined ? Number(raw['delay']) : 2000,
    verbose:   raw['verbose'] === true,
  });
})();
