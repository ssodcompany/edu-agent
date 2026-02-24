/**
 * generate_infographic.cjs
 *
 * Generates infographic PNG images from lecture-spec.json data using SVG → Sharp → PNG.
 * Called by the infographic-agent to create charts/visualizations for lecture slides.
 *
 * Usage:
 *   node scripts/generate_infographic.cjs \
 *     --input output/{run-id}/lecture-spec.json \
 *     --output-dir output/{run-id}/infographics \
 *     --manifest output/{run-id}/asset-manifest.json \
 *     [--slides 3,5,7] \
 *     [--force]
 */

'use strict';

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// ─── Constants ────────────────────────────────────────────────────────────────

const WIDTH = 1280;
const HEIGHT = 720;

const DEFAULT_COLORS = {
  primary: '#C4963C',
  text: '#1A1A1A',
  subtle: '#666666',
  muted: '#999999',
  background: 'transparent',
  white: '#FFFFFF',
  lightBg: '#F8F8F6',
};

const FONT_FAMILY = 'Arial, sans-serif';

// ─── CLI Argument Parser ───────────────────────────────────────────────────────

/**
 * Parses process.argv into a simple key-value map.
 * Supports --key value and --flag (boolean) forms.
 * @returns {{ input: string, outputDir: string, manifest: string, slides: number[]|null, force: boolean }}
 */
function parseArgs() {
  const argv = process.argv.slice(2);
  const args = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }

  if (!args.input) {
    console.error('Error: --input is required');
    process.exit(1);
  }
  if (!args['output-dir']) {
    console.error('Error: --output-dir is required');
    process.exit(1);
  }
  if (!args.manifest) {
    console.error('Error: --manifest is required');
    process.exit(1);
  }

  const slides =
    args.slides
      ? String(args.slides)
          .split(',')
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n))
      : null;

  return {
    input: path.resolve(args.input),
    outputDir: path.resolve(args['output-dir']),
    manifest: path.resolve(args.manifest),
    slides,
    force: args.force === true,
  };
}

// ─── SVG → PNG ────────────────────────────────────────────────────────────────

/**
 * Converts an SVG string to a PNG file using Sharp.
 * @param {string} svgString - SVG markup
 * @param {string} outputPath - Absolute path for the output PNG
 * @param {number} width - Output width in pixels
 * @param {number} height - Output height in pixels
 * @returns {Promise<void>}
 */
async function svgToPng(svgString, outputPath, width, height) {
  await sharp(Buffer.from(svgString))
    .resize(width, height)
    .png()
    .toFile(outputPath);
}

// ─── Manifest Helper ──────────────────────────────────────────────────────────

/**
 * Reads, appends an entry, and writes back the asset manifest JSON file.
 * Creates the file with an empty array if it does not exist.
 * @param {string} manifestPath - Path to asset-manifest.json
 * @param {{ slideNumber: number, type: string, filePath: string, fileName: string }} entry
 * @returns {Promise<void>}
 */
async function updateManifest(manifestPath, entry) {
  let manifest = [];
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (!Array.isArray(manifest)) manifest = [];
    } catch (_) {
      manifest = [];
    }
  }

  // Remove any existing entry for the same slide/type so we don't duplicate
  manifest = manifest.filter(
    (e) => !(e.slideNumber === entry.slideNumber && e.type === entry.type)
  );
  manifest.push(entry);

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}

// ─── SVG Arc Path Helper ──────────────────────────────────────────────────────

/**
 * Returns an SVG arc path string for a circle segment.
 * Angles are in degrees, measured clockwise from the top (12 o'clock).
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} r - Radius
 * @param {number} startAngle - Start angle in degrees
 * @param {number} endAngle - End angle in degrees
 * @returns {string} SVG path data string
 */
function describeArc(cx, cy, r, startAngle, endAngle) {
  const toRad = (deg) => ((deg - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

// ─── Text Wrapping Helper ─────────────────────────────────────────────────────

/**
 * Wraps text into lines of at most maxChars characters, splitting on spaces.
 * @param {string} text
 * @param {number} maxChars
 * @returns {string[]}
 */
function wrapText(text, maxChars) {
  if (!text) return [];
  const words = String(text).split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + (current ? ' ' : '') + word).length <= maxChars) {
      current += (current ? ' ' : '') + word;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ─── Chart Generators ─────────────────────────────────────────────────────────

/**
 * Generates a horizontal bar chart SVG.
 * @param {{ title: string, items: Array<{label: string, value: number, color?: string}>, unit?: string, maxValue?: number }} data
 * @param {typeof DEFAULT_COLORS} colors
 * @returns {string} SVG markup
 */
function generateBarChart(data, colors) {
  const { title = '', items = [], unit = '', maxValue } = data;
  const max = maxValue || Math.max(...items.map((i) => i.value), 1);

  const paddingTop = 80;
  const paddingLeft = 220;
  const paddingRight = 100;
  const paddingBottom = 60;
  const barAreaWidth = WIDTH - paddingLeft - paddingRight;
  const barHeight = 36;
  const barGap = 20;
  const totalBarsHeight = items.length * (barHeight + barGap) - barGap;
  const chartTop = paddingTop + 20;

  const svgHeight = chartTop + totalBarsHeight + paddingBottom;
  const svgH = Math.max(svgHeight, HEIGHT);

  const bars = items
    .map((item, i) => {
      const barWidth = Math.round((item.value / max) * barAreaWidth);
      const y = chartTop + i * (barHeight + barGap);
      const color = item.color || colors.primary;
      const labelLines = wrapText(item.label, 22);
      const labelY =
        y + barHeight / 2 - ((labelLines.length - 1) * 16) / 2;

      const labelSvg = labelLines
        .map(
          (line, li) =>
            `<text x="${paddingLeft - 16}" y="${labelY + li * 16}"
              font-family="${FONT_FAMILY}" font-size="14" fill="${colors.text}"
              text-anchor="end" dominant-baseline="middle">${escapeXml(line)}</text>`
        )
        .join('');

      return `
        <!-- Bar ${i + 1} -->
        <rect x="${paddingLeft}" y="${y}" width="${barWidth}" height="${barHeight}"
          rx="4" ry="4" fill="${color}" opacity="0.9"/>
        <!-- Label -->
        ${labelSvg}
        <!-- Value -->
        <text x="${paddingLeft + barWidth + 10}" y="${y + barHeight / 2}"
          font-family="${FONT_FAMILY}" font-size="15" font-weight="bold"
          fill="${colors.text}" dominant-baseline="middle">
          ${escapeXml(String(item.value))}${escapeXml(unit)}
        </text>
      `;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}"
    viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <!-- Background -->
    <rect width="${WIDTH}" height="${HEIGHT}" fill="${colors.lightBg}" rx="0"/>
    <!-- Left accent bar -->
    <rect x="0" y="0" width="6" height="${HEIGHT}" fill="${colors.primary}"/>
    <!-- Title -->
    <text x="${paddingLeft}" y="52" font-family="${FONT_FAMILY}" font-size="28"
      font-weight="bold" fill="${colors.text}">${escapeXml(title)}</text>
    <!-- Gridlines -->
    ${[0, 25, 50, 75, 100]
      .filter((v) => v <= max)
      .map((v) => {
        const x = paddingLeft + Math.round((v / max) * barAreaWidth);
        return `<line x1="${x}" y1="${chartTop - 10}" x2="${x}"
          y2="${chartTop + totalBarsHeight + 10}"
          stroke="#DDDDDD" stroke-width="1"/>
          <text x="${x}" y="${chartTop + totalBarsHeight + 28}"
            font-family="${FONT_FAMILY}" font-size="11" fill="${colors.muted}"
            text-anchor="middle">${v}${escapeXml(unit)}</text>`;
      })
      .join('')}
    ${bars}
  </svg>`;
}

/**
 * Generates a pie chart SVG.
 * @param {{ title: string, items: Array<{label: string, value: number, color?: string}>, centerLabel?: string }} data
 * @param {typeof DEFAULT_COLORS} colors
 * @returns {string} SVG markup
 */
function generatePieChart(data, colors) {
  return _generatePieOrDonut(data, colors, false);
}

/**
 * Generates a donut chart SVG.
 * @param {{ title: string, items: Array<{label: string, value: number, color?: string}>, centerLabel?: string }} data
 * @param {typeof DEFAULT_COLORS} colors
 * @returns {string} SVG markup
 */
function generateDonutChart(data, colors) {
  return _generatePieOrDonut(data, colors, true);
}

/**
 * Internal: pie or donut chart renderer.
 * @param {object} data
 * @param {typeof DEFAULT_COLORS} colors
 * @param {boolean} isDonut
 * @returns {string} SVG markup
 */
function _generatePieOrDonut(data, colors, isDonut) {
  const { title = '', items = [], centerLabel = '' } = data;
  const total = items.reduce((s, i) => s + (i.value || 0), 0) || 1;

  const cx = 380;
  const cy = 360;
  const outerR = 220;
  const innerR = isDonut ? Math.round(outerR * 0.6) : 0;

  let currentAngle = 0;
  const segments = items.map((item, idx) => {
    const fraction = item.value / total;
    const sweep = fraction * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sweep - (sweep < 360 ? 0.5 : 0); // small gap between segments
    currentAngle += sweep;
    const color = item.color || colors.primary;

    let pathD;
    if (sweep >= 359.9) {
      // Full circle — use two arcs
      pathD = `M ${cx} ${cy - outerR}
        A ${outerR} ${outerR} 0 1 1 ${cx - 0.01} ${cy - outerR} Z`;
    } else {
      const toRad = (deg) => ((deg - 90) * Math.PI) / 180;
      const ox1 = cx + outerR * Math.cos(toRad(startAngle));
      const oy1 = cy + outerR * Math.sin(toRad(startAngle));
      const ox2 = cx + outerR * Math.cos(toRad(endAngle));
      const oy2 = cy + outerR * Math.sin(toRad(endAngle));
      const largeArc = sweep > 180 ? 1 : 0;

      if (isDonut) {
        const ix1 = cx + innerR * Math.cos(toRad(endAngle));
        const iy1 = cy + innerR * Math.sin(toRad(endAngle));
        const ix2 = cx + innerR * Math.cos(toRad(startAngle));
        const iy2 = cy + innerR * Math.sin(toRad(startAngle));
        pathD = `M ${ox1} ${oy1}
          A ${outerR} ${outerR} 0 ${largeArc} 1 ${ox2} ${oy2}
          L ${ix1} ${iy1}
          A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
      } else {
        pathD = `M ${cx} ${cy}
          L ${ox1} ${oy1}
          A ${outerR} ${outerR} 0 ${largeArc} 1 ${ox2} ${oy2} Z`;
      }
    }

    return { pathD, color, item, idx };
  });

  const segmentSvg = segments
    .map(
      ({ pathD, color }) =>
        `<path d="${pathD}" fill="${color}" stroke="${colors.lightBg}" stroke-width="2"/>`
    )
    .join('');

  // Legend (right side)
  const legendX = 750;
  const legendStartY = 200;
  const legendItemH = 44;
  const legendSvg = items
    .map((item, i) => {
      const color = item.color || colors.primary;
      const pct = Math.round((item.value / total) * 100);
      const y = legendStartY + i * legendItemH;
      return `
        <rect x="${legendX}" y="${y}" width="16" height="16" rx="3" fill="${color}"/>
        <text x="${legendX + 24}" y="${y + 8}" font-family="${FONT_FAMILY}"
          font-size="16" fill="${colors.text}" dominant-baseline="middle">
          ${escapeXml(item.label)}
        </text>
        <text x="${legendX + 24}" y="${y + 26}" font-family="${FONT_FAMILY}"
          font-size="13" fill="${colors.subtle}">
          ${pct}%
        </text>
      `;
    })
    .join('');

  // Center label for donut
  const centerSvg = isDonut && centerLabel
    ? `<text x="${cx}" y="${cy - 12}" font-family="${FONT_FAMILY}" font-size="18"
        fill="${colors.subtle}" text-anchor="middle">${escapeXml(centerLabel)}</text>
       <text x="${cx}" y="${cy + 16}" font-family="${FONT_FAMILY}" font-size="28"
        font-weight="bold" fill="${colors.text}" text-anchor="middle">
        ${Math.round(total)}
       </text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}"
    viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="${colors.lightBg}"/>
    <rect x="0" y="0" width="6" height="${HEIGHT}" fill="${colors.primary}"/>
    <!-- Title -->
    <text x="60" y="60" font-family="${FONT_FAMILY}" font-size="28" font-weight="bold"
      fill="${colors.text}">${escapeXml(title)}</text>
    <!-- Segments -->
    ${segmentSvg}
    ${centerSvg}
    <!-- Legend -->
    ${legendSvg}
  </svg>`;
}

/**
 * Generates a stat card SVG showing 1–4 large statistics.
 * @param {{ stats: Array<{value: string, label: string, highlight?: boolean}> }} data
 * @param {typeof DEFAULT_COLORS} colors
 * @returns {string} SVG markup
 */
function generateStatCard(data, colors) {
  const { stats = [] } = data;
  const count = Math.min(stats.length, 4);
  const cols = count <= 2 ? count : Math.ceil(count / 2);
  const rows = Math.ceil(count / cols);

  const cellW = Math.floor(WIDTH / cols);
  const cellH = Math.floor(HEIGHT / rows);

  const cells = stats.slice(0, 4).map((stat, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * cellW;
    const y = row * cellH;
    const bg = stat.highlight ? colors.primary : colors.lightBg;
    const valueFill = stat.highlight ? colors.white : colors.primary;
    const labelFill = stat.highlight ? colors.white : colors.subtle;

    const labelLines = wrapText(stat.label, 22);
    const labelStartY = y + cellH / 2 + 36;

    const labelTextSvg = labelLines
      .map(
        (line, li) =>
          `<text x="${x + cellW / 2}" y="${labelStartY + li * 22}"
            font-family="${FONT_FAMILY}" font-size="17" fill="${labelFill}"
            text-anchor="middle">${escapeXml(line)}</text>`
      )
      .join('');

    return `
      <rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="${bg}"/>
      ${col > 0 ? `<line x1="${x}" y1="${y + 40}" x2="${x}" y2="${y + cellH - 40}" stroke="#DDDDDD" stroke-width="1"/>` : ''}
      ${row > 0 ? `<line x1="${x + 40}" y1="${y}" x2="${x + cellW - 40}" y2="${y}" stroke="#DDDDDD" stroke-width="1"/>` : ''}
      <text x="${x + cellW / 2}" y="${y + cellH / 2 + 16}"
        font-family="${FONT_FAMILY}" font-size="64" font-weight="bold"
        fill="${valueFill}" text-anchor="middle">${escapeXml(String(stat.value))}</text>
      ${labelTextSvg}
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}"
    viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="${colors.lightBg}"/>
    ${cells.join('')}
    <!-- Bottom accent -->
    <rect x="0" y="${HEIGHT - 5}" width="${WIDTH}" height="5" fill="${colors.primary}"/>
  </svg>`;
}

/**
 * Generates a horizontal timeline SVG.
 * @param {{ title: string, items: Array<{period: string, event: string, highlight?: boolean}> }} data
 * @param {typeof DEFAULT_COLORS} colors
 * @returns {string} SVG markup
 */
function generateTimeline(data, colors) {
  const { title = '', items = [] } = data;
  const count = items.length;
  if (count === 0) return _emptySvg(title, colors);

  const lineY = HEIGHT / 2 - 20;
  const paddingX = 100;
  const usableWidth = WIDTH - paddingX * 2;
  const step = count > 1 ? Math.floor(usableWidth / (count - 1)) : 0;

  const nodeR = 18;

  const nodes = items.map((item, i) => {
    const x = count === 1 ? WIDTH / 2 : paddingX + i * step;
    const isHighlight = item.highlight === true;
    const nodeFill = isHighlight ? colors.primary : colors.white;
    const nodeStroke = isHighlight ? colors.primary : colors.subtle;
    const textFill = isHighlight ? colors.primary : colors.text;

    // Alternate label above/below to reduce overlap
    const labelAbove = i % 2 === 0;
    const periodY = labelAbove ? lineY - nodeR - 14 : lineY + nodeR + 20;
    const eventBaseY = labelAbove ? lineY - nodeR - 34 : lineY + nodeR + 44;

    const eventLines = wrapText(item.event, 18);
    const eventSvg = eventLines
      .map(
        (line, li) =>
          `<text x="${x}" y="${labelAbove ? eventBaseY - (eventLines.length - 1 - li) * 18 : eventBaseY + li * 18}"
            font-family="${FONT_FAMILY}" font-size="13" fill="${colors.subtle}"
            text-anchor="middle">${escapeXml(line)}</text>`
      )
      .join('');

    return `
      <!-- Node ${i + 1} -->
      <circle cx="${x}" cy="${lineY}" r="${nodeR}"
        fill="${nodeFill}" stroke="${nodeStroke}" stroke-width="3"/>
      ${isHighlight ? `<circle cx="${x}" cy="${lineY}" r="${nodeR - 7}" fill="${colors.primary}"/>` : ''}
      <text x="${x}" y="${periodY}" font-family="${FONT_FAMILY}" font-size="15"
        font-weight="bold" fill="${textFill}" text-anchor="middle">
        ${escapeXml(String(item.period))}
      </text>
      ${eventSvg}
    `;
  });

  // Horizontal line connecting nodes
  const lineX1 = count === 1 ? WIDTH / 2 : paddingX;
  const lineX2 = count === 1 ? WIDTH / 2 : paddingX + (count - 1) * step;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}"
    viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="${colors.lightBg}"/>
    <rect x="0" y="0" width="6" height="${HEIGHT}" fill="${colors.primary}"/>
    <!-- Title -->
    <text x="40" y="52" font-family="${FONT_FAMILY}" font-size="28" font-weight="bold"
      fill="${colors.text}">${escapeXml(title)}</text>
    <!-- Timeline line -->
    <line x1="${lineX1}" y1="${lineY}" x2="${lineX2}" y2="${lineY}"
      stroke="${colors.subtle}" stroke-width="3"/>
    ${nodes.join('')}
  </svg>`;
}

/**
 * Generates a process flow SVG with numbered steps connected by arrows.
 * @param {{ title: string, steps: Array<{number: number, title: string, description: string}> }} data
 * @param {typeof DEFAULT_COLORS} colors
 * @returns {string} SVG markup
 */
function generateProcessFlow(data, colors) {
  const { title = '', steps = [] } = data;
  const count = steps.length;
  if (count === 0) return _emptySvg(title, colors);

  const nodeR = 36;
  const paddingX = 80;
  const usableWidth = WIDTH - paddingX * 2;
  const step = count > 1 ? Math.floor(usableWidth / (count - 1)) : 0;
  const nodeY = 310;
  const textY = nodeY + nodeR + 32;

  const stepSvg = steps.map((s, i) => {
    const x = count === 1 ? WIDTH / 2 : paddingX + i * step;

    // Arrow between nodes
    const arrowSvg =
      i < count - 1
        ? (() => {
            const nextX = paddingX + (i + 1) * step;
            const arrowX1 = x + nodeR + 6;
            const arrowX2 = nextX - nodeR - 6;
            const midX = (arrowX1 + arrowX2) / 2;
            return `
            <line x1="${arrowX1}" y1="${nodeY}" x2="${arrowX2}" y2="${nodeY}"
              stroke="${colors.subtle}" stroke-width="2"/>
            <polygon points="${arrowX2},${nodeY} ${arrowX2 - 10},${nodeY - 6} ${arrowX2 - 10},${nodeY + 6}"
              fill="${colors.subtle}"/>
          `;
          })()
        : '';

    const descLines = wrapText(s.description || '', 20);
    const descSvg = descLines
      .map(
        (line, li) =>
          `<text x="${x}" y="${textY + 28 + li * 20}"
            font-family="${FONT_FAMILY}" font-size="13" fill="${colors.subtle}"
            text-anchor="middle">${escapeXml(line)}</text>`
      )
      .join('');

    return `
      ${arrowSvg}
      <!-- Step ${i + 1} circle -->
      <circle cx="${x}" cy="${nodeY}" r="${nodeR}" fill="${colors.primary}"/>
      <text x="${x}" y="${nodeY + 12}" font-family="${FONT_FAMILY}" font-size="26"
        font-weight="bold" fill="${colors.white}" text-anchor="middle">${s.number || i + 1}</text>
      <!-- Step title -->
      <text x="${x}" y="${textY}" font-family="${FONT_FAMILY}" font-size="16"
        font-weight="bold" fill="${colors.text}" text-anchor="middle">
        ${escapeXml(s.title || '')}
      </text>
      ${descSvg}
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}"
    viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="${colors.lightBg}"/>
    <rect x="0" y="0" width="6" height="${HEIGHT}" fill="${colors.primary}"/>
    <!-- Title -->
    <text x="40" y="60" font-family="${FONT_FAMILY}" font-size="28" font-weight="bold"
      fill="${colors.text}">${escapeXml(title)}</text>
    ${stepSvg.join('')}
  </svg>`;
}

/**
 * Generates a comparison table SVG.
 * @param {{ title: string, columns: string[], rows: string[][], highlightColumn?: number }} data
 * @param {typeof DEFAULT_COLORS} colors
 * @returns {string} SVG markup
 */
function generateComparisonTable(data, colors) {
  const { title = '', columns = [], rows = [], highlightColumn } = data;
  const numCols = columns.length || 1;
  const numRows = rows.length;

  const paddingX = 60;
  const paddingTop = 100;
  const colWidth = Math.floor((WIDTH - paddingX * 2) / numCols);
  const rowHeight = Math.min(
    Math.floor((HEIGHT - paddingTop - 60) / (numRows + 1)),
    72
  );
  const tableWidth = colWidth * numCols;

  // Header row
  const headerSvg = columns
    .map((col, ci) => {
      const x = paddingX + ci * colWidth;
      const isHL = ci === highlightColumn;
      return `
        <rect x="${x}" y="${paddingTop}" width="${colWidth}" height="${rowHeight}"
          fill="${isHL ? colors.primary : colors.text}"/>
        <text x="${x + colWidth / 2}" y="${paddingTop + rowHeight / 2 + 6}"
          font-family="${FONT_FAMILY}" font-size="16" font-weight="bold"
          fill="${colors.white}" text-anchor="middle">${escapeXml(col)}</text>
      `;
    })
    .join('');

  // Data rows
  const dataSvg = rows
    .map((row, ri) => {
      const y = paddingTop + (ri + 1) * rowHeight;
      const rowBg = ri % 2 === 0 ? colors.white : '#F3F3F0';
      return `
        <rect x="${paddingX}" y="${y}" width="${tableWidth}" height="${rowHeight}"
          fill="${rowBg}"/>
        ${row
          .map((cell, ci) => {
            const x = paddingX + ci * colWidth;
            const isHL = ci === highlightColumn;
            return `
              ${isHL
                ? `<rect x="${x}" y="${y}" width="${colWidth}" height="${rowHeight}"
                    fill="${colors.primary}" opacity="0.12"/>`
                : ''}
              <text x="${x + colWidth / 2}" y="${y + rowHeight / 2 + 6}"
                font-family="${FONT_FAMILY}" font-size="15"
                fill="${isHL ? colors.primary : colors.text}"
                font-weight="${isHL ? 'bold' : 'normal'}"
                text-anchor="middle">${escapeXml(String(cell))}</text>
            `;
          })
          .join('')}
        <!-- Row bottom border -->
        <line x1="${paddingX}" y1="${y + rowHeight}" x2="${paddingX + tableWidth}" y2="${y + rowHeight}"
          stroke="#EEEEEE" stroke-width="1"/>
      `;
    })
    .join('');

  // Column dividers
  const dividerSvg = columns
    .slice(1)
    .map((_, ci) => {
      const x = paddingX + (ci + 1) * colWidth;
      return `<line x1="${x}" y1="${paddingTop}" x2="${x}"
        y2="${paddingTop + (numRows + 1) * rowHeight}" stroke="#CCCCCC" stroke-width="1"/>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}"
    viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="${colors.lightBg}"/>
    <rect x="0" y="0" width="6" height="${HEIGHT}" fill="${colors.primary}"/>
    <!-- Title -->
    <text x="40" y="60" font-family="${FONT_FAMILY}" font-size="28" font-weight="bold"
      fill="${colors.text}">${escapeXml(title)}</text>
    <!-- Outer border -->
    <rect x="${paddingX}" y="${paddingTop}" width="${tableWidth}"
      height="${(numRows + 1) * rowHeight}" fill="none"
      stroke="#CCCCCC" stroke-width="1" rx="4"/>
    ${headerSvg}
    ${dataSvg}
    ${dividerSvg}
  </svg>`;
}

/**
 * Generates an icon grid SVG showing items with a simple geometric icon, label, and value.
 * @param {{ title: string, items: Array<{icon: string, label: string, value: string}> }} data
 * @param {typeof DEFAULT_COLORS} colors
 * @returns {string} SVG markup
 */
function generateIconGrid(data, colors) {
  const { title = '', items = [] } = data;
  const count = Math.min(items.length, 8);
  const cols = count <= 3 ? count : Math.min(4, Math.ceil(count / 2));
  const rows = Math.ceil(count / cols);

  const paddingX = 60;
  const paddingTop = 110;
  const cellW = Math.floor((WIDTH - paddingX * 2) / cols);
  const cellH = Math.floor((HEIGHT - paddingTop - 40) / rows);

  const cells = items.slice(0, 8).map((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = paddingX + col * cellW + cellW / 2;
    const cy = paddingTop + row * cellH + 50;

    const iconSvg = _simpleIcon(item.icon || 'circle', cx, cy - 10, 28, colors.primary);

    const labelLines = wrapText(item.label || '', 16);

    return `
      <!-- Cell ${i + 1} -->
      <rect x="${paddingX + col * cellW + 10}" y="${paddingTop + row * cellH + 4}"
        width="${cellW - 20}" height="${cellH - 8}" rx="8"
        fill="${colors.white}" opacity="0.8"/>
      ${iconSvg}
      <text x="${cx}" y="${cy + 32}" font-family="${FONT_FAMILY}" font-size="26"
        font-weight="bold" fill="${colors.primary}" text-anchor="middle">
        ${escapeXml(String(item.value || ''))}
      </text>
      ${labelLines
        .map(
          (line, li) =>
            `<text x="${cx}" y="${cy + 64 + li * 20}" font-family="${FONT_FAMILY}"
              font-size="14" fill="${colors.subtle}" text-anchor="middle">
              ${escapeXml(line)}
            </text>`
        )
        .join('')}
    `;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}"
    viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="${colors.lightBg}"/>
    <rect x="0" y="0" width="6" height="${HEIGHT}" fill="${colors.primary}"/>
    <!-- Title -->
    <text x="40" y="60" font-family="${FONT_FAMILY}" font-size="28" font-weight="bold"
      fill="${colors.text}">${escapeXml(title)}</text>
    ${cells.join('')}
  </svg>`;
}

// ─── Internal Utilities ───────────────────────────────────────────────────────

/**
 * Renders a simple geometric icon at the given center point.
 * Supported icon names: circle, square, diamond, star, triangle, hexagon.
 * Falls back to circle for unknown names.
 * @param {string} iconName
 * @param {number} cx
 * @param {number} cy
 * @param {number} r - Approximate radius/size
 * @param {string} fill - Fill color hex string
 * @returns {string} SVG element string
 */
function _simpleIcon(iconName, cx, cy, r, fill) {
  switch (iconName.toLowerCase()) {
    case 'square':
      return `<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}"
        rx="4" fill="${fill}" opacity="0.85"/>`;
    case 'diamond':
      return `<polygon points="${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}"
        fill="${fill}" opacity="0.85"/>`;
    case 'triangle':
      return `<polygon points="${cx},${cy - r} ${cx + r},${cy + r} ${cx - r},${cy + r}"
        fill="${fill}" opacity="0.85"/>`;
    case 'star': {
      const pts = Array.from({ length: 5 }, (_, i) => {
        const outerAngle = (i * 72 - 90) * (Math.PI / 180);
        const innerAngle = (i * 72 + 36 - 90) * (Math.PI / 180);
        const ox = cx + r * Math.cos(outerAngle);
        const oy = cy + r * Math.sin(outerAngle);
        const ix = cx + (r * 0.45) * Math.cos(innerAngle);
        const iy = cy + (r * 0.45) * Math.sin(innerAngle);
        return `${ox},${oy} ${ix},${iy}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="${fill}" opacity="0.85"/>`;
    }
    case 'hexagon': {
      const pts = Array.from({ length: 6 }, (_, i) => {
        const angle = (i * 60 - 30) * (Math.PI / 180);
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="${fill}" opacity="0.85"/>`;
    }
    case 'circle':
    default:
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="0.85"/>`;
  }
}

/**
 * Returns a minimal placeholder SVG when no data is provided.
 * @param {string} title
 * @param {typeof DEFAULT_COLORS} colors
 * @returns {string} SVG markup
 */
function _emptySvg(title, colors) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}"
    viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="${colors.lightBg}"/>
    <rect x="0" y="0" width="6" height="${HEIGHT}" fill="${colors.primary}"/>
    <text x="${WIDTH / 2}" y="${HEIGHT / 2}" font-family="${FONT_FAMILY}" font-size="24"
      fill="${colors.muted}" text-anchor="middle">${escapeXml(title || 'No data')}</text>
  </svg>`;
}

/**
 * Escapes special XML characters to prevent SVG injection.
 * @param {string} str
 * @returns {string}
 */
function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ─── Chart Dispatch ────────────────────────────────────────────────────────────

/**
 * Dispatches to the appropriate generator function based on infographicType.
 * Returns null (with a warning) if the type is unknown.
 * @param {string} type
 * @param {object} data
 * @param {typeof DEFAULT_COLORS} colors
 * @returns {string|null} SVG markup or null
 */
function generateSvg(type, data, colors) {
  switch (type) {
    case 'bar-chart':
      return generateBarChart(data, colors);
    case 'pie-chart':
      return generatePieChart(data, colors);
    case 'donut-chart':
      return generateDonutChart(data, colors);
    case 'stat-card':
      return generateStatCard(data, colors);
    case 'timeline':
      return generateTimeline(data, colors);
    case 'process-flow':
      return generateProcessFlow(data, colors);
    case 'comparison-table':
      return generateComparisonTable(data, colors);
    case 'icon-grid':
      return generateIconGrid(data, colors);
    default:
      console.warn(`  [WARN] Unknown infographic type: "${type}" — skipping`);
      return null;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * Entry point. Reads lecture-spec.json, generates PNGs for each slide
 * with infographicNeeded === true, and updates the asset manifest.
 */
async function main() {
  const args = parseArgs();
  const { input, outputDir, manifest, slides: slideFilter, force } = args;

  console.log('=== generate_infographic.cjs ===\n');
  console.log(`Input:      ${input}`);
  console.log(`Output dir: ${outputDir}`);
  console.log(`Manifest:   ${manifest}`);
  if (slideFilter) console.log(`Slides:     ${slideFilter.join(', ')}`);
  if (force) console.log('Force:      yes (overwrite existing files)');
  console.log('');

  // 1. Read lecture-spec.json
  if (!fs.existsSync(input)) {
    console.error(`Error: Input file not found: ${input}`);
    process.exit(1);
  }

  let spec;
  try {
    spec = JSON.parse(fs.readFileSync(input, 'utf8'));
  } catch (err) {
    console.error(`Error: Failed to parse JSON from ${input}: ${err.message}`);
    process.exit(1);
  }

  // 2. Resolve colors from lecture-spec theme (if provided)
  const theme = spec.theme || {};
  const colors = {
    primary: theme.accent || theme.primary || DEFAULT_COLORS.primary,
    text: theme.text || DEFAULT_COLORS.text,
    subtle: theme.subtle || DEFAULT_COLORS.subtle,
    muted: theme.muted || DEFAULT_COLORS.muted,
    white: DEFAULT_COLORS.white,
    lightBg: theme.lightBg || DEFAULT_COLORS.lightBg,
    background: DEFAULT_COLORS.background,
  };

  // 3. Create output directory
  fs.mkdirSync(outputDir, { recursive: true });

  // 4. Filter slides
  const allSlides = Array.isArray(spec.slides) ? spec.slides : [];
  const targetSlides = allSlides.filter((slide) => {
    if (!slide) return false;
    const visual = slide.visual || {};
    if (!visual.infographicNeeded) return false;
    if (slideFilter && !slideFilter.includes(slide.slideNumber)) return false;
    return true;
  });

  if (targetSlides.length === 0) {
    console.log('No slides with infographicNeeded === true found. Nothing to generate.');
    return;
  }

  console.log(`Found ${targetSlides.length} slide(s) to process.\n`);

  // 5. Generate each infographic
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const slide of targetSlides) {
    const { slideNumber, visual = {} } = slide;
    const type = visual.infographicType || '';
    const data = visual.infographicData || {};
    const outFileName = `infographic-${slideNumber}.png`;
    const outPath = path.join(outputDir, outFileName);

    process.stdout.write(`[Slide ${slideNumber}] type="${type}" → ${outFileName} ... `);

    // Skip if file already exists and --force not set
    if (!force && fs.existsSync(outPath)) {
      console.log('skipped (already exists, use --force to overwrite)');
      skipped++;
      continue;
    }

    // Generate SVG
    let svgString;
    try {
      svgString = generateSvg(type, data, colors);
    } catch (err) {
      console.log(`FAILED (SVG generation error: ${err.message})`);
      failed++;
      continue;
    }

    if (svgString === null) {
      // Unknown type — warning already printed inside generateSvg
      failed++;
      continue;
    }

    // Convert to PNG
    try {
      await svgToPng(svgString, outPath, WIDTH, HEIGHT);
    } catch (err) {
      console.log(`FAILED (PNG conversion error: ${err.message})`);
      failed++;
      continue;
    }

    // Update manifest
    try {
      await updateManifest(manifest, {
        slideNumber,
        type,
        filePath: outPath,
        fileName: outFileName,
        width: WIDTH,
        height: HEIGHT,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.log(`WARN: PNG written but manifest update failed: ${err.message}`);
    }

    console.log('done');
    generated++;
  }

  // 6. Summary
  console.log('');
  console.log('=== Summary ===');
  console.log(`  Generated: ${generated}`);
  console.log(`  Skipped:   ${skipped}`);
  console.log(`  Failed:    ${failed}`);
  console.log('');
  if (failed > 0) {
    console.warn(`WARNING: ${failed} infographic(s) failed to generate.`);
    process.exitCode = 1;
  } else {
    console.log('Done.');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err.message || err);
  process.exit(1);
});
