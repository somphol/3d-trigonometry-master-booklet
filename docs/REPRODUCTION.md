# Reproduction book

How to rebuild **TrigLab 3D — 20-Tab Trigonometry Master Booklet & SRS Learning Studio**
from scratch, or re-verify that a rebuild matches the published release. Read
[ARCHITECTURE.md](ARCHITECTURE.md) first for the data model and viewer.

> **The source is the truth.** `main` at HEAD is the release. There is no bundle, package
> manager or tagged version. Rebuild only when the files are unavailable or you
> deliberately want a variant.

## 1. What is being reproduced

A static, three-file trigonometry learning studio:

- **Twenty chapters** on a scrollable tab rail: angles, radians, SOH CAH TOA, reciprocal
  ratios, inverse functions, unit circle, ASTC, special triangles, sine/cosine graphs,
  tangent asymptotes, amplitude/period, phase, laws of sines and cosines, the ambiguous
  case, the Pythagorean identity, double angles, 3D vectors and spherical coordinates.
- **Twenty real-world simulators**, one per chapter: robot arm, tire speedometer,
  clinometer, optical lens, wheelchair ramp, joystick, ATC radar, roof truss, AC generator,
  pendulum, lighthouse, radio tuner, noise cancellation, river survey, coast guard SSA,
  aviation law of cosines, shader normal, projectile cannon, solar tracker and GPS globe.
- **Learning layer per chapter** — three measurable objectives, a four-step study
  sequence, a five-step guided story, per-control help (60 guides), a live coach, a
  chapter-specific colour key, a formula decoder and a common-trap note.
- **Twenty generative checkpoints** with numeric or multiple-choice answers, a three-level
  hint ladder, a worked solution after effort, misconception feedback and an
  explain-it-back prompt.
- **Chapter 01 pick-and-place game** — set the base, shoulder and elbow, grab the glowing
  ball from Bin A, carry it to Bin B, drop it and score.
- **SRS engine** — status, last review, review count and next due date, with 1/3/7/30-day
  intervals, due filter, badges, score and global progress.
- **Portable progress** — automatic `localStorage` plus `trig_srs_progress.json`
  export/import with validation.
- **Delivery** — `index.html` + `style.css` + `script.js`; Three.js r128 and OrbitControls
  from CDNs; no build, backend, analytics or CI. If Three.js fails, drills and SRS remain
  usable and each viewport shows a fallback card.

## 2. Requirements matrix

| # | Requirement | Implementation | Where |
| ---: | --- | --- | --- |
| 1 | Twenty chapters and tabs | `MODULES`, `buildTabsAndPanels`, `activateTab` | `script.js` |
| 2 | One 3D simulator per chapter | twenty `build…Scene` functions, `Viewer` | `script.js` |
| 3 | Three objectives per chapter | `AGENDAS` | `script.js` |
| 4 | Five-step guided story | `NARRATIVES`, `storyFor`, `setStoryStep` | `script.js` |
| 5 | Per-control help and live coach | `LESSONS`, `controlMarkup`, `updateLiveCoach` | `script.js` |
| 6 | Chapter-specific colour keys | `LABEL_GUIDES`, `legendColor`, `openVisualKey` | `script.js` |
| 7 | Formula decoder | `MODULES.formula`, `openFormula` | `script.js` |
| 8 | Generative checkpoint per chapter | twenty generators, `renderExercise` | `script.js` |
| 9 | Grading, hints, solution, teach-back | `checkAnswer`, `showHint`, `showSolution` | `script.js` |
| 10 | Chapter 01 pick-and-place game | `ARM_GAME`, arm scene, arm buttons | `script.js`, `index.html` |
| 11 | SRS status and due scheduling | §6 state engine, 1/3/7/30 intervals | `script.js` |
| 12 | Score, reviews, mastered/due HUD | `refreshGlobalUI` | `script.js` |
| 13 | Progress persistence | `triglab3d.progress.v1` | `localStorage` |
| 14 | Portable JSON export/import | `saveProgressFile`, `importProgressFile` | `script.js` |
| 15 | 3D failure fallback | `Viewer.init` false path, slot cards | `script.js` |
| 16 | Responsive layout | CSS 1747–1823 | `style.css` |
| 17 | Speech narration | `speakStory`, SpeechSynthesis | `script.js` |
| 18 | Static Pages delivery | root files, `.nojekyll`, CDN scripts | repository root |

## 3. Build order

1. **Shell** — head/meta/fonts, ambient background, top bar, control deck, tab rail, due
   banner, module host, footer, toast/modal, boot screen.
2. **Theme** — dark STEM design system, panels, viewport, story, agenda, controls,
   checkpoint, responsive breakpoints at 1280/1100/820/520 px.
3. **Curriculum table** — `MODULES` with ids, titles, simulators, formulas, legends,
   controls, HUD/readout hooks and build/exercise references.
4. **Learning layer** — `NARRATIVES`, `LABEL_GUIDES`, `LESSONS`, `AGENDAS`,
   `MISCONCEPTIONS`, `storyFor`.
5. **Scenes** — twenty `build…Scene` functions against the shared toolkit.
6. **Viewer** — one renderer, one canvas, lazy records, OrbitControls fallback, loop.
7. **Panels** — `buildTabsAndPanels`, `controlMarkup`, story/keys/formula/arm delegation.
8. **Exercises** — twenty generators, `renderExercise`, grading, hint ladder, solution,
   teach-back.
9. **SRS** — default state, normalisation, intervals, badges, due count, save/load.
10. **Progress files** — export wrapper, import validation, reset.
11. **Chrome wiring** — tabs, hash, due filter, keyboard, modals, speech, onboarding.
12. **Verification and docs** — DOM audit, all-tab scene smoke, one full checkpoint,
   screenshots, README, this set.

## 4. Acceptance checks

A rebuild is done when all of these pass:

1. `python3 -m http.server 8123` serves the page; the boot screen clears and Chapter 01
   opens.
2. The DOM contains **20 tabs, 20 panels, 60 agenda items, 100 story step dots, 60
   control-help buttons and 20 exercise bodies**.
3. Activating each of the 20 tabs builds a canvas in that panel's viewport slot; no
   chapter silently falls back when the CDN is available.
4. The formula pill, colour key and a control-help button each open a modal with the
   correct chapter content.
5. Story **Next** moves `1 / 5` to `2 / 5` and changes the title.
6. A checkpoint shows a prompt, givens, answer input, Check/Hint/Show Steps and feedback;
   a hint produces the concept-level message.
7. Answering correctly awards **+10**, logs review 1, sets status **Practicing**, schedules
   the next review **+1 day**, shows the teach-back prompt, updates the global reviews and
   score, and writes the tab to `localStorage`.
8. A later review follows 1 → 3 → 7 → 30 days and reaches **Mastered** at 6 reviews.
9. Save downloads `trig_srs_progress.json`; load restores score, reviews, badges and due
   count.
10. With the Three.js CDN blocked, all 20 panels still build, exercises remain usable, and
    every viewport shows the fallback card.
11. At 390 × 844 the document has no horizontal overflow and the controls remain readable.
12. The live `index.html` and `script.js` SHA-1 hashes match the local files.
13. No uncaught exceptions or console errors during boot or the audit.

Record what you actually ran in [TESTING.md](TESTING.md), including what you did not
re-run.

## 5. Provenance

| Item | Value |
| --- | --- |
| Initial build | `3455d0e` "feat: TrigLab 3D — 20-tab trigonometry master booklet" |
| Learning layer | `d44e789` "feat: add learning agendas, 5-step lessons, control guides, and checkpoints" |
| Stories, keys, formula decoders | `65bf204` "feat: add guided stories, colour-key pop-ups, and formula decoders" |
| Accuracy and arm game | `2cd9103` "feat: accurate chapter keys, playable arm challenge, and concept audit" |
| Repository docs and community files | `b18d206` "docs: add complete repository documentation and community files" |
| Release docs | this commit (`AGENTS.md` + `docs/`) |
| Three.js | r128, MIT, cdnjs |
| OrbitControls | r128, MIT, jsDelivr |
| Fonts | Space Grotesk, JetBrains Mono, Google Fonts, SIL OFL 1.1 |
| Author | Somphol Boonjing, MIT |

There is no tagged release and no build artefact. `CHANGELOG.md` is the change record;
`STATE.md` / `state.json` are the 2026-10-31 build receipt and are not regenerated by
later commits.
