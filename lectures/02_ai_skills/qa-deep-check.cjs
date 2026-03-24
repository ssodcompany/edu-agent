const { chromium } = require('playwright');
const path = require('path');

const SLIDES_DIR = '/Users/kimjimyoung/Documents/projects/bni-edu/ppt_team_agent/lectures/02_ai_skills/slides';
const VIEWPORT_WIDTH = 960;
const VIEWPORT_HEIGHT = 540;

// Slide dimensions in CSS px (the design space)
const SLIDE_W = 720;
const SLIDE_H = 405;

async function deepCheck(slideName) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });

  const url = `file://${path.join(SLIDES_DIR, slideName)}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const report = await page.evaluate(({vw, vh}) => {
    const results = {
      textOverlaps: [],
      clippedText: [],
      overflowingElements: [],
      tinyText: [],
      emptyAreas: [],
      alignmentIssues: [],
      allTextElements: []
    };

    // Get all text-bearing elements
    const textTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'li', 'a', 'div', 'label'];
    const textEls = [];

    document.querySelectorAll(textTags.join(',')).forEach(el => {
      // Only elements with direct text content
      const directText = Array.from(el.childNodes)
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent.trim())
        .join('');

      if (directText.length < 2) return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const style = window.getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);

      textEls.push({
        tag: el.tagName,
        text: directText.substring(0, 80),
        rect: {
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          bottom: Math.round(rect.bottom),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        fontSize: Math.round(fontSize),
        color: style.color,
        overflow: style.overflow,
        scrollH: el.scrollHeight,
        clientH: el.clientHeight,
        scrollW: el.scrollWidth,
        clientW: el.clientWidth
      });
    });

    results.allTextElements = textEls;

    // Check for text overflow/clipping
    textEls.forEach(el => {
      // Text that goes beyond viewport
      if (el.rect.right > vw + 5 || el.rect.bottom > vh + 5 ||
          el.rect.left < -5 || el.rect.top < -5) {
        results.overflowingElements.push({
          text: el.text,
          rect: el.rect,
          issue: 'extends beyond viewport'
        });
      }

      // Clipped by overflow:hidden
      if (el.scrollH > el.clientH + 4 || el.scrollW > el.clientW + 4) {
        results.clippedText.push({
          text: el.text,
          tag: el.tag,
          scrollH: el.scrollH,
          clientH: el.clientH,
          scrollW: el.scrollW,
          clientW: el.clientW,
          overflow: el.overflow,
          rect: el.rect
        });
      }

      // Tiny text (readability)
      if (el.fontSize < 10) {
        results.tinyText.push({
          text: el.text,
          fontSize: el.fontSize,
          rect: el.rect
        });
      }
    });

    // Check for text element overlaps
    for (let i = 0; i < textEls.length; i++) {
      for (let j = i + 1; j < textEls.length; j++) {
        const a = textEls[i].rect;
        const b = textEls[j].rect;
        // Check if rectangles overlap
        if (a.left < b.right && a.right > b.left &&
            a.top < b.bottom && a.bottom > b.top) {
          // Calculate overlap area
          const overlapW = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const overlapH = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          const overlapArea = overlapW * overlapH;
          const aArea = a.width * a.height;
          const bArea = b.width * b.height;
          const minArea = Math.min(aArea, bArea);

          // Only flag if overlap is significant (>10% of smaller element)
          if (overlapArea > minArea * 0.1 && overlapArea > 50) {
            results.textOverlaps.push({
              elementA: { text: textEls[i].text, tag: textEls[i].tag, rect: a },
              elementB: { text: textEls[j].text, tag: textEls[j].tag, rect: b },
              overlapPx: `${overlapW}x${overlapH}`,
              overlapPercent: Math.round((overlapArea / minArea) * 100)
            });
          }
        }
      }
    }

    return results;
  }, {vw: VIEWPORT_WIDTH, vh: VIEWPORT_HEIGHT});

  await browser.close();
  return report;
}

async function main() {
  const slides = [
    'slide-01.html', 'slide-02.html', 'slide-03.html', 'slide-04.html',
    'slide-05.html', 'slide-06.html', 'slide-07.html', 'slide-08.html',
    'slide-09.html', 'slide-10.html', 'slide-11.html'
  ];

  const allResults = {};

  for (const slide of slides) {
    process.stdout.write(`\nChecking ${slide}...`);
    const report = await deepCheck(slide);
    allResults[slide] = report;

    const issues = [];
    if (report.textOverlaps.length) issues.push(`${report.textOverlaps.length} text overlaps`);
    if (report.clippedText.length) issues.push(`${report.clippedText.length} clipped`);
    if (report.overflowingElements.length) issues.push(`${report.overflowingElements.length} overflow`);
    if (report.tinyText.length) issues.push(`${report.tinyText.length} tiny text`);

    if (issues.length === 0) {
      console.log(' OK');
    } else {
      console.log(' ISSUES: ' + issues.join(', '));
      if (report.textOverlaps.length) {
        report.textOverlaps.forEach(o => {
          console.log(`  OVERLAP: "${o.elementA.text}" <-> "${o.elementB.text}" (${o.overlapPercent}% overlap)`);
        });
      }
      if (report.clippedText.length) {
        report.clippedText.forEach(c => {
          console.log(`  CLIPPED: "${c.text}" scrollH=${c.scrollH} clientH=${c.clientH}`);
        });
      }
      if (report.overflowingElements.length) {
        report.overflowingElements.forEach(o => {
          console.log(`  OVERFLOW: "${o.text}" rect=${JSON.stringify(o.rect)}`);
        });
      }
      if (report.tinyText.length) {
        report.tinyText.forEach(t => {
          console.log(`  TINY: "${t.text}" fontSize=${t.fontSize}px`);
        });
      }
    }
  }

  // Output full JSON for reference
  const fs = require('fs');
  fs.writeFileSync('/tmp/qa-deep-results.json', JSON.stringify(allResults, null, 2));
  console.log('\nFull results saved to /tmp/qa-deep-results.json');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
