# BNI SoR v3 Deck — 사진 배치 가이드

발표 deck `BNI_SoR_v3_claude.html`에 사진을 삽입하는 방법과 권장 사진 톤 정리.

## 현재 사진 슬롯 (5개)

| 슬롯 | 위치 | 비율 | 톤 |
|---|---|---|---|
| s10 photo 01 | photo wall 좌측 첫 카드 | 4:5 | Notion Camp HR 워크숍 (본사 협업, 발표자 등장 가능) |
| s10 photo 02 | photo wall 두 번째 | 4:5 | 상장사·중견기업 onsite 컨설팅 (화이트보드·회의 장면) |
| s10 photo 03 | photo wall 세 번째 | 4:5 | n8n·Notion 공식 행사 강연 (무대·발표) |
| s10 photo 04 | photo wall 네 번째 | 4:5 | 자유 슬롯 (유튜브 channel mosaic·고객사 단체사진 등) |
| s11 closing | closing 우측 | 3:2 | 발표 현장·동료적 분위기·단체 사진 가능 |

## 활성화 방법 (2단계)

각 `.photo-slot` div에 두 가지를 추가하면 placeholder가 사진으로 즉시 교체됩니다.

```html
<!-- BEFORE (현재 placeholder 상태) -->
<div class="photo-slot">
  <div class="photo-slot-inner">
    <span class="photo-slot-label">Photo 01</span>
    <span class="photo-slot-hint">Notion Camp HR<br>2025-12 · 본사 협업</span>
  </div>
</div>

<!-- AFTER (사진 활성화) -->
<div class="photo-slot has-photo"
     style="background-image: url('photos/notion-camp.jpg')">
  <div class="photo-slot-inner">
    <span class="photo-slot-label">Photo 01</span>
    <span class="photo-slot-hint">Notion Camp HR<br>2025-12 · 본사 협업</span>
  </div>
</div>
```

**핵심**:
1. `class="photo-slot"` → `class="photo-slot has-photo"` (클래스 추가)
2. `style="background-image: url('photos/파일명.확장자')"` (inline style 추가)

`.has-photo` 클래스가 자동으로 placeholder inner 텍스트를 숨기고 `background-size: cover` `background-position: center` 적용.

## 추천 사진 폴더 구조

```
lectures/03_sor_framework/
  ├── BNI_SoR_v3_claude.html
  ├── assets/                 (이미 존재 — ambassador 배지·icon·로고)
  ├── photos/                 (신설 권장)
  │   ├── notion-camp.jpg
  │   ├── consulting-onsite.jpg
  │   ├── seminar-stage.jpg
  │   ├── youtube-mosaic.jpg
  │   └── closing-photo.jpg
  └── ...
```

각 사진 권장 해상도: 최소 **1200x1500** (4:5 카드) / **1800x1200** (3:2 closing). JPG/PNG 모두 OK. WebP는 발표 환경 호환성 점검 후 권장.

## NDA 안전 가이드 (필수)

deck는 NDA 보호 사례를 다루므로 사진도 다음 5종 단어·요소 회피:

- 회사 로고·간판·매장명 노출 → **블러 처리 또는 회피 각도**
- 명함·문서·화면 텍스트 → **모자이크 또는 비식별 각도**
- 청중·동료 얼굴 → **모자이크 또는 동의 확인 후 사용**
- 매장 외관·상품 사진 → **유아동·키즈·베이비·135·9개월** 단어 누출 0
- 정보 흐름 도식 → **DW·ClickHouse·AX** 등 약어 누출 0

## 추가 사진 배치 가능 위치 (라운드 4 Visual Storyteller 제안)

향후 더 사진 넣고 싶을 때 옵션. 각 추가는 slide layout 미세 재구성 필요:

### 옵션 A — s1 cover 우측 빈 공간 (발표자 프로필)
- **자리**: cover 본문 우측 (현재 ambassador 배지 외 빈 공간)
- **사진**: 김지명 반신 프로필샷 (다크 BG, 인물 단독)
- **효과**: 첫 인상 발표자 인지 강화. BNI 멤버 referral 시 시각 mental hook
- **작업**: cover 본문 layout 2-col grid 재구성 필요 (현재 flex column)

### 옵션 B — s7 take-away slogan dark slide
- **자리**: slogan 풀스크린 우측 또는 하단
- **사진**: Notion·n8n ambassador 인증 메일/페이지 캡쳐 또는 행사 무대
- **효과**: 자격 증명 시각 climax. 단 slogan 강도 약화 위험
- **작업**: 신중 검토 — slogan만으로 climax 충분할 수 있음

### 옵션 C — s9 AI 시대 stat3 옆
- **자리**: stat3 카드 옆 또는 take-away bar 위
- **사진**: Gartner 2026 리포트 표지 / Palantir Ontology 도식 thumbnail
- **효과**: 출처 시각화. 단 stat 카드와 시각 충돌 가능
- **작업**: stat-grid 4-col로 확장 또는 별도 inset

## 활성화 작업 순서 권장

1. **photos/ 폴더 생성** — `mkdir lectures/03_sor_framework/photos`
2. **사진 5장 준비** (또는 일부만) — 위 추천 톤 매트릭스 참고
3. **NDA 점검** — 위 5종 단어·요소 회피 확인
4. **HTML 5개 슬롯 활성화** — `has-photo` 클래스 + inline `background-image` URL
5. **브라우저 재로드** + 슬라이드별 사진 fit 확인
6. **빔 프로젝터 테스트** (선택) — 실제 발표 환경 1920x1080에서 사진 가독성 확인

## 활성화 후 검증 체크리스트

- [ ] 사진 5장 모두 `has-photo` 클래스 적용
- [ ] inline `background-image` URL이 photos/ 폴더 상대 경로
- [ ] NDA 금지 5종 단어·요소 누출 0건
- [ ] 빔 환경 대비 충분 (사진이 너무 어둡거나 텍스트 가독성 떨어지지 않는지)
- [ ] 사진 비율 카드와 매칭 (4:5 또는 3:2 — `object-fit: cover` 자동 처리)
- [ ] photo-slot-inner 텍스트 자동 숨김 동작 확인 (placeholder 텍스트 비노출)
