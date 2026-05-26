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
# Slide builders
# ────────────────────────────────────────────────────────────


def build_s1_cover(prs):
    """s1 표지 — 회사의 일하는 구조 + SSOD · 김지명."""
    slide = add_black_slide(prs)
    add_punch_text(slide, "AI 시대 일하는 구조", 84, top_inches=2.9, height_inches=1.5)
    add_caption(slide, "SSOD · 김지명", top_inches=4.6, font_size_pt=20, color=INK_WHITE)


def build_s2_promise(prs):
    """s2 인트로 promise — 오늘 가져가실 2가지."""
    slide = add_black_slide(prs)
    add_brandlogy(slide, 2)
    add_punch_text(slide, "오늘 가져가실 2가지", 56, top_inches=1.6, height_inches=0.9)

    tb = slide.shapes.add_textbox(Inches(0), Inches(3.3), CANVAS_W, Inches(3.0))
    tf = tb.text_frame
    tf.margin_left = tf.margin_right = 0
    tf.vertical_anchor = MSO_ANCHOR.TOP

    lines = [
        "①  SSOD는 무엇을 하는가?",
        "②  우리 회사는?",
    ]
    for idx, text in enumerate(lines):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.CENTER
        p.space_after = Pt(28)
        r = p.add_run()
        r.text = text
        r.font.name = FONT_LIGHT
        r.font.size = Pt(40)
        r.font.color.rgb = INK_WHITE


def build_s3_years(prs):
    """s3 7년 — 메가 punch."""
    slide = add_black_slide(prs)
    add_brandlogy(slide, 3)
    add_punch_text(slide, "7년", 240, top_inches=1.8, height_inches=3.5)
    add_caption(slide, "B2B 컨설팅", top_inches=5.4, font_size_pt=24)


def build_s4_dual_ambassador(prs):
    """s4 둘 다 + Notion·n8n 배지 (배지만 원색 유지)."""
    slide = add_black_slide(prs)
    add_brandlogy(slide, 4)
    add_punch_text(slide, "둘 다", 160, top_inches=1.4, height_inches=2.2)

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

    add_caption(
        slide,
        "글로벌 공식 앰버서더 — 한국에 쏘드뿐",
        top_inches=6.2,
        font_size_pt=20,
    )


def build_s5_scale(prs):
    """s5 3 → 상장사 (혼합 색·크기 한 줄)."""
    slide = add_black_slide(prs)
    add_brandlogy(slide, 5)

    tb = slide.shapes.add_textbox(Inches(0), Inches(2.8), CANVAS_W, Inches(2.0))
    tf = tb.text_frame
    tf.margin_left = tf.margin_right = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER

    def _run(text, *, size, color):
        r = p.add_run()
        r.text = text
        r.font.name = FONT_BLACK
        r.font.size = Pt(size)
        r.font.color.rgb = color

    _run("3", size=160, color=INK_WHITE)
    _run("   →   ", size=120, color=MUTED_GRAY)
    _run("상장사", size=140, color=INK_WHITE)

    add_caption(slide, "직원 3명 사무실부터 상장사까지", top_inches=5.6, font_size_pt=20)


def build_s6_dx_ax(prs):
    """s6 DX · AX — 본업 정의 (SoR/SoE/SoI 진입 transition)."""
    slide = add_black_slide(prs)
    add_brandlogy(slide, 6)
    add_punch_text(slide, "DX · AX", 200, top_inches=2.2, height_inches=2.8)
    add_caption(
        slide,
        "Digital Transformation · AI Transformation",
        top_inches=5.4,
        font_size_pt=22,
    )


def build_s11_self_audit(prs):
    """s11 우리 회사는? + 체크박스 SoR/SoE/SoI (자기진단 cliff hanger)."""
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


def build_s12_close(prs):
    """s12 검정 마무리 — 우하 SSOD · 김지명만."""
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
    for i in range(7, 11):  # s7~s10 placeholder (filled in Tasks 4–5)
        slide = add_black_slide(prs)
        add_brandlogy(slide, i)
    build_s11_self_audit(prs)
    build_s12_close(prs)

    prs.save(OUTPUT)
    print(f"saved → {OUTPUT}  ({len(prs.slides)} slides)")


if __name__ == "__main__":
    main()
