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
from pptx.util import Inches, Pt

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


# ────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────


def add_black_slide(prs: Presentation):
    """16:9 빈 슬라이드 + 검정 배경."""
    blank_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(blank_layout)
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, CANVAS_W, CANVAS_H)
    bg.fill.solid()
    bg.fill.fore_color.rgb = BG_BLACK
    bg.line.fill.background()
    return slide


def add_punch_text(
    slide,
    text: str,
    font_size_pt: int,
    *,
    font_name: str = FONT_BLACK,
    color: RGBColor = INK_WHITE,
    top_inches: float = 2.8,
    height_inches: float = 2.0,
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


def add_caption(
    slide,
    text: str,
    *,
    top_inches: float = 5.6,
    font_size_pt: int = 18,
    color: RGBColor = MUTED_GRAY,
    align=PP_ALIGN.CENTER,
):
    """보조 회색 캡션."""
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


def add_brandlogy(slide, slide_no: int):
    """좌상 NN/12 + 우하 SSOD 워드마크 (본문 슬라이드 공통)."""
    # 좌상
    tl = slide.shapes.add_textbox(Inches(0.4), Inches(0.3), Inches(1.0), Inches(0.3))
    p = tl.text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.LEFT
    r = p.add_run()
    r.text = f"{slide_no:02d}/12"
    r.font.name = FONT_MONO
    r.font.size = Pt(11)
    r.font.color.rgb = MUTED_GRAY

    # 우하
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


# ────────────────────────────────────────────────────────────
# Slide builders (filled in Tasks 2–5)
# ────────────────────────────────────────────────────────────


def main():
    prs = Presentation()
    prs.slide_width = CANVAS_W
    prs.slide_height = CANVAS_H

    for i in range(1, 13):
        slide = add_black_slide(prs)
        if 2 <= i <= 10:
            add_brandlogy(slide, i)

    prs.save(OUTPUT)
    print(f"saved → {OUTPUT}  ({len(prs.slides)} slides)")


if __name__ == "__main__":
    main()
