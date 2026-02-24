'use strict';

/**
 * qa_validate.cjs
 * Automated QA validation for HTML slide files.
 * Checks compliance with pptx-skill conversion rules.
 *
 * Usage:
 *   node scripts/qa_validate.cjs \
 *     --slides-dir output/{run-id}/slides \
 *     --spec output/{run-id}/lecture-spec.json \
 *     --output output/{run-id}/qa-report.json \
 *     --iteration 1 \
 *     [--use-playwright]
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const APPROVED_FONTS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Impact',
  'Comic Sans MS',
  'Pretendard',
];

const GRADIENT_PATTERNS = [
  /linear-gradient\s*\(/gi,
  /radial-gradient\s*\(/gi,
  /conic-gradient\s*\(/gi,
];

const PROPER_TEXT_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'span', 'a', 'strong', 'em', 'b', 'i']);
const CONTAINER_TAGS_TO_CHECK = new Set(['div', 'section', 'article', 'main', 'aside', 'header', 'footer']);

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true; // boolean flag
      } else {
        args[key] = next;
        i++;
      }
    }
  }
  return args;
}

function validateArgs(args) {
  const required = ['slides-dir', 'spec', 'output'];
  for (const key of required) {
    if (!args[key]) {
      console.error(`[qa_validate] Missing required argument: --${key}`);
      process.exit(1);
    }
  }
}

// ---------------------------------------------------------------------------
// Lightweight HTML parser helpers (no cheerio dependency required)
// ---------------------------------------------------------------------------

/**
 * Extract content of the first <style> block and all inline style attributes.
 * Returns { styleBlocks: string[], inlineStyles: string[] }
 */
function extractStyles(html) {
  const styleBlocks = [];
  const inlineStyles = [];

  // <style> blocks
  const styleTagRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = styleTagRe.exec(html)) !== null) {
    styleBlocks.push(m[1]);
  }

  // inline style="..."
  const inlineRe = /\bstyle\s*=\s*["']([^"']*)["']/gi;
  while ((m = inlineRe.exec(html)) !== null) {
    inlineStyles.push(m[1]);
  }

  return { styleBlocks, inlineStyles };
}

/**
 * Return all CSS text (style blocks + inline) concatenated.
 */
function allCssText(html) {
  const { styleBlocks, inlineStyles } = extractStyles(html);
  return [...styleBlocks, ...inlineStyles].join('\n');
}

// ---------------------------------------------------------------------------
// Check implementations
// ---------------------------------------------------------------------------

/**
 * 1. Dimension Check
 * Expects: width: 720pt; height: 405pt in the <body> style.
 */
function checkDimensions(html) {
  const issues = [];

  // Try to find body style attribute
  const bodyStyleRe = /<body[^>]*\bstyle\s*=\s*["']([^"']*)["'][^>]*>/i;
  const m = bodyStyleRe.exec(html);
  const bodyStyle = m ? m[1] : '';

  const widthMatch = /width\s*:\s*([\d.]+)(pt|px)/i.exec(bodyStyle);
  const heightMatch = /height\s*:\s*([\d.]+)(pt|px)/i.exec(bodyStyle);

  let widthOk = false;
  let heightOk = false;

  if (widthMatch) {
    const val = parseFloat(widthMatch[1]);
    const unit = widthMatch[2].toLowerCase();
    widthOk = unit === 'pt' && val === 720;
    if (!widthOk) {
      issues.push({
        severity: 'critical',
        category: 'dimension',
        description: `Body width is ${val}${unit}, expected 720pt.`,
        fix: 'Set <body style="width:720pt; height:405pt; ..."> in the slide HTML.',
        targetAgent: 'assembly-agent',
        autoFixable: true,
      });
    }
  } else {
    issues.push({
      severity: 'critical',
      category: 'dimension',
      description: 'Body width not found or not set in inline style.',
      fix: 'Add width:720pt to the <body> style attribute.',
      targetAgent: 'assembly-agent',
      autoFixable: true,
    });
  }

  if (heightMatch) {
    const val = parseFloat(heightMatch[1]);
    const unit = heightMatch[2].toLowerCase();
    heightOk = unit === 'pt' && val === 405;
    if (!heightOk) {
      issues.push({
        severity: 'critical',
        category: 'dimension',
        description: `Body height is ${val}${unit}, expected 405pt.`,
        fix: 'Set <body style="width:720pt; height:405pt; ..."> in the slide HTML.',
        targetAgent: 'assembly-agent',
        autoFixable: true,
      });
    }
  } else {
    issues.push({
      severity: 'critical',
      category: 'dimension',
      description: 'Body height not found or not set in inline style.',
      fix: 'Add height:405pt to the <body> style attribute.',
      targetAgent: 'assembly-agent',
      autoFixable: true,
    });
  }

  const pass = issues.length === 0;
  return { pass, issues };
}

/**
 * 2. Image Path Check
 * Finds all <img src="..."> and verifies each file exists on disk.
 */
function checkImages(html, htmlFilePath) {
  const issues = [];
  const htmlDir = path.dirname(htmlFilePath);

  const imgRe = /<img[^>]+\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = imgRe.exec(html)) !== null) {
    const src = m[1];
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
      continue; // external or data URLs are not file-checked
    }
    const absPath = path.resolve(htmlDir, src);
    if (!fs.existsSync(absPath)) {
      issues.push({
        severity: 'critical',
        category: 'image',
        description: `Image not found on disk: "${src}" (resolved: ${absPath})`,
        fix: `Ensure the image file exists at the resolved path or update the src attribute.`,
        targetAgent: 'assembly-agent',
        autoFixable: false,
      });
    }
  }

  const pass = issues.length === 0;
  return { pass, issues };
}

/**
 * 3. CSS Gradient Check
 * Searches for linear-gradient, radial-gradient, conic-gradient.
 */
function checkNoGradients(html) {
  const issues = [];
  const css = allCssText(html);

  for (const pattern of GRADIENT_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(css)) {
      const gradientType = pattern.source.split('\\s')[0];
      issues.push({
        severity: 'warning',
        category: 'gradient',
        description: `CSS gradient detected (${gradientType}). html2pptx.cjs cannot convert gradients.`,
        fix: 'Replace gradient backgrounds with a solid color or a pre-rendered PNG image.',
        targetAgent: 'assembly-agent',
        autoFixable: false,
      });
    }
  }

  const pass = issues.length === 0;
  return { pass, issues };
}

/**
 * 4. Text Tag Check
 * Detect text nodes that are direct children of block container elements
 * (div, section, etc.) instead of being wrapped in <p>, <h1>-<h6>, <li>, etc.
 *
 * Strategy: simple regex scan for patterns like:
 *   >text content<   where the parent opener is a container tag.
 */
function checkTextInProperTags(html) {
  const issues = [];

  // Strip script/style blocks to avoid false positives
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');

  // Match opening container tag followed directly by significant text (not just whitespace)
  // before the next tag opener.
  const containerOpenRe = /<(div|section|article|main|aside|header|footer)[^>]*>([\s\S]*?)(?=<)/gi;
  let m;
  while ((m = containerOpenRe.exec(cleaned)) !== null) {
    const tag = m[1];
    const inner = m[2];
    // Check if there is non-whitespace text directly inside
    const trimmed = inner.trim();
    if (trimmed.length > 0 && !trimmed.startsWith('<')) {
      // There is raw text directly inside a container
      const snippet = trimmed.slice(0, 60);
      issues.push({
        severity: 'critical',
        category: 'text-tag',
        description: `Text directly inside <${tag}> without a proper text tag: "${snippet}..."`,
        fix: `Wrap text content in a <p> or <h1>-<h6> tag inside the <${tag}>.`,
        targetAgent: 'assembly-agent',
        autoFixable: true,
      });
    }
  }

  const pass = issues.length === 0;
  return { pass, issues };
}

/**
 * 5. Font Check
 * Scan all font-family declarations for unapproved fonts.
 */
function checkFonts(html) {
  const issues = [];
  const css = allCssText(html);

  // Extract all font-family values (allow quotes inside the capture for style blocks)
  const fontFamilyRe = /font-family\s*:\s*([^;}]+)/gi;
  let m;
  const foundFonts = new Set();

  while ((m = fontFamilyRe.exec(css)) !== null) {
    const declaration = m[1];
    // Split by comma for font stacks
    const fonts = declaration.split(',').map((f) =>
      f.trim().replace(/^['"]|['"]$/g, '').trim()
    );
    for (const font of fonts) {
      if (font && font.toLowerCase() !== 'inherit' && font.toLowerCase() !== 'sans-serif'
          && font.toLowerCase() !== 'serif' && font.toLowerCase() !== 'monospace'
          && font.toLowerCase() !== 'cursive' && font.toLowerCase() !== 'fantasy'
          && font.toLowerCase() !== 'system-ui' && font.toLowerCase() !== 'initial') {
        foundFonts.add(font);
      }
    }
  }

  const approvedLower = APPROVED_FONTS.map((f) => f.toLowerCase());

  for (const font of foundFonts) {
    if (!approvedLower.includes(font.toLowerCase())) {
      issues.push({
        severity: 'warning',
        category: 'font',
        description: `Unapproved font detected: "${font}". Only web-safe fonts and Pretendard are allowed.`,
        fix: `Replace "${font}" with one of: ${APPROVED_FONTS.join(', ')}.`,
        targetAgent: 'assembly-agent',
        autoFixable: true,
      });
    }
  }

  const pass = issues.length === 0;
  return { pass, issues };
}

/**
 * 6. Color Consistency Check
 * Extract hex colors from styles, compare against the theme palette.
 */
function checkColorConsistency(html, themePalette) {
  const issues = [];

  if (!themePalette) {
    return { pass: true, issues }; // no palette to compare against
  }

  const css = allCssText(html);
  const hexRe = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
  let m;
  const foundColors = new Set();

  while ((m = hexRe.exec(css)) !== null) {
    const hex = m[0].toLowerCase();
    // Normalize 3-char hex to 6-char
    const normalized =
      hex.length === 4
        ? '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
        : hex;
    foundColors.add(normalized);
  }

  const paletteValues = Object.values(themePalette).map((c) => c.toLowerCase());

  for (const color of foundColors) {
    if (!paletteValues.includes(color)) {
      issues.push({
        severity: 'warning',
        category: 'color',
        description: `Color "${color}" not in the defined theme palette (${paletteValues.join(', ')}).`,
        fix: 'Use only palette colors defined in lecture-spec.json theme.palette.',
        targetAgent: 'assembly-agent',
        autoFixable: false,
      });
    }
  }

  const pass = issues.length === 0;
  return { pass, issues };
}

/**
 * 7. Content Match Check
 * Fuzzy check: does the headline from the spec appear somewhere in the HTML?
 */
function checkContentMatchesSpec(html, specSlide) {
  const issues = [];

  if (!specSlide) {
    return { pass: true, issues };
  }

  const lowerHtml = html.toLowerCase();

  // Check headline
  if (specSlide.headline) {
    const headline = specSlide.headline.toLowerCase().trim();
    // Fuzzy: check if at least 60% of significant words appear
    const words = headline.split(/\s+/).filter((w) => w.length > 2);
    const presentCount = words.filter((w) => lowerHtml.includes(w)).length;
    const ratio = words.length > 0 ? presentCount / words.length : 1;

    if (ratio < 0.6) {
      issues.push({
        severity: 'info',
        category: 'content',
        description: `Headline "${specSlide.headline}" may not be present in the slide (${Math.round(ratio * 100)}% word match).`,
        fix: 'Review slide content and ensure the headline matches the lecture-spec.',
        targetAgent: 'assembly-agent',
        autoFixable: false,
      });
    }
  }

  // Check that at least some bullet points are represented
  if (specSlide.bullets && specSlide.bullets.length > 0) {
    const hasListTag = /<ul|<ol|<li/i.test(html);
    if (!hasListTag) {
      issues.push({
        severity: 'info',
        category: 'content',
        description: 'lecture-spec specifies bullet points but no <ul>/<ol>/<li> tags found in slide.',
        fix: 'Add bullet point list to the slide HTML.',
        targetAgent: 'assembly-agent',
        autoFixable: false,
      });
    }
  }

  const pass = issues.length === 0;
  return { pass, issues };
}

/**
 * 8. Overflow Detection using Playwright (optional)
 */
async function checkOverflowWithPlaywright(htmlFilePath) {
  const issues = [];
  try {
    const { chromium } = require('playwright');
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width: 960, height: 540 });
    await page.goto(`file://${path.resolve(htmlFilePath)}`);

    const overflowData = await page.evaluate(() => {
      const body = document.body;
      const bodyW = body.scrollWidth;
      const bodyH = body.scrollHeight;
      const styleW = parseFloat(body.style.width) || body.clientWidth;
      const styleH = parseFloat(body.style.height) || body.clientHeight;
      return {
        scrollWidth: bodyW,
        scrollHeight: bodyH,
        styleWidth: styleW,
        styleHeight: styleH,
        overflowX: bodyW > styleW ? bodyW - styleW : 0,
        overflowY: bodyH > styleH ? bodyH - styleH : 0,
      };
    });

    await browser.close();

    if (overflowData.overflowX > 2 || overflowData.overflowY > 2) {
      issues.push({
        severity: 'critical',
        category: 'overflow',
        description:
          `Content overflow detected: ${overflowData.overflowX}px horizontal, ` +
          `${overflowData.overflowY}px vertical beyond 720pt x 405pt body.`,
        fix: 'Reduce font sizes, content density, or padding to fit within slide bounds.',
        targetAgent: 'assembly-agent',
        autoFixable: false,
      });
    }
  } catch (err) {
    console.warn(`[qa_validate] Playwright overflow check failed: ${err.message}`);
    issues.push({
      severity: 'info',
      category: 'overflow',
      description: `Playwright overflow check could not run: ${err.message}`,
      fix: 'Install playwright or check browser availability.',
      targetAgent: 'manual',
      autoFixable: false,
    });
  }

  const pass = issues.filter((i) => i.severity === 'critical').length === 0;
  return { pass, issues };
}

// ---------------------------------------------------------------------------
// Per-slide validation
// ---------------------------------------------------------------------------

async function validateSlide(htmlFilePath, slideNumber, specSlide, themePalette, usePlaywright) {
  let html;
  try {
    html = fs.readFileSync(htmlFilePath, 'utf-8');
  } catch (err) {
    return {
      slideNumber,
      file: path.basename(htmlFilePath),
      pass: false,
      checks: {
        dimensionsCorrect: false,
        noOverflow: false,
        allImagesExist: false,
        noCssGradients: false,
        textInProperTags: false,
        fontsApproved: false,
        colorConsistency: false,
        contentMatchesSpec: false,
      },
      issues: [
        {
          severity: 'critical',
          category: 'dimension',
          description: `Cannot read file: ${err.message}`,
          fix: 'Check that the slide HTML file exists and is readable.',
          targetAgent: 'assembly-agent',
          autoFixable: false,
        },
      ],
    };
  }

  const allIssues = [];

  const dimResult = checkDimensions(html);
  const imgResult = checkImages(html, htmlFilePath);
  const gradResult = checkNoGradients(html);
  const textResult = checkTextInProperTags(html);
  const fontResult = checkFonts(html);
  const colorResult = checkColorConsistency(html, themePalette);
  const contentResult = checkContentMatchesSpec(html, specSlide);

  let overflowResult = { pass: true, issues: [] };
  if (usePlaywright) {
    overflowResult = await checkOverflowWithPlaywright(htmlFilePath);
  }

  allIssues.push(
    ...dimResult.issues,
    ...imgResult.issues,
    ...gradResult.issues,
    ...textResult.issues,
    ...fontResult.issues,
    ...colorResult.issues,
    ...contentResult.issues,
    ...overflowResult.issues,
  );

  // A slide fails if any critical issue exists
  const hasCritical = allIssues.some((i) => i.severity === 'critical');
  const pass = !hasCritical;

  return {
    slideNumber,
    file: path.basename(htmlFilePath),
    pass,
    checks: {
      dimensionsCorrect: dimResult.pass,
      noOverflow: overflowResult.pass,
      allImagesExist: imgResult.pass,
      noCssGradients: gradResult.pass,
      textInProperTags: textResult.pass,
      fontsApproved: fontResult.pass,
      colorConsistency: colorResult.pass,
      contentMatchesSpec: contentResult.pass,
    },
    issues: allIssues,
  };
}

// ---------------------------------------------------------------------------
// Recommendations builder
// ---------------------------------------------------------------------------

function buildRecommendations(slideResults) {
  const recommendations = [];
  const failingSlides = slideResults.filter((s) => !s.pass);

  if (failingSlides.length > 0) {
    const slideNums = failingSlides.map((s) => s.slideNumber);
    recommendations.push({
      type: 'fix-required',
      description: `${failingSlides.length} slide(s) have critical issues and must be fixed before PPTX conversion.`,
      targetAgent: 'assembly-agent',
      slideNumbers: slideNums,
    });
  }

  // Collect unique warning categories
  const warningCategories = new Set();
  for (const slide of slideResults) {
    for (const issue of slide.issues) {
      if (issue.severity === 'warning') {
        warningCategories.add(issue.category);
      }
    }
  }

  if (warningCategories.has('gradient')) {
    recommendations.push({
      type: 'fix-required',
      description: 'CSS gradients found. Replace with solid colors or pre-rendered PNG backgrounds for PPTX compatibility.',
      targetAgent: 'assembly-agent',
      slideNumbers: slideResults
        .filter((s) => s.issues.some((i) => i.category === 'gradient'))
        .map((s) => s.slideNumber),
    });
  }

  if (warningCategories.has('font')) {
    recommendations.push({
      type: 'improvement',
      description: 'Unapproved fonts detected. Switching to approved fonts ensures consistent rendering across systems.',
      targetAgent: 'assembly-agent',
      slideNumbers: slideResults
        .filter((s) => s.issues.some((i) => i.category === 'font'))
        .map((s) => s.slideNumber),
    });
  }

  if (warningCategories.has('color')) {
    recommendations.push({
      type: 'improvement',
      description: 'Colors outside the defined theme palette found. Review for visual consistency.',
      targetAgent: 'assembly-agent',
      slideNumbers: slideResults
        .filter((s) => s.issues.some((i) => i.category === 'color'))
        .map((s) => s.slideNumber),
    });
  }

  // Info recommendations
  const infoSlides = slideResults.filter((s) => s.issues.some((i) => i.severity === 'info'));
  if (infoSlides.length > 0) {
    recommendations.push({
      type: 'review-needed',
      description: 'Some slides may have content that does not fully match the lecture-spec. Review and update as needed.',
      targetAgent: 'assembly-agent',
      slideNumbers: infoSlides.map((s) => s.slideNumber),
    });
  }

  return recommendations;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv);
  validateArgs(args);

  const slidesDir = path.resolve(args['slides-dir']);
  const specFile = path.resolve(args['spec']);
  const outputFile = path.resolve(args['output']);
  const iteration = parseInt(args['iteration'] || '1', 10);
  const usePlaywright = args['use-playwright'] === true || args['use-playwright'] === 'true';

  console.log('[qa_validate] Starting QA validation');
  console.log(`  Slides dir : ${slidesDir}`);
  console.log(`  Spec file  : ${specFile}`);
  console.log(`  Output     : ${outputFile}`);
  console.log(`  Iteration  : ${iteration}`);
  console.log(`  Playwright : ${usePlaywright}`);

  // Load spec
  let spec = null;
  let runId = 'unknown';
  let themePalette = null;
  let specSlides = [];

  if (fs.existsSync(specFile)) {
    try {
      spec = JSON.parse(fs.readFileSync(specFile, 'utf-8'));
      runId = spec?.meta?.runId || 'unknown';
      themePalette = spec?.theme?.palette || null;
      specSlides = spec?.slides || [];
    } catch (err) {
      console.warn(`[qa_validate] Could not parse spec file: ${err.message}`);
    }
  } else {
    console.warn(`[qa_validate] Spec file not found: ${specFile}`);
  }

  // Find HTML slide files
  if (!fs.existsSync(slidesDir)) {
    console.error(`[qa_validate] Slides directory not found: ${slidesDir}`);
    process.exit(1);
  }

  const htmlFiles = fs
    .readdirSync(slidesDir)
    .filter((f) => f.endsWith('.html'))
    .sort()
    .map((f) => path.join(slidesDir, f));

  if (htmlFiles.length === 0) {
    console.error(`[qa_validate] No HTML files found in: ${slidesDir}`);
    process.exit(1);
  }

  console.log(`[qa_validate] Found ${htmlFiles.length} slide file(s)`);

  // Validate each slide
  const slideResults = [];
  for (let i = 0; i < htmlFiles.length; i++) {
    const filePath = htmlFiles[i];
    const slideNumber = i + 1;
    const specSlide = specSlides.find((s) => s.slideNumber === slideNumber) || null;

    process.stdout.write(`[qa_validate] Checking slide ${slideNumber}/${htmlFiles.length}...`);
    const result = await validateSlide(filePath, slideNumber, specSlide, themePalette, usePlaywright);
    const status = result.pass ? 'PASS' : 'FAIL';
    console.log(` ${status} (${result.issues.length} issue(s))`);
    slideResults.push(result);
  }

  // Build summary
  const totalSlides = slideResults.length;
  const passedSlides = slideResults.filter((s) => s.pass).length;
  const failedSlides = totalSlides - passedSlides;
  const allIssues = slideResults.flatMap((s) => s.issues);
  const criticalIssues = allIssues.filter((i) => i.severity === 'critical').length;
  const warningIssues = allIssues.filter((i) => i.severity === 'warning').length;
  const infoIssues = allIssues.filter((i) => i.severity === 'info').length;

  const overallPass = failedSlides === 0;

  const report = {
    meta: {
      runId,
      reviewedAt: new Date().toISOString(),
      iteration,
      htmlDir: slidesDir,
      specFile,
    },
    overallPass,
    summary: {
      totalSlides,
      passedSlides,
      failedSlides,
      criticalIssues,
      warningIssues,
      infoIssues,
    },
    slides: slideResults,
    recommendations: buildRecommendations(slideResults),
  };

  // Write output
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2), 'utf-8');

  // Print summary
  console.log('\n[qa_validate] ==================== QA SUMMARY ====================');
  console.log(`  Run ID     : ${runId}`);
  console.log(`  Overall    : ${overallPass ? 'PASS' : 'FAIL'}`);
  console.log(`  Slides     : ${passedSlides}/${totalSlides} passed`);
  console.log(`  Critical   : ${criticalIssues}`);
  console.log(`  Warnings   : ${warningIssues}`);
  console.log(`  Info       : ${infoIssues}`);
  console.log(`  Report     : ${outputFile}`);
  console.log('[qa_validate] ====================================================\n');

  if (report.recommendations.length > 0) {
    console.log('[qa_validate] Recommendations:');
    for (const rec of report.recommendations) {
      const slides = rec.slideNumbers && rec.slideNumbers.length > 0
        ? ` (slides: ${rec.slideNumbers.join(', ')})`
        : '';
      console.log(`  [${rec.type}] ${rec.description}${slides}`);
    }
    console.log('');
  }

  process.exit(overallPass ? 0 : 1);
}

main().catch((err) => {
  console.error('[qa_validate] Fatal error:', err);
  process.exit(1);
});
