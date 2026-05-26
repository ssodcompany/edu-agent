# BNI v10 PPT Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** v10 design spec(검정+흰색 monochrome punch, 12장, 단일 thesis)을 그대로 PPT로 떨어뜨리는 python-pptx 빌더를 신규 백지로 작성. 출력은 `BNI_SoR_v10.pptx`.

**Architecture:** 단일 파일 `build_v10_pptx.py` (~400줄). 상단 = 토큰/헬퍼, 하단 = 12개 슬라이드 빌더 함수, main()에서 순차 호출 후 save. v9 빌더(1,700줄 cream+coral)는 참조하지 않음 — 12장 × 단어 1~2개 구조라 공통 패턴이 거의 없음.

**Tech Stack:** python-pptx, Pretendard Black/Light(시스템 폰트), 16:9 (13.333 × 7.5 인치 = 1280×720), assets/ 로컬 이미지(Notion·n8n 배지).

---

## File Structure

- **Create:** `bni-edu/ppt_team_agent/lectures/03_sor_framework/build_v10_pptx.py`
- **Output:** `bni-edu/ppt_team_agent/lectures/03_sor_framework/BNI_SoR_v10.pptx`
- **Assets (read-only):**
  - `assets/notion-ambassador-badge.png` (s4)
  - `assets/n8n-amber-ssod-black.png` (s4)
  - `assets/ssod-logo-mono.svg` → 미리 PNG 변환 필요 시 텍스트 wordmark로 대체

## 12-슬라이드 매핑 (spec 그대로)

| # | 화면 punch | 보조 |
|---|---|---|
| s1 | "회사의 일하는 구조" (Pretendard Black 96pt, 흰색, 중앙) | 하단 작게 "SSOD · 김지명" |
| s2 | "오늘 가져가실 2가지" (헤드라인) | ① SSOD는 무엇을 하는가? / ② 우리 회사는? |
| s3 | "7년" (Pretendard Black 240pt 메가) | 하단 "B2B 컨설팅" 회색 작게 |
| s4 | "둘 다" (Pretendard Black 160pt) | Notion·n8n 배지 가로 정렬 + "한국에 쏘드뿐" |
| s5 | "3 → 상장사" (Pretendard Black 140pt) | 화살표 "→" 회색, 양옆 흰색 |
| s6 | "DX · AX" (Pretendard Black 200pt) | 하단 "Digital · AI Transformation" 회색 |
| s7 | "SoR — 데이터" (Pretendard Black 140pt) | 상단 회색 SoR / 하단 "ERP · 고객 명단 · 매출" |
| s8 | "SoE — 일" (동일 패턴) | "카톡 · 노션 · 결재" |
| s9 | "SoI — 판단" (동일 패턴) | "사장님 · 대시보드 · AI" |
| s10 | "+ AI" (Pretendard Black 240pt) | 하단 "그 위에" 회색 |
| s11 | "우리 회사는?" (Pretendard Black 120pt) | 체크박스 3줄 "☐ SoR  ☐ SoE  ☐ SoI" 큰 회색 |
| s12 | (빈 검정) | 하단 우측 "SSOD · 김지명" 흰색 16pt |

**4-corner brandlogy (s1·s11·s12 제외 본문 9장 공통):**
- 좌상: slide no "NN/12" (회색 14pt mono)
- 우하: "SSOD" 워드마크 (흰색 14pt)

## 디자인 토큰

```python
CANVAS_W = Inches(13.333)
CANVAS_H = Inches(7.5)
BG_BLACK = RGBColor(0x00, 0x00, 0x00)
INK_WHITE = RGBColor(0xFF, 0xFF, 0xFF)
MUTED_GRAY = RGBColor(0x66, 0x66, 0x66)
FONT_BLACK = "Pretendard Black"
FONT_LIGHT = "Pretendard Light"
FONT_MONO = "SF Mono"  # slide no용
ASSETS = Path(__file__).parent / "assets"
```

---

### Task 1: 빌더 skeleton + 토큰 + 헬퍼

**Files:**
- Create: `bni-edu/ppt_team_agent/lectures/03_sor_framework/build_v10_pptx.py`

- [ ] **Step 1: 빈 파일 생성 + imports + 토큰 상수**

```python
"""BNI v10 PPT builder — Monochrome Punch (12 slides, 검정+흰색 only).

Spec: design-v10-spec.md (2026-05-25 SHIP).
Run: python build_v10_pptx.py
Output: BNI_SoR_v10.pptx (16:9, 1280x720)
"""
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Inches, Pt, Emu

ROOT = Path(__file__).parent
ASSETS = ROOT / "assets"
OUTPUT = ROOT / "BNI_SoR_v10.pptx"

CANVAS_W = Inches(13.333)
CANVAS_H = Inches(7.5)
BG_BLACK = RGBColor(0x00, 0x00, 0x00)
INK_WHITE = RGBColor(0xFF, 0xFF, 0xFF)
MUTED_GRAY = RGBColor(0x66, 0x66, 0x66)
FONT_BLACK = "Pretendard Black"
FONT_LIGHT = "Pretendard Light"
FONT_MONO = "SF Mono"
```

- [ ] **Step 2: 헬퍼 — 검정 캔버스 슬라이드 추가**

```python
def add_black_slide(prs: Presentation):
    """16:9 빈 슬라이드 + 검정 배경."""
    blank_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(blank_layout)
    bg = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, 0, 0, CANVAS_W, CANVAS_H
    )
    bg.fill.solid()
    bg.fill.fore_color.rgb = BG_BLACK
    bg.line.fill.background()
    return slide
```

- [ ] **Step 3: 헬퍼 — 중앙 punch 텍스트**

```python
def add_punch_text(
    slide,
    text: str,
    font_size_pt: int,
    *,
    font_name: str = FONT_BLACK,
    color: RGBColor = INK_WHITE,
    top_inches: float = 2.8,
    height_inches: float = 2.0,
    letter_spacing_pt: float = -2.0,
):
    """슬라이드 중앙 가로 정렬 한 줄 텍스트."""
    tb = slide.shapes.add_textbox(
        Inches(0), Inches(top_inches), CANVAS_W, Inches(height_inches)
    )
    tf = tb.text_frame
    tf.margin_left = tf.margin_right = 0
    tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = text
    run.font.name = font_name
    run.font.size = Pt(font_size_pt)
    run.font.color.rgb = color
    return tb
```

- [ ] **Step 4: 헬퍼 — 4-corner brandlogy**

```python
def add_brandlogy(slide, slide_no: int):
    """좌상 slide no + 우하 SSOD 워드마크."""
    # 좌상: NN/12
    tl = slide.shapes.add_textbox(Inches(0.4), Inches(0.3), Inches(1.0), Inches(0.3))
    p = tl.text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.LEFT
    r = p.add_run()
    r.text = f"{slide_no:02d}/12"
    r.font.name = FONT_MONO
    r.font.size = Pt(11)
    r.font.color.rgb = MUTED_GRAY

    # 우하: SSOD
    br = slide.shapes.add_textbox(
        Inches(11.5), Inches(6.95), Inches(1.5), Inches(0.3)
    )
    p = br.text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.RIGHT
    r = p.add_run()
    r.text = "SSOD"
    r.font.name = FONT_BLACK
    r.font.size = Pt(11)
    r.font.color.rgb = INK_WHITE
```

- [ ] **Step 5: 헬퍼 — 보조 텍스트 (회색 캡션)**

```python
def add_caption(
    slide,
    text: str,
    *,
    top_inches: float = 5.6,
    font_size_pt: int = 18,
    color: RGBColor = MUTED_GRAY,
    align=PP_ALIGN.CENTER,
):
    tb = slide.shapes.add_textbox(
        Inches(0), Inches(top_inches), CANVAS_W, Inches(0.5)
    )
    p = tb.text_frame.paragraphs[0]
    p.alignment = align
    r = p.add_run()
    r.text = text
    r.font.name = FONT_LIGHT
    r.font.size = Pt(font_size_pt)
    r.font.color.rgb = color
    return tb
```

- [ ] **Step 6: main() skeleton + 빈 12장 생성 smoke test**

```python
def main():
    prs = Presentation()
    prs.slide_width = CANVAS_W
    prs.slide_height = CANVAS_H

    for i in range(1, 13):
        slide = add_black_slide(prs)
        if 2 <= i <= 10:  # 본문만 brandlogy
            add_brandlogy(slide, i)

    prs.save(OUTPUT)
    print(f"saved → {OUTPUT}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 7: 실행 검증**

Run: `cd ~/Documents/projects/bni-edu/ppt_team_agent/lectures/03_sor_framework && python build_v10_pptx.py`
Expected: `saved → .../BNI_SoR_v10.pptx`. 파일 열어보면 검정 12장, 본문 9장 좌상 `02/12`~`10/12` 우하 `SSOD`.

- [ ] **Step 8: Commit**

```bash
cd ~/Documents/projects/bni-edu/ppt_team_agent
git add lectures/03_sor_framework/build_v10_pptx.py lectures/03_sor_framework/BNI_SoR_v10.pptx
git commit -m "feat(bni-v10): scaffold monochrome builder — 12 blank slides + brandlogy helper"
```

---

### Task 2: s1 표지 + s2 promise + s11 cliff + s12 검정 (4-corner anchor)

**Files:**
- Modify: `build_v10_pptx.py` (slide builder 함수 4개 추가, main() 호출 교체)

- [ ] **Step 1: s1 표지 빌더**

```python
def build_s1_cover(prs):
    slide = add_black_slide(prs)
    add_punch_text(slide, "회사의 일하는 구조", 84, top_inches=2.9, height_inches=1.5)
    add_caption(slide, "SSOD · 김지명", top_inches=4.6, font_size_pt=20, color=INK_WHITE)
```

- [ ] **Step 2: s2 promise 빌더 (2줄)**

```python
def build_s2_promise(prs):
    slide = add_black_slide(prs)
    add_brandlogy(slide, 2)
    add_punch_text(slide, "오늘 가져가실 2가지", 56, top_inches=1.6, height_inches=0.9)

    # 2 lines
    tb = slide.shapes.add_textbox(Inches(0), Inches(3.3), CANVAS_W, Inches(3.0))
    tf = tb.text_frame
    tf.margin_left = tf.margin_right = 0
    tf.vertical_anchor = MSO_ANCHOR.TOP

    lines = [
        ("①  SSOD는 무엇을 하는가?", INK_WHITE),
        ("②  우리 회사는?", INK_WHITE),
    ]
    for idx, (text, color) in enumerate(lines):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.CENTER
        p.space_after = Pt(28)
        r = p.add_run()
        r.text = text
        r.font.name = FONT_LIGHT
        r.font.size = Pt(40)
        r.font.color.rgb = color
```

- [ ] **Step 3: s11 우리회사 빌더 (체크박스 3줄)**

```python
def build_s11_self_audit(prs):
    slide = add_black_slide(prs)
    add_punch_text(slide, "우리 회사는?", 96, top_inches=1.5, height_inches=1.3)

    tb = slide.shapes.add_textbox(Inches(0), Inches(3.7), CANVAS_W, Inches(3.0))
    tf = tb.text_frame
    tf.vertical_anchor = MSO_ANCHOR.TOP

    items = ["☐  SoR — 데이터", "☐  SoE — 일", "☐  SoI — 판단"]
    for idx, text in enumerate(items):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.CENTER
        p.space_after = Pt(16)
        r = p.add_run()
        r.text = text
        r.font.name = FONT_LIGHT
        r.font.size = Pt(36)
        r.font.color.rgb = MUTED_GRAY
```

- [ ] **Step 4: s12 검정 클로징**

```python
def build_s12_close(prs):
    slide = add_black_slide(prs)
    tb = slide.shapes.add_textbox(
        Inches(10.5), Inches(6.85), Inches(2.5), Inches(0.4)
    )
    p = tb.text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.RIGHT
    r = p.add_run()
    r.text = "SSOD · 김지명"
    r.font.name = FONT_LIGHT
    r.font.size = Pt(14)
    r.font.color.rgb = INK_WHITE
```

- [ ] **Step 5: main() 교체 — 4개 빌더 호출 + 본문 5~10 빈 슬라이드 유지**

```python
def main():
    prs = Presentation()
    prs.slide_width = CANVAS_W
    prs.slide_height = CANVAS_H

    build_s1_cover(prs)
    build_s2_promise(prs)
    for i in range(3, 11):  # s3~s10 placeholder
        slide = add_black_slide(prs)
        add_brandlogy(slide, i)
    build_s11_self_audit(prs)
    build_s12_close(prs)

    prs.save(OUTPUT)
    print(f"saved → {OUTPUT}")
```

- [ ] **Step 6: 실행 + 시각 검증**

Run: `python build_v10_pptx.py`. PPT 열어 s1·s2·s11·s12 톤 확인. 자랑 톤 0, 빈 공간 70%+, 단어 1~2개 룰 OK.

- [ ] **Step 7: Commit**

```bash
git add lectures/03_sor_framework/build_v10_pptx.py lectures/03_sor_framework/BNI_SoR_v10.pptx
git commit -m "feat(bni-v10): add s1 cover, s2 promise, s11 self-audit, s12 close"
```

---

### Task 3: s3·s4·s5·s6 자격 punch 4장

**Files:**
- Modify: `build_v10_pptx.py` (s3~s6 함수 + main 교체)

- [ ] **Step 1: s3 "7년"**

```python
def build_s3_years(prs):
    slide = add_black_slide(prs)
    add_brandlogy(slide, 3)
    add_punch_text(slide, "7년", 240, top_inches=1.8, height_inches=3.5)
    add_caption(slide, "B2B 컨설팅", top_inches=5.4, font_size_pt=24)
```

- [ ] **Step 2: s4 "둘 다" + Notion·n8n 배지**

```python
def build_s4_dual_ambassador(prs):
    slide = add_black_slide(prs)
    add_brandlogy(slide, 4)
    add_punch_text(slide, "둘 다", 160, top_inches=1.4, height_inches=2.2)

    # 배지 2개 가로 정렬 (중앙 기준 좌우)
    badge_h = Inches(1.4)
    notion_path = ASSETS / "notion-ambassador-badge.png"
    n8n_path = ASSETS / "n8n-amber-ssod-black.png"

    if notion_path.exists():
        slide.shapes.add_picture(
            str(notion_path), Inches(4.3), Inches(4.4), height=badge_h
        )
    if n8n_path.exists():
        slide.shapes.add_picture(
            str(n8n_path), Inches(7.3), Inches(4.4), height=badge_h
        )

    add_caption(slide, "글로벌 공식 앰버서더 — 한국에 쏘드뿐", top_inches=6.2, font_size_pt=20)
```

- [ ] **Step 3: s5 "3 → 상장사"**

```python
def build_s5_scale(prs):
    slide = add_black_slide(prs)
    add_brandlogy(slide, 5)

    # 3 — → — 상장사 (한 줄 mixed color)
    tb = slide.shapes.add_textbox(Inches(0), Inches(2.8), CANVAS_W, Inches(2.0))
    tf = tb.text_frame
    tf.margin_left = tf.margin_right = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER

    def add_run(p, text, *, size, color, font=FONT_BLACK):
        r = p.add_run()
        r.text = text
        r.font.name = font
        r.font.size = Pt(size)
        r.font.color.rgb = color

    add_run(p, "3", size=160, color=INK_WHITE)
    add_run(p, "   →   ", size=120, color=MUTED_GRAY)
    add_run(p, "상장사", size=140, color=INK_WHITE)

    add_caption(slide, "직원 3명 사무실부터 상장사까지", top_inches=5.6, font_size_pt=20)
```

- [ ] **Step 4: s6 "DX · AX"**

```python
def build_s6_dx_ax(prs):
    slide = add_black_slide(prs)
    add_brandlogy(slide, 6)
    add_punch_text(slide, "DX · AX", 200, top_inches=2.2, height_inches=2.8)
    add_caption(
        slide,
        "Digital Transformation · AI Transformation",
        top_inches=5.4,
        font_size_pt=22,
    )
```

- [ ] **Step 5: main() — s3~s6 호출 교체**

```python
def main():
    prs = Presentation()
    prs.slide_width = CANVAS_W
    prs.slide_height = CANVAS_H

    build_s1_cover(prs)
    build_s2_promise(prs)
    build_s3_years(prs)
    build_s4_dual_ambassador(prs)
    build_s5_scale(prs)
    build_s6_dx_ax(prs)
    for i in range(7, 11):  # s7~s10 placeholder
        slide = add_black_slide(prs)
        add_brandlogy(slide, i)
    build_s11_self_audit(prs)
    build_s12_close(prs)

    prs.save(OUTPUT)
    print(f"saved → {OUTPUT}")
```

- [ ] **Step 6: 실행 + 시각 검증**

Run: `python build_v10_pptx.py`. s3 "7년" 메가 punch 압도성 OK인지, s4 배지 가로 정렬·크기 균형 OK인지, s5 화살표 회색 voltage OK인지 PPT 열어 확인.

- [ ] **Step 7: Commit**

```bash
git add lectures/03_sor_framework/build_v10_pptx.py lectures/03_sor_framework/BNI_SoR_v10.pptx
git commit -m "feat(bni-v10): add s3-s6 credential punch (7년, 둘 다, 3→상장사, DX·AX)"
```

---

### Task 4: s7·s8·s9 SoR/SoE/SoI 3장 (공통 패턴)

**Files:**
- Modify: `build_v10_pptx.py` (공통 빌더 1개 + 3회 호출)

- [ ] **Step 1: 공통 SoX 빌더**

```python
def build_sox(prs, slide_no: int, label_en: str, label_ko: str, examples: str):
    slide = add_black_slide(prs)
    add_brandlogy(slide, slide_no)

    # 상단 회색 영문 약어
    top_label = slide.shapes.add_textbox(
        Inches(0), Inches(1.6), CANVAS_W, Inches(0.6)
    )
    p = top_label.text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = label_en
    r.font.name = FONT_MONO
    r.font.size = Pt(32)
    r.font.color.rgb = MUTED_GRAY

    # 중앙 큰 punch
    add_punch_text(slide, label_ko, 140, top_inches=2.7, height_inches=2.4)

    # 하단 예시
    add_caption(slide, examples, top_inches=5.4, font_size_pt=22)
```

- [ ] **Step 2: main() — s7~s9 3회 호출**

```python
    build_sox(prs, 7, "SoR", "데이터", "ERP · 고객 명단 · 매출")
    build_sox(prs, 8, "SoE", "일", "카톡 · 노션 · 결재")
    build_sox(prs, 9, "SoI", "판단", "사장님 · 대시보드 · AI")
```

(기존 `for i in range(7, 11)` placeholder 루프는 `for i in range(10, 11)`로 축소)

- [ ] **Step 3: 실행 + 시각 검증**

Run: `python build_v10_pptx.py`. s7~s9 3장 패턴 일관성 + 영문 약어 voltage anchor + 한국어 punch 압도성 확인.

- [ ] **Step 4: Commit**

```bash
git add lectures/03_sor_framework/build_v10_pptx.py lectures/03_sor_framework/BNI_SoR_v10.pptx
git commit -m "feat(bni-v10): add s7-s9 SoR/SoE/SoI triplet via shared builder"
```

---

### Task 5: s10 "+ AI" + 최종 통합 + 시각 인계

**Files:**
- Modify: `build_v10_pptx.py` (s10 + main 마무리)

- [ ] **Step 1: s10 "+ AI"**

```python
def build_s10_plus_ai(prs):
    slide = add_black_slide(prs)
    add_brandlogy(slide, 10)
    add_caption(slide, "그 위에", top_inches=2.0, font_size_pt=28)
    add_punch_text(slide, "+ AI", 240, top_inches=3.0, height_inches=3.0)
```

- [ ] **Step 2: main() 최종 — placeholder 루프 완전 제거**

```python
def main():
    prs = Presentation()
    prs.slide_width = CANVAS_W
    prs.slide_height = CANVAS_H

    build_s1_cover(prs)
    build_s2_promise(prs)
    build_s3_years(prs)
    build_s4_dual_ambassador(prs)
    build_s5_scale(prs)
    build_s6_dx_ax(prs)
    build_sox(prs, 7, "SoR", "데이터", "ERP · 고객 명단 · 매출")
    build_sox(prs, 8, "SoE", "일", "카톡 · 노션 · 결재")
    build_sox(prs, 9, "SoI", "판단", "사장님 · 대시보드 · AI")
    build_s10_plus_ai(prs)
    build_s11_self_audit(prs)
    build_s12_close(prs)

    prs.save(OUTPUT)
    print(f"saved → {OUTPUT}  ({len(prs.slides)} slides)")
```

- [ ] **Step 3: 최종 실행 + 12장 전수 검증**

Run: `python build_v10_pptx.py`
Expected stdout: `saved → .../BNI_SoR_v10.pptx  (12 slides)`

사용자 PPT 열어 12장 전수 확인:
- 디자인 일관성 (검정+흰색·여백 70%+·brandlogy 4-corner)
- 단어 1~2개 룰 준수
- s4 배지만 원색, 나머지 monochrome
- s11 자기진단 cliff hanger 톤
- s12 깔끔 검정 마무리

- [ ] **Step 4: Commit**

```bash
git add lectures/03_sor_framework/build_v10_pptx.py lectures/03_sor_framework/BNI_SoR_v10.pptx
git commit -m "feat(bni-v10): complete 12-slide monochrome punch deck"
```

- [ ] **Step 5: 사용자 시각 인계 + 결정 게이트**

사용자가 PPT 열어 확인 → 합격 시 다음 단계(script-v10.md) 진입. fix 필요 시 R0 fix 루프.

---

## Self-Review 체크

- [x] spec 12-슬라이드 100% 매핑 (s1~s12 모두 빌더 함수 존재)
- [x] 디자인 토큰 spec 일치 (BG_BLACK=#000, INK_WHITE=#FFF, MUTED_GRAY=#666)
- [x] s4 배지 원색 유지 (assets/ PNG 그대로 임베드)
- [x] 4-corner brandlogy s2~s10만 (s1·s11·s12 제외 spec 미명시 — 결정 박제: 표지/cliff/검정은 brandlogy 0)
- [x] 자랑 톤 0 (s6 "DX·AX"는 정의 톤, "아무나 못합니다" 발화 영역만)
- [x] 화면 단어·숫자 1~2개 룰 (s2 promise만 2줄 텍스트, 나머지 단어 1~2개)
- [x] 함수 시그니처 일관 (add_punch_text·add_brandlogy·add_caption 모든 호출 동일)
- [ ] Pretendard Black/Light 시스템 폰트 미설치 위험 — 사용자 macOS Pretendard 설치 가정. fallback 처리 안 함 (실행 시 시스템 default로 떨어져도 layout은 유지)

## Execution Handoff

Plan 완료. 두 옵션:
1. **Subagent-Driven (recommended)** — fresh subagent per task, 사이사이 시각 검증 게이트
2. **Inline Execution** — 이 세션에서 5 task 연속 실행, Task 2·5 사이 사용자 시각 확인

사용자 선택 대기.
