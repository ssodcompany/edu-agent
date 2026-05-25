# BNI v10 Design Spec — Monochrome Punch Reset

**날짜**: 2026-05-25 · **단계**: brainstorming SHIP (design approved) · **다음**: writing-plans
**컨텍스트**: v9.1 (27장 Claude DESIGN.md cream+coral) → 사용자 진단 "디자인·메시지 일관성 없음, 무슨 말 하는지 모르겠음" → 백지 reset

---

## Core Thesis (단일, 모든 슬라이드 수렴)

> **"AI 시대엔 SoR/SoE/SoI 설계 + AI 씌우는 일이 필요한데 — 7년·이중 앰버서더·상장사 경험으로 쏘드만이 한다."**

v9.1의 분산된 4개 thesis (구조없음AI없음 · 한국형FDE · DX/AX전담 · 듀얼모델) → v10 단일 thesis 톤.

## Audience Promise (s2 인트로)

청중이 발표 끝났을 때 챙겨갈 2가지:
1. **SSOD는 무엇을 하는가?** ← 본문 s3~s10이 답함
2. **우리 회사는?** ← 본문 s11이 던짐 (cliff hanger, CTA 0)

## Closing 방식

**침묵 cliff hanger.** "그래서 — 우리 회사는?" + 1초 침묵 → 김지명 작게 + 끝. referral 부탁 명시 X, 매칭 라우팅 X, 방향성 announcement X. 청중 자기진단으로 마무리.

⚠️ **BNI 평등 문화 톤 룰 (CTA 명시 금지) 일치, 단 자랑 톤 risk 있음 — 사용자 결정 우선**

---

## 12-슬라이드 골격

| # | 화면 | 발화 톤 |
|---|---|---|
| s1 | "회사의 일하는 구조" + SSOD + 김지명 | 인사 + 본인 소개 |
| s2 | "오늘 가져가실 2가지<br/>① SSOD는 무엇을 하는가?<br/>② 우리 회사는?" | 발표 promise |
| s3 | "7년" | B2B 컨설팅 7년 — Notion·n8n·Claude로 |
| s4 | "둘 다" + Notion·n8n 배지 | 글로벌 공식 앰버서더 둘 다 — 한국에 쏘드뿐 |
| s5 | "3 → 상장사" | 직원 3명 사무실부터 상장사까지 |
| s6 | "DX · AX" | 쏘드가 하는 일 — Digital Transformation · AI Transformation |
| s7 | "SoR — 데이터" | DX·AX의 본질 셋. 첫째 — 회사에 적힌 사실 (ERP·고객 명단·매출) |
| s8 | "SoE — 일" | 둘째 — 사람이 일하는 공간 (카톡·노션·결재) |
| s9 | "SoI — 판단" | 셋째 — 결정이 내려지는 자리 (사장님·대시보드·AI) |
| s10 | "+ AI" | 그 위에 AI 씌움 — 구조 없으면 AI도 못 들어와요 |
| s11 | "우리 회사는?" + 체크박스 SoR ☐ SoE ☐ SoI ☐ | 1초 침묵 — 청중 자기진단 |
| s12 | 검정 빈 + 작게 "SSOD · 김지명" | 감사합니다 |

**총 12장.** 발화 풍부, 화면 단어·숫자만.

---

## 디자인 토큰 — Monochrome Punch

- **캔버스**: 순흑 `#000000`
- **텍스트 primary**: 흰색 `#FFFFFF`
- **텍스트 secondary**: 회색 `#666666`
- **색 0개** — 액센트 컬러 없음. Notion·n8n 배지(s4)만 원래 색 유지, 나머지 monochrome
- **타이포**: Pretendard Black (큰 punch 1~2 단어 중앙) + Pretendard Light (보조 회색)
- **레이아웃**: 모든 슬라이드 동일 grid — 큰 키워드 중앙, 4-corner brandlogy(slide no · SSOD wordmark) 일관
- **여백**: 슬라이드 70%+ 빈 공간
- **1 슬라이드 = 1 idea** 엄격 준수

## 발화 톤 가이드

- 한국어, 종결어미 다양화 (~합니다 / ~죠 / ~예요 / ~겠습니다 / 의문문 혼합)
- 영문 약어 (SoR/SoE/SoI/DX/AX)는 처음 등장 시 한국어 풀이 즉시 ("SoR — 데이터")
- "아무나 못합니다" 같은 자랑 톤 제거됨 (사용자 결정 2026-05-25)
- 청중 직접 호명 ("여러분 회사는") — 자기진단 유도
- 권위 톤은 화면 키워드·자격 자체로, 발화는 진단 톤

## NDA·BNI 톤 노트

- s5 "3 → 상장사" — "수천억 코스닥" 단수 식별 회피, "상장사" 복수 카테고리
- 청중 자기진단 cliff hanger — referral 매칭은 청중 자율
- 발표일: 2026-05-27 수요일 (사용자 자율 시간 조정)

---

## v10 vs v9.1 변경 요약

| 축 | v9.1 | v10 |
|---|---|---|
| Thesis 개수 | 4개 분산 | 1개 단일 |
| 슬라이드 개수 | 27장 | 12장 |
| 디자인 톤 | Claude DESIGN.md (cream+coral editorial) | Monochrome punch (검정+흰색 only) |
| 화면 텍스트 | 정의·통찰 카드 풍부 (4~6줄 본문) | 단어·숫자 1~2개 only |
| Closing | referral + 듀얼 모델 + 매칭 라우팅 | 자기진단 침묵 cliff hanger |
| 톤 | 진단 + 차별화 + 사업 announcement 혼합 | 자격·권위·자기진단 단일 톤 |

---

## 다음 단계 (writing-plans)

1. python-pptx 빌더 재작성 — `build_v10_pptx.py` (monochrome 토큰, 12장)
2. 발화 대본 — `script-v10.md` (12 비트 발화 멘트 풀이)
3. 시각 검증 — 사용자 PPT 열어 직접 확인
4. 발표 1~2일 전 리허설 권장

---

## 사용자 결정 박제 (2026-05-25 결혼식 후 reset 세션)

1. **백지 reset** — v9.1 폐기, reference로만 유지 (git 박제됨)
2. **단일 thesis** — 자격·차별화·자기진단 한 줄기
3. **7번 closing 침묵 cliff hanger** — CTA 0, 자기진단으로 닫음
4. **모노톤 punch** — 검정 + 흰색 only, 1 액센트 색 0개
5. **글 최소화** — 화면엔 키워드 1~2개만, 설명은 100% 발화
6. **s5 분해** — SoR/SoE/SoI 각각 1장씩 (어려운 개념)
7. **s2 인트로 promise** — "오늘 가져가실 2가지" 명시
8. **s6 DX·AX 본업 정의** — SoR/SoE/SoI 도입 transition
9. **s7 "아무나 못합니다" 제거** — 자랑 톤 risk 해소

Status: **design approved · spec written** — 다음은 writing-plans 가동.
