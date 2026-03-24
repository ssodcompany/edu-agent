# QA Report — 02_ai_skills Slide Deck

**Date:** 2026-03-24
**Slides:** slide-01.html through slide-11.html
**Viewport tested:** 960×540px (representing 720pt×405pt at 4:3 pt-to-px ratio)
**Tool:** Playwright Chromium 143.0 (headless), automated DOM analysis + visual inspection
**Screenshots:** `qa-screenshots/slide-01.png` through `slide-11.png`

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL  | 0 |
| HIGH      | 3 |
| MEDIUM    | 4 |
| LOW       | 4 |
| **Total** | **11** |

---

## Slide-by-Slide Findings

---

### Slide 01 — Title Slide ("내 Skills 찾기")

**Screenshot:** `qa-screenshots/slide-01.png`

#### ISSUE-01 · HIGH · Text Clipping — Hero Title

- **Elements:** `<h1>내 Skills</h1>` and `<h1>찾기</h1>`
- **Detail:** Both `<h1>` elements at 76pt font-size have `scrollHeight: 108px` vs `clientHeight: 96px` — a 12px vertical clip. The bottom of each glyph descender is cut off by the parent flex container. Line-height is set to 0.95 which is tighter than the actual font metrics, causing the bounding box to be smaller than the rendered glyphs.
- **Root cause:** `line-height: 0.95` on 76pt text causes the calculated cell height to be less than the actual rendered ink height.
- **Suggested fix:** Increase `line-height` to at least `1.0` on both `<h1>` tags, or add a small `padding-bottom: 4pt` to the containing `<div>` to prevent descender clipping.

#### ISSUE-02 · LOW · Overflow — Decorative "#2" Element

- **Element:** `<p style="font-size: 220pt; ...">` in the right decorative column
- **Detail:** Intentionally overflowed right edge (right: 1022px vs viewport 960px). The parent container has `overflow: hidden` so this is visually contained. The element also has `margin-right: -40pt` to create a cropped effect.
- **Assessment:** Design intent appears deliberate (watermark crop). However the 220pt glyph also has `scrollHeight: 321px` vs `clientHeight: 293px`, meaning even within the container the top/bottom is clipped slightly.
- **Suggested fix:** If the crop is intentional, no change needed. If the full "#2" must be visible within its column, reduce font-size to ~180pt or increase the column's height overflow allowance.

#### ISSUE-03 · MEDIUM · Tiny Text — Sidebar Label

- **Element:** `<p>BNI K-CHAPTER · AI 시대 네트워킹 #2</p>` (rotated sidebar)
- **Detail:** Computed font-size: 9px (7pt). Rotated text at 9px is extremely difficult to read, particularly in PPTX conversion where rendering fidelity may be lower.
- **Suggested fix:** Increase to at least 11px (8pt) or accept as decorative-only and ensure it does not carry critical information.

---

### Slide 02 — Hook Slide ("직원한테 줄 일을 안 준 적 있으신 분?")

**Screenshot:** `qa-screenshots/slide-02.png`

No programmatic issues detected.

#### ISSUE-04 · LOW · Empty Area — Upper 40% of Slide Unused

- **Detail:** The main content (subtitle + hero question + divider + caption) occupies roughly the center 60% of the slide vertically. The top ~40% is empty dark space. This is intentional compositional whitespace, but the quote mark icon ("") in the top-left corner is very small (approximately 14px) and visually disconnected from the quote text below.
- **Suggested fix:** Either increase the quote mark size to at least 24pt, or move the content block slightly upward to reduce the empty gap at the top.

#### ISSUE-05 · LOW · Readability — Caption Text Contrast

- **Element:** `<p>여러분의 고객도, 여러분한테 똑같은 생각을 하고 있을 수 있습니다.</p>` (bottom caption)
- **Detail:** Small gray text (~11pt) on a near-black background. While contrast is technically sufficient (light gray on dark), the sentence is long and reads at small size in the bottom strip.
- **Suggested fix:** No change required for print/projected use, but verify contrast ratio is above 4.5:1 for accessibility compliance.

---

### Slide 03 — Feature Slide ("3년차 직원처럼 알아서 일한다")

**Screenshot:** `qa-screenshots/slide-03.png`

#### ISSUE-06 · MEDIUM · Text Wrapping — Left Panel Label Text

- **Element:** `<p>AI한테 회사 업무 방식을 가르치면</p>` in the left column (220pt wide)
- **Detail:** The text wraps to two lines ("AI한테 회사 업무 방식을 가르" / "치면") due to the narrow column width. The break is linguistically awkward — "가르치면" splits across lines, separating the verb from the phrase it belongs to.
- **Root cause:** The left column is 220pt wide with 44pt left padding and 32pt right padding, leaving only 144pt of text space — insufficient for this 18-character Korean phrase at 12pt.
- **Suggested fix:** Options in order of preference:
  1. Reword to a shorter phrase that fits on one line (e.g., "회사 방식을 가르치면")
  2. Reduce left padding from 44pt to 32pt
  3. Add `word-break: keep-all` to prevent mid-word breaks in Korean

#### ISSUE-07 · LOW · Tiny Text — "ANTHROPIC" Label

- **Element:** `<p style="font-size: 7pt; ...">ANTHROPIC</p>` (logo caption above "Claude · Skills")
- **Detail:** Computed at 9px — below readable threshold for PPTX conversion.
- **Suggested fix:** Increase to 8pt minimum. This is a secondary label so even 7.5pt would help.

---

### Slide 04 — Quote Slide ("잘해서 자르는 게 아니라...")

**Screenshot:** `qa-screenshots/slide-04.png`

No programmatic issues detected.

#### ISSUE-08 · MEDIUM · Large Empty Area — Center Gap

- **Detail:** The slide has a large empty zone between the Harvard Business Review citation and the bottom divider/caption. Approximately 35–40% of the slide height is blank. While this is a deliberate editorial quote layout, the large gap weakens visual tension and may read as incomplete in a presentation context.
- **Suggested fix:** Either: (a) move the quote block down slightly to vertically center it between the top and the divider line, or (b) increase the quote font size from the current ~30pt to ~36pt to fill the space more confidently.

---

### Slide 05 — Data Slide ("컨설턴트가 들어간 회사의 매출 2배")

**Screenshot:** `qa-screenshots/slide-05.png`

#### ISSUE-09 · HIGH · Text Clipping — Hero Number "2배"

- **Element:** `<h1 style="font-size: 96pt; line-height: 0.9; ...">2배</h1>`
- **Detail:** `scrollHeight: 134px` vs `clientHeight: 115px` — 19px of the hero number is clipped vertically. The bottom of "배" is cut off by the parent `<div>` container. At 96pt with `line-height: 0.9`, the container is undersized for the actual glyph ink bounds.
- **Root cause:** Same pattern as ISSUE-01 — aggressive `line-height` below 1.0 causes the rendered glyph to exceed the calculated layout height. Korean characters with complex strokes are particularly susceptible.
- **Confirmed by user:** This is the previously-reported overlap between "컨설턴트가 들어간 회사의 매출" and "2배" — the label text and hero number are rendered in close proximity and the hero number clips into/past its container.
- **Suggested fix:** Change `line-height: 0.9` to `line-height: 1.0` on the `<h1>`. If vertical space is tight, add `overflow: visible` to the parent `<div>` wrapping the hero number, or reduce font-size to 88pt.

---

### Slide 06 — Framework Slide ("AI가 따라올 수 없는 세 가지 판단력")

**Screenshot:** `qa-screenshots/slide-06.png`

#### ISSUE-10 · HIGH · Text Wrapping — Left Panel Hero Title Line Break

- **Element:** `<h1 style="font-size: 38pt; ...">AI가 따라올 수 없는</h1>`
- **Detail:** The text "AI가 따라올 수 없는" renders correctly on one line but "세 가지 판단력" also fits on the second line. However at this font size within the 390pt left column (with 64pt left + 48pt right padding = 278pt usable), the first `<h1>` "AI가 따라올 수 없는" is wrapping to **three lines** in the rendered screenshot: "AI가 따라올 수 없" / "는" / "세 가지 판단력". The orphaned "는" on its own line is a critical readability issue.
- **Root cause:** 38pt font in 278pt column = approximately 7.3 Korean characters per line. "AI가 따라올 수 없는" is 10 characters including spaces, forcing an awkward break.
- **Suggested fix:** Options:
  1. Reduce font-size from 38pt to 32pt — fits the full phrase on one line
  2. Add `white-space: nowrap` and `font-size: clamp(28pt, 5vw, 38pt)` to allow dynamic sizing
  3. Rewrite line 1 as "AI가 따라올 수 없는" → break as "AI가 따라올" / "수 없는" by inserting `<br>` at a natural linguistic boundary

---

### Slide 07 — Detail Slide ("맥락을 읽는 판단")

**Screenshot:** `qa-screenshots/slide-07.png`

No programmatic issues detected. Layout is clean.

#### ISSUE (OBSERVATION) · LOW · Empty Area — Lower 40% Unused

- **Detail:** The slide is top-heavy. The quote block occupies the top third, with the bottom statement anchored to the slide floor. This leaves a large empty middle zone (~150px). This is a deliberate design choice using `align-items: flex-end` on the bottom element, but in a PPTX context, large empty zones can look unintentional.
- **Suggested fix:** Accept as-is if editorial whitespace is intentional. Alternatively, remove `flex: 1; align-items: flex-end` and add `margin-top: 40pt` to the bottom `<h3>` to give it controlled breathing room.

---

### Slide 08 — Detail Slide ("리스크를 감수하는 판단")

**Screenshot:** `qa-screenshots/slide-08.png`

No programmatic issues detected.

#### ISSUE (OBSERVATION) · LOW · Empty Area — Same pattern as Slide 07

- **Detail:** Same layout as Slide 07 with large empty middle zone. Consistent pattern across the skill detail slides — if intentional, it is consistent. Note this is MEDIUM severity if inconsistency with other slides is undesirable.

---

### Slide 09 — Detail Slide ("버리는 판단")

**Screenshot:** `qa-screenshots/slide-09.png`

No programmatic issues detected. The dark quote box with full-width treatment renders well. Layout is the most compact and balanced of the three detail slides.

---

### Slide 10 — Exercise Slide ("BNI 60초 소개 — Before/After")

**Screenshot:** `qa-screenshots/slide-10.png`

No programmatic issues detected.

#### ISSUE-11 · MEDIUM · Content Imbalance — Right Column Far Denser Than Left

- **Detail:** Left column ("AI가 5초 만에 쓴 소개") has only 2 short lines of gray placeholder text occupying ~15% of the column height. Right column ("내 판단력이 담긴 소개") has 3 bold content lines occupying ~40% of column height but positioned very low (bottom third).
- **The right column's content is pushed down** because the bold text starts at roughly 50% of the column height (y≈270px). A large empty zone occupies the top 55% of the right column. This makes the right side feel unanchored and the Before/After comparison structure reads as unfinished.
- **Suggested fix:** Add `justify-content: center` to the right column flex container, or add a sample "after" intro card (even as a styled placeholder box) to make the right column feel purposefully minimal rather than empty.

---

### Slide 11 — Closing / Homework Slide

**Screenshot:** `qa-screenshots/slide-11.png`

No programmatic issues detected. Overall layout is strong.

#### ISSUE (OBSERVATION) · LOW · Tiny Text — "HOMEWORK" Badge Label

- **Element:** `<p style="font-size: 7pt; ...">HOMEWORK</p>` inside badge
- **Detail:** Computed at 9px. Same pattern as ISSUE-03 and ISSUE-07. Acceptable as a design badge, but at PPTX conversion resolution may become illegible.
- **Suggested fix:** Increase to 8pt (consistent with other badge labels in the deck).

---

## Cross-Deck Issues

### PATTERN-01 · HIGH · Aggressive line-height on Large Korean Text

- **Affects:** Slides 01, 05 (confirmed), potentially 06
- **Pattern:** `line-height: 0.9` or `line-height: 0.95` combined with large font sizes (76pt, 96pt, 38pt) causes Korean glyph descenders and ascenders to be clipped by their layout containers.
- **Universal fix:** For any `font-size` ≥ 36pt in Korean text, use `line-height` of at least `1.0`. For display sizes (60pt+), use `1.05` or add `padding: 4pt 0` on the element.

### PATTERN-02 · MEDIUM · Tiny Badge Labels (sub-10px text)

- **Affects:** Slides 01 (sidebar), 03 ("ANTHROPIC"), 07, 08, 09 ("SKILL 1/2/3"), 11 ("HOMEWORK")
- **Pattern:** Several label/badge elements use 7–8pt font sizes which render at ≤9px computed size.
- **Universal fix:** Establish a minimum badge font-size of 8pt across the design system. For rotated text specifically, use 9pt minimum.

### PATTERN-03 · MEDIUM · Narrow Left Column Text Wrapping

- **Affects:** Slides 03, 06
- **Pattern:** Left panel columns with heavy padding (44pt+32pt = 76pt total) leave insufficient text space for 12–14 character Korean strings at 12–14pt font size, causing awkward mid-phrase line breaks.
- **Universal fix:** Add `word-break: keep-all` to all left-column `<p>` elements. This prevents breaks within Korean syllable clusters.

---

## Issues Not Found

- No broken images (all `<img>` assets rendered, though some use relative paths — confirmed visually)
- No horizontal overflow at body level (all slides: `bodyScrollWidth = 960`)
- No z-index layering conflicts
- No text-on-text overlap (the "컨설턴트가 들어간 회사의 매출" / "2배" issue is a clipping issue within a container, not a visual overlap between separate elements)
- No color contrast failures on primary content text

---

## Recommended Fix Priority

| Priority | Issue | Slide | Fix Effort |
|----------|-------|-------|-----------|
| 1 | ISSUE-09: "2배" hero number clipped | 05 | Change `line-height: 0.9` → `1.0` |
| 2 | ISSUE-01: "내 Skills / 찾기" title clipped | 01 | Change `line-height: 0.95` → `1.0` |
| 3 | ISSUE-10: "AI가 따라올 수 없는" orphan line break | 06 | Reduce font-size to 32pt or add `<br>` |
| 4 | ISSUE-06: "가르치면" awkward wrap in left panel | 03 | Add `word-break: keep-all` |
| 5 | ISSUE-11: Content imbalance in Before/After | 10 | Add vertical centering to right column |
| 6 | PATTERN-02: Sub-10px badge labels | 01,03,11 | Set minimum 8pt on all badge labels |

---

## Cleanup

- tmux sessions used: `qa-slides-screenshot-*`, `qa-slides-deep-*`, `qa-slides-deep2-*`
- All sessions killed: YES
- Temp files: `/tmp/qa-screenshot-output.txt`, `/tmp/qa-deep-output.txt`, `/tmp/qa-deep-output2.txt`, `/tmp/qa-deep-results.json`
- QA scripts retained: `qa-screenshot.cjs`, `qa-deep-check.cjs` (can be deleted after fixes are applied)
- Screenshots retained: `qa-screenshots/slide-01.png` through `slide-11.png`
