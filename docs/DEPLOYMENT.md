# Deployment

Hosted on **GitHub Pages**, served straight from `main` as a static site. There is no
build artifact, package manager, backend or CI workflow: the committed files are what is
served.

- Live URL: <https://somphol.github.io/3d-trigonometry-master-booklet/>
- Repository: <https://github.com/somphol/3d-trigonometry-master-booklet>
- Source branch: `main`, folder `/` (repository root)
- Entry file: `index.html`
- Runtime network calls: **Three.js r128, OrbitControls r128 and Google Fonts** (see §3)

## 1. Deploy a change

```bash
cd ~/Projects/3d-trigonometry-master-booklet

# 1. verify locally
python3 -m http.server 8123          # http://localhost:8123/
#    run the matrix in docs/TESTING.md

# 2. commit and push
git add -A
git commit -m "…"
git push origin main
```

Pages rebuilds on push, usually within a minute. Confirm:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://somphol.github.io/3d-trigonometry-master-booklet/
```

Re-check that the served files are the committed ones:

```bash
shasum index.html style.css script.js
for f in index.html style.css script.js; do
  curl -sL "https://raw.githubusercontent.com/somphol/3d-trigonometry-master-booklet/main/$f" | shasum
done
```

At the documentation release the hashes were:

```text
index.html  83737913e68dcc7f8838c7bf4e45aff89c55bf23
style.css   28fe09d5d267a29a0d452f39c492a8c9e15d06dc
script.js   00897df140e39c5aa1710f0b685cd72dbfbf457c
```

All three matched the live/raw copies.

## 2. Repository settings that matter

| Setting | Value | Why |
| --- | --- | --- |
| Pages source | Deploy from a branch → `main` → `/ (root)` | the app lives at the root |
| Custom domain | none | default `*.github.io` host |
| Enforce HTTPS | on | default certificate |
| Actions | none required | no workflow exists in `.github/workflows/` |

`.nojekyll` is committed. Keep it: it stops Jekyll from processing the site and keeps the
publish path a plain static copy. The app uses classic deferred `<script>` tags, so MIME
handling is simple.

## 3. Files that are published

Everything in the repository root is public, including documentation and screenshots:

- `index.html` — shell, header, controls, boot screen, CDN scripts
- `style.css` — dark STEM design system and responsive layout
- `script.js` — curriculum, twenty scenes, lessons, exercises, SRS, import/export
- `favicon` — inline SVG data URI in the head
- `screenshot.png`, `screenshot-welcome.png`, `screenshot-control.png`,
  `screenshot-checkpoint.png`, `screenshot-arm.png`, `screenshot-key.png`,
  `screenshot-formula.png`, `screenshot-mobile.png`, `screenshot-truss.png`,
  `screenshot-globe.png` — README images, about 7.4 MB total
- `docs/social-card.png` — 1200 × 630 Open Graph / Twitter preview
- `README.md`, `CHANGELOG.md`, `AGENTS.md`, `docs/*.md`
- `STATE.md`, `state.json` — historical build receipt
- `THIRD_PARTY_NOTICES.md`, `LICENSE`
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`
- `robots.txt`, `sitemap.xml`
- `.github/` issue templates, pull-request template and CODEOWNERS

There is no secrets file, no environment variable and no runtime configuration.

**Runtime network dependencies.** These are real requests on every cold load:

| Request | Host | Purpose |
| --- | --- | --- |
| `three.min.js` r128 | `cdnjs.cloudflare.com` | Three.js core |
| `OrbitControls.js` r128 | `cdn.jsdelivr.net` | 3D camera |
| Google Fonts stylesheet | `fonts.googleapis.com` | Space Grotesk, JetBrains Mono |
| Font files | `fonts.gstatic.com` | the same two families |

The script tags have no `integrity` attribute. If Three.js or OrbitControls is blocked,
`Viewer.init()` returns false and every viewport shows a **"3D engine couldn't load"** card
while the drills and SRS remain usable. If only fonts fail, the browser falls back to
system faces. Do not describe the 3D experience as offline-capable.

## 4. Rollback

Pages serves the current `main`, so rolling back is a normal history operation:

```bash
git revert <bad-commit>          # preferred: keeps history
git push origin main
```

or, for an immediate local reset:

```bash
git reset --hard <good-commit>
git push --force-with-lease origin main
```

Force-pushing rewrites published history; prefer `git revert` unless the bad commit
contains something that must not remain public.

## 5. Caching

At the time of writing the live document returned:

```text
cache-control: max-age=600
etag: "6ae76b44-2644"
last-modified: Sun, 01 Nov 2026 16:39:32 GMT
```

A browser may keep an old `index.html` for up to ten minutes. `style.css` and `script.js`
are cached independently; hard-refresh (Shift-Reload) or use a private window after a
deploy. There is no service worker and no offline cache to invalidate.

## 6. Local preview versus production

A local server is recommended because the app uses `localStorage` and `history.replaceState`:

```bash
python3 -m http.server 8123
open http://localhost:8123/
```

`file://` usually works for the panels, but browsers may restrict history writes or
storage. The progress file is the portable fallback for progress.

## 7. Platform requirements

- A browser with **WebGL**, Canvas 2D, ES6, `localStorage` and (optionally) SpeechSynthesis.
  Chrome/Chromium was verified; Safari, Firefox, Edge and real mobile devices are
  unverified for this release.
- A network connection on first load for Three.js, OrbitControls and Google Fonts. The
  3D layer degrades to a fallback card; the learning layer does not.
- On macOS headless Chrome, WebGL needs `--use-angle=metal`. With `--disable-gpu` the 3D
  viewer reports a WebGL initialisation failure and the fallback cards appear.
- Real touch orbit/pinch, HiDPI scaling and screen-reader output are unverified.
- No install, service worker or manifest; there is nothing to add to a home screen.
