# Build State

| Field | Value |
| --- | --- |
| Project | TrigLab 3D — 20-Tab Trigonometry Master Booklet & SRS Learning Studio |
| Repository | <https://github.com/somphol/3d-trigonometry-master-booklet> |
| Live demo | <https://somphol.github.io/3d-trigonometry-master-booklet/> |
| Started | 2026-10-31 23:31:24 UTC |
| Completed | 2026-11-01 01:24:51 UTC |
| Duration | **1h 53m 27s** (6,807 seconds) |
| Harness | OpenCode 2.2.5 |
| Model | DeepSeek V4.1 Flash (`opencode-go/deepseek-v4.1-flash`) |
| Session | `ses_e6bb24505ffelmj1LvBX4VBJSx` |
| Source | 3 files · 9,040 lines · 399,554 bytes |
| Tested | 20 agendas, 100 story steps, 60 control guides, 20 checkpoints, 0 console errors |

## Token usage

| Metric | Tokens |
| --- | ---: |
| Input | 743,792 |
| Output | 236,508 |
| Reasoning | 173,697 |
| **Total (input + output + reasoning)** | **1,153,997** |
| Cache read | 127,564,928 |
| Cache write | 1,583 |
| Total including cache | 128,720,508 |

> Snapshot taken from the OpenCode session record when the project was packaged at 2026-11-01 01:24:51 UTC. The final state-file commit/push and closing response occur outside this snapshot, so the live session totals will be marginally higher.

## What was built

- `index.html`, `style.css`, and `script.js`: a dependency-light static application with no build step.
- **20 learning agendas** with 60 measurable objectives: understand the idea, read the model, and apply it.
- **100 guided-story steps** (five per chapter): the job, the scene, the trig idea in everyday words, the formula in action, and a guided experiment.
- **60 control guides** behind `?` buttons: what each slider changes, what to watch, and its trig focus. A live coach explains the result after every adjustment.
- **60 chapter-specific colour keys** and **20 formula decoders**. Cyan/magenta are only called cosine/sine when they actually represent a projection; otherwise the key names the real object. Chapter 1 keeps the robot joints neutral and puts the cyan 0° axis, magenta 90° axis, and yellow rotation arc on the floor.
- **A playable Chapter 1 pick-and-place game**: set the base angle, reach into Bin A or B, grab the glowing ball, carry it to the target bin, drop it, and score. The game reuses the same signed-angle concepts as the lesson and checkpoint.
- **20 checkpoint drills** explicitly aligned to objective 3, with progressive hint ladders, chapter-specific common-trap feedback, worked solutions, and an explain-it-back prompt.
- **20 interactive Three.js r128 scenes**, one per chapter, sharing a single WebGL context and lazy scene construction.
- **20 real-world simulators**: robotic arm, tire speedometer, clinometer, optical lens, wheelchair ramp, joystick, ATC radar, roof truss, AC generator, pendulum, lighthouse, radio tuner, ANC, river survey, coast guard SSA, aviation law of cosines, shader normal, projectile cannon, solar tracker, and GPS globe.
- **Accuracy pass**: corrected the ASTC reference-angle calculation, solar dot/cross-product outputs, reciprocal-ratio checkpoint, and chapter colour semantics.
- **Spaced repetition engine** with status, `lastReviewed`, `reviewCount`, `nextReviewDue`, expanding 1/3/7/30-day intervals, due badges, and a Due Today focus filter.
- **Portable progress**: automatic `localStorage` persistence plus `trig_srs_progress.json` download/upload with validation and cross-device restore.
- **Research-informed lesson design**: CRA sequencing, Predict–Observe–Explain, cognitive-load-aware chunking, worked examples, retrieval practice, misconception feedback, and self-explanation.
- **GitHub Pages deployment** with `.nojekyll`, MIT licence, third-party notices, README, and rendered screenshots.

## Verification

- Headless Chrome 156 rendered all 20 chapters at 1600 × 1200 and the responsive layout at 390 × 844.
- 20/20 learning agendas show three objectives and the recommended study sequence.
- 100/100 story steps were walked; 60/60 colour-key pop-ups, 60/60 control guides, and 20/20 formula decoders opened with the correct content.
- 20/20 legend sets were audited for chapter-specific colour meaning; no fallback explanations remained.
- The live coach updated with the correct observation after real slider changes on every chapter.
- All 20 checkpoints were solved through the real UI; progressive hints, misconception feedback, scores, review counts, status transitions, teach-back, and timestamps were verified.
- Chapter 1's pick-and-place game was played to a successful placement: grab, carry, drop, score increment, HUD update, and next-ball swap verified.
- Chapter 7 reference angles, Chapter 4 reciprocal-ratio prompts, and Chapter 19 dot/cross-product HUD outputs were checked against their formulas.
- JSON import/export round-trip verified.
- Real pointer clicks on colour keys, control help, formula pills, story navigation, and game buttons were verified.
- The live GitHub Pages URL, `style.css`, and `script.js` return HTTP 200, with the deployed script hash matching the local source.
- No uncaught exceptions or console errors.

## Learning design and sources

- Concrete → Representational → Abstract (CRA): 3D machine/game → colour/HUD/formula decoder → symbolic checkpoint.
- Predict–Observe–Explain: prediction in “Your turn”, observation via the live coach, explanation via “Explain it back”.
- Cognitive load and worked examples: five chunked steps, control help, hint ladder, full solution after effort.
- Retrieval practice and spacing: generative checkpoints plus 1/3/7/30-day SRS.
- Misconception research: chapter-specific “Common trap” feedback.
- Self-explanation: teach-back prompt after every correct checkpoint.
- Embodied practice: Chapter 1's pick-and-place game.

Sources are listed in [README.md](README.md#learning-design).

## Credits

Built with [OpenCode](https://opencode.ai) v2.2.5 and **DeepSeek V4.1 Flash** (`opencode-go/deepseek-v4.1-flash`). The curriculum, learning agendas, storytelling, control guides, simulators, exercises, SRS engine, interface, tests, and documentation were produced in a single agent session.

3D powered by [Three.js](https://threejs.org/) r128 and OrbitControls. Typography by Space Grotesk and JetBrains Mono (SIL Open Font License). See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
