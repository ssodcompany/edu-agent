---
description: 강의 PPT 생성 파이프라인 - 대화부터 최종 PPTX까지 자동화
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - WebSearch
  - WebFetch
  - Task
---

# 강의 PPT 생성 파이프라인

$ARGUMENTS 주제로 강의 PPT를 생성하는 6단계 에이전트 파이프라인을 실행합니다.

## 파이프라인 개요

```
[1.강의기획] → [2.자료조사] → [3.인포그래픽] + [5.이미지생성] (병렬) → [6.최종조립] → [4.품질검수] → 완성
```

## 실행 절차

### Step 0: 초기화
```bash
node scripts/orchestrate.cjs init --topic "$ARGUMENTS"
```
생성된 `run-id`를 기록합니다. 이후 모든 파일은 `output/{run-id}/` 아래에 저장됩니다.

### Step 1: 강의기획 (lecture-script-agent)
`lecture-script-agent`를 실행하여 사용자와 인터뷰를 진행합니다.
- 사용자에게 주제, 청중, 시간, 목적, 톤 등을 질문
- 스토리라인 프레임워크를 제안하고 확인
- `output/{run-id}/lecture-spec.json` 생성

```
Task(subagent_type="lecture-script-agent", prompt="run-id: {run-id}로 강의 기획을 진행하세요. 주제: $ARGUMENTS")
```

### Step 2: 자료조사 (research-agent)
`research-agent`를 실행하여 데이터 검증을 수행합니다.
- lecture-spec.json의 dataRequirements 처리
- 2-3개 출처 교차검증
- `output/{run-id}/research-report.json` 생성

```
Task(subagent_type="research-agent", prompt="output/{run-id}/lecture-spec.json을 읽고 모든 데이터 요구사항을 조사하세요. 결과를 output/{run-id}/research-report.json에 저장하세요.")
```

### Step 3+5: 인포그래픽 + 이미지 생성 (병렬)
두 에이전트를 **동시에** 실행합니다:

**인포그래픽 (infographic-agent)**:
```
Task(subagent_type="infographic-agent", prompt="output/{run-id}/의 lecture-spec.json과 research-report.json을 읽고 인포그래픽을 생성하세요.", run_in_background=true)
```

**이미지 생성 (image-gen-agent)**:
```
Task(subagent_type="image-gen-agent", prompt="output/{run-id}/의 lecture-spec.json을 읽고 배경 이미지를 생성하세요.", run_in_background=true)
```

두 에이전트가 모두 완료될 때까지 대기합니다.

### Step 6: 최종조립 (assembly-agent)
모든 에셋을 통합하여 HTML 슬라이드와 PPTX를 생성합니다.
```
Task(subagent_type="assembly-agent", prompt="output/{run-id}/의 모든 자료를 통합하여 HTML 슬라이드를 생성하고 PPTX로 변환하세요.")
```

### Step 4: 품질검수 (qa-review-agent)
최종 결과물을 검증합니다.
```
Task(subagent_type="qa-review-agent", prompt="output/{run-id}/slides/의 HTML 슬라이드를 검수하세요. lecture-spec: output/{run-id}/lecture-spec.json")
```

QA 결과가 실패이면:
1. qa-report.json의 수정 지시를 assembly-agent에 전달
2. assembly-agent가 수정
3. qa-review-agent가 재검수
4. 최대 3회 반복

### 완료
```
강의 PPT 생성 완료!
output/{run-id}/final.pptx
```

## 에러 처리

| 단계 실패 | 대응 |
|-----------|------|
| 강의기획 | 사용자에게 재시도 요청 |
| 자료조사 | 2회 재시도 -> "[검증 필요]" 마커로 진행 |
| 인포그래픽 | 텍스트 기반 대체 |
| 이미지생성 | Sharp 그래디언트 폴백 |
| 최종조립 | 1회 재시도 -> 부분 HTML 출력 |
| 품질검수 | 3회 한도 -> 현 상태로 출력 |
