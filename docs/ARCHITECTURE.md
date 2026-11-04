# Architecture

`3d-trigonometry-master-booklet` is a static, three-file learning studio with twenty
chapters, twenty lazily built Three.js scenes and a local spaced-repetition engine. This
map covers the parts that control behaviour: the curriculum data model, panel
construction, the shared viewer, grading, and persistence.

## 1. File map

| File | Lines | Contents |
| --- | ---: | --- |
| `index.html` | 179 | head/meta/fonts (1–30), ambient and shell (31–40), top bar (41–86), control deck (88–118), tab rail (120–124), due banner (126–130), module host (132), footer (134–146), toast/modal (148–156), boot screen (157–169), noscript (170–174), CDN scripts (175–177) |
| `style.css` | 1,823 | base/vars (1–76), ambient (77–109), shell (110–217), control deck (218–333), tab rail (334–457), module panel (458–544), story (545–705), agenda (706–774), control help/coach (775–871), checkpoint (872–918), viewport (919–1078), side column (1079–1120), simulator (1121–1292), exercise (1293–1510), footer (1511–1529), toasts (1530–1565), modal (1566–1699), boot (1700–1734), utility (1735–1746), responsive (1747–1823) |
| `script.js` | 7,052 | 16 numbered sections, listed below |
| `docs/social-card.png` | — | 1200 × 630 link preview |

`script.js` sections:

| § | Lines | Subject |
| ---: | --- | --- |
| 0 | 9–93 | constants, SRS intervals, utilities, solar geometry |
| 1 | 94–664 | `MODULES` — 20 chapter definitions, controls, HUD/readout hooks |
| 1b | 665–1632 | `NARRATIVES`, `LABEL_GUIDES`, story text, colour keys, formula decoders |
| 1c | 1633–2181 | `LESSONS`, guided experiments, per-control guides |
| 1d | 2182–2380 | `AGENDAS`, `MISCONCEPTIONS`, `storyFor` |
| 2 | 2381–2825 | twenty exercise generators |
| 3 | 2826–2859 | shared trigonometry helpers |
| 4 | 2860–3069 | Three.js scene toolkit |
| 5 | 3070–5299 | twenty `build…Scene` functions |
| 6 | 5300–5438 | SRS state engine |
| 7 | 5439–5590 | UI helpers, modals, review footer |
| 8 | 5591–6308 | tab/panel construction, story, keys, formula, arm game |
| 9 | 6309–6518 | exercise rendering, grading, hints, review logging |
| 10 | 6519–6703 | shared viewer |
| 11 | 6704–6899 | tab activation, due filter, import/export, dialogs |
| 12 | 6900–7052 | boot and event wiring |

## 2. Runtime state

```js
state = {
  version: 1,
  createdAt: ISO,
  score: number,
  totalReviews: number,
  tabs: {
    1: { status, lastReviewed, reviewCount, nextReviewDue },
    ...20
  }
}
```

The persisted SRS record uses key `triglab3d.progress.v1` (`script.js:13`). Module-level
session values hold the rest:

| Value | Purpose | Persisted? |
| --- | --- | --- |
| `simStates[id]` | current control values per chapter | no |
| `exercises[id]` | generated drill, answer, solution | no |
| `choices[id]`, `attempts[id]`, `hints[id]` | answer state | no |
| `storyStep[id]` | which of the five story steps is open | no |
| `activeTab`, `dueMode` | current chapter and due filter | tab via hash only |
| `speechUtterance`, `speechModule` | SpeechSynthesis session | no |
| `ARM_GAME` | chapter 1 pick-and-place state | no |

Defaults and helpers are in §6: `defaultState()` (5307), `normalizeState()` (5325),
`intervalDays()` (5353), `levelFor()` (5360), `isDue()` (5367), `dueCount()` (5373),
`masteredCount()` (5379), `badgeFor()` (5385), `loadState()` (5392), `saveStateNow()`
(5403).

## 3. Curriculum data model

`MODULES` (`script.js:98`) is the chapter table. Each entry has:

| Field | Meaning |
| --- | --- |
| `id`, `title`, `short`, `icon`, `accent` | identity and rail styling |
| `sim` | real-world simulator name |
| `formula` | formula pill text |
| `blurb`, `note` | chapter summary and simulator note |
| `legend[]` | chapter-specific colour-key labels |
| `controls[]` | slider/select/toggle definitions, ranges and defaults |
| `hud(s)`, `readout(s)` | live model strings derived from the current controls |
| `build(accent)` | returns `{scene, camera, target, update(t, s)}` |
| `exercise()` | generator returning the current drill |

The learning layer is indexed by the same ids:

| Data | Lines | Contents |
| --- | --- | --- |
| `NARRATIVES` | 670 | five-step story text per chapter |
| `LABEL_GUIDES` | 1472 | plain-English colour keys |
| `LESSONS` | 1637 | concept, guided experiment, control guides |
| `AGENDAS` | 2186 | three objectives and a checkpoint statement |
| `MISCONCEPTIONS` | 2349 | one common-trap note per chapter |
| `storyFor(id)` | 2372 | returns the five steps for a chapter |

The colour rule is deliberate: `legendColor()` and `LEGEND_COLOR_MAP` (5594) map a label
to cyan (cosine / x), magenta (sine / y), yellow (tangent/vector/beam) or green
(target/result), but each chapter's legend names the actual object. There is no universal
"cyan always means cosine" rule.

## 4. Panel construction and interactions

`buildTabsAndPanels()` (`script.js:5986`) runs once at boot:

1. For each module, create a `.tab-btn` with `role="tab"`, a status badge, title and
   accent.
2. Create a hidden `.module-panel` with `role="tabpanel"` containing:
   - the chapter hero and formula button;
   - the learning agenda (`AGENDAS[id]`, three `agenda-item` rows);
   - the guided story (`storyFor(id)`, five dots, Back/Next/Listen, colour key and
     lab-guide buttons);
   - the viewport card (`[data-slot=id]`, legend chips, HUD strip);
   - the simulator card (`meta.controls` via `controlMarkup()`, chapter 1 arm game,
     live coach, readout);
   - the checkpoint card (`[data-exercise=id]`, filled later by `renderExercise`).
3. Delegate clicks for story steps, colour keys, formula, control help and arm actions.
4. Wire tabs, control inputs, exercise buttons, modals and keyboard navigation.

`controlMarkup()` (5948) emits a range, select or toggle with a help button. Inputs carry
`data-key`, `data-type` and per-chapter ids (`ctrl-<id>-<key>`). The delegated `input`
handler updates `simStates`, the output label, `updateHud()` (5501), `updateReadout()`
(5515) and `updateLiveCoach()` (5870). The live coach is generated from the chapter's
control guide and current value.

`activateTab(id, opts)` (6707) hides every other panel, updates `aria-selected`/`tabIndex`,
replaces the hash, activates the 3D scene and focuses the answer input. The tab rail also
supports ArrowLeft/ArrowRight roving focus.
## 5. Shared Three.js viewer

`Viewer` (`script.js:6580`) owns:

- one `WebGLRenderer` with sRGB output, ACES tone mapping, exposure 1.08 and DPR capped
  at 2;
- one canvas, moved into the active `[data-slot]`;
- a `records` map of `{scene, camera, target, update}` per chapter;
- one `OrbitControls` instance (or a small `FallbackOrbit` if OrbitControls is missing);
- a single requestAnimationFrame loop.

`Viewer.init()` (6587) returns false when `window.THREE` is absent. `boot()` then writes
"Three.js CDN unavailable — exercises and SRS are still fully active" into the boot note
and inserts a fallback card in every viewport slot. `ensureRecord(id)` (6629) lazily calls
`meta.build(accent)`; a build failure is caught, logged, and replaced with an empty scene
so one bad chapter cannot kill the others. `activate(id)` (6658) moves the canvas, rebuilds
controls for that camera and resizes. `loop(ms)` (6685) updates only the active scene and
guards update errors with a one-time warning.

Scenes are authored against `simStates[id]`, so a control change is reflected on the next
animation frame without rebuilding the panel.

## 6. Exercises, grading and SRS

Each module's `exercise()` returns a fresh randomised drill:

```js
{
  prompt, context, givens: [[label, value], ...],
  answer, tol, unit,
  hint, solution: [step, ...],
  mode?: 'choice', choices?: [...], answerIndex?
}
```

`renderExercise(id)` (6312) writes the checkpoint, given chips, answer input or choice
buttons, Check/Hint/Show Steps actions, feedback, worked solution and teach-back area.
`checkAnswer(id)` (6391):

- numeric answers use `tol` or a 1e-6 relative tolerance;
- a correct answer increments `reviewCount`, sets `lastReviewed`, computes
  `nextReviewDue` with `intervalDays()`, becomes `Mastered` at 6 reviews, adds 10 points
  and one `totalReviews`, saves, and reveals the teach-back prompt;
- a wrong answer increments `attempts`, shows the chapter's `MISCONCEPTIONS` note, and
  opens the worked solution after two attempts.

`showHint()` (6479) is a three-level ladder: concept → formula and givens → first solution
step. `showSolution()` (6503) reveals the worked solution; reading it does not log a
review — the answer still has to be entered.

SRS intervals (`SRS_INTERVALS`, line 16): review 1 → +1 day; 2–3 → +3 days; 4–5 → +7
days; 6+ → +30 days. Badges are due (🟡), mastered (🟢), practicing (🔵) and new (🔴).
`refreshGlobalUI()` (5540) writes mastered/due/reviews/score, the progress bar and the due
banner.

## 7. Progress files

`saveProgressFile()` (6772) saves the current state and downloads:

```json
{
  "app": "TrigLab 3D — 20-Tab Trigonometry Master Booklet & SRS Learning Studio",
  "version": "1.0.0",
  "exportedAt": "…",
  "credits": { "engine": "OpenCode", "model": "DeepSeek V4.1 Flash", "three": "r128" },
  "state": { "version": 1, "score": 0, "totalReviews": 0, "tabs": { "1": { … } } }
}
```

`importProgressFile(file)` (6793) rejects files over 2 MB, accepts the wrapper or a bare
state, requires a `tabs` or `score` field, runs `normalizeState()`, saves, refreshes the
global UI and all review footers, updates the active level tag, and reports the imported
review/mastered/score counts. `resetProgress()` (6829) replaces the state with defaults
after confirmation.

## 8. Data flow

```text
MODULES + NARRATIVES + LABEL_GUIDES + LESSONS + AGENDAS + MISCONCEPTIONS
        ↓
buildTabsAndPanels() → 20 tabs + 20 panels
        ↓
activateTab(id) → Viewer.activate(id) → ensureRecord(id) → meta.build()
        ↓
control input → simStates → updateHud / updateReadout / updateLiveCoach
        ↓
meta.exercise() → renderExercise() → checkAnswer()
        ↓
state.tabs[id] + score + totalReviews → saveStateNow() → localStorage
        ↓
refreshGlobalUI() → badges, due count, progress bar
```

Story, colour-key, formula, control-help and teach-back are DOM-only paths; they do not
touch the SRS record.

## 9. Change guide

| To change… | Touch | Watch out for |
| --- | --- | --- |
| Chapter list or controls | `MODULES`, `controlMarkup`, scene `build` | ids must stay 1–20 and match every learning array |
| Story copy | `NARRATIVES`, `storyFor`, story markup | exactly five steps per chapter; dots and counters assume it |
| Objectives | `AGENDAS` | three objectives per chapter; the third is the checkpoint statement |
| Colour meaning | chapter `legend`, `LABEL_GUIDES`, `LEGEND_COLOR_MAP` | do not impose a universal cyan/magenta rule |
| Simulator | `build…Scene`, `simStates`, `hud`/`readout` | update errors are swallowed; test the active tab |
| Exercise | generator in §2, `MISCONCEPTIONS`, `AGENDAS.checkpoint` | random prompts; tolerance and units must match |
| SRS behaviour | §6 intervals, `normalizeState`, `badgeFor` | migration needed if the storage schema changes |
| Progress file | `saveProgressFile`, `importProgressFile` | keep wrapper/bare-state support and validation |
| UI theme | `style.css` block map | Thai/emoji line height and 390 px layout |
| 3D viewer | `Viewer`, `FallbackOrbit` | one context only; keep the CDN fallback path |
| Add a chapter | all six data arrays + generator + scene + legend | TAB_COUNT and rail layout are fixed at 20 |

Keep the app static: three files, CDN Three.js, no build server, no backend, no
analytics. A change that needs any of those is a product decision, not a refactor.
