# BNI W22 — claude.ai Projects 백업 패키지

## 무엇인가요?

페이퍼로즈 SOP를 따라 claude.ai의 **Projects 기능**에서 BNI 발표 PPT를 다시 만들 수 있는 1턴 패키지.

**왜 백업?** Claude Code 메인 트랙으로 이미 `BNI_SoR_v_final_9_1.pptx` (27장 native PPTX) 만들어 둠. 이 패키지는:
- v9.1 PPTX 톤이 마음에 안 들면 claude.ai에서 처음부터 다시 생성
- Excel-linked 차트가 필요해지면 claude.ai에서 추가
- 향후 BNI 04·05 강의 시리즈·SSOD 외부 세미나에 재사용

## 사용 흐름 (5분)

1. **claude.ai → Projects → New Project** 생성. 이름: `SSOD-PPT-Claude-Tone` (또는 즐겨찾기 고정)
2. **Instructions 칸**: 이 폴더의 `instructions.txt` 통째 붙여넣기
3. **Knowledge 칸**: `knowledge-list.md` 참고해서 자료 업로드
4. **새 채팅 시작** + `request-template.md`의 요청 1턴 던지기

## 파일 구성

| 파일 | 용도 |
|---|---|
| `instructions.txt` | SSOD-PPT Project Instructions (영문 master prompt) |
| `knowledge-list.md` | Knowledge 칸에 올릴 자료 목록 + 절대경로 |
| `request-template.md` | 채팅 1턴 요청 템플릿 (BNI 발표용) |

## 영문/한글 분리 룰

페이퍼로즈 SOP 권장: **디자인 시스템 프롬프트 본체는 영문**, 슬라이드 카피와 사용자 대화는 **한국어**.

- `instructions.txt`: 영문 (Claude가 디테일 잘 받음)
- `request-template.md`: 한국어 (당신이 자연스럽게 던지는 톤)

## 백업 트랙이 메인 트랙보다 나은 경우

- **차트가 필요**할 때 — Gartner stats(40%·15%·40%·Deloitte 53%·MCP 970배)나 추가 정량 anchor를 Excel-linked 막대·선·도넛으로 시각화하고 싶으면 claude.ai로
- **톤 톤탐색** — v9.1 Claude 톤이 아닌 다른 브랜드 톤(stripe·linear·notion·minimax 등) 보고 싶을 때
- **재사용** — BNI 04·05 강의나 외부 세미나에 같은 디자인 시스템 가져갈 때

## 패키지 만든 사람

Claude (Opus 4.7, 1M context) — 사용자 결혼식 5시간 자율 모드 (2026-05-25)
원본 v9.1 산출물: `/Users/kimjimyoung/Documents/projects/bni-edu/ppt_team_agent/lectures/03_sor_framework/`
