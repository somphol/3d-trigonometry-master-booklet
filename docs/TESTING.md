# Testing

## Status of this release

| Evidence | When | Result |
| --- | --- | --- |
| Local DOM audit | 2026-11-03 | **20 tabs, 20 panels, 60 agenda items, 100 story steps, 60 control guides, 20 exercises** |
| All-tab scene smoke (CDP) | 2026-11-03 | **20/20 tabs build a canvas in their viewport** |
| Console exceptions during audit | 2026-11-03 | **0** |
| Control/coach interaction | 2026-11-03 | base 30° → 45°; HUD, readout and live coach all updated |
| Formula / colour-key / control-help modals | 2026-11-03 | **all opened with the correct chapter content** |
| Story navigation | 2026-11-03 | **1 / 5 → 2 / 5**, title changed |
| Checkpoint grading (chapter 1) | 2026-11-03 | **265° + 210° → 115° correct, +10, review 1, Practicing, next +1 day** |
| Local storage after grading | 2026-11-03 | tab 1 record written to `triglab3d.progress.v1` |
| Desktop screenshot, 1600 × 1200 | 2026-11-03 | **1,046,748-byte PNG** |
| Phone emulation, 390 × 844 | 2026-11-03 | **197,570-byte PNG**, scrollWidth 390, no overflow |
| Three.js CDN blocked | 2026-11-03 | **20 fallback cards, 20 exercises still built** |
| `--disable-gpu` WebGL failure | 2026-11-03 | **20 fallback cards, drills intact** |
| Live Pages probe (`curl`) | 2026-11-03 | **200** |
| Local vs live `index.html` / `script.js` (SHA-1) | 2026-11-03 | **match** (`83737913…` / `00897df1…`) |
| Live DOM | 2026-11-03 | **296,860 bytes**, 20 tabs, 20 exercises, 100 story steps |
| CDN probes (Three, Orbit, fonts) | 2026-11-03 | **200 / 200 / 200** |
| All 20 checkpoints solved, full SRS ladder, JSON file round-trip | — | **Not re-run** this release |
| Safari / Firefox / Edge / real touch / screen reader | — | **Not verified** |
| CI | — | **None exists** in this repository |

The documentation commit changes Markdown only; `index.html`, `style.css` and `script.js`
are untouched.

## 1. Commands

```bash
cd ~/Projects/3d-trigonometry-master-booklet

# run
python3 -m http.server 8123          # http://localhost:8123/
open index.html                      # server recommended for history/localStorage

# structural smoke
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --use-angle=metal --mute-audio \
  --virtual-time-budget=15000 --timeout=30000 \
  --dump-dom "http://localhost:8123/" > /tmp/trig-dom.html

grep -o 'role="tab"' /tmp/trig-dom.html | wc -l
grep -o 'role="tabpanel"' /tmp/trig-dom.html | wc -l
grep -o 'class="agenda-item"' /tmp/trig-dom.html | wc -l
grep -o 'data-story-step' /tmp/trig-dom.html | wc -l
grep -o 'data-exercise="[0-9]*"' /tmp/trig-dom.html | wc -l

# one full view
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --use-angle=metal --mute-audio \
  --virtual-time-budget=15000 --timeout=30000 --window-size=1600,1200 \
  --screenshot=/tmp/trig.png "http://localhost:8123/"

# 3D CDN failure path
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --mute-audio \
  --host-resolver-rules="MAP cdnjs.cloudflare.com ~NOTFOUND, MAP cdn.jsdelivr.net ~NOTFOUND, EXCLUDE localhost" \
  --virtual-time-budget=12000 --timeout=30000 \
  --dump-dom "http://localhost:8123/" > /tmp/trig-nocdn.html
grep -o "3D engine couldn't load" /tmp/trig-nocdn.html | wc -l

# live probe and hashes
curl -s -o /dev/null -w '%{http_code}\n' https://somphol.github.io/3d-trigonometry-master-booklet/
shasum index.html style.css script.js
```

### Browser-console audit

Start Chrome with `--remote-debugging-port=9240 --user-data-dir=/tmp/trig-profile`,
attach with the DevTools Protocol (Node's built-in `WebSocket` is enough), then evaluate
the checks used in this release:

```js
({
  tabs: document.querySelectorAll('.tab-btn').length,
  panels: document.querySelectorAll('.module-panel').length,
  agenda: document.querySelectorAll('.agenda-item').length,
  steps: document.querySelectorAll('[data-story-step]').length,
  guides: document.querySelectorAll('[data-control-help]').length,
  exercises: document.querySelectorAll('[data-exercise]').length,
  canvases: document.querySelectorAll('canvas').length,
  bootHidden: document.getElementById('bootScreen').hidden
})
```

For each chapter, click `#tab-<n>`, wait ~350 ms, then check
`!!document.querySelector('[data-slot="<n>"] canvas')`. The viewer moves one canvas
between slots, so only the active panel should have it.

## 2. Results (2026-11-03)

### Structure

```text
tabs 20 · panels 20 · agenda items 60 · story step dots 100
control-guide buttons 60 · exercise bodies 20
boot screen hidden · welcome modal shown on the fresh profile
```

All 20 tabs activated successfully, each with its own canvas in the active slot. The
per-tab control-guide counts summed to 60.

### Interactions

| Action | Observed |
| --- | --- |
| Formula pill, chapter 1 | modal open, title **Angles & Rotations**, 666 chars |
| Colour key, chapter 1 | modal open, title **How to read this scene**, 1,146 chars |
| Base-yaw help | modal open, title **Base yaw**, 662 chars |
| Story Next | `1 / 5` → `2 / 5`, title **What the colours are telling you** |
| Hint on chapter 1 | **Hint 1 · Concept.** Add the signed rotation, then normalize modulo 360° |
| Base yaw 30° → 45° | coach explains the 0° axis/arc/HUD; HUD shows 45°; readout updates |

### Checkpoint and SRS

The generated chapter 1 prompt was:

> A robotic arm starts at 265° and rotates +210°. What is its final angle in the standard
> interval [0°, 360°)?

Entering **115** through the real UI produced:

```text
Correct. +10 points. Review #1 logged — next review in 1 day.
✓ Checkpoint passed: Normalize a signed arm rotation into standard position.
Mastered 0/20 · Reviews 1 · Score 10 · Due 0 · teach-back visible

localStorage tab 1:
  status "Practicing"
  reviewCount 1
  lastReviewed "2026-11-04T05:51:55.961Z"
  nextReviewDue "2026-11-05T05:51:55.961Z"
```

This verifies grading, the +10 score, the 1-day interval, the teach-back reveal, the SRS
record and localStorage. It does **not** verify later intervals or a full 20-drill sweep.

### Fallback paths

With both script CDNs blocked (and `--disable-gpu` as well):

```text
DOM 304,279 bytes
20 × "3D engine couldn't load"
20 exercise bodies still present
boot note: Three.js CDN unavailable — exercises and SRS are still fully active.
```

With only `--disable-gpu` (scripts reachable), the DOM was 304,287 bytes with the same 20
fallback cards and 20 exercises. The learning layer therefore survives both a missing
library and a missing WebGL context.

### Screenshots

| View | Size | Observed |
| --- | --- | --- |
| Chapter 1 at 1600 × 1200 | 1,046,748 bytes | top bar, rail, agenda, story, 3D arm, simulator, coach |
| Chapter 1 at 390 × 844 | 197,570 bytes | responsive stack, no horizontal overflow |

The repository screenshots are older captures from the 2026-10-31 build.

## 3. Manual matrix

| Area | Check | Status |
| --- | --- | --- |
| Boot | Boot bar clears, Chapter 01 opens | Verified headless |
| Welcome | First-visit briefing appears and starts chapter 1 | Verified on fresh profile |
| Tabs | 20 tabs, roving focus, hash update, one panel visible | Verified; arrow-key focus by code |
| Scenes | 20/20 activate a canvas | Verified |
| Controls | Slider changes sim state, HUD, readout, coach | Verified on chapter 1 |
| Control help | `?` opens the correct guide | Verified on chapter 1 |
| Story | Next/Back steps, five dots, title/text change | Next verified; Back/dots by code |
| Speech | Listen reads the current step | Not verified (no audio in headless) |
| Colour key | Chapter-specific modal | Verified chapter 1 |
| Formula | Symbol-by-symbol decoder | Verified chapter 1 |
| Agenda | Three objectives per chapter | Verified structurally |
| Checkpoint | Prompt, givens, input, Check/Hint/Steps | Verified chapter 1 |
| Grading | Correct answer, score, review log | Verified chapter 1 |
| Hints | Three-level ladder | Hint 1 verified; 2–3 by code |
| Solution | Worked steps reveal after effort | Verified DOM; reveal by code |
| Teach-back | Prompt appears after a correct answer | Verified |
| SRS | 1/3/7/30 intervals, Mastered at 6 | 1-day interval verified; rest by code |
| Due filter | Dim non-due, highlight amber | Not run |
| Progress file | Save/load JSON round-trip | Not re-run |
| Arm game | Grab, carry, drop, score | Not played this release |
| Mobile | 390 × 844, no horizontal overflow | Verified in emulation |
| Reload | SRS persists; controls/story reset | Storage verified; reload by code |

## 4. Failure triage

- **Boot screen never clears** — check the console; a boot exception hides the screen and
  writes a message into `#bootNote`.
- **A chapter has no canvas** — inspect `Viewer` and `meta.build`; a scene build failure
  is logged and replaced with an empty scene, so the panel still renders.
- **"3D engine couldn't load"** — Three.js or OrbitControls is blocked or WebGL failed.
  The drills and SRS still work; check the CDN and hardware acceleration.
- **A control does nothing** — the input needs `data-key`/`data-type`; confirm the chapter
  id in `simStates` and that the delegated listener is attached.
- **Answer always wrong** — check the generator's `answer`, `tol` and `unit`; numeric
  answers compare against `tol` or a relative 1e-6 tolerance.
- **Review count does not advance** — only a correct answer logs; reading the solution or
  revealing hints does not.
- **Progress disappears** — `localStorage` may be blocked in private mode; the console
  logs the failure. Use the progress file for transport.
- **Import rejected** — the file must be valid JSON with a `tabs` or `score` field and be
  under 2 MB.
- **Speech does nothing** — SpeechSynthesis or a voice is unavailable; the app shows a
  toast and the text remains.

## 5. Not verified

- All 20 generated checkpoints and their answer tolerances; only chapter 1 was solved.
- The full SRS ladder (3, 7, 30 days), Mastered transitions, due filter, due jump and
  badge transitions.
- Saving a real `trig_srs_progress.json` download and importing it into a cleared profile.
- The chapter 1 pick-and-place game (grab, carry, drop, score).
- Speech narration, voice selection and pronunciation.
- Drag/orbit/zoom/pinch feel across all 20 scenes.
- Safari, Firefox, Edge, real iOS/Android, touch, HiDPI and screen-reader output.
- The claim in `STATE.md` that all 20 checkpoints, 60 control guides and 60 colour keys
  were exercised in the original build; this release re-verified the structure and a
  representative subset.
