'use strict';

/**
 * orchestrate.cjs
 * Pipeline utility for run ID generation and state tracking.
 *
 * Usage:
 *   node scripts/orchestrate.cjs init --topic "AI시대 네트워킹"
 *   node scripts/orchestrate.cjs status --run-id 20260224-143000-a1b2
 *   node scripts/orchestrate.cjs list
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OUTPUT_DIR = path.resolve(__dirname, '..', 'output');

const STAGES = [
  'lecture-script',
  'research',
  'infographic',
  'image-gen',
  'assembly',
  'qa-review',
];

const STAGE_LABELS = {
  'lecture-script': 'Lecture Script',
  'research':       'Research',
  'infographic':    'Infographic',
  'image-gen':      'Image Generation',
  'assembly':       'Assembly',
  'qa-review':      'QA Review',
};

const STATUS_ICONS = {
  pending:    '○',
  'in-progress': '◑',
  completed:  '●',
  failed:     '✗',
  skipped:    '–',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateRunId() {
  const now = new Date();
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  const date =
    String(now.getFullYear()) +
    pad(now.getMonth() + 1) +
    pad(now.getDate());
  const time =
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds());
  const hex = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .padStart(4, '0');
  return `${date}-${time}-${hex}`;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 3; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    }
  }
  return args;
}

function readPipelineState(runId) {
  const stateFile = path.join(OUTPUT_DIR, runId, 'pipeline-state.json');
  if (!fs.existsSync(stateFile)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
  } catch {
    return null;
  }
}

function computeProgress(stages) {
  const total = STAGES.length;
  const done = STAGES.filter(
    (s) => stages[s] && stages[s].status === 'completed'
  ).length;
  return Math.round((done / total) * 100);
}

function formatDate(iso) {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return (
      String(d.getFullYear()) +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0') +
      ' ' +
      String(d.getHours()).padStart(2, '0') +
      ':' +
      String(d.getMinutes()).padStart(2, '0')
    );
  } catch {
    return iso;
  }
}

function printTable(headers, rows, colWidths) {
  const border = colWidths.map((w) => '-'.repeat(w)).join('-+-');
  const header = headers
    .map((h, i) => h.padEnd(colWidths[i]))
    .join(' | ');
  console.log(header);
  console.log(border);
  for (const row of rows) {
    console.log(row.map((cell, i) => String(cell).padEnd(colWidths[i])).join(' | '));
  }
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function cmdInit(args) {
  const topic = args['topic'];
  if (!topic) {
    console.error('[orchestrate] --topic is required for init');
    process.exit(1);
  }

  const runId = generateRunId();
  const runDir = path.join(OUTPUT_DIR, runId);

  // Create directory structure
  const dirs = [
    runDir,
    path.join(runDir, 'infographics'),
    path.join(runDir, 'images'),
    path.join(runDir, 'slides'),
  ];
  for (const d of dirs) {
    fs.mkdirSync(d, { recursive: true });
  }

  // Empty placeholder files
  const placeholders = {
    'lecture-spec.json': {},
    'research-report.json': {},
    'qa-report.json': {},
  };
  for (const [filename, content] of Object.entries(placeholders)) {
    fs.writeFileSync(
      path.join(runDir, filename),
      JSON.stringify(content, null, 2),
      'utf-8'
    );
  }

  // asset-manifest.json with initialized meta
  const assetManifest = {
    meta: {
      runId,
      updatedAt: new Date().toISOString(),
      baseDir: runDir,
    },
    assets: [],
  };
  fs.writeFileSync(
    path.join(runDir, 'asset-manifest.json'),
    JSON.stringify(assetManifest, null, 2),
    'utf-8'
  );

  // pipeline-state.json
  const now = new Date().toISOString();
  const stageDefaults = {};
  for (const stage of STAGES) {
    stageDefaults[stage] = {
      status: 'pending',
      startedAt: null,
      completedAt: null,
    };
  }

  const pipelineState = {
    runId,
    topic,
    createdAt: now,
    stages: stageDefaults,
    qaIterations: 0,
    currentStage: 'lecture-script',
  };
  fs.writeFileSync(
    path.join(runDir, 'pipeline-state.json'),
    JSON.stringify(pipelineState, null, 2),
    'utf-8'
  );

  console.log('[orchestrate] Run initialized');
  console.log(`  Run ID : ${runId}`);
  console.log(`  Topic  : ${topic}`);
  console.log(`  Dir    : ${runDir}`);
}

function cmdStatus(args) {
  const runId = args['run-id'];
  if (!runId) {
    console.error('[orchestrate] --run-id is required for status');
    process.exit(1);
  }

  const state = readPipelineState(runId);
  if (!state) {
    console.error(`[orchestrate] No pipeline-state.json found for run: ${runId}`);
    process.exit(1);
  }

  const progress = computeProgress(state.stages);

  console.log('\n[orchestrate] Pipeline Status');
  console.log(`  Run ID  : ${state.runId}`);
  console.log(`  Topic   : ${state.topic}`);
  console.log(`  Created : ${formatDate(state.createdAt)}`);
  console.log(`  Current : ${state.currentStage}`);
  console.log(`  QA Iter : ${state.qaIterations}`);
  console.log(`  Progress: ${progress}%`);
  console.log('');

  const headers = ['Stage', 'Status', 'Started', 'Completed'];
  const colWidths = [20, 12, 18, 18];
  const rows = STAGES.map((stage) => {
    const s = state.stages[stage] || {};
    const icon = STATUS_ICONS[s.status] || '?';
    return [
      STAGE_LABELS[stage] || stage,
      `${icon} ${s.status || 'pending'}`,
      formatDate(s.startedAt),
      formatDate(s.completedAt),
    ];
  });

  printTable(headers, rows, colWidths);
  console.log('');
}

function cmdList() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    console.log('[orchestrate] No output directory found. No runs yet.');
    return;
  }

  const entries = fs
    .readdirSync(OUTPUT_DIR)
    .filter((name) => {
      const p = path.join(OUTPUT_DIR, name);
      return fs.statSync(p).isDirectory();
    })
    .sort()
    .reverse(); // newest first

  if (entries.length === 0) {
    console.log('[orchestrate] No runs found in output/');
    return;
  }

  const headers = ['Run ID', 'Topic', 'Created', 'Current Stage', 'Progress'];
  const colWidths = [24, 28, 18, 18, 10];
  const rows = [];

  for (const runId of entries) {
    const state = readPipelineState(runId);
    if (!state) {
      rows.push([runId, '(no state)', '-', '-', '-']);
      continue;
    }
    const progress = computeProgress(state.stages);
    const topic =
      state.topic && state.topic.length > 26
        ? state.topic.slice(0, 25) + '…'
        : state.topic || '-';
    rows.push([
      state.runId,
      topic,
      formatDate(state.createdAt),
      state.currentStage || '-',
      `${progress}%`,
    ]);
  }

  console.log('\n[orchestrate] All Runs\n');
  printTable(headers, rows, colWidths);
  console.log('');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const command = process.argv[2];
  const args = parseArgs(process.argv);

  switch (command) {
    case 'init':
      cmdInit(args);
      break;
    case 'status':
      cmdStatus(args);
      break;
    case 'list':
      cmdList();
      break;
    default:
      console.error(
        '[orchestrate] Unknown command. Use: init | status | list'
      );
      console.error('  node scripts/orchestrate.cjs init --topic "..."');
      console.error('  node scripts/orchestrate.cjs status --run-id <id>');
      console.error('  node scripts/orchestrate.cjs list');
      process.exit(1);
  }
}

main();
