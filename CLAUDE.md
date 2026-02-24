# edu-agent: 멀티 에이전트 강의 PPT 생성 시스템

## 자동 트리거 규칙

사용자가 다음과 같은 요청을 하면 **즉시 강의 PPT 생성 파이프라인을 실행**하세요:
- "강의 만들어줘", "PPT 만들어줘", "프레젠테이션 만들어줘"
- "~에 대한 강의", "~주제로 발표자료"
- "슬라이드 만들어줘", "발표 준비해줘"
- 기타 강의/PPT/프레젠테이션 생성 의도가 명확한 요청

주제가 명시되어 있으면 바로 실행하고, 없으면 주제만 물어본 뒤 시작하세요.

## 파이프라인 (6단계)

```
[1.강의기획] → [2.자료조사] → [3.인포그래픽 + 5.이미지생성] (병렬) → [6.최종조립] → [4.품질검수]
```

### 실행 방법

1. **초기화**: `node scripts/orchestrate.cjs init --topic "주제"`로 run-id 생성
2. **강의기획**: `Task(subagent_type="lecture-script-agent")` — 사용자 인터뷰 → `lecture-spec.json`
3. **자료조사**: `Task(subagent_type="research-agent")` — 데이터 교차검증 → `research-report.json`
4. **인포그래픽 + 이미지**: 두 에이전트 병렬 실행
   - `Task(subagent_type="infographic-agent", run_in_background=true)`
   - `Task(subagent_type="image-gen-agent", run_in_background=true)`
5. **최종조립**: `Task(subagent_type="assembly-agent")` — HTML 슬라이드 + PPTX 생성
6. **품질검수**: `Task(subagent_type="qa-review-agent")` — 실패 시 최대 3회 수정 루프

모든 결과물은 `output/{run-id}/`에 저장됩니다.

## 에러 처리

| 단계 | 대응 |
|------|------|
| 강의기획 실패 | 사용자에게 재시도 요청 |
| 자료조사 실패 | 2회 재시도 → "[검증 필요]" 마커로 진행 |
| 인포그래픽 실패 | 텍스트 기반 대체 |
| 이미지생성 실패 | Sharp 그래디언트 폴백 |
| 최종조립 실패 | 1회 재시도 → 부분 HTML 출력 |
| 품질검수 실패 | 3회 한도 → 현 상태로 출력 |

## 프로젝트 구조

```
.claude/agents/          # 6개 에이전트 정의
scripts/                 # 4개 실행 스크립트
schemas/                 # 4개 JSON 스키마
output/{run-id}/         # 실행 결과물
```

## 디자인 규칙

- 슬라이드 크기: 720pt × 405pt (16:9)
- 기본 폰트: Pretendard
- CSS 그래디언트 금지 (PPTX 변환 비호환)
- 텍스트는 반드시 p/h1-h6/ul/ol 태그 안에
- design-skill의 템플릿과 색상 팔레트 시스템 준수
