/**
 * Create all visual assets: gradient backgrounds, decorative shapes, icons
 * Run: node create_assets.cjs
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const React = require('react');
const ReactDOMServer = require('react-dom/server');

const ASSETS = path.join(__dirname, 'assets');
fs.mkdirSync(ASSETS, { recursive: true });

// --- Helper ---
async function svgToPng(svg, filename, w, h) {
  const out = path.join(ASSETS, filename);
  await sharp(Buffer.from(svg)).resize(w, h).png().toFile(out);
  console.log(`  ${filename} (${w}x${h})`);
}

async function rasterizeIcon(IconComponent, color, size, filename) {
  const svgString = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color: `#${color}`, size: String(size) })
  );
  const out = path.join(ASSETS, filename);
  await sharp(Buffer.from(svgString)).png().toFile(out);
  console.log(`  ${filename} (icon)`);
}

async function main() {
  console.log('=== Generating visual assets ===\n');

  // ---------- Background gradients ----------
  console.log('[Backgrounds]');

  // Warm white with subtle texture
  await svgToPng(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
      <rect width="100%" height="100%" fill="#FAFAF8"/>
      <circle cx="1100" cy="600" r="300" fill="#F0EDE6" opacity="0.6"/>
      <circle cx="200" cy="100" r="200" fill="#F0EDE6" opacity="0.4"/>
    </svg>
  `, 'bg-warm.png', 1280, 720);

  // White with gold accent bar at left
  await svgToPng(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
      <rect width="100%" height="100%" fill="#FFFFFF"/>
      <rect x="0" y="0" width="6" height="100%" fill="#C4963C"/>
    </svg>
  `, 'bg-gold-bar.png', 1280, 720);

  // Dark slide (for contrast slides)
  await svgToPng(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
      <rect width="100%" height="100%" fill="#1A1A1A"/>
      <circle cx="640" cy="360" r="400" fill="#222222" opacity="0.5"/>
    </svg>
  `, 'bg-dark.png', 1280, 720);

  // Section divider - left dark, right light
  await svgToPng(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
      <rect x="0" y="0" width="420" height="100%" fill="#1A1A1A"/>
      <rect x="420" y="0" width="860" height="100%" fill="#FAFAF8"/>
    </svg>
  `, 'bg-split.png', 1280, 720);

  // Soft gradient for data
  await svgToPng(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#F8F8F6"/>
          <stop offset="100%" style="stop-color:#F0EDE6"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>
  `, 'bg-data-light.png', 1280, 720);

  // ---------- Decorative shapes ----------
  console.log('\n[Decorative Shapes]');

  // Large decorative circle (gold, semi-transparent)
  await svgToPng(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
      <circle cx="200" cy="200" r="195" fill="none" stroke="#C4963C" stroke-width="2" opacity="0.3"/>
      <circle cx="200" cy="200" r="160" fill="none" stroke="#C4963C" stroke-width="1" opacity="0.15"/>
    </svg>
  `, 'deco-circle-gold.png', 400, 400);

  // Dots pattern
  await svgToPng(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
      ${Array.from({length: 64}, (_, i) => {
        const x = (i % 8) * 24 + 12;
        const y = Math.floor(i / 8) * 24 + 12;
        return `<circle cx="${x}" cy="${y}" r="2" fill="#C4963C" opacity="0.2"/>`;
      }).join('')}
    </svg>
  `, 'deco-dots.png', 200, 200);

  // Quote mark
  await svgToPng(`
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="100" viewBox="0 0 120 100">
      <text x="0" y="80" font-family="Georgia, serif" font-size="120" fill="#C4963C" opacity="0.3">"</text>
    </svg>
  `, 'deco-quote.png', 120, 100);

  // Arrow right
  await svgToPng(`
    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24">
      <path d="M5 12h14M12 5l7 7-7 7" fill="none" stroke="#C4963C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `, 'icon-arrow.png', 60, 60);

  // ---------- Icons via react-icons ----------
  console.log('\n[Icons]');

  const { FaRobot, FaHandshake, FaChartLine, FaPhone, FaUsers, FaHeart } = require('react-icons/fa');

  await rasterizeIcon(FaRobot, 'C4963C', 128, 'icon-robot.png');
  await rasterizeIcon(FaHandshake, 'C4963C', 128, 'icon-handshake.png');
  await rasterizeIcon(FaChartLine, 'C4963C', 128, 'icon-chart.png');
  await rasterizeIcon(FaPhone, 'C4963C', 128, 'icon-phone.png');
  await rasterizeIcon(FaUsers, 'C4963C', 128, 'icon-users.png');
  await rasterizeIcon(FaHeart, 'C4963C', 128, 'icon-heart.png');

  // White versions for dark backgrounds
  await rasterizeIcon(FaHandshake, 'FFFFFF', 128, 'icon-handshake-w.png');

  // Number badges (1, 2, 3 in circles)
  console.log('\n[Number Badges]');
  for (const n of [1, 2, 3]) {
    await svgToPng(`
      <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">
        <circle cx="40" cy="40" r="38" fill="#C4963C"/>
        <text x="40" y="52" text-anchor="middle" font-family="Arial" font-size="36" font-weight="bold" fill="#FFFFFF">${n}</text>
      </svg>
    `, `badge-${n}.png`, 80, 80);
  }

  console.log('\n=== Done! ===');
}

main().catch(console.error);
