# claude.ai Projects Knowledge — 업로드 자료 목록

## 필수 (Knowledge 칸에 반드시 올릴 것)

### 1. SSOD 브랜드 자산
| 파일 | 위치 | 용도 |
|---|---|---|
| `ssod-logo.svg` | `assets/ssod-logo.svg` | 표지·closing brand-mark |
| `ssod-logo.png` | `assets/ssod-logo.png` | PPTX 임베드 fallback |
| `ssod-logo-mono.svg` | `assets/ssod-logo-mono.svg` | 다크 슬라이드용 |

### 2. 앰버서더 배지
| 파일 | 위치 | 용도 |
|---|---|---|
| `notion-ambassador-badge.png` | `assets/notion-ambassador-badge.png` | s4 이중 앰버서더 punch |
| `notion-logo.png` | `assets/notion-logo.png` | s3 logo wall |
| `n8n_full_black_logo.svg` | `assets/n8n_full_black_logo.svg` | s4 이중 앰버서더 + s3 + s24 vessel |
| `n8n-amber-ssod-black.png` | `assets/n8n-amber-ssod-black.png` | n8n 앰버서더 배지 |

### 3. 도구 로고
| 파일 | 위치 | 용도 |
|---|---|---|
| `claude-logo.png` | `assets/claude-logo.png` | s5 활동 + s23 도구 grid |
| `microsoft-excel-new.png` | `assets/microsoft-excel-new.png` | s3 logo wall + s23 |

### 4. 폰트
- **Pretendard Variable** (https://github.com/orioncactus/pretendard)
- 직접 OTF/TTF 파일 업로드 권장 — claude.ai가 폰트명만으로 렌더링 불가
- Variable 단일 파일이면 충분, weight는 PPTX에서 컨트롤

### 5. 콘텐츠 자료 (current source of truth)
| 파일 | 위치 | 용도 |
|---|---|---|
| `script-v_final.md` (v9.1) | `lectures/03_sor_framework/script-v_final.md` | 발화 대본 + 비트 매핑 |
| `BNI_SoR_v_final_9_1.pptx` | `lectures/03_sor_framework/BNI_SoR_v_final_9_1.pptx` | reference 출력물 |
| `build_v9_pptx.py` | `lectures/03_sor_framework/build_v9_pptx.py` | 빌더 로직 — 디자인 토큰 참조 |

## 옵션 (필요할 때만)

### 6. 평가 로그 (라운드 2 검토 시)
- `~/.claude/team-evaluations/logs/20260525_bni-sor-v9-1-autonomous-rebuild.md`

### 7. v8 reference (이전 톤 비교용)
- `BNI_SoR_v_final_8.pptx` — v8차 23장 PNG 임베드 (편집 불가, 시각 reference)

### 8. SSOD 메모리 (특정 발화 컨텍스트 필요 시)
- `~/.claude/projects/-Users-kimjimyoung-Documents-projects-active-SSOD/memory/feedback_ssod_seminar_design_principles.md` — SSOD 9원칙
- `~/.claude/projects/-Users-kimjimyoung-Documents-projects-active-SSOD/memory/feedback_dual_ambassador_punch.md` — 이중 앰버서더 패턴
- `~/.claude/projects/-Users-kimjimyoung-Documents-projects-active-SSOD/memory/feedback_dual_business_model.md` — 듀얼 모델 룰

## 업로드 명령 (참고)

claude.ai 웹 UI에서 Knowledge 패널에 드래그&드롭 또는 첨부 버튼 사용.
파일 크기 제한 있음 — PPTX 1.0MB 이내, 폰트 OTF 5MB 이내 권장.

## 자산 묶음 ZIP 만들기 (옵션)

```bash
cd /Users/kimjimyoung/Documents/projects/bni-edu/ppt_team_agent/lectures/03_sor_framework
zip -r bni-w22-knowledge.zip assets/ script-v_final.md BNI_SoR_v_final_9_1.pptx build_v9_pptx.py
# 결과: bni-w22-knowledge.zip — 한 번에 claude.ai에 업로드
```
