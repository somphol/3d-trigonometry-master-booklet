# AGENTS.md — TRIGLAB 3D

> Handoff for the next maintainer or agent. Rebuild detail is in
> [docs/REPRODUCTION.md](docs/REPRODUCTION.md); the technical map is
> [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 1. What this is

A static, three-file **20-chapter trigonometry booklet and spaced-repetition studio**.
`index.html` supplies the shell, `style.css` the dark STEM theme, and a 7,052-line IIFE in
`script.js` builds twenty module panels. Each chapter has a learning agenda (three
objectives), a five-step guided story, a live Three.js r128 engineering simulator with
per-control help and a live coach, a colour key, a formula decoder, a generated checkpoint
drill with hints/worked solution/teach-back, and SRS metadata. Chapter 01 adds a playable
pick-and-place robot-arm game. Progress is a versioned `localStorage` record plus a
portable `trig_srs_progress.json` export/import.

It is **not** an accredited curriculum or a substitute for a teacher, not a server-backed
LMS, not multiplayer, and **not offline-capable for 3D**: Three.js, OrbitControls and
Google Fonts load from CDNs. If Three.js fails, the drills and SRS still work and the
viewports show a fallback message (verified). **Only SRS progress persists**; control
values, story step, generated exercise and filter state reset on reload.

Live copy: <https://somphol.github.io/3d-trigonometry-master-booklet/>. Local master:
`~/Projects/3d-trigonometry-master-booklet`. App version **1.0.0** (`script.js:12`); there
is no git tag. Latest source commit at the time of writing: `b18d206`.

## 2. Commands

```bash
cd ~/Projects/3d-trigonometry-master-booklet

# run — a server is recommended for history/localStorage behaviour
python3 -m http.server 8123
open http://localhost:8123/

# headless smoke: 20 tabs, 20 panels, 60 objectives, 100 story steps
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --use-angle=metal --mute-audio \
  --virtual-time-budget=15000 --timeout=30000 \
  --dump-dom "http://localhost:8123/" > /tmp/trig-dom.html
grep -o 'role="tab"' /tmp/trig-dom.html | wc -l
grep -o 'data-story-step' /tmp/trig-dom.html | wc -l

# one full view
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --use-angle=metal --mute-audio \
  --virtual-time-budget=15000 --timeout=30000 --window-size=1600,1200 \
  --screenshot=/tmp/trig.png "http://localhost:8123/"

# live probe and source match
curl -s -o /dev/null -w '%{http_code}\n' https://somphol.github.io/3d-trigonometry-master-booklet/
shasum index.html style.css script.js

# deploy — Pages serves the repository root of main; no workflow
git push origin main
```

There is **no self-test panel and no `window` debug handle**; verification is DOM
inspection plus real UI interaction. The 20 scenes share one WebGL context and are built
lazily when a tab is activated. Evidence is in [docs/TESTING.md](docs/TESTING.md).

## 3. Architecture

| File | Lines | Role |
| --- | ---: | --- |
| `index.html` | 179 | head/meta/fonts (1–30), ambient background (31–37), app shell and top bar (39–86), control deck (88–118), tab rail (120–124), due banner (126–130), module host (132), footer (134–146), toast/modal (148–156), boot screen (157–169), noscript (170–174), CDN scripts (175–177) |
| `style.css` | 1,823 | base/vars (1–76), ambient (77–109), shell (110–217), control deck (218–333), tab rail (334–457), module panel (458–544), guided story (545–705), agenda (706–774), control help/coach (775–871), checkpoint (872–918), viewport (919–1078), side column (1079–1120), simulator (1121–1292), exercise (1293–1510), footer (1511–1529), toasts (1530–1565), modal (1566–1699), boot (1700–1734), utility (1735–1746), responsive (1747–1823) |
| `script.js` | 7,052 | 16 numbered sections listed below |
| `docs/social-card.png` | — | 1200 × 630 link preview |
| `STATE.md`, `state.json` | 79 / — | historical build receipt |

`script.js` sections:

| § | Lines | Subject |
| ---: | --- | --- |
| 0 | 9–93 | constants, utilities, solar geometry |
| 1 | 94–664 | `MODULES` — 20 chapter definitions, controls, HUD, exercise hook |
| 1b | 665–1632 | `NARRATIVES`, `LABEL_GUIDES`, story texts, colour keys, formula decoders |
| 1c | 1633–2181 | `LESSONS` — concept, guided experiment, control guides |
| 1d | 2182–2380 | `AGENDAS` and `MISCONCEPTIONS` |
| 2 | 2381–2825 | twenty generative exercise generators |
| 3 | 2826–2859 | shared trigonometry helpers |
| 4 | 2860–3069 | Three.js scene toolkit |
| 5 | 3070–5299 | twenty `build…Scene` functions |
| 6 | 5300–5438 | SRS state, intervals, normalisation, persistence |
| 7 | 5439–5590 | small UI helpers, modals, review footer |
| 8 | 5591–6308 | tab and panel construction, story/keys/formula/arm interactions |
| 9 | 6309–6518 | exercise rendering, grading, hints, review logging |
| 10 | 6519–6703 | shared viewer: one renderer, 20 lazy scenes |
| 11 | 6704–6899 | tab activation, due filter, import/export, dialogs |
| 12 | 6900–7052 | boot and event wiring |

Key paths:

- **State** — `APP_VERSION` and `STORAGE_KEY = "triglab3d.progress.v1"` at
  `script.js:12–13`; `TAB_COUNT = 20`, SRS intervals 1/3/7/30 days and level names at
  14–17. `state`, `simStates`, `exercises`, `choices`, `attempts`, `hints` and
  `storyStep` are module values around 5420–5438.
- **Curriculum data** — `MODULES` (`script.js:98`) is the single chapter table: id, title,
  sim, formula, blurb, legend, controls, HUD function, readout, `build` and `exercise`.
  `NARRATIVES`/`LABEL_GUIDES` (670/1472), `LESSONS` (1637), `AGENDAS` (2186),
  `MISCONCEPTIONS` (2349) and the generators (2381) supply the learning layer.
- **Build** — `buildTabsAndPanels()` (`script.js:5986`) creates 20 tab buttons and 20
  hidden panels, including agenda, story, viewport slot, controls, arm game (chapter 1)
  and exercise body. `boot()` (6986) builds them, binds chrome, initialises the viewer,
  activates the hash tab, hides the boot screen and shows the welcome briefing once.
- **3D viewer** — `Viewer` (`script.js:6519`) owns one `WebGLRenderer`, one camera and
  one resize/controls setup. It keeps a `records` map of per-scene state and lazily builds
  the active chapter. `Viewer.activate(id)` swaps the canvas into the active
  `.viewport-slot`. If `window.THREE` is missing, `Viewer.init()` returns false and each
  slot gets a "3D engine couldn't load" fallback.
- **Story** — `storyFor(id)` (2372), `setStoryStep()` (5742), `speakStory()` (5699)
  using SpeechSynthesis, colour keys `openVisualKey()` (5777), formula decoder
  `openFormula()` (5898), control help `openControlHelp()` (5832).
- **Exercises** — twenty generators under section 2 return
  `{prompt, context, givens, answer, tol, unit, hint, solution, mode?, choices?}`.
  `renderExercise()` (6312) paints the checkpoint; `checkAnswer()` (6391) grades numeric
  or multiple-choice answers, logs the review, updates SRS and saves.
- **SRS** — `normalizeState()` (5325), `intervalDays()` (5353), `levelFor()` (5360),
  `isDue()` (5367), `badgeFor()` (5385), `loadState()` (5392), `saveStateNow()` (5403).
  A correct answer increments `reviewCount`, sets `lastReviewed` and `nextReviewDue`,
  adds 10 points and refreshes the global stats.
- **Progress files** — `saveProgressFile()` (`script.js:6772`) exports
  `{app, version, exportedAt, credits, state}` as `trig_srs_progress.json`;
  `importProgressFile()` (6793) accepts the wrapper or a bare state, size-caps at 2 MB and
  normalises every field.
- **Tabs/filters** — `activateTab()` (6707) hides all but one panel, updates ARIA and
  hash, activates the scene and focuses the answer. `toggleDueFilter()` (6759),
  `jumpToNextDue()` (6748).

## 4. Decisions and constraints

- **Three static files, no build.** `index.html` + `style.css` + `script.js` are the
  delivery format. Do not introduce npm, modules, a bundler or a build step without a
  product decision.
- **Content is data, not markup.** Chapter copy lives in `MODULES`, `NARRATIVES`,
  `LABEL_GUIDES`, `LESSONS`, `AGENDAS` and `MISCONCEPTIONS`. Edit the arrays and keep the
  ids aligned; do not hand-edit generated panels.
- **Twenty chapters, twenty scenes, one WebGL context.** The viewer reuses one renderer
  and one canvas. Adding a chapter means a `MODULES` entry, a story, an agenda, a lesson,
  a misconception, a generator, a `build…Scene` and colour-key entries — not a new canvas.
- **Colour semantics are chapter-specific.** Cyan/magenta are cosine/sine only where the
  chapter actually projects a direction. `LEGEND_COLOR_MAP` and each chapter's `legend`
  are the contract; do not impose universal colour meanings.
- **Exercises are randomised on purpose.** Every render calls the generator again, so
  prompts and answers differ between loads. Reproducing an exact drill is not a goal.
- **The SRS schema is a contract.** Key `triglab3d.progress.v1`, version 1, fields
  `status`, `lastReviewed`, `reviewCount`, `nextReviewDue`, plus `score` and
  `totalReviews`. Intervals are 1/3/7/30 days; a change needs migration or a new key.
- **Only SRS persists.** Control values, story step, due filter, active exercise and
  teach-back text are session values. Do not imply full resume.
- **The 3D fallback is deliberate.** If Three.js is absent, drills and SRS must remain
  usable and each viewport must show the fallback message. Keep that path when editing
  the viewer.
- **Speech is optional.** `speakStory()` must degrade to a toast when
  `speechSynthesis` is unavailable.
- **Import is untrusted.** `normalizeState()` clamps counts, statuses, dates and score;
  keep validation when adding fields.
- **Google Fonts and the two script CDNs are remote.** There is no local Three.js or font
  copy, and the script tags have no SRI.
- **Docs-only changes should not touch the three source files.** Pages serves `main`
  directly; there is no staging build.

## 5. Known issues

- **No automated test suite or CI.** There is no self-test panel, no test runner and no
  workflow. The extensive verification in `STATE.md` was a one-off headless run; this
  release re-checked structure, one full checkpoint, one hint, dialogs and the CDN
  fallback, not all 20 drills.
- **Runtime CDN dependency.** Three.js, OrbitControls and Google Fonts are remote. The
  3D fallback works, but the page still labels the top bar "WebGL · SRS online" and the
  font/typography degrades if Google Fonts is blocked.
- **Only Chromium headless was verified.** Safari, Firefox, Edge, real iOS/Android, touch
  orbit/pinch, HiDPI and screen-reader output are unverified.
- **SRS progress is local to one browser profile.** There is no account or sync; the JSON
  file is the only transfer path. Private mode or blocked storage silently loses progress
  (the catch only logs a warning).
- **Partial session state.** Reloading keeps the SRS record and the tab hash but resets
  control values, story step, exercise instance, due filter and teach-back text.
- **Import trusts `status`.** `normalizeState()` forces `Mastered` when `reviewCount ≥ 6`
  but does not demote an imported `Mastered` with a low count. A hand-edited file can
  therefore show a mastered badge without the reviews.
- **The 3D canvas has an `aria-label`, but the experience is visual.** The agenda, story
  and controls are labelled; the 3D scene itself has no text alternative, and modals set
  `aria-modal` without a focus trap. No screen-reader pass was run.
- **Randomised drills are not reproducible.** A bug report needs the prompt, givens and
  answer shown on screen, not just the chapter number.
- **`STATE.md` is a historical receipt.** It records 9,040 lines / 399,605 bytes; the
  current three files are 9,054 lines / 400,906 bytes. It also repeats the earlier
  one-off verification claims.

## 6. Continuity

- Live: <https://somphol.github.io/3d-trigonometry-master-booklet/> (HTTP 200 at the time
  of writing).
- Pages: `main` branch, repository root, `.nojekyll` present, no Actions workflow.
- Repository: <https://github.com/somphol/3d-trigonometry-master-booklet>.
- Local master copy: `~/Projects/3d-trigonometry-master-booklet`.
- Initial build: commit `3455d0e` "feat: TrigLab 3D — 20-tab trigonometry master
  booklet".
- Learning layer expansion: commit `d44e789` "feat: add learning agendas, 5-step lessons,
  control guides, and checkpoints".
- Accuracy/game pass: commit `2cd9103` "feat: accurate chapter keys, playable arm
  challenge, and concept audit".
- Last source/state commit before the documentation release: `b18d206` "docs: add
  complete repository documentation and community files".
- Documentation release: the commit adding this file and `docs/`.
- Author: Somphol Boonjing, MIT. Three.js and OrbitControls are MIT; Space Grotesk and
  JetBrains Mono are SIL OFL. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
