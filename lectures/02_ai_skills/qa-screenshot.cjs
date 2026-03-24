const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SLIDES_DIR = '/Users/kimjimyoung/Documents/projects/bni-edu/ppt_team_agent/lectures/02_ai_skills/slides';
const OUTPUT_DIR = '/Users/kimjimyoung/Documents/projects/bni-edu/ppt_team_agent/lectures/02_ai_skills/qa-screenshots';

// 720pt x 405pt -> px (1pt = 4/3 px at 96dpi, but slides use 720x405 as CSS px)
// The slides are designed at 720x405 CSS units, rendered at device pixel ratio 1
// To get full-resolution screenshots: use 960x540 (720*4/3 x 405*4/3) or match CSS px exactly
const VIEWPORT_WIDTH = 960;
const VIEWPORT_HEIGHT = 540;
const DEVICE_SCALE = 1;

async function main() {
  const browser = await chromium.launch();

  const slides = fs.readdirSync(SLIDES_DIR)
    .filter(f => f.match(/^slide-\d+\.html$/))
    .sort();

  console.log(`Found ${slides.length} slides to screenshot`);

  for (const slide of slides) {
    const slidePath = path.join(SLIDES_DIR, slide);
    const outputPath = path.join(OUTPUT_DIR, slide.replace('.html', '.png'));

    const page = await browser.newPage();
    await page.setViewportSize({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });

    const url = `file://${slidePath}`;
    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for fonts and images to settle
    await page.waitForTimeout(500);

    await page.screenshot({
      path: outputPath,
      fullPage: false,
      clip: { x: 0, y: 0, width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }
    });

    // Also capture overflow info
    const overflowInfo = await page.evaluate(() => {
      const body = document.body;
      const slide = document.querySelector('.slide') || document.querySelector('[class*="slide"]') || body;
      const allElements = document.querySelectorAll('*');
      const overflowing = [];

      allElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth || rect.bottom > window.innerHeight ||
            rect.left < 0 || rect.top < 0) {
          const text = el.textContent.trim().substring(0, 50);
          if (text) {
            overflowing.push({
              tag: el.tagName,
              class: el.className,
              text,
              rect: { top: Math.round(rect.top), right: Math.round(rect.right), bottom: Math.round(rect.bottom), left: Math.round(rect.left) }
            });
          }
        }
      });

      // Check computed styles for overflow:hidden cutting off content
      const clipped = [];
      allElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const scrollHeight = el.scrollHeight;
        const clientHeight = el.clientHeight;
        if (scrollHeight > clientHeight + 2 && style.overflow !== 'visible') {
          const text = el.textContent.trim().substring(0, 80);
          if (text) {
            clipped.push({
              tag: el.tagName,
              class: el.className,
              text,
              scrollHeight,
              clientHeight,
              overflow: style.overflow
            });
          }
        }
      });

      return { overflowing, clipped, bodyScrollWidth: body.scrollWidth, bodyScrollHeight: body.scrollHeight };
    });

    console.log(`\n=== ${slide} ===`);
    console.log(`Screenshot: ${outputPath}`);
    if (overflowInfo.overflowing.length > 0) {
      console.log('OVERFLOW DETECTED:', JSON.stringify(overflowInfo.overflowing, null, 2));
    }
    if (overflowInfo.clipped.length > 0) {
      console.log('CLIPPED CONTENT:', JSON.stringify(overflowInfo.clipped, null, 2));
    }
    console.log(`Body dimensions: ${overflowInfo.bodyScrollWidth}x${overflowInfo.bodyScrollHeight} (viewport: ${VIEWPORT_WIDTH}x${VIEWPORT_HEIGHT})`);

    await page.close();
  }

  await browser.close();
  console.log('\nAll screenshots complete.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
