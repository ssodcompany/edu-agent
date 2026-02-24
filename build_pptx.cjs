/**
 * Build PPTX from HTML slides
 * Run: node build_pptx.cjs
 */
const pptxgen = require('pptxgenjs');
const html2pptx = require('./.claude/skills/pptx-skill/scripts/html2pptx.cjs');
const path = require('path');
const fs = require('fs');

const SLIDES_DIR = path.join(__dirname, 'slides');
const OUTPUT_FILE = path.join(__dirname, 'AI시대_네트워킹_강의.pptx');

// Parse CLI args for dynamic paths
const args = process.argv.slice(2);
let slidesDir = SLIDES_DIR;
let outputFile = OUTPUT_FILE;
let notesFile = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--slides-dir' && args[i+1]) slidesDir = path.resolve(args[i+1]);
  if (args[i] === '--output' && args[i+1]) outputFile = path.resolve(args[i+1]);
  if (args[i] === '--notes' && args[i+1]) notesFile = path.resolve(args[i+1]);
  if (args[i] === '--title' && args[i+1]) pptx.title = args[i+1];
}

// Speaker notes per slide (from lecture_v2.json)
const NOTES = [
  "(강의 시작 전 타이틀 슬라이드. 청중이 착석하면서 볼 수 있도록 미리 띄워놓기.)",
  "여러분, 오픈클로 들어보셨죠? 한 달 만에 GitHub 스타 20만 개를 찍은 AI 에이전트입니다. 카카오, 네이버, 당근마켓이 보안 문제로 사내 사용을 금지시켰을 정도로 임팩트가 큰 도구입니다. 카톡으로 메시지 하나 보내면, AI가 알아서 컴퓨터를 조작합니다. PPT 만들고, 이메일 보내고, 견적서까지 작성합니다. 사람이 없어도요.",
  "(2초 침묵 후, 천천히) 그런데 이 AI가 못하는 게 딱 하나 있습니다. (슬라이드 전환) 신뢰. '이 사람을 믿겠다'는 결정은 누가 내립니까? AI가요? 아닙니다. 여전히 사람입니다. 오늘 저는 이 한 가지 이야기를 하려고 합니다.",
  "자, 이제 숫자로 보겠습니다. AI가 모든 것을 싸고 빠르게 만드는 시대에, 유일하게 값이 올라가고 있는 것이 있습니다.",
  "숫자를 보겠습니다. 전문가의 64%가 AI가 만들어낸 분석보다 자신의 인간 네트워크에서 얻은 인사이트를 더 신뢰한다고 응답했습니다. 영업에서도 마찬가지입니다. 관계 기반 추천의 전환율은 15~25%인데, 콜드콜은 고작 2~3%입니다. 4배 차이. 지인의 추천을 신뢰하는 비율은 92%인데, 온라인 광고는 33%에 불과합니다. AI가 정보를 무료로 만들수록, '누가 말했느냐'의 가치, 즉 신뢰의 가격은 올라가고 있습니다.",
  "링크드인이 3,000명 이상을 대상으로 조사한 결과, 일자리의 85%가 네트워킹을 통해 채워집니다. 추천 지원자는 전체의 7%에 불과하지만, 실제 채용의 40%를 차지합니다. 더 아이러니한 건, AI 채용 필터가 강화될수록 이 수치가 더 올라간다는 겁니다.",
  "여러분이 매주 하고 계신 그 추천 한 건. 그게 뭔지 다시 생각해보겠습니다. BNI 회원들이 지난 12개월간 추천을 통해 만들어낸 수익이 약 35조원입니다. 1,740만 건의 추천이 오갔습니다. 추천 한 건의 의미는, 내 평판을 걸고 누군가를 보증한다는 뜻입니다. 이것은 어떤 AI 알고리즘도 생성할 수 없는, 인간 고유의 행위입니다.",
  "자, 그러면 우리가 오늘부터 할 수 있는 것은 무엇인가.",
  "AI에게 시간을 뺏기는 것이 아니라, AI가 절약해준 시간을 사람에게 투자하세요. 1-1-1 네트워킹 법칙입니다. 매주 1명에게 먼저 연락하세요. 매주 1시간을 만남에 투자하세요. 만남마다 상대에게 1가지 도움을 먼저 제공하세요. 1년이면 52명, 3년이면 150명입니다. 던바의 수, 즉 의미 있는 관계를 유지할 수 있는 상한이 150명입니다. 3년이면 당신의 관계 자본이 가득 찹니다.",
  "오늘 이 강의가 끝나고 딱 한 가지만 해주십시오. 핸드폰을 꺼내서, 최근 3개월간 연락하지 못한 사람 한 명에게 메시지를 보내세요. 거창할 필요 없습니다. '요즘 어떻게 지내세요? 한번 뵙고 싶습니다.' 이 한 줄이면 됩니다.",
  "(느리게, 무게 있게) AI시대에 가장 비싼 것은 신뢰입니다. 그리고 이 방에 있는 여러분이, 신뢰를 만드는 사람들입니다. 감사합니다."
];

async function main() {
  console.log('Building PPTX from HTML slides...\n');

  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'BNI Education';
  pptx.title = 'AI시대에 결국 남는 것은 사람과의 네트워킹이다';
  pptx.subject = '10분 강의 - 신뢰의 희소성';

  // Apply --title if provided (re-apply after pptx instantiation)
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title' && args[i+1]) pptx.title = args[i+1];
  }

  // Load notes from file if --notes provided, otherwise use hardcoded NOTES
  const notes = notesFile && fs.existsSync(notesFile)
    ? JSON.parse(fs.readFileSync(notesFile, 'utf8'))
    : NOTES;

  // Get all slide HTML files sorted
  const slideFiles = fs.readdirSync(slidesDir)
    .filter(f => f.endsWith('.html'))
    .sort();

  console.log(`Found ${slideFiles.length} slides\n`);

  for (let i = 0; i < slideFiles.length; i++) {
    const file = slideFiles[i];
    const filePath = path.join(slidesDir, file);
    console.log(`  [${i + 1}/${slideFiles.length}] Converting ${file}...`);

    try {
      const { slide } = await html2pptx(filePath, pptx);

      // Add speaker notes
      if (notes[i]) {
        slide.addNotes(notes[i]);
      }

      console.log(`    OK`);
    } catch (err) {
      console.error(`    ERROR: ${err.message}`);
    }
  }

  // Save
  await pptx.writeFile({ fileName: outputFile });
  console.log(`\nPPTX saved: ${outputFile}`);
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
