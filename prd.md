# 강의 PPT 생성 파이프라인 - PRD

## 프로젝트 개요
**Run ID:** 20260224-213637-9b7d
**주제:** AI시대에 결국 남는 것은 사람과의 네트워킹이다
**청중:** BNI 회원 (비IT 사업가)
**시간:** 10분 / 12슬라이드

## 파이프라인 경로
- **기획서:** `output/20260224-213637-9b7d/lecture-spec.json`
- **조사보고서:** `output/20260224-213637-9b7d/research-report.json`
- **인포그래픽:** `output/20260224-213637-9b7d/infographics/`
- **이미지:** `output/20260224-213637-9b7d/images/`
- **에셋 매니페스트:** `output/20260224-213637-9b7d/asset-manifest.json`
- **HTML 슬라이드:** `output/20260224-213637-9b7d/slides/`
- **최종 PPTX:** `output/20260224-213637-9b7d/final.pptx`
- **QA 리포트:** `output/20260224-213637-9b7d/qa-report.json`
- **사용자 에셋:** `output/20260224-213637-9b7d/user-assets/` (캡쳐 이미지 3장)

## 작업 목록

```json
[
  {
    "id": 1,
    "category": "research",
    "description": "자료조사 - lecture-spec.json의 dataRequirements를 웹 검색으로 검증하고 research-report.json 생성",
    "steps": [
      "output/20260224-213637-9b7d/lecture-spec.json 파일을 읽어 모든 slides[].dataRequirements를 추출한다",
      "각 claim에 대해 WebSearch로 검색하고 WebFetch로 원본 확인한다",
      "슬라이드3: Claude Code/오픈클로 관련 최신 뉴스 및 트렌드 검색",
      "슬라이드4: 미국 로펌 주니어 변호사 채용 축소 뉴스, 서초동 막변 현상 검색",
      "슬라이드5: AI 특이점/대격변 관련 유명 인사 인용구 검색",
      "슬라이드11: AI 시대 대면 신뢰 가치 관련 연구/트렌드 검색",
      "각 데이터에 출처 URL, 발행일, 접근일, 신뢰도를 기록한다",
      "최소 2개 출처로 교차검증하고 confidence 점수를 매긴다",
      "schemas/research-report.schema.json 형식에 맞게 output/20260224-213637-9b7d/research-report.json을 생성한다"
    ],
    "passes": false
  },
  {
    "id": 2,
    "category": "infographic",
    "description": "인포그래픽 생성 - lecture-spec.json과 research-report.json을 기반으로 차트/인포그래픽 PNG 생성",
    "steps": [
      "output/20260224-213637-9b7d/lecture-spec.json에서 infographicNeeded: true인 슬라이드를 확인한다 (슬라이드 4, 9, 11)",
      "research-report.json의 검증된 데이터로 infographicData를 보강한다",
      "node scripts/generate_infographic.cjs --input output/20260224-213637-9b7d/lecture-spec.json --output-dir output/20260224-213637-9b7d/infographics --manifest output/20260224-213637-9b7d/asset-manifest.json 실행",
      "생성된 PNG 파일들이 output/20260224-213637-9b7d/infographics/에 존재하는지 확인한다",
      "asset-manifest.json이 올바르게 생성되었는지 확인한다"
    ],
    "passes": false
  },
  {
    "id": 3,
    "category": "image-generation",
    "description": "이미지 생성 - lecture-spec.json의 imageNeeded 슬라이드에 대해 배경 이미지 생성",
    "steps": [
      "output/20260224-213637-9b7d/lecture-spec.json에서 imageNeeded: true인 슬라이드를 확인한다 (슬라이드 3)",
      "GEMINI_API_KEY 환경변수가 설정되어 있는지 확인한다",
      "API키가 있으면: node scripts/generate_images.cjs --input output/20260224-213637-9b7d/lecture-spec.json --output-dir output/20260224-213637-9b7d/images --manifest output/20260224-213637-9b7d/asset-manifest.json 실행",
      "API키가 없으면: Sharp로 그래디언트 폴백 이미지를 직접 생성한다 (node -e로 Sharp 사용하여 960x540 다크 그래디언트 PNG 생성)",
      "생성된 이미지가 output/20260224-213637-9b7d/images/에 존재하는지 확인한다",
      "asset-manifest.json을 업데이트한다"
    ],
    "passes": false
  },
  {
    "id": 4,
    "category": "assembly",
    "description": "최종 조립 - 모든 에셋을 통합하여 12개 HTML 슬라이드와 PPTX 파일을 생성",
    "steps": [
      "output/20260224-213637-9b7d/의 lecture-spec.json, research-report.json, asset-manifest.json을 읽는다",
      "user-assets/ 폴더의 캡쳐 이미지 3장도 확인한다",
      ".claude/skills/design-skill/SKILL.md의 디자인 규칙과 템플릿을 참고한다",
      "각 슬라이드를 HTML로 생성한다 (720pt x 405pt, Pretendard 폰트 CDN 포함)",
      "슬라이드 7,8은 사용자 캡쳐 이미지를 <img> 태그로 임베드한다",
      "인포그래픽 PNG를 해당 슬라이드에 <img> 태그로 임베드한다",
      "생성된 이미지를 해당 슬라이드에 <img> 태그로 임베드한다",
      "모든 텍스트를 p/h1-h6/ul/ol 태그 안에 넣는다 (div/span 직접 텍스트 금지)",
      "CSS 그래디언트 사용하지 않는다",
      "output/20260224-213637-9b7d/slides/ 디렉토리에 slide-01.html ~ slide-12.html 저장",
      "node build_pptx.cjs --slides-dir output/20260224-213637-9b7d/slides --output output/20260224-213637-9b7d/final.pptx --title 'AI시대, 결국 남는 것' 실행하여 PPTX 변환",
      "final.pptx 파일이 생성되었는지 확인한다"
    ],
    "passes": false
  },
  {
    "id": 5,
    "category": "qa",
    "description": "품질검수 - HTML 슬라이드의 디자인 규칙 준수 여부 검증 및 수정",
    "steps": [
      "node scripts/qa_validate.cjs --slides-dir output/20260224-213637-9b7d/slides --spec output/20260224-213637-9b7d/lecture-spec.json --output output/20260224-213637-9b7d/qa-report.json 실행",
      "qa-report.json을 읽고 overallPass 여부를 확인한다",
      "실패한 슬라이드가 있으면 issues[]의 fix 지시를 따라 HTML을 수정한다",
      "주요 체크항목: 슬라이드 치수(720pt x 405pt), 이미지 경로 존재, CSS 그래디언트 금지, 텍스트 태그 규칙, 폰트 승인 목록",
      "수정 후 qa_validate.cjs를 다시 실행하여 재검증한다",
      "overallPass: true가 될 때까지 반복한다 (최대 3회)",
      "수정 후 build_pptx.cjs를 다시 실행하여 최종 PPTX를 재생성한다"
    ],
    "passes": false
  }
]
```
