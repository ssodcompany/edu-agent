"""BNI v10 PPT builder — Monochrome Punch (14 slides, 검정+흰색 only).

Spec: design-v10-spec.md (2026-05-25 SHIP) + photo wall s4 추가 (2026-05-26).
Run: python build_v10_pptx.py
Output: BNI_SoR_v10.pptx (16:9, 1280x720)
"""
from pathlib import Path

from lxml import etree

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from pptx.util import Inches, Pt

ROOT = Path(__file__).parent
ASSETS = ROOT / "assets"
PHOTOS = ASSETS / "photos"
OUTPUT = ROOT / "BNI_SoR_v10.pptx"

CANVAS_W = Inches(13.333)
CANVAS_H = Inches(7.5)
TOTAL_SLIDES = 13

# Linear DESIGN.md 이식 (alpha v10.1, monochrome 유지 + ink·spacing refinement)
BG_BLACK = RGBColor(0x01, 0x01, 0x02)  # Linear canvas — near-black with faint blue tint
INK_WHITE = RGBColor(0xF7, 0xF8, 0xF8)  # Linear ink — light gray (덜 가혹)
MUTED_GRAY = RGBColor(0x8A, 0x8F, 0x98)  # Linear ink-subtle (caption)
INK_TERTIARY = RGBColor(0x62, 0x66, 0x6D)  # Linear ink-tertiary (page no, eyebrow)
HAIRLINE = RGBColor(0x23, 0x25, 0x2A)  # 1px border / divider
SURFACE_1 = RGBColor(0x0F, 0x10, 0x11)  # card lift (diagram 박스 fill)

LAVENDER = RGBColor(0x5E, 0x6A, 0xD2)  # Linear signature accent (brand mark only)

FONT_BLACK = "Pretendard Black"
FONT_LIGHT = "Pretendard Light"
FONT_MONO = "SF Mono"

PUNCH_SPACING_PCT = -3.5  # Linear display aggressive negative tracking


# ────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────


def set_font(run, font_name: str):
    """python-pptx font.name은 Latin만 잡음. Hangul/CJK 위해 ea·cs track도 동일 폰트로 강제."""
    rPr = run._r.get_or_add_rPr()
    for tag in ("a:latin", "a:ea", "a:cs"):
        el = rPr.find(qn(tag))
        if el is None:
            el = etree.SubElement(rPr, qn(tag))
        el.set("typeface", font_name)


def set_letter_spacing(run, spacing_pct: float):
    """Letter-spacing in percent of font size. Negative = tighter (Linear signature).

    OOXML spc unit = 1/100 pt. 200pt × -3.5% = -7pt = spc='-700'.
    """
    if run.font.size is None:
        return
    pt = run.font.size.pt
    spc_val = int(pt * spacing_pct)
    rPr = run._r.get_or_add_rPr()
    rPr.set("spc", str(spc_val))


def add_black_slide(prs: Presentation):
    """16:9 빈 슬라이드 + 검정 배경."""
    blank_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(blank_layout)
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, CANVAS_W, CANVAS_H)
    bg.fill.solid()
    bg.fill.fore_color.rgb = BG_BLACK
    bg.line.fill.background()
    return slide


def add_gradient_slide(prs: Presentation):
    """16:9 빈 슬라이드 + diagonal 그라데이션 (좌상 검정 → 보라 → 우하 라일락).

    3-stop gradient, 135° diagonal (top-left → bottom-right).
    """
    blank_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(blank_layout)
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, CANVAS_W, CANVAS_H)
    bg.line.fill.background()

    sp_pr = bg.fill._xPr
    for tag in ("a:solidFill", "a:gradFill", "a:noFill", "a:pattFill", "a:blipFill"):
        el = sp_pr.find(qn(tag))
        if el is not None:
            sp_pr.remove(el)

    grad = etree.SubElement(sp_pr, qn("a:gradFill"))
    grad.set("flip", "none")
    grad.set("rotWithShape", "1")
    gs_lst = etree.SubElement(grad, qn("a:gsLst"))

    # 3-stop: 좌상 검정 영역 넓게 → 중앙 진보라 → 우하 라일락
    # 검정 0~35%, 보라 70%, 라일락 100% — reference 톤 매칭
    stops = [
        ("0", "000000"),
        ("35000", "000000"),
        ("70000", "6a5acd"),
        ("100000", "e8b0e8"),
    ]
    for pos, hex_color in stops:
        gs = etree.SubElement(gs_lst, qn("a:gs"))
        gs.set("pos", pos)
        srgb = etree.SubElement(gs, qn("a:srgbClr"))
        srgb.set("val", hex_color)

    lin = etree.SubElement(grad, qn("a:lin"))
    lin.set("ang", "2700000")  # 45° = 좌상→우하 diagonal
    lin.set("scaled", "0")

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
    set_font(run, font_name)
    run.font.size = Pt(font_size_pt)
    run.font.color.rgb = color
    # Linear aggressive negative tracking on display punch
    if font_name == FONT_BLACK and font_size_pt >= 80:
        set_letter_spacing(run, PUNCH_SPACING_PCT)
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
    set_font(r, FONT_LIGHT)
    r.font.size = Pt(font_size_pt)
    r.font.color.rgb = color
    return tb


SSOD_LOGO = ASSETS / "ssod-wordmark.png"  # 가로형 워드마크 (마크 + SSOD 영문)
SSOD_LOGO_H = Inches(0.62)
SSOD_LOGO_W = Inches(0.62 * 2440 / 1585)  # 원본 비율 2440x1585

# Footer 레이아웃 토큰
FOOTER_DIVIDER_Y = Inches(6.72)  # divider 위치 (footer 영역 확장)
FOOTER_BASELINE_Y = Inches(6.82)  # chip·로고 top baseline


def add_brandlogy(slide, slide_no: int):
    """좌하 NN/14 chip + 하단 hairline divider + 우하 SSOD 가로형 워드마크.

    Footer 시각 균형: divider 위(콘텐츠) / divider 아래(footer 영역) 분리.
    좌측 chip(작음, 보조 정보) vs 우측 워드마크(큼, 브랜드 시그너처) 위계 명확.
    """
    # 하단 hairline divider — footer 영역 윤곽
    divider = slide.shapes.add_connector(
        1, Inches(0.4), FOOTER_DIVIDER_Y, CANVAS_W - Inches(0.4), FOOTER_DIVIDER_Y
    )
    divider.line.color.rgb = HAIRLINE
    divider.line.width = Pt(0.5)

    # 좌하: pill chip — surface-1 fill + hairline border + rounded pill
    chip_w = Inches(1.05)
    chip_h = Inches(0.32)
    # 로고 vertical center와 align (로고 height 0.62, top 6.82 → center 7.13)
    # chip center 7.13 → chip top 7.13 - 0.16 = 6.97
    chip = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.4), Inches(6.97), chip_w, chip_h
    )
    chip.fill.solid()
    chip.fill.fore_color.rgb = SURFACE_1
    chip.line.color.rgb = HAIRLINE
    chip.line.width = Pt(0.75)
    chip.adjustments[0] = 0.5  # pill
    tf = chip.text_frame
    tf.word_wrap = False  # 한 줄 강제
    tf.margin_left = tf.margin_right = Inches(0.1)
    tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = f"{slide_no:02d} / {TOTAL_SLIDES}"
    set_font(r, FONT_MONO)
    r.font.size = Pt(10)
    r.font.color.rgb = MUTED_GRAY
    set_letter_spacing(r, 4.0)  # eyebrow positive tracking

    # 우하: SSOD 가로형 워드마크 (footer 영역 안, divider 아래)
    if SSOD_LOGO.exists():
        right_margin = Inches(0.4)
        # 로고 top 6.82, height 0.62 → bottom 7.44 (캔버스 7.5 안, divider 6.72 아래)
        top = FOOTER_BASELINE_Y
        left = CANVAS_W - SSOD_LOGO_W - right_margin
        slide.shapes.add_picture(
            str(SSOD_LOGO), left, top, width=SSOD_LOGO_W, height=SSOD_LOGO_H
        )


# ────────────────────────────────────────────────────────────
# Slide builders
# ────────────────────────────────────────────────────────────


def build_s1_cover(prs):
    """s1 표지 — eyebrow + punch + 중앙 SSOD 워드마크, 검정 BG."""
    slide = add_black_slide(prs)

    # eyebrow: AI 시대 (작은 mono small caps 톤)
    eyebrow = slide.shapes.add_textbox(Inches(0), Inches(2.4), CANVAS_W, Inches(0.5))
    ep = eyebrow.text_frame.paragraphs[0]
    ep.alignment = PP_ALIGN.CENTER
    er = ep.add_run()
    er.text = "AI 시대"
    set_font(er, FONT_LIGHT)
    er.font.size = Pt(28)
    er.font.color.rgb = MUTED_GRAY

    # punch: 준비해야하는 일의 구조
    add_punch_text(
        slide,
        "준비해야하는 일의 구조",
        72,
        top_inches=3.05,
        height_inches=1.6,
    )

    # 중앙 SSOD 워드마크 (표지 시그너처)
    if SSOD_LOGO.exists():
        h = Inches(0.7)
        w = Inches(0.7 * 2440 / 1585)
        left = (CANVAS_W - w) / 2
        top = Inches(5.3)
        slide.shapes.add_picture(str(SSOD_LOGO), left, top, width=w, height=h)


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
        set_font(r, FONT_LIGHT)
        r.font.size = Pt(40)
        r.font.color.rgb = INK_WHITE


def build_s3_years(prs):
    """s3 7년 — 메가 punch."""
    slide = add_black_slide(prs)
    add_brandlogy(slide, 3)
    add_punch_text(slide, "7년", 240, top_inches=1.8, height_inches=3.5)
    add_caption(slide, "B2B 컨설팅", top_inches=5.4, font_size_pt=24)


def build_s4_dual_ambassador(prs):
    """s4 국내 유일 + Notion·n8n 배지 (배지만 원색 유지, 가로 중앙 정렬)."""
    slide = add_black_slide(prs)
    add_brandlogy(slide, 4)
    add_punch_text(slide, "국내 유일", 130, top_inches=1.4, height_inches=2.2)

    notion_path = ASSETS / "notion-ambassador-badge.png"
    n8n_path = ASSETS / "n8n-amber-ssod-black.png"

    # 실측: notion 400x123 (aspect 3.25), n8n 391x110 (aspect 3.55)
    badge_h_in = 1.1
    badge_h = Inches(badge_h_in)
    notion_w = Inches(badge_h_in * 400 / 123)
    n8n_w = Inches(badge_h_in * 391 / 110)
    gap = Inches(0.45)

    total_w = notion_w + gap + n8n_w
    left_notion = (CANVAS_W - total_w) / 2
    left_n8n = left_notion + notion_w + gap
    top = Inches(4.55)

    if notion_path.exists():
        slide.shapes.add_picture(
            str(notion_path), left_notion, top, width=notion_w, height=badge_h
        )
    if n8n_path.exists():
        slide.shapes.add_picture(
            str(n8n_path), left_n8n, top, width=n8n_w, height=badge_h
        )

    add_caption(
        slide,
        "이중 앰버서더는 국내 SSOD뿐",
        top_inches=6.1,
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
        set_font(r, FONT_BLACK)
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


def build_sox(prs, slide_no, label_en, label_ko, subtitle, examples):
    """s7·s8·s9 공통 — SoR/SoE/SoI 패턴.

    위계: 영문 약어 punch(흰, 메인) → 한글 단어(muted) → 부제 1줄(흰, 풍부) → 예시(muted, 작게).
    """
    slide = add_black_slide(prs)
    add_brandlogy(slide, slide_no)

    add_punch_text(slide, label_en, 200, top_inches=1.6, height_inches=2.6)
    add_caption(slide, label_ko, top_inches=4.45, font_size_pt=44, color=MUTED_GRAY)
    add_caption(slide, subtitle, top_inches=5.15, font_size_pt=22, color=INK_WHITE)
    add_caption(slide, examples, top_inches=5.85, font_size_pt=18)


def build_s10_diagram(prs):
    """s10 — SoR·SoE·SoI 세 레이어 수직 연결 다이어그램 (Palantir Ontology 모델)."""
    slide = add_black_slide(prs)
    add_brandlogy(slide, 10)

    box_w = Inches(6.0)
    box_h = Inches(1.15)
    gap = Inches(0.45)  # 화살표 들어갈 자리
    left = (CANVAS_W - box_w) / 2
    start_top = Inches(1.35)

    # 위→아래: SoI (지능) / SoE (참여) / SoR (기록) — 기록이 토대, 지능이 정점
    layers = [
        ("SoI", "지능"),
        ("SoE", "참여"),
        ("SoR", "기록"),
    ]

    for idx, (label_en, label_ko) in enumerate(layers):
        top = start_top + (box_h + gap) * idx

        # Linear lift: surface-1 fill + hairline 1pt border + sm corner
        box = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, left, top, box_w, box_h
        )
        box.fill.solid()
        box.fill.fore_color.rgb = SURFACE_1
        box.line.color.rgb = HAIRLINE
        box.line.width = Pt(1.0)
        box.adjustments[0] = 0.10  # Linear lg rounded ≈ 8.5% of box_h

        # 박스 안 텍스트: 영문 punch + 한글 보조
        tf = box.text_frame
        tf.margin_left = Inches(0.4)
        tf.margin_right = Inches(0.4)
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER

        r1 = p.add_run()
        r1.text = label_en
        set_font(r1, FONT_BLACK)
        r1.font.size = Pt(54)
        r1.font.color.rgb = INK_WHITE

        r2 = p.add_run()
        r2.text = f"    {label_ko}"
        set_font(r2, FONT_LIGHT)
        r2.font.size = Pt(28)
        r2.font.color.rgb = MUTED_GRAY

        # 박스 사이 ↑ 화살표 — 라벤더 액센트 (Linear signature accent)
        if idx > 0:
            arrow_top = top - gap + Inches(0.05)
            arrow = slide.shapes.add_textbox(
                left, arrow_top, box_w, gap - Inches(0.1)
            )
            ap = arrow.text_frame.paragraphs[0]
            ap.alignment = PP_ALIGN.CENTER
            ar = ap.add_run()
            ar.text = "↑"
            set_font(ar, FONT_BLACK)
            ar.font.size = Pt(28)
            ar.font.color.rgb = LAVENDER


def build_s11_plus_ai(prs):
    """s11 + AI — 그 위에 AI 씌움 (구조 없으면 AI도 못 들어옴)."""
    slide = add_black_slide(prs)
    add_brandlogy(slide, 11)
    add_caption(slide, "그 위에", top_inches=2.0, font_size_pt=28)
    add_punch_text(slide, "+ AI", 240, top_inches=3.0, height_inches=3.0)


def build_s12_self_audit(prs):
    """s12 우리 회사는? + 체크박스 SoR/SoE/SoI (자기진단 cliff hanger)."""
    slide = add_black_slide(prs)
    add_punch_text(slide, "우리 회사는?", 96, top_inches=1.5, height_inches=1.3)

    tb = slide.shapes.add_textbox(Inches(0), Inches(3.7), CANVAS_W, Inches(3.0))
    tf = tb.text_frame
    tf.vertical_anchor = MSO_ANCHOR.TOP

    items = ["☐  SoR — 기록", "☐  SoE — 참여", "☐  SoI — 지능"]
    for idx, text in enumerate(items):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.CENTER
        p.space_after = Pt(16)
        r = p.add_run()
        r.text = text
        set_font(r, FONT_LIGHT)
        r.font.size = Pt(36)
        r.font.color.rgb = MUTED_GRAY


def build_s13_close(prs):
    """s13 검정 마무리 — 중앙 SSOD 가로형 워드마크 + 김지명."""
    slide = add_black_slide(prs)

    # 중앙 가로형 워드마크 (closing brand mark)
    if SSOD_LOGO.exists():
        h = Inches(1.4)
        w = Inches(1.4 * 2440 / 1585)
        left = (CANVAS_W - w) / 2
        top = (CANVAS_H - h) / 2 - Inches(0.3)
        slide.shapes.add_picture(str(SSOD_LOGO), left, top, width=w, height=h)

    # 워드마크 아래 김지명 (중앙 정렬)
    tb = slide.shapes.add_textbox(Inches(0), Inches(5.1), CANVAS_W, Inches(0.5))
    p = tb.text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = "김지명"
    set_font(r, FONT_LIGHT)
    r.font.size = Pt(18)
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
    build_sox(prs, 7, "SoR", "기록", "회사의 거래·사실이 권위 있게 적힌 자리", "ERP · CRM · 매출")
    build_sox(prs, 8, "SoE", "참여", "사람의 상호작용·협업이 일어나는 자리", "카톡 · 노션 · 메일")
    build_sox(prs, 9, "SoI", "지능", "여러 기록을 합쳐 AI가 결정을 만드는 자리", "BI · 대시보드 · AI")
    build_s10_diagram(prs)
    build_s11_plus_ai(prs)
    build_s12_self_audit(prs)
    build_s13_close(prs)

    prs.save(OUTPUT)
    print(f"saved → {OUTPUT}  ({len(prs.slides)} slides)")


if __name__ == "__main__":
    main()
