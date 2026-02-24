@prd.md @activity.md

We are building a lecture PPT through a multi-agent pipeline according to the PRD in this repo.

First read activity.md to see what was recently accomplished.

## Work on Tasks

Open prd.md and find the single highest priority task where `"passes": false`.

Work on exactly ONE task:
1. Read the task steps carefully
2. Implement the task following each step in order
3. Verify the output files exist and are valid

### Task-specific Instructions

**Task 1 (research):**
- Read `output/20260224-213637-9b7d/lecture-spec.json` and extract all `dataRequirements`
- Use WebSearch to find real data for each claim (Korean + English searches)
- Use WebFetch to verify source pages and extract exact data
- Cross-validate with at least 2 sources per claim
- Generate `output/20260224-213637-9b7d/research-report.json` following `schemas/research-report.schema.json`
- Do NOT fabricate data. If you cannot find data, mark `verified: false` and provide `confidence` score

**Task 2 (infographic):**
- Run: `node scripts/generate_infographic.cjs --input output/20260224-213637-9b7d/lecture-spec.json --output-dir output/20260224-213637-9b7d/infographics --manifest output/20260224-213637-9b7d/asset-manifest.json`
- If the infographicData in lecture-spec needs updating with research findings, update it first
- Verify PNG files were generated in `output/20260224-213637-9b7d/infographics/`

**Task 3 (image-generation):**
- Check if `GEMINI_API_KEY` is set
- If yes: `node scripts/generate_images.cjs --input output/20260224-213637-9b7d/lecture-spec.json --output-dir output/20260224-213637-9b7d/images --manifest output/20260224-213637-9b7d/asset-manifest.json`
- If no API key: Create a fallback dark gradient image (960x540) using Sharp directly:
  ```
  node -e "const sharp=require('sharp');sharp({create:{width:960,height:540,channels:4,background:{r:26,g:26,b:26,alpha:1}}}).png().toFile('output/20260224-213637-9b7d/images/slide-03-bg.png')"
  ```
- Update asset-manifest.json with the generated image

**Task 4 (assembly):**
- Read `.claude/skills/design-skill/SKILL.md` for design templates and rules
- Read lecture-spec.json, research-report.json, and asset-manifest.json
- Generate 12 HTML slides (slide-01.html to slide-12.html) in `output/20260224-213637-9b7d/slides/`
- Rules: 720pt x 405pt, Pretendard font CDN, no CSS gradients, text only in p/h1-h6/ul/ol tags
- Slides 7,8: embed user screenshots from `user-assets/` using relative path `../user-assets/filename.png`
- Infographic/image slides: embed PNGs from `../infographics/` or `../images/` using relative paths
- After HTML generation, run: `node build_pptx.cjs --slides-dir output/20260224-213637-9b7d/slides --output output/20260224-213637-9b7d/final.pptx --title "AI시대, 결국 남는 것"`

**Task 5 (qa):**
- Run: `node scripts/qa_validate.cjs --slides-dir output/20260224-213637-9b7d/slides --spec output/20260224-213637-9b7d/lecture-spec.json --output output/20260224-213637-9b7d/qa-report.json`
- Read qa-report.json and fix any failing slides
- Re-run qa_validate.cjs after fixes
- If overallPass is true, re-run build_pptx.cjs to regenerate final PPTX
- Repeat fix loop up to 3 times max

## Log Progress

Append a dated progress entry to activity.md describing:
- What task you worked on
- What you changed / generated
- Commands you ran and their results
- Any issues encountered and how you resolved them

## Update Task Status

When the task is confirmed working, update that task's `"passes"` field in prd.md from `false` to `true`.

## Commit Changes

Make one git commit for that task only:
```
git add .
git commit -m "pipeline: [brief description of what was done]"
```

Do NOT run `git init`, do NOT change git remotes, and do NOT push.

## Important Rules

- ONLY work on a SINGLE task per iteration
- Tasks must be done in order (1 → 2 → 3 → 4 → 5)
- Always log your progress in activity.md
- Always commit after completing a task
- Do NOT fabricate research data - use real web searches
- Follow the design-skill rules strictly for HTML slides

## Completion

When ALL tasks have `"passes": true`, output:

<promise>COMPLETE</promise>
