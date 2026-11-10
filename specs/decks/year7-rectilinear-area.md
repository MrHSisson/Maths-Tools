# Area of rectilinear shapes — Year 7 top set
**Status:** implemented
**Length:** 60 minutes; practice and worksheet can continue next lesson.
**Starting point:** pupils know rectangle area and are new to rectilinear shapes.
**Agreed requirements:** no retrieval starter; large board labels; reduced labels throughout; missing lengths by addition/subtraction mid-lesson; removal of cut-outs introduced through discussion; authored scaffolded worksheet with answers.

| Minutes | Activity | Intended evidence |
| --- | --- | --- |
| 0–5 | Objective, formal definition, suggest a split | Pupils identify rectangles inside the original shape |
| 5–13 | Model split/add; compare two valid splits | Every part counted once; multiply within rectangles, then add |
| 13–24 | Six authored questions, then optional live/offline general practice | Transfer through rotated, reflected, T and staircase outlines |
| 24–35 | Missing-length models and six authored questions; optional generator | Use addition before subtraction; find the marked length before area |
| 35–43 | Discuss removing the 3 × 2 corner from the 8 × 6 rectangle; choose an efficient method | Explain why 48 − 6 and 32 + 10 both give 42 cm² |
| 43–57 | Twelve authored worksheet questions | Fading prompts and supplied splits; later unknown lengths and method choice |
| 57–60 | New area question and explanation | Accurate length/area units and a justified method |

## Authored ladder and traps
| Set | Ladder | Traps checked |
| --- | --- | --- |
| Board A, 6 | Split provided → identify dimensions → rotation/reflection → T → three rectangles | Area vs perimeter; multiplying two lengths from different rectangles; omitting a region; enclosing rectangle includes extra area |
| Board B, 6 | Addition → rotated addition → subtraction → reflection → independent mixed orientation | Using the whole length for a part; adding instead of subtracting; stopping after finding the missing length |
| Worksheet, 12 | Four prompted splits → four supplied splits with working space → four independent questions | Unknown lengths first; choose efficient method; cm vs cm² |

Whole centimetres only. Worksheet questions differ from the board questions and have distinct answers. Authoring uses Q.rectilinear and the tool's canonical solution; answers are independently checked using polygon area and boundary lengths. Ordinary discussion checks are used, not new Depth cards. No Depth bank is required for this lesson.

The PowerPoint will use separate question/build/answer slides so it is reliable offline. The shared editor deck contains live generator slides. PowerPoint general practice includes fixed offline backup questions.

## Deliverables and verification
- Offline PowerPoint: 59 slides, including optional practice, separate answer reveals and teacher notes.
- Print: three-page pupil worksheet, three-page worked answers and two-page teacher guide.
- Shared editor draft: `year7-rectilinear-area`, 17 slides, two live generators and pinned authored worksheet. Not published.
- All 34 shapes independently checked by polygon area, rectangle sums/removals and missing edge lengths; authored content checks pass.
- `year7-rectilinear-export.tsx` exports shared-renderer SVGs and canonical question data. `_check/year7-rectilinear-export.py --work <directory>` builds files from `lesson-bundle.json` and `lesson-assets/` (python-pptx, reportlab, Pillow).

Re-export with the app running: `SMOKE_URL=http://localhost:5173 node specs/decks/_check/year7-rectilinear-assets.cjs work/year7-lesson`, then `python specs/decks/_check/year7-rectilinear-export.py --work work/year7-lesson`. Set `PLAYWRIGHT_PATH` and `CHROMIUM_PATH` if installed outside the project. Convert the resulting PPTX to PDF with LibreOffice if a slide PDF is required.
