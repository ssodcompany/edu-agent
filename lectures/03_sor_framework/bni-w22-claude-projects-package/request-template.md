# claude.ai 채팅 요청 템플릿 — BNI W22 발표용

## 1턴 요청 (백업 트랙 재생성용)

claude.ai의 `SSOD-PPT-Claude-Tone` Project에서 새 채팅 열고 아래 그대로 붙여넣기.

---

### 요청 본문 (한국어)

```
첨부한 script-v_final.md (v9.1차)를 SSOD 디자인 시스템(Claude tone)으로
PPT를 만들어줘. 16:9, 27장, Pretendard, native shape·텍스트로.

발표 컨텍스트:
- BNI K-Chapter Feature Presentation, 수요일 발표
- 청중: 자영업·전문직 50명, AI 들었지만 시스템 프레임은 처음
- 목적: 자연 referral + SSOD 방향성(상주 + 듀얼 모델) 사전 노출
- 분량 envelope 제약 없음 (사용자가 현장에서 자율 조정)

발표 구조 (대본의 비트 ↔ deck slide 매핑 표 참고):
- ① 자기소개 (s1~s5, 5장)
- ② 오프닝 훅 (s6, 1장)
- ③ SoR/SoE/SoI 진단 (s7~s12, 6장)
- ③.3 AI 시대 3축 연결 thesis (s13, 1장)
- ③.5 SSOD reveal + 매핑 (s14·s15, 2장)
- ③.7 photo wall (s16, 1장)
- ④ slogan + BEFORE/AFTER 사례 (s17·s18, 2장)
- ⑤ AI 본질 + 팔란티어 모델 + 한국에선 쏘드가 (s19·s20·s21, 3장)
- ⑤.7 도구 (s22·s23·s24, 3장)
- ⑥ 클로징 thesis + 어느 회사든 두 길 + referral (s25·s26·s27, 3장)

특별 요구:
- Gartner stats (40% · 15% · 40% · Deloitte 53% · MCP 970배)를
  Excel-linked native chart로 시각화 (옵션, ⑤.3 또는 ⑥ 진입 직전 추가)
- s14 SSOD 4-letter punch는 D 글자만 coral, 나머지 ink
- s4 이중 앰버서더는 단독 punch 슬라이드, 1초 호흡 cue
- coral은 thesis 슬라이드(s14·s17·s19·s20·s25·s26·s27)에만 voltage
- 사진 placeholder 5개 유지 (s3 logo wall 1개 + s16 photo wall 4개)

업로드한 파일:
- script-v_final.md (대본 + 비트 매핑표)
- BNI_SoR_v_final_9_1.pptx (이전 native 출력물, 톤 reference)
- ssod-logo.svg, notion-ambassador-badge.png, n8n_full_black_logo.svg,
  claude-logo.png, microsoft-excel-new.png
- Pretendard 폰트

native PPTX로 출력해줘. 파일명은 BNI_SoR_v_final_9_2_claude.pptx로.
```

---

## 옵션 — Excel-linked 차트만 추가하고 싶을 때

```
첨부한 BNI_SoR_v_final_9_1.pptx에 Excel-linked 차트 5개만 추가해줘:

1. s13 (AI 시대 3축 연결) — Gartner AI 에이전트 40% 도넛 차트
2. s19 (AI 본질) — Deloitte +53% 막대 (digital integrated companies)
3. ⑤.3 직전 신규 슬라이드 — MCP SDK 다운로드 970배 성장 라인 차트
4. s25 (closing thesis) — 한국 enterprise AI 채택 추세 (Gartner 2026~2028)
5. s26 (dual path) — DX/AX 시장 segment 파이 차트

차트는 native Excel link, 더블클릭으로 수치 수정 가능하게.
디자인은 coral · ink · canvas 톤 유지.
```

---

## 옵션 — 톤 탐색 (다른 브랜드 디자인 시스템)

다른 톤을 시험하고 싶으면 `instructions.txt`의 Design System 섹션을
교체. 추천 톤 후보:

| 톤 | 분위기 | 적합한 컨텍스트 |
|---|---|---|
| `stripe` | 절제 · 그라데이션 · saturated | SaaS·핀테크 청중 |
| `linear.app` | 미니멀 · 어두운 · 정확 | 개발자·테크 청중 |
| `notion` | 캐주얼 · sticky-note · warm | 일반 비즈니스 |
| `claude` (현재) | warm-editorial · cream + coral | BNI·SSOD 정본 |
| `minimax` | 컬러풀 · playful · 대비 | 캠페인·이벤트 |

awesome-design-md 로컬 미러: `~/Documents/projects/tools/awesome-design-md/design-md/<brand>/DESIGN.md`

## 옵션 — 1장 미세조정 루프 (페이퍼로즈 SOP §3)

특정 슬라이드 톤만 바꾸고 싶을 때:

```
첨부한 두 슬라이드 비교해줘:
- Slide 1 (PAGE 1): 현재 출력
- Slide 2 (PAGE 2): 내가 손으로 수정한 결과

PAGE 2를 source of truth로 보고, 둘의 diff를 분석해서
master prompt를 업데이트해줘. PAGE 1이 아닌 PAGE 2처럼 나오게.

전체 업데이트된 영문 master prompt를 다시 한 번 통째로 줘.
Project Instructions에 그대로 붙여넣게.
```

---

## 발표 당일 즉석 fix 옵션 (시간 단축)

발표 당일 envelope 초과 위험 시 즉석 컷 우선순위:
1. ④ "두 회사를 섞었습니다" 변명 -5초
2. ③.5 SSOD 매핑(s15) 압축 -15초
3. ⑤.5 한국에선 쏘드가(s21) "회사를 옆에서 짓는 일" 한 줄 압축 -10초

총 -30초 확보 가능.
