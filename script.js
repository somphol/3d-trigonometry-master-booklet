/* ==========================================================================
   TrigLab 3D — 20-Tab Trigonometry Master Booklet & SRS Learning Studio
   Vanilla ES6 · Three.js r128 · static-hosting friendly
   Built with OpenCode × DeepSeek V4.1 Flash
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     0. Constants & tiny utilities
     ------------------------------------------------------------------------ */
  const APP_VERSION = "1.0.0";
  const STORAGE_KEY = "triglab3d.progress.v1";
  const TAB_COUNT = 20;
  const DAY_MS = 86400000;
  const SRS_INTERVALS = { 1: 1, 2: 3, 3: 7, 4: 30 }; // days
  const SRS_LEVEL_NAMES = { 1: "L1 · Learn", 2: "L2 · Practicing", 3: "L3 · Reinforcing", 4: "L4 · Mastered" };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ri = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const rad = (deg) => (deg * Math.PI) / 180;
  const deg = (r) => (r * 180) / Math.PI;
  const norm360 = (a) => ((a % 360) + 360) % 360;
  const fmt = (n, d = 1) => (Number.isFinite(n) ? Number(n).toFixed(d) : "—");
  const signed = (n) => (n >= 0 ? `+${n}` : `${n}`);
  const uid = (p = "id") => `${p}-${Math.random().toString(36).slice(2, 9)}`;
  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function tolFor(answer) {
    return Math.max(0.005, Math.abs(answer) * 0.0025);
  }

  function relTime(iso) {
    if (!iso) return "never";
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t)) return "never";
    const diff = t - Date.now();
    const abs = Math.abs(diff);
    const days = Math.round(abs / DAY_MS);
    if (abs < 60000) return diff >= 0 ? "in a moment" : "just now";
    if (abs < 3600000) return diff >= 0 ? `in ${Math.round(abs / 60000)}m` : `${Math.round(abs / 60000)}m ago`;
    if (abs < DAY_MS) return diff >= 0 ? `in ${Math.round(abs / 3600000)}h` : `${Math.round(abs / 3600000)}h ago`;
    return diff >= 0 ? `in ${days}d` : `${days}d ago`;
  }

  /* ------------------------------------------------------------------------
     1. The 20-module curriculum
     Each module = metadata + simulator controls + HUD + 3D scene + exercise.
     ------------------------------------------------------------------------ */
  const MODULES = [
    {
      id: 1,
      title: "Angles & Rotations",
      short: "Angles",
      sim: "Robotic Arm Pick-and-Place",
      icon: "🦾",
      accent: "#22d3ee",
      formula: "θf = (θ0 + Δθ) mod 360°",
      blurb: "Drive a 3-axis pick-and-place arm and watch positive / negative rotations resolve to a single standard-position angle.",
      note: "Rotate the base, shoulder and elbow. Every joint angle is measured counter-clockwise from its local zero axis.",
      legend: ["cosine", "sine", "rotation arc"],
      controls: [
        { key: "base", label: "Base yaw", min: -160, max: 160, step: 1, value: 30, unit: "°" },
        { key: "shoulder", label: "Shoulder", min: -70, max: 70, step: 1, value: 26, unit: "°" },
        { key: "elbow", label: "Elbow", min: -100, max: 100, step: 1, value: 48, unit: "°" },
        { key: "grip", label: "Gripper", min: 0, max: 1, step: 0.01, value: 0.55, unit: "" },
        { key: "auto", label: "Demo motion", type: "toggle", value: true, wide: true },
      ],
      hud: (s) => [
        ["Base", `${fmt(s.base, 0)}°`],
        ["Shoulder", `${fmt(s.shoulder, 0)}°`],
        ["Elbow", `${fmt(s.elbow, 0)}°`],
        ["Standard θ", `${fmt(norm360(s.base), 0)}°`],
      ],
      readout: (s) => `TCP target ${(2.0 + 1.1 * Math.sin(rad(s.shoulder + s.elbow))).toFixed(2)} m`,
      build: buildArmScene,
      exercise: exAngles,
    },
    {
      id: 2,
      title: "Radians vs. Degrees",
      short: "Radians",
      sim: "Vehicle Speedometer & Tire RPM",
      icon: "🛞",
      accent: "#38bdf8",
      formula: "v = ωr = (2πN/60)r",
      blurb: "Spin a tire at highway RPM and connect revolutions, angular velocity and linear road speed in real units.",
      note: "The tire's angular velocity ω converts RPM to rad/s. Linear speed is ω × radius, then converted to km/h.",
      legend: ["cosine", "sine", "velocity vector"],
      controls: [
        { key: "rpm", label: "Tire speed", min: 0, max: 1200, step: 10, value: 620, unit: " rpm" },
        { key: "radius", label: "Tire radius", min: 26, max: 52, step: 1, value: 36, unit: " cm" },
        { key: "auto", label: "Wheel spin", type: "toggle", value: true, wide: true },
      ],
      hud: (s) => [
        ["Angular ω", `${fmt((s.rpm * 2 * Math.PI) / 60, 2)} rad/s`],
        ["Linear v", `${fmt(((s.rpm * 2 * Math.PI) / 60) * (s.radius / 100) * 3.6, 1)} km/h`],
        ["Revolutions", `${fmt(s.rpm / 60, 2)} rev/s`],
        ["Deg per s", `${fmt((s.rpm / 60) * 360, 0)}°/s`],
      ],
      readout: (s) => `${fmt((s.rpm * 2 * Math.PI) / 60, 2)} rad/s · ${fmt((s.rpm * 2 * Math.PI * s.radius) / 6000, 1)} km/h`,
      build: buildWheelScene,
      exercise: exRadians,
    },
    {
      id: 3,
      title: "SOH CAH TOA Basics",
      short: "SOH CAH TOA",
      sim: "Skyscraper Clinometer Estimator",
      icon: "🏙️",
      accent: "#fbbf24",
      formula: "tan θ = opposite / adjacent",
      blurb: "Aim a clinometer at a tower crown from street level; use the tangent ratio to turn one angle into a building height.",
      note: "The horizontal distance is the adjacent side; the tower above eye level is the opposite side. Add eye height at the end.",
      legend: ["cosine", "sine", "tangent height"],
      controls: [
        { key: "distance", label: "Ground distance", min: 10, max: 80, step: 1, value: 36, unit: " m" },
        { key: "angle", label: "Clinometer angle", min: 12, max: 60, step: 1, value: 36, unit: "°" },
        { key: "eye", label: "Eye height", min: 1.2, max: 1.9, step: 0.05, value: 1.6, unit: " m" },
      ],
      hud: (s) => [
        ["Opposite", `${fmt(s.distance * Math.tan(rad(s.angle)), 1)} m`],
        ["Adjacent", `${fmt(s.distance, 0)} m`],
        ["Total height", `${fmt(s.distance * Math.tan(rad(s.angle)) + s.eye, 1)} m`],
        ["Tangent", `${fmt(Math.tan(rad(s.angle)), 3)}`],
      ],
      readout: (s) => `${fmt(s.distance * Math.tan(rad(s.angle)) + s.eye, 1)} m tall (eye + ${fmt(s.eye, 2)} m)`,
      build: buildClinometerScene,
      exercise: exClinometer,
    },
    {
      id: 4,
      title: "Reciprocal Ratios",
      short: "Reciprocals",
      sim: "Optical Refraction & Lens Design",
      icon: "🔬",
      accent: "#a78bfa",
      formula: "csc θ = 1/sin θ · sec θ = 1/cos θ · cot θ = 1/tan θ",
      blurb: "Trace a laser through a lens interface and use Snell's law — a ratio cousin of cosecant and secant — to bend light correctly.",
      note: "Refraction follows n₁ sin θ₁ = n₂ sin θ₂. Beyond the critical angle, total internal reflection locks the beam inside the glass.",
      legend: ["cosine", "sine", "refracted beam"],
      controls: [
        { key: "incidence", label: "Incidence θ₁", min: 5, max: 80, step: 1, value: 42, unit: "°" },
        { key: "n2", label: "Lens index n₂", min: 1.0, max: 2.2, step: 0.01, value: 1.5, unit: "" },
        { key: "medium", label: "Source medium", type: "select", value: "air", options: [{ value: "air", label: "Air · n₁ = 1.00" }, { value: "water", label: "Water · n₁ = 1.33" }], wide: true },
      ],
      hud: (s) => {
        const n1 = s.medium === "water" ? 1.33 : 1;
        const ratio = (n1 * Math.sin(rad(s.incidence))) / s.n2;
        const out = ratio <= 1 ? deg(Math.asin(ratio)) : null;
        return [
          ["θ₁ incidence", `${fmt(s.incidence, 0)}°`],
          ["θ₂ refraction", out == null ? "TIR" : `${fmt(out, 1)}°`],
          ["Critical angle", n1 < s.n2 ? `${fmt(deg(Math.asin(n1 / s.n2)), 1)}°` : "none"],
          ["csc θ₁", `${fmt(1 / Math.sin(rad(s.incidence)), 3)}`],
        ];
      },
      readout: (s) => {
        const n1 = s.medium === "water" ? 1.33 : 1;
        return `${s.medium === "water" ? "Water" : "Air"} → n₂ ${fmt(s.n2, 2)} · ${n1 < s.n2 ? "bends toward normal" : "rare medium"}`;
      },
      build: buildLensScene,
      exercise: exReciprocal,
    },
    {
      id: 5,
      title: "Inverse Trig Functions",
      short: "Inverse Trig",
      sim: "Wheelchair Ramp Safety Inspector",
      icon: "♿",
      accent: "#4ade80",
      formula: "θ = arctan(rise / run) = arcsin(rise / length)",
      blurb: "Design a wheelchair ramp, then recover its incline angle from rise and run — the essential inverse-tangent inspection move.",
      note: "ADA guidance caps a ramp at roughly 4.8° (1:12). The inspector computes θ = arctan(rise/run) and flags unsafe geometry.",
      legend: ["cosine", "sine", "slope vector"],
      controls: [
        { key: "angle", label: "Ramp incline", min: 2, max: 18, step: 0.5, value: 6.5, unit: "°" },
        { key: "auto", label: "Roll test", type: "toggle", value: true, wide: true },
      ],
      hud: (s) => [
        ["Incline θ", `${fmt(s.angle, 1)}°`],
        ["Grade", `${fmt(Math.tan(rad(s.angle)) * 100, 1)} %`],
        ["Ratio", `1 : ${fmt(1 / Math.tan(rad(s.angle)), 1)}`],
        ["Safety", s.angle <= 4.8 ? "ADA OK" : "STEep"],
      ],
      readout: (s) => (s.angle <= 4.8 ? "Compliant with 1:12 guidance" : `Exceeds 4.8° by ${fmt(s.angle - 4.8, 1)}°`),
      build: buildRampScene,
      exercise: exInverse,
    },
    {
      id: 6,
      title: "3D Unit Circle",
      short: "Unit Circle",
      sim: "Game Character Joystick Engine",
      icon: "🕹️",
      accent: "#f472b6",
      formula: "(x, y) = (cos θ, sin θ) · tan θ = y/x",
      blurb: "Map a joystick's circular gate into cosine and sine axes, then feed the character's motion vector in real time.",
      note: "The joystick radius is normalized to 1. Cosine drives X, sine drives Y, and tangent is their ratio. The magenta and cyan projections make the signs obvious.",
      legend: ["cosine X", "sine Y", "tangent"],
      controls: [
        { key: "angle", label: "Joystick angle", min: 0, max: 360, step: 1, value: 35, unit: "°" },
        { key: "auto", label: "Idle orbit", type: "toggle", value: true, wide: true },
      ],
      hud: (s) => [
        ["cos θ", `${fmt(Math.cos(rad(s.angle)), 3)}`],
        ["sin θ", `${fmt(Math.sin(rad(s.angle)), 3)}`],
        ["tan θ", `${fmt(Math.tan(rad(s.angle)), 3)}`],
        ["Quadrant", quadrantOf(s.angle)],
      ],
      readout: (s) => `Move vector (${fmt(Math.cos(rad(s.angle)), 2)}, ${fmt(Math.sin(rad(s.angle)), 2)})`,
      build: buildUnitCircleScene,
      exercise: exUnitCircle,
    },
    {
      id: 7,
      title: "ASTC Quadrants",
      short: "ASTC Radar",
      sim: "Air Traffic Control Radar",
      icon: "📡",
      accent: "#2dd4bf",
      formula: "All · Sine · Tangent · Cosine",
      blurb: "Sweep an ATC radar and classify each target's trigonometric signs by quadrant using the ASTC rule.",
      note: "Quadrant I: all positive. II: sine only. III: tangent only. IV: cosine only. The radar's reference angle is the acute angle to the X-axis.",
      legend: ["cosine", "sine", "target"],
      controls: [
        { key: "angle", label: "Target bearing", min: 0, max: 360, step: 1, value: 135, unit: "°" },
        { key: "radius", label: "Target range", min: 1, max: 5, step: 0.1, value: 3.2, unit: " km" },
        { key: "sweep", label: "Radar sweep", type: "toggle", value: true, wide: true },
      ],
      hud: (s) => {
        const ref = Math.abs(((s.angle + 180) % 180) - 90) === 90 ? 0 : Math.abs(((s.angle + 90) % 180) - 90);
        return [
          ["Bearing", `${fmt(s.angle, 0)}°`],
          ["Quadrant", quadrantOf(s.angle)],
          ["Reference", `${fmt(ref, 0)}°`],
          ["Sine sign", Math.sin(rad(s.angle)) >= 0 ? "＋" : "−"],
        ];
      },
      readout: (s) => `${quadrantOf(s.angle)} airspace · range ${fmt(s.radius, 1)} km`,
      build: buildRadarScene,
      exercise: exASTC,
    },
    {
      id: 8,
      title: "Special Right Triangles",
      short: "Special △",
      sim: "Roof Truss Timber Calculator",
      icon: "🏠",
      accent: "#fb923c",
      formula: "30-60-90 → 1 : √3 : 2 · 45-45-90 → 1 : 1 : √2",
      blurb: "Frame a gable roof truss and let 30-60-90 / 45-45-90 ratios compute rafter length and rise without a calculator.",
      note: "Changing span and pitch rebuilds the truss in real time. The rafters are the hypotenuse; half-span is adjacent; rise is opposite.",
      legend: ["cosine", "sine", "rafters"],
      controls: [
        { key: "span", label: "Building span", min: 4, max: 12, step: 0.5, value: 8, unit: " m" },
        { key: "pitch", label: "Roof pitch", min: 20, max: 60, step: 1, value: 35, unit: "°" },
        { key: "auto", label: "Show ratio", type: "toggle", value: true, wide: true },
      ],
      hud: (s) => [
        ["Half span", `${fmt(s.span / 2, 2)} m`],
        ["Rise", `${fmt((s.span / 2) * Math.tan(rad(s.pitch)), 2)} m`],
        ["Rafter", `${fmt(s.span / 2 / Math.cos(rad(s.pitch)), 2)} m`],
        ["Pitch ratio", `1 : ${fmt(1 / Math.tan(rad(s.pitch)), 2)}`],
      ],
      readout: (s) => `2 × ${fmt(s.span / 2 / Math.cos(rad(s.pitch)), 2)} m rafters · rise ${fmt((s.span / 2) * Math.tan(rad(s.pitch)), 2)} m`,
      build: buildTrussScene,
      exercise: exSpecialTriangle,
    },
    {
      id: 9,
      title: "Unrolling Sine",
      short: "Unrolling Sin",
      sim: "AC Electrical Generator",
      icon: "⚡",
      accent: "#f472b6",
      formula: "v(t) = Vp sin(2πft) · Vrms = Vp/√2",
      blurb: "Spin a coil through a magnetic field and unroll its induced EMF into the sine wave that powers the grid.",
      note: "The rotating coil's vertical projection is sin θ. Peak voltage, frequency and RMS all update as you turn the generator controls.",
      legend: ["cosine", "sine EMF", "coil"],
      controls: [
        { key: "peak", label: "Peak voltage", min: 50, max: 340, step: 1, value: 170, unit: " V" },
        { key: "freq", label: "Frequency", min: 40, max: 70, step: 1, value: 50, unit: " Hz" },
        { key: "auto", label: "Spin coil", type: "toggle", value: true, wide: true },
      ],
      hud: (s) => [
        ["V peak", `${fmt(s.peak, 0)} V`],
        ["V RMS", `${fmt(s.peak / Math.SQRT2, 1)} V`],
        ["Period", `${fmt(1000 / s.freq, 1)} ms`],
        ["ω", `${fmt(2 * Math.PI * s.freq, 1)} rad/s`],
      ],
      readout: (s) => `${fmt(s.freq, 0)} Hz · ${fmt(s.peak, 0)} V peak · ${fmt(s.peak / Math.SQRT2, 1)} V RMS`,
      build: buildGeneratorScene,
      exercise: exGenerator,
    },
    {
      id: 10,
      title: "Unrolling Cosine",
      short: "Unrolling Cos",
      sim: "Clock Pendulum Motion Tracker",
      icon: "🕰️",
      accent: "#22d3ee",
      formula: "x(t) = A cos(ωt) · ω = √(g/L)",
      blurb: "Release a clock pendulum and trace its horizontal shadow: a pure cosine motion unrolled across time.",
      note: "The bob's horizontal displacement is L sin θ. At small angles this approximates simple harmonic cosine motion with period 2π√(L/g).",
      legend: ["cosine shadow", "sine bob", "trace"],
      controls: [
        { key: "length", label: "Pendulum length", min: 1, max: 4, step: 0.05, value: 2, unit: " m" },
        { key: "amplitude", label: "Swing amplitude", min: 8, max: 60, step: 1, value: 28, unit: "°" },
        { key: "auto", label: "Swing", type: "toggle", value: true, wide: true },
      ],
      hud: (s) => [
        ["Period T", `${fmt(2 * Math.PI * Math.sqrt(s.length / 9.81), 2)} s`],
        ["ω", `${fmt(Math.sqrt(9.81 / s.length), 2)} rad/s`],
        ["Max x", `${fmt(s.length * Math.sin(rad(s.amplitude)), 2)} m`],
        ["Amplitude", `${fmt(s.amplitude, 0)}°`],
      ],
      readout: (s) => `T = 2π√(${fmt(s.length, 2)}/9.81) = ${fmt(2 * Math.PI * Math.sqrt(s.length / 9.81), 2)} s`,
      build: buildPendulumScene,
      exercise: exPendulum,
    },
    {
      id: 11,
      title: "Tangent & Asymptotes",
      short: "Tangent",
      sim: "Lighthouse Shoreline Beam",
      icon: "🗼",
      accent: "#facc15",
      formula: "tan θ = height / distance · θ → 90° ⇒ ∞",
      blurb: "Sweep a lighthouse beam across the shoreline and watch the distance projection explode as the beam approaches vertical.",
      note: "At 90° the tangent is undefined: the beam is parallel to the tower and never meets the shoreline. The dashed asymptote marks that limit.",
      legend: ["cosine", "sine", "tangent beam"],
      controls: [
        { key: "height", label: "Tower height", min: 20, max: 90, step: 1, value: 55, unit: " m" },
        { key: "distance", label: "Shore distance", min: 60, max: 280, step: 1, value: 140, unit: " m" },
        { key: "auto", label: "Rotate beacon", type: "toggle", value: true, wide: true },
      ],
      hud: (s) => [
        ["Depression θ", `${fmt(deg(Math.atan(s.height / s.distance)), 2)}°`],
        ["Beam length", `${fmt(Math.hypot(s.height, s.distance), 1)} m`],
        ["tan θ", `${fmt(s.height / s.distance, 3)}`],
        ["Asymptote", "90°"],
      ],
      readout: (s) => `Beam reaches shore at ${fmt(deg(Math.atan(s.height / s.distance)), 2)}° below horizontal`,
      build: buildLighthouseScene,
      exercise: exTangent,
    },
    {
      id: 12,
      title: "Wave Amplitude & Period",
      short: "Amplitude",
      sim: "Radio Station Signal Tuner",
      icon: "📻",
      accent: "#38bdf8",
      formula: "y = A sin(2πt/T) · λ = c/f",
      blurb: "Tune an AM/FM transmitter and watch carrier amplitude, period and wavelength respond on the antenna array.",
      note: "Period is the reciprocal of frequency. Wavelength λ = 300 / f(MHz) metres. AM and FM occupy very different bands — the HUD flags the selected band.",
      legend: ["cosine", "sine carrier", "wavefronts"],
      controls: [
        { key: "frequency", label: "Carrier frequency", min: 0.5, max: 108, step: 0.1, value: 98.7, unit: " MHz" },
        { key: "amplitude", label: "Carrier amplitude", min: 1, max: 5, step: 0.1, value: 3, unit: " V" },
        { key: "band", label: "Band", type: "select", value: "FM", options: [{ value: "FM", label: "FM · 88–108 MHz" }, { value: "AM", label: "AM · 0.54–1.6 MHz" }], wide: true },
      ],
      hud: (s) => [
        ["Period", `${fmt(1000 / s.frequency, 3)} µs`],
        ["Wavelength", `${fmt(300 / s.frequency, 2)} m`],
        ["Amplitude", `${fmt(s.amplitude, 1)} V`],
        ["Band check", bandCheck(s.band, s.frequency)],
      ],
      readout: (s) => `${s.band} ${bandCheck(s.band, s.frequency)} · λ = ${fmt(300 / s.frequency, 2)} m`,
      build: buildRadioScene,
      exercise: exRadio,
    },
    {
      id: 13,
      title: "Phase Shift",
      short: "Phase Shift",
      sim: "Active Noise Cancellation",
      icon: "🎧",
      accent: "#a78bfa",
      formula: "A_sum = 2A|cos(φ/2)| · φ = 180° ⇒ silence",
      blurb: "Fire an anti-phase wave into a noisy cabin and dial the phase until destructive interference cancels the sound.",
      note: "Two equal-amplitude waves combine to 2A cos(φ/2). At 180° the resultant is zero; at 0° it doubles. The green trace is the superposition.",
      legend: ["anti-noise", "noise", "resultant"],
      controls: [
        { key: "phase", label: "Phase offset φ", min: 0, max: 360, step: 1, value: 180, unit: "°" },
        { key: "amplitude", label: "Wave amplitude", min: 1, max: 5, step: 0.1, value: 3, unit: " V" },
        { key: "auto", label: "Animate waves", type: "toggle", value: true, wide: true },
      ],
      hud: (s) => [
        ["Resultant", `${fmt(2 * s.amplitude * Math.abs(Math.cos(rad(s.phase / 2))), 2)} V`],
        ["Cancellation", `${fmt(100 - (Math.abs(Math.cos(rad(s.phase / 2))) * 100), 1)} %`],
        ["Phase", `${fmt(s.phase, 0)}°`],
        ["Delay", `${fmt((s.phase / 360) * 4, 2)} ms`],
      ],
      readout: (s) => `${fmt(100 - Math.abs(Math.cos(rad(s.phase / 2))) * 100, 1)}% destructive cancellation at φ = ${fmt(s.phase, 0)}°`,
      build: buildANCScene,
      exercise: exANC,
    },
    {
      id: 14,
      title: "Law of Sines",
      short: "Law of Sines",
      sim: "River Width Land Surveyor",
      icon: "🌊",
      accent: "#22d3ee",
      formula: "a/sin A = b/sin B = c/sin C",
      blurb: "Stake a baseline on the near bank, sight a landmark across the river, and triangulate a width you cannot tape-measure.",
      note: "The baseline c is opposite angle C. Law of sines gives AC = c sin B / sin C; the river width is AC sin A.",
      legend: ["cosine baseline", "sine sightline", "survey triangle"],
      controls: [
        { key: "baseline", label: "Baseline c", min: 40, max: 140, step: 1, value: 80, unit: " m" },
        { key: "angleA", label: "Sight angle A", min: 30, max: 80, step: 1, value: 55, unit: "°" },
        { key: "angleB", label: "Sight angle B", min: 40, max: 80, step: 1, value: 65, unit: "°" },
      ],
      hud: (s) => {
        const C = 180 - s.angleA - s.angleB;
        const ac = (s.baseline * Math.sin(rad(s.angleB))) / Math.sin(rad(C));
        return [
          ["Angle C", `${fmt(C, 1)}°`],
          ["Sightline AC", `${fmt(ac, 1)} m`],
          ["River width", `${fmt(ac * Math.sin(rad(s.angleA)), 1)} m`],
          ["Baseline", `${fmt(s.baseline, 0)} m`],
        ];
      },
      readout: (s) => {
        const C = 180 - s.angleA - s.angleB;
        const ac = (s.baseline * Math.sin(rad(s.angleB))) / Math.sin(rad(C));
        return `River width ≈ ${fmt(ac * Math.sin(rad(s.angleA)), 1)} m`;
      },
      build: buildRiverScene,
      exercise: exLawSines,
    },
    {
      id: 15,
      title: "Ambiguous Case (SSA)",
      short: "SSA Case",
      sim: "Coast Guard Interception",
      icon: "🚢",
      accent: "#fb7185",
      formula: "h = b sin A · compare a with h and b",
      blurb: "A distress bearing plus two ranges can produce zero, one, or two intercept triangles. Plot every possibility before you launch.",
      note: "Drop the altitude h = b sin A. If a < h there is no triangle; a = h gives one right triangle; h < a < b gives two; a ≥ b gives one.",
      legend: ["cosine", "sine", "possible courses"],
      controls: [
        { key: "a", label: "Interceptor range a", min: 3, max: 14, step: 0.1, value: 8, unit: " km" },
        { key: "b", label: "Distress range b", min: 5, max: 16, step: 0.1, value: 10, unit: " km" },
        { key: "angleA", label: "Bearing angle A", min: 15, max: 75, step: 1, value: 35, unit: "°" },
      ],
      hud: (s) => {
        const h = s.b * Math.sin(rad(s.angleA));
        const d = s.a * s.a - h * h;
        return [
          ["Altitude h", `${fmt(h, 2)} km`],
          ["a vs h", s.a < h ? "a < h" : "a ≥ h"],
          ["Discriminant", `${fmt(d, 2)}`],
          ["Solutions", String(ssaSolutions(s.a, s.b, s.angleA))],
        ];
      },
      readout: (s) => `${ssaSolutions(s.a, s.b, s.angleA)} possible intercept${ssaSolutions(s.a, s.b, s.angleA) === 1 ? "" : "s"}`,
      build: buildSSAScene,
      exercise: exSSA,
    },
    {
      id: 16,
      title: "Law of Cosines",
      short: "Law of Cosines",
      sim: "Aviation Distance & Wind Drift",
      icon: "✈️",
      accent: "#38bdf8",
      formula: "c² = a² + b² − 2ab cos C",
      blurb: "Combine two flight legs with an included wind angle and solve the closing side — the navigation workhorse for non-right triangles.",
      note: "The route triangle has legs a and b with included angle C. The closing ground distance is c = √(a² + b² − 2ab cos C).",
      legend: ["cosine leg", "sine leg", "ground track"],
      controls: [
        { key: "legA", label: "Leg a", min: 100, max: 450, step: 5, value: 280, unit: " km" },
        { key: "legB", label: "Leg b", min: 80, max: 380, step: 5, value: 220, unit: " km" },
        { key: "angle", label: "Included angle C", min: 25, max: 150, step: 1, value: 75, unit: "°" },
        { key: "auto", label: "Animate aircraft", type: "toggle", value: true, wide: true },
      ],
      hud: (s) => {
        const c = Math.sqrt(s.legA ** 2 + s.legB ** 2 - 2 * s.legA * s.legB * Math.cos(rad(s.angle)));
        return [
          ["Closing side c", `${fmt(c, 1)} km`],
          ["Leg a", `${fmt(s.legA, 0)} km`],
          ["Leg b", `${fmt(s.legB, 0)} km`],
          ["Angle C", `${fmt(s.angle, 0)}°`],
        ];
      },
      readout: (s) => {
        const c = Math.sqrt(s.legA ** 2 + s.legB ** 2 - 2 * s.legA * s.legB * Math.cos(rad(s.angle)));
        return `Ground distance ${fmt(c, 1)} km`;
      },
      build: buildAviationScene,
      exercise: exLawCosines,
    },
    {
      id: 17,
      title: "Pythagorean Identity",
      short: "Pythag Identity",
      sim: "Shader & Surface Lighting Normalizer",
      icon: "💡",
      accent: "#f472b6",
      formula: "sin² θ + cos² θ = 1 · n̂ = (sin θ, cos θ, 0)",
      blurb: "Normalize a surface normal for a GLSL-style lighting model and verify that sin² + cos² always reconstructs unit length.",
      note: "A normalized normal has length 1, so its components obey sin² θ + cos² θ = 1. The magenta arrow is the normal; the orbiting light tests its response.",
      legend: ["cosine normal", "sine normal", "light vector"],
      controls: [
        { key: "sinValue", label: "sin θ", min: 0.05, max: 0.98, step: 0.01, value: 0.6, unit: "" },
        { key: "light", label: "Light azimuth", min: 0, max: 360, step: 1, value: 45, unit: "°" },
      ],
      hud: (s) => {
        const cosV = Math.sqrt(1 - s.sinValue ** 2);
        return [
          ["sin θ", `${fmt(s.sinValue, 3)}`],
          ["cos θ", `${fmt(cosV, 3)}`],
          ["tan θ", `${fmt(s.sinValue / cosV, 3)}`],
          ["Identity", `${fmt(s.sinValue ** 2 + cosV ** 2, 4)}`],
        ];
      },
      readout: (s) => `Normal length = √(${fmt(s.sinValue ** 2, 3)} + ${fmt(1 - s.sinValue ** 2, 3)}) = 1.000`,
      build: buildShaderScene,
      exercise: exPythag,
    },
    {
      id: 18,
      title: "Double Angle Formulas",
      short: "Double Angle",
      sim: "Projectile Cannon Maximizer",
      icon: "💥",
      accent: "#facc15",
      formula: "sin 2θ = 2 sin θ cos θ · R = v² sin 2θ / g",
      blurb: "Aim the cannon and use the double-angle identity to discover why 45° maximizes range — then optimize the shot.",
      note: "Range depends on sin 2θ, which peaks at 90°, so θ = 45°. Launch speed and gravity set the scale; the yellow parabola updates live.",
      legend: ["cosine", "sine", "trajectory"],
      controls: [
        { key: "speed", label: "Muzzle speed", min: 15, max: 60, step: 1, value: 32, unit: " m/s" },
        { key: "angle", label: "Launch angle θ", min: 10, max: 80, step: 1, value: 45, unit: "°" },
        { key: "auto", label: "Fire animation", type: "toggle", value: true, wide: true },
      ],
      hud: (s) => [
        ["Range R", `${fmt((s.speed ** 2 * Math.sin(rad(2 * s.angle))) / 9.81, 1)} m`],
        ["Max height", `${fmt((s.speed ** 2 * Math.sin(rad(s.angle)) ** 2) / (2 * 9.81), 1)} m`],
        ["Flight time", `${fmt((2 * s.speed * Math.sin(rad(s.angle))) / 9.81, 2)} s`],
        ["sin 2θ", `${fmt(Math.sin(rad(2 * s.angle)), 3)}`],
      ],
      readout: (s) => `R = ${fmt(s.speed, 0)}² · sin ${fmt(2 * s.angle, 0)}° / 9.81 = ${fmt((s.speed ** 2 * Math.sin(rad(2 * s.angle))) / 9.81, 1)} m`,
      build: buildProjectileScene,
      exercise: exProjectile,
    },
    {
      id: 19,
      title: "3D Vectors & Cross Products",
      short: "Cross Product",
      sim: "Solar Panel Sun-Tracking Engine",
      icon: "☀️",
      accent: "#fbbf24",
      formula: "|a × b| = |a||b| sin θ · n̂ = a × b / |a × b|",
      blurb: "Align a solar panel to the sun and compute the cross product that defines its surface normal and tilt axis.",
      note: "The cross product is perpendicular to both the panel edge a and the sun vector b. Its magnitude is |a||b| sin θ, peaking when the vectors are perpendicular.",
      legend: ["cosine", "sine", "cross product"],
      controls: [
        { key: "azimuth", label: "Sun azimuth", min: 0, max: 360, step: 1, value: 135, unit: "°" },
        { key: "elevation", label: "Sun elevation", min: 8, max: 85, step: 1, value: 45, unit: "°" },
        { key: "panelAz", label: "Panel azimuth", min: 0, max: 360, step: 1, value: 135, unit: "°" },
      ],
      hud: (s) => {
        const cross = Math.abs(Math.sin(rad(s.azimuth - s.panelAz)) * Math.cos(rad(s.elevation)));
        const eff = Math.max(0, Math.cos(rad(s.elevation - 30)) * Math.cos(rad(s.azimuth - s.panelAz)));
        return [
          ["|a × b|", `${fmt(cross, 3)}`],
          ["Incidence", `${fmt(Math.abs(s.azimuth - s.panelAz), 1)}°`],
          ["Panel output", `${fmt(eff * 100, 1)} %`],
          ["Sun elevation", `${fmt(s.elevation, 0)}°`],
        ];
      },
      readout: (s) => `Panel tracks ${fmt(s.panelAz, 0)}° · sun ${fmt(s.azimuth, 0)}° · cross sin Δ = ${fmt(Math.sin(rad(s.azimuth - s.panelAz)), 3)}`,
      build: buildSolarScene,
      exercise: exCrossProduct,
    },
    {
      id: 20,
      title: "Spherical Coordinates",
      short: "Spherical",
      sim: "GPS Satellite & Flight Navigator",
      icon: "🛰️",
      accent: "#22d3ee",
      formula: "x = r cos φ cos λ · y = r sin φ · z = r cos φ sin λ",
      blurb: "Pin a location on a 3D Earth, convert latitude/longitude/altitude into Cartesian coordinates, and track a satellite overhead.",
      note: "Latitude φ is the elevation from the equatorial plane and longitude λ is the azimuth around Y. The radius includes Earth's 6,371 km plus altitude.",
      legend: ["cosine", "sine", "radius vector"],
      controls: [
        { key: "lat", label: "Latitude φ", min: -80, max: 80, step: 0.5, value: 13.7, unit: "°" },
        { key: "lon", label: "Longitude λ", min: -180, max: 180, step: 0.5, value: 100.5, unit: "°" },
        { key: "altitude", label: "Altitude", min: 400, max: 2000, step: 10, value: 550, unit: " km" },
      ],
      hud: (s) => {
        const r = 6371 + s.altitude;
        const x = r * Math.cos(rad(s.lat)) * Math.cos(rad(s.lon));
        const y = r * Math.sin(rad(s.lat));
        const z = r * Math.cos(rad(s.lat)) * Math.sin(rad(s.lon));
        return [
          ["x", `${fmt(x / 1000, 1)}k km`],
          ["y", `${fmt(y / 1000, 1)}k km`],
          ["z", `${fmt(z / 1000, 1)}k km`],
          ["Radius", `${fmt(r / 1000, 1)}k km`],
        ];
      },
      readout: (s) => `φ ${fmt(s.lat, 1)}° · λ ${fmt(s.lon, 1)}° · r ${fmt(6371 + s.altitude, 0)} km`,
      build: buildGlobeScene,
      exercise: exSpherical,
    },
  ];

  /* ------------------------------------------------------------------------
     1b. Storytelling, visual keys, and formula decoders
     Every chapter tells the learner what they are looking at before asking
     them to manipulate it. The vocabulary assumes no prior trig knowledge.
     ------------------------------------------------------------------------ */
  const NARRATIVES = {
    1: {
      story: [
        {
          title: "Your first shift as a robot operator",
          text: "You are in charge of a pick-and-place arm on a factory floor. The controller only accepts a final orientation between 0° and 360°, even when the arm has spun several times in different directions.",
          focus: "the blue turntable, the two arm segments, and the yellow gripper at the end.",
        },
        {
          title: "What the colours are telling you",
          text: "Cyan is the scene's cosine channel: it marks the base, shoulder, and the horizontal part of motion. Magenta is the sine channel: it highlights the elbow and the vertical reach. Yellow is the angle and pickup channel.",
          focus: "the glowing ring at each joint. Those rings are the rotations you are about to command.",
        },
        {
          title: "Turn a spin into one clean angle",
          text: "If the arm starts at 168° and turns −106°, add the two values to get 62°. The 'mod 360°' rule simply means adding or subtracting full circles until the result sits between 0° and 360°. Drag Base yaw and watch the cyan HUD update.",
          focus: "the yellow arc on the turntable. It shows the base's angle measured counter-clockwise from the front.",
        },
      ],
      math: "θf = (θ0 + Δθ) mod 360° means: take the starting angle, add the signed rotation, then wrap around the circle until the answer is in standard position.",
      mathParts: [
        ["θ0", "where the arm starts, in degrees"],
        ["Δθ", "the signed turn: positive is counter-clockwise, negative is clockwise"],
        ["mod 360°", "keep only the final direction after removing complete 360° turns"],
      ],
      keys: {
        "cosine": {
          meaning: "Cosine is the horizontal share of a direction. On a unit circle it is the x-coordinate; in a right triangle it is adjacent ÷ hypotenuse.",
          here: "Cyan marks the horizontal/cosine channel. In this scene it lights the base and shoulder so you can see how far the arm leans left or right.",
        },
        "sine": {
          meaning: "Sine is the vertical share of a direction. On a unit circle it is the y-coordinate; in a right triangle it is opposite ÷ hypotenuse.",
          here: "Magenta marks the vertical/sine channel. Here it highlights the elbow and the arm's upward reach.",
        },
        "rotation arc": {
          meaning: "An arc is part of a circle. A rotation arc runs from the zero direction to the current angle, so its length represents the size of the turn.",
          here: "The yellow arc on the turntable is the base's commanded angle, measured counter-clockwise from the front of the robot.",
        },
      },
    },
    2: {
      story: [
        {
          title: "A wheel is a rotating circle",
          text: "You are tuning a vehicle's speed display. The tire spins at a certain number of revolutions per minute, but the driver cares about kilometres per hour on the road.",
          focus: "the large tire, the road beneath it, and the glowing speedometer on the right.",
        },
        {
          title: "Two ways to measure the same turn",
          text: "Degrees and radians both measure rotation. One full revolution is 360° or 2π radians. The cyan arrow shows forward road direction, the magenta needle shows the wheel turning, and the yellow arrow shows the resulting velocity.",
          focus: "the yellow velocity arrow. It grows as the tire's linear speed increases.",
        },
        {
          title: "Bridge revolutions to road speed",
          text: "Convert rpm to radians per second with 2πN/60, multiply by the tire radius in metres, then multiply by 3.6 to reach km/h. Drag the Tire speed and Tire radius sliders and watch the HUD respond.",
          focus: "the 'Linear v' HUD chip. It is the same calculation the car's speedometer uses.",
        },
      ],
      math: "v = ωr and ω = 2πN/60. In words: turn rpm into radians per second, then multiply by the wheel radius to get metres per second.",
      mathParts: [
        ["N", "tire revolutions per minute (rpm)"],
        ["ω", "angular velocity in radians per second"],
        ["r", "tire radius in metres"],
        ["v", "linear road speed in metres per second"],
      ],
      keys: {
        "cosine": {
          meaning: "Cosine is the horizontal or forward share of a rotating direction.",
          here: "Cyan marks the forward road direction and the horizontal component of the wheel's motion.",
        },
        "sine": {
          meaning: "Sine is the vertical or sideways share of a rotating direction.",
          here: "Magenta marks the wheel's rotation and the speedometer needle, which sweeps through a circular scale.",
        },
        "velocity vector": {
          meaning: "A vector is an arrow with both size and direction. A velocity vector points the way something moves; its length represents speed.",
          here: "The yellow arrow points along the road. It gets longer as the tire's linear speed increases.",
        },
      },
    },
    3: {
      story: [
        {
          title: "Measure a tower without climbing it",
          text: "You are a surveyor standing on the street. A skyscraper is too tall to measure with a tape, but you can measure how far you stand from it and the angle at which you sight its roof.",
          focus: "the small tripod at street level and the glass tower in front of you.",
        },
        {
          title: "A right triangle hiding in the city",
          text: "The horizontal distance is the adjacent side (cyan). The height above your eye is the opposite side (magenta). The sight line to the roof is the hypotenuse (yellow), and the clinometer angle sits between the horizontal and that sight line.",
          focus: "the dashed horizontal cyan line and the dashed vertical yellow line. They form a right angle at the tower base.",
        },
        {
          title: "Tangent turns an angle into height",
          text: "Tangent compares opposite to adjacent: tan θ = height ÷ distance. Multiply distance by tan θ, then add your 1.6 m eye height. Move the clinometer angle and watch the tower, sight line, and HUD height grow together.",
          focus: "the height readout and the rooftop marker. They should agree with the geometry you see.",
        },
      ],
      math: "tan θ = opposite / adjacent. Here the opposite side is the height above eye level and the adjacent side is the ground distance. The final height adds eye height.",
      mathParts: [
        ["θ", "clinometer angle measured up from horizontal"],
        ["opposite", "tower height above your eye"],
        ["adjacent", "horizontal distance from you to the tower"],
        ["eye height", "the 1.6 m you must add at the end"],
      ],
      keys: {
        "cosine": {
          meaning: "Cosine connects the adjacent side to the hypotenuse: cos θ = adjacent ÷ hypotenuse.",
          here: "Cyan marks the ground distance — the adjacent side of the sight triangle.",
        },
        "sine": {
          meaning: "Sine connects the opposite side to the hypotenuse: sin θ = opposite ÷ hypotenuse.",
          here: "Magenta marks the height above eye level — the opposite side of the sight triangle.",
        },
        "tangent height": {
          meaning: "Tangent compares opposite to adjacent. It is the slope of the sight line and the quickest way to turn distance plus angle into height.",
          here: "The yellow sight line and rooftop marker show the tangent relationship growing as the angle increases.",
        },
      },
    },
    4: {
      story: [
        {
          title: "Design a lens that bends light predictably",
          text: "You are an optical engineer. A laser hits a glass lens at an angle. The light changes direction at the surface, and your job is to predict the new angle instead of guessing.",
          focus: "the violet lens, the magenta incoming beam, and the cyan outgoing beam.",
        },
        {
          title: "Angles are measured from the normal",
          text: "The dashed horizontal line is the normal — an imaginary line perpendicular to the lens surface. Both the incidence angle and the refraction angle are measured from that normal, not from the surface itself.",
          focus: "the two small arcs at the lens centre. They show θ₁ and θ₂ opening away from the dashed normal.",
        },
        {
          title: "Snell's law is a ratio of sines",
          text: "n₁ sin θ₁ = n₂ sin θ₂. A larger refractive index bends light more strongly toward the normal. Increase n₂ and watch the cyan beam pull closer to the dashed line; push the angle far enough and total internal reflection sends the beam back.",
          focus: "the refraction readout and the cyan ray. If the HUD says TIR, the ray turns yellow and reflects inside the glass.",
        },
      ],
      math: "n₁ sin θ₁ = n₂ sin θ₂. The refractive index n measures how strongly a material slows and bends light. Solve for sin θ₂, then take the inverse sine.",
      mathParts: [
        ["n₁", "refractive index of the source medium (air = 1.00, water = 1.33)"],
        ["n₂", "refractive index of the lens"],
        ["θ₁", "incidence angle measured from the normal"],
        ["θ₂", "refraction angle measured from the normal"],
      ],
      keys: {
        "cosine": {
          meaning: "Cosine is the component of a direction along the surface-adjacent axis. In optics it often describes how much of a ray runs along the interface.",
          here: "Cyan is the outgoing/refracted ray and the cosine-like component of the light path.",
        },
        "sine": {
          meaning: "Sine is the component perpendicular to the interface. Snell's law is written with sines because refraction is driven by the perpendicular component.",
          here: "Magenta is the incoming laser. The incidence angle opens between this ray and the dashed normal.",
        },
        "refracted beam": {
          meaning: "The refracted beam is the part of the light that passes into the new material and changes direction.",
          here: "The cyan ray inside and beyond the lens. Its angle from the dashed normal is θ₂ in the HUD.",
        },
      },
    },
    5: {
      story: [
        {
          title: "Inspect a ramp before someone uses it",
          text: "You are an accessibility inspector. A ramp looks gentle, but a few degrees too steep can make a wheelchair unsafe. You have the rise and the run; you need the incline angle.",
          focus: "the ramp, the wheelchair, and the colour of the deck. Green is compliant, yellow is marginal, red is unsafe.",
        },
        {
          title: "Rise, run, and the invisible triangle",
          text: "The horizontal run is cyan and the vertical rise is yellow. The sloped deck is the hypotenuse. The angle between the deck and the ground is what the inspector must recover.",
          focus: "the dashed cyan run line and the dashed yellow rise line at the end of the ramp.",
        },
        {
          title: "Use inverse tangent to recover the angle",
          text: "tan θ = rise ÷ run, so θ = arctan(rise ÷ run). A 4.8° threshold is roughly a 1:12 slope. Drag the incline slider and watch the deck colour and safety readout change.",
          focus: "the grade percentage and the 1:12 ratio in the HUD. They describe the same slope in different ways.",
        },
      ],
      math: "θ = arctan(rise / run). Inverse tangent answers the question: what angle has this slope? The ratio is rise divided by horizontal run.",
      mathParts: [
        ["rise", "vertical height gained by the ramp"],
        ["run", "horizontal distance covered by the ramp"],
        ["θ", "incline angle above the ground"],
        ["4.8°", "a common accessibility threshold, approximately 1:12"],
      ],
      keys: {
        "cosine": {
          meaning: "Cosine links the horizontal run to the sloped length: cos θ = run ÷ ramp length.",
          here: "Cyan marks the horizontal run at the base of the ramp.",
        },
        "sine": {
          meaning: "Sine links the vertical rise to the sloped length: sin θ = rise ÷ ramp length.",
          here: "Yellow marks the vertical rise at the high end of the ramp.",
        },
        "slope vector": {
          meaning: "A slope vector points along the ramp. Its horizontal part is the run and its vertical part is the rise.",
          here: "The wheelchair rolls along this vector. The deck changes colour as the slope crosses safety thresholds.",
        },
      },
    },
    6: {
      story: [
        {
          title: "Turn a joystick into character motion",
          text: "You are building a game controller. The player pushes a stick inside a circular gate; the game needs a clean horizontal and vertical number to move the character.",
          focus: "the glowing unit circle, the joystick controller, and the small character platform.",
        },
        {
          title: "The circle is a map of every direction",
          text: "A point on the unit circle has coordinates (cos θ, sin θ). Cyan drops to the x-axis to show the cosine; magenta runs across to the y-axis to show the sine. The radius is always 1, so the numbers stay between −1 and 1.",
          focus: "the cyan and magenta projection lines. They are the horizontal and vertical parts of the joystick push.",
        },
        {
          title: "Tangent and the joystick angle",
          text: "Tangent is sine divided by cosine: tan θ = y ÷ x. It measures steepness. Some joystick games use the raw sin/cos pair; others use the angle. Drag the joystick angle and watch all three numbers change.",
          focus: "the yellow tangent segment at x = 1. It shoots up or down as the angle approaches 90° or 270°.",
        },
      ],
      math: "On the unit circle, x = cos θ and y = sin θ. Tangent is the ratio y/x. The angle θ is measured counter-clockwise from the positive x-axis.",
      mathParts: [
        ["cos θ", "x-coordinate: how far right or left"],
        ["sin θ", "y-coordinate: how far up or down"],
        ["tan θ", "slope y/x; undefined when x = 0"],
        ["unit circle", "a circle of radius 1 centred at the origin"],
      ],
      keys: {
        "cosine X": {
          meaning: "Cosine is the x-coordinate on the unit circle — the horizontal share of the joystick push.",
          here: "The cyan vertical drop line and the cyan x-axis show cos θ. Right is positive, left is negative.",
        },
        "sine Y": {
          meaning: "Sine is the y-coordinate on the unit circle — the vertical share of the joystick push.",
          here: "The magenta horizontal line and the magenta y-axis show sin θ. Up is positive, down is negative.",
        },
        "tangent": {
          meaning: "Tangent is the slope of the radius: sine divided by cosine. It blows up near 90° and 270° because the horizontal share becomes zero.",
          here: "The yellow segment at x = 1 is the tangent height. It is clamped in the drawing so extreme values stay visible.",
        },
      },
    },
    7: {
      story: [
        {
          title: "Identify an aircraft from its bearing alone",
          text: "You are an air-traffic-control trainee. A target appears at a bearing on the radar. Before you can label it, you need to know which trig functions are positive in that part of the sky.",
          focus: "the circular radar floor, the sweeping wedge, and the glowing target blip.",
        },
        {
          title: "ASTC is a four-letter memory aid",
          text: "Quadrant I: All functions positive. Quadrant II: Sine positive. Quadrant III: Tangent positive. Quadrant IV: Cosine positive. The sweep and the concentric rings help you see which quadrant the target occupies.",
          focus: "the target's position relative to the cyan x-axis and magenta y-axis. Those signs are what ASTC describes.",
        },
        {
          title: "Use the reference angle, then apply the sign",
          text: "A 140° bearing is 40° past the negative x-axis. Its reference angle is 40°, and because it is in Quadrant II, cosine is negative. Drag the target bearing and watch the quadrant and sign readouts change.",
          focus: "the 'Quadrant' and 'Reference' HUD chips. They turn a large bearing into a small angle plus a sign.",
        },
      ],
      math: "ASTC tells you the sign of sine, cosine, and tangent in each quadrant. The magnitude comes from the reference angle measured to the nearest x-axis.",
      mathParts: [
        ["All", "Quadrant I: sine, cosine, tangent all positive"],
        ["Sine", "Quadrant II: only sine positive"],
        ["Tangent", "Quadrant III: only tangent positive"],
        ["Cosine", "Quadrant IV: only cosine positive"],
      ],
      keys: {
        "cosine": {
          meaning: "Cosine is positive when the x-coordinate is positive: Quadrants I and IV.",
          here: "Cyan marks the horizontal axis that decides the sign of cosine.",
        },
        "sine": {
          meaning: "Sine is positive when the y-coordinate is positive: Quadrants I and II.",
          here: "Magenta marks the vertical axis that decides the sign of sine.",
        },
        "target": {
          meaning: "The target is the aircraft blip the radar is tracking. Its bearing and range locate it in polar coordinates.",
          here: "The glowing amber blip and its dashed beacon. Drag Target bearing to move it between quadrants.",
        },
      },
    },
    8: {
      story: [
        {
          title: "Frame a roof without wasting timber",
          text: "You are a carpenter building a gable roof. The span and pitch are fixed by the house design, but you need the rafter length and rise before you cut any timber.",
          focus: "the timber truss, the house walls beneath it, and the dashed measuring lines.",
        },
        {
          title: "Special triangles have fixed side ratios",
          text: "A 30-60-90 triangle has sides in the ratio 1 : √3 : 2. A 45-45-90 triangle has sides 1 : 1 : √2. Those ratios let you calculate missing lengths without a calculator.",
          focus: "the yellow rafters, the cyan web members, and the magenta ridge. The rafters are the hypotenuse of each half of the roof.",
        },
        {
          title: "Pitch decides rise and rafter length",
          text: "Rise = half-span × tan(pitch). Rafter = half-span ÷ cos(pitch). Increase the pitch and the roof gets taller while the rafters get longer. Drag the pitch slider and watch the HUD rebuild.",
          focus: "the 'Rise' and 'Rafter' readouts. They update while the truss geometry rebuilds in real time.",
        },
      ],
      math: "For a gable roof, half the span is the adjacent side, the rise is opposite, and the rafter is the hypotenuse. Rise = half-span × tan θ and rafter = half-span ÷ cos θ.",
      mathParts: [
        ["half-span", "half the building width, the adjacent side"],
        ["pitch", "roof angle above horizontal"],
        ["rise", "vertical height gained from wall to ridge"],
        ["rafter", "sloped length of one roof member"],
      ],
      keys: {
        "cosine": {
          meaning: "Cosine connects the adjacent half-span to the sloped rafter: cos θ = half-span ÷ rafter.",
          here: "Cyan marks the horizontal half-span and the web members that divide the truss.",
        },
        "sine": {
          meaning: "Sine connects the vertical rise to the sloped rafter: sin θ = rise ÷ rafter.",
          here: "Magenta marks the ridge and the vertical proportion of the roof.",
        },
        "rafters": {
          meaning: "Rafters are the sloping beams that carry the roof surface. Each one is the hypotenuse of a right triangle.",
          here: "The yellow sloping beams. Their length is shown in the HUD and changes with the pitch.",
        },
      },
    },
    9: {
      story: [
        {
          title: "Generate electricity with a spinning coil",
          text: "You are on the grid operations team. A coil rotates inside a magnetic field, and the changing angle induces a voltage. Your job is to understand why the output is a sine wave.",
          focus: "the magenta coil, the two magnetic poles, and the waveform panel behind the generator.",
        },
        {
          title: "A rotating loop projects a sine wave",
          text: "As the coil turns, only the part of its area facing the magnetic field generates voltage. That projection rises and falls smoothly: the vertical projection is sine, the horizontal projection is cosine. The cyan arrows show the magnetic field.",
          focus: "the coil's angle and the magenta wave. Each full turn of the coil produces one full sine cycle.",
        },
        {
          title: "Peak, RMS, and frequency",
          text: "The peak voltage is the tallest point of the sine wave. The RMS voltage is the equivalent steady DC voltage, equal to peak ÷ √2. Frequency says how many cycles happen per second. Turn up the frequency and the wave gets squeezed tighter.",
          focus: "the V RMS and Period HUD chips. They convert the wave's height and speed into engineering numbers.",
        },
      ],
      math: "v(t) = Vp sin(2πft) describes a sine wave with peak voltage Vp and frequency f. RMS voltage is Vp/√2.",
      mathParts: [
        ["Vp", "peak voltage at the top of the sine wave"],
        ["f", "frequency in cycles per second (Hz)"],
        ["t", "time in seconds"],
        ["Vrms", "equivalent steady voltage, Vp ÷ √2"],
      ],
      keys: {
        "cosine": {
          meaning: "Cosine is the horizontal projection of a rotating vector. It is 90° out of step with sine.",
          here: "Cyan marks the magnetic field arrows and the coil's horizontal projection.",
        },
        "sine EMF": {
          meaning: "The induced electromotive force follows the vertical projection of the rotating coil, producing a sine wave.",
          here: "The magenta coil and the magenta waveform. The wave's height is the instantaneous voltage at that moment.",
        },
        "coil": {
          meaning: "The coil is the loop of wire rotating in the magnetic field. Its changing orientation is what generates voltage.",
          here: "The magenta rectangular loop. It spins continuously and drives the waveform on the panel.",
        },
      },
    },
    10: {
      story: [
        {
          title: "Make a clock tick at the right rate",
          text: "You are restoring a pendulum clock. The bob swings back and forth, and its horizontal shadow moves in a smooth, repeating pattern. Your job is to connect the swing angle to that motion.",
          focus: "the pendulum frame, the glowing bob, and the cosine trace on the right.",
        },
        {
          title: "The pendulum draws a cosine",
          text: "At the extremes the bob is momentarily still; at the centre it moves fastest. Its horizontal displacement is x = L sin θ. Plotted against time, that back-and-forth motion looks like a cosine wave.",
          focus: "the cyan trace and the yellow marker travelling along it. That is the horizontal motion unrolled over time.",
        },
        {
          title: "Length controls the period",
          text: "A longer pendulum swings more slowly. The period is T = 2π√(L/g), so doubling the length increases the period by about 1.41×. Drag the length slider and watch the period and swing speed change.",
          focus: "the 'Period T' HUD chip. It tells you how many seconds one complete back-and-forth takes.",
        },
      ],
      math: "x = L sin θ gives the bob's horizontal displacement. For small swings the motion is approximately simple harmonic, with period T = 2π√(L/g).",
      mathParts: [
        ["L", "pendulum length from pivot to bob"],
        ["θ", "angle from vertical"],
        ["x", "horizontal displacement from the centre line"],
        ["T", "time for one complete back-and-forth swing"],
      ],
      keys: {
        "cosine shadow": {
          meaning: "The horizontal shadow of circular motion traces a cosine wave over time.",
          here: "The cyan trace is that shadow, plotted as displacement versus time.",
        },
        "sine bob": {
          meaning: "Sine gives the vertical or angular position of the bob as it swings.",
          here: "The magenta bob and its arc show the swing angle. The bob's height follows a sine-like projection.",
        },
        "trace": {
          meaning: "A trace is a path left behind by a moving point. Here it turns the pendulum's repetitive motion into a readable wave.",
          here: "The cyan wave and yellow marker on the right-hand panel. The marker moves as the pendulum swings.",
        },
      },
    },
    11: {
      story: [
        {
          title: "Sweep a lighthouse beam to the shore",
          text: "You are the keeper of a lighthouse. The lamp sits high above the water, and its beam must reach a boat at a known horizontal distance. You need the angle between the beam and the sea.",
          focus: "the tower, the yellow beam, the shoreline, and the small boat.",
        },
        {
          title: "The beam forms a right triangle",
          text: "The tower height is the opposite side (magenta), the shoreline distance is the adjacent side (cyan), and the beam is the hypotenuse (yellow). The depression angle opens between the horizontal and the beam.",
          focus: "the dashed cyan distance line and the dashed vertical height line. The tangent ratio compares them.",
        },
        {
          title: "Tangent approaches infinity at 90°",
          text: "tan θ = height ÷ distance. As the distance shrinks, the angle approaches 90° and the tangent grows without bound; at exactly 90° it is undefined. That is the vertical asymptote marked by the dashed line.",
          focus: "the 'Depression θ' readout. Shrink the shore distance and watch the angle race upward.",
        },
      ],
      math: "tan θ = height / distance. At 90° the beam is vertical and never meets a shoreline at a finite distance, so tangent is undefined there.",
      mathParts: [
        ["height", "tower height above the water"],
        ["distance", "horizontal reach from tower to shoreline"],
        ["θ", "depression angle below horizontal"],
        ["90°", "the vertical asymptote where tangent is undefined"],
      ],
      keys: {
        "cosine": {
          meaning: "Cosine links the horizontal distance to the beam length: cos θ = distance ÷ beam.",
          here: "Cyan marks the horizontal distance from the tower to the shore.",
        },
        "sine": {
          meaning: "Sine links the tower height to the beam length: sin θ = height ÷ beam.",
          here: "Magenta marks the vertical height of the lamp above the water.",
        },
        "tangent beam": {
          meaning: "Tangent compares tower height to shoreline distance. It grows rapidly as the beam becomes more vertical.",
          here: "The yellow lighthouse beam. Its angle is the depression angle in the HUD.",
        },
      },
    },
    12: {
      story: [
        {
          title: "Tune a radio transmitter",
          text: "You are a broadcast engineer. A station's carrier frequency determines its wavelength, period, and how its radio waves spread from the antenna. AM and FM use very different frequency bands.",
          focus: "the antenna mast, the expanding rings, the waveform, and the receiver box.",
        },
        {
          title: "Frequency is cycles per second",
          text: "One hertz means one cycle per second. A 98.7 MHz FM signal completes 98,700,000 cycles every second. The rings expanding from the mast represent wavefronts moving outward; their spacing relates to wavelength.",
          focus: "the cyan or yellow wavefront rings. Their colour changes with the selected band.",
        },
        {
          title: "Period and wavelength are reciprocals",
          text: "Period T = 1/f. Wavelength λ = c/f, or 300 ÷ f(MHz) metres. Higher frequency means a shorter period and a shorter wavelength. Drag the frequency and watch the HUD and ring speed change.",
          focus: "the Period and Wavelength chips. They are two ways of describing the same carrier.",
        },
      ],
      math: "Frequency f and period T are reciprocals: T = 1/f. For radio, wavelength λ = c/f; using f in MHz, the shortcut is λ = 300/f metres.",
      mathParts: [
        ["f", "carrier frequency in hertz (or MHz)"],
        ["T", "period of one cycle in seconds"],
        ["λ", "wavelength in metres"],
        ["c", "speed of light, 3 × 10⁸ m/s"],
      ],
      keys: {
        "cosine": {
          meaning: "Cosine is one of the two projections of a rotating phasor; it is 90° out of phase with sine.",
          here: "Cyan is the cosine channel and the FM wavefront colour.",
        },
        "sine carrier": {
          meaning: "A carrier wave is the steady high-frequency sine wave that carries a signal. Its amplitude and frequency define the transmission.",
          here: "The magenta waveform rising and falling across the scene.",
        },
        "wavefronts": {
          meaning: "Wavefronts are expanding surfaces of equal phase. The distance between them is the wavelength.",
          here: "The rings leaving the antenna. Higher frequency makes them expand faster and pack closer together.",
        },
      },
    },
    13: {
      story: [
        {
          title: "Cancel noise with opposite noise",
          text: "You are designing noise-cancelling headphones. A microphone hears a noise wave; the headphone speaker plays a mirrored wave so the two cancel before they reach your ear.",
          focus: "the two speaker boxes, the magenta noise wave, the cyan anti-noise wave, and the green result.",
        },
        {
          title: "Phase is a timing offset",
          text: "Phase measures how far one wave is shifted relative to another. A 180° shift flips the wave upside down: peaks meet troughs and cancel. A 0° shift makes them add together and double.",
          focus: "the green resultant wave. It shrinks toward a flat line near 180° and grows near 0° or 360°.",
        },
        {
          title: "Cancel at 180°, boost at 0°",
          text: "Two equal waves combine to 2A cos(φ/2). At φ = 180° the cosine is zero, so the result is silence. Drag the phase slider slowly and watch the cancellation meter swing.",
          focus: "the cancellation percentage and the green meter. They peak at 180°.",
        },
      ],
      math: "For two equal-amplitude waves with phase offset φ, the resultant amplitude is 2A|cos(φ/2)|. At 180° this is zero; at 0° it is 2A.",
      mathParts: [
        ["A", "amplitude of each original wave"],
        ["φ", "phase offset between the waves, in degrees"],
        ["2A cos(φ/2)", "resultant amplitude after superposition"],
        ["180°", "perfect destructive interference"],
      ],
      keys: {
        "anti-noise": {
          meaning: "Anti-noise is a wave deliberately inverted relative to the noise so the two cancel.",
          here: "The cyan wave. It mirrors the magenta noise and drives the green result toward zero.",
        },
        "noise": {
          meaning: "Noise is the unwanted wave the microphone picks up. Its amplitude determines how much cancellation is possible.",
          here: "The magenta wave from the left speaker.",
        },
        "resultant": {
          meaning: "The resultant is the sum of the two waves — what your ear actually hears.",
          here: "The green wave and meter. Flat green means silence; tall green means the waves reinforced each other.",
        },
      },
    },
    14: {
      story: [
        {
          title: "Measure a river you cannot cross",
          text: "You are a land surveyor. The river is too wide for a tape measure, so you stake a baseline along the near bank and sight a landmark on the far side from both ends.",
          focus: "the blue river, the survey poles, and the tree landmark across the water.",
        },
        {
          title: "Two angles and one side define a triangle",
          text: "The baseline is cyan. The two sightlines are yellow and magenta. The landmark is the third vertex. Once you know two angles, the third follows because a triangle's angles add to 180°.",
          focus: "the triangle drawn across the water and the dashed width line from the landmark to the baseline.",
        },
        {
          title: "Law of sines finds the missing side",
          text: "a/sin A = b/sin B = c/sin C. Use the baseline and its opposite angle to find the sightline to the landmark, then take the perpendicular component to get the river width. Drag the angles and watch the triangle reshape.",
          focus: "the 'River width' HUD chip. It is the perpendicular distance, not the slanted sightline.",
        },
      ],
      math: "The law of sines says side lengths are proportional to the sines of their opposite angles: a/sin A = b/sin B = c/sin C. Two angles and the baseline are enough to solve the triangle.",
      mathParts: [
        ["A, B, C", "the three angles of the survey triangle"],
        ["a, b, c", "the sides opposite those angles"],
        ["baseline c", "the measured distance along the near bank"],
        ["river width", "the perpendicular distance from landmark to baseline"],
      ],
      keys: {
        "cosine baseline": {
          meaning: "The baseline is the known side along the bank. Cosine would give its horizontal projection relative to a sightline.",
          here: "The cyan line between the two survey poles on the near bank.",
        },
        "sine sightline": {
          meaning: "A sightline is a straight line from an observer to a target. Sine links the angle at the observer to the opposite side.",
          here: "The yellow and magenta lines from the poles to the tree.",
        },
        "survey triangle": {
          meaning: "The survey triangle is formed by the baseline and the two sightlines. Solving it gives distances you cannot measure directly.",
          here: "The full triangle over the river, including the dashed width line.",
        },
      },
    },
    15: {
      story: [
        {
          title: "Plot every possible intercept",
          text: "You are a coast guard watch officer. A distress call gives a bearing and a range from a station, and your cutter has a different range. Depending on the numbers, there may be no intercept, one, or two.",
          focus: "the coast guard station, the distress vessel, and the dashed circle of possible cutter positions.",
        },
        {
          title: "The ambiguous case is a geometry puzzle",
          text: "Drop the altitude h = b sin A from the distress vessel to the bearing line. Compare your cutter range a with h and with b. The dashed circle shows all points at range a; the number of intersections with the bearing line is the number of triangles.",
          focus: "the dashed circle and the cyan/magenta course lines. Two intersections mean two valid intercepts.",
        },
        {
          title: "How many triangles survive?",
          text: "If a < h, the circle never reaches the bearing line: zero. If a = h or a ≥ b: one. If h < a < b: two. Drag the ranges and bearing and watch the solution count and geometry change.",
          focus: "the 'Solutions' HUD chip and the course lines appearing or disappearing.",
        },
      ],
      math: "For SSA data (two sides and a non-included angle), the altitude h = b sin A decides how many triangles exist. Compare the opposite side a with h and b.",
      mathParts: [
        ["a", "interceptor range, opposite angle A"],
        ["b", "distress range"],
        ["A", "bearing angle at the station"],
        ["h", "altitude from the distress vessel to the bearing line"],
      ],
      keys: {
        "cosine": {
          meaning: "Cosine projects a distance onto the horizontal bearing line. It helps find where the altitude meets that line.",
          here: "Cyan marks the bearing line and the first possible course.",
        },
        "sine": {
          meaning: "Sine gives the perpendicular component of a distance, which becomes the altitude h in the SSA test.",
          here: "Magenta marks the second possible course and the altitude relationship.",
        },
        "possible courses": {
          meaning: "Each valid triangle corresponds to a different intercept course that satisfies the same range and bearing data.",
          here: "The cyan and magenta lines from the station to the two possible intersection points.",
        },
      },
    },
    16: {
      story: [
        {
          title: "Plan a flight with a wind angle",
          text: "You are a flight planner. An aircraft flies one leg, turns through a known angle, then flies a second leg. You need the straight-line distance between the start and end points.",
          focus: "the airport, the two route legs, the aircraft, and the closing line.",
        },
        {
          title: "Two sides and the included angle",
          text: "Leg a is cyan, leg b is yellow, and the closing side is magenta. The included angle C sits between the two legs at the airport. The planes animate along the route so you can see how the triangle is built.",
          focus: "the magenta closing side. It is opposite angle C and is the distance you need.",
        },
        {
          title: "Law of cosines handles non-right triangles",
          text: "c² = a² + b² − 2ab cos C. When C = 90°, cosine is zero and the formula becomes Pythagoras. Drag the leg lengths and angle, and watch the closing distance change.",
          focus: "the 'Closing side c' HUD chip and the magenta line. They solve the navigation triangle.",
        },
      ],
      math: "The law of cosines generalises Pythagoras to any triangle: c² = a² + b² − 2ab cos C, where C is the angle between sides a and b.",
      mathParts: [
        ["a, b", "the two known flight legs"],
        ["C", "included angle between the legs"],
        ["c", "closing ground distance"],
        ["−2ab cos C", "the correction that accounts for the non-right angle"],
      ],
      keys: {
        "cosine leg": {
          meaning: "Cosine of the included angle adjusts the two legs so they close into the correct triangle.",
          here: "Cyan marks the first leg from the airport.",
        },
        "sine leg": {
          meaning: "The second leg contributes both horizontal and vertical displacement; sine describes its sideways part.",
          here: "Yellow marks the second leg and its glow.",
        },
        "ground track": {
          meaning: "The ground track is the actual path over the ground after combining the legs and wind.",
          here: "The magenta closing side between the two route endpoints.",
        },
      },
    },
    17: {
      story: [
        {
          title: "Keep a 3D surface normal unit-length",
          text: "You are writing a lighting shader. A surface normal is an arrow perpendicular to the surface; it must have length 1 so the lighting maths stays stable. You know one component and need the other.",
          focus: "the metallic sphere, the magenta normal arrow, and the orbiting yellow light.",
        },
        {
          title: "Sine and cosine are the two legs",
          text: "On the unit circle, the normal's horizontal component is cosine and its vertical component is sine. The dashed identity diagram shows a right triangle with hypotenuse 1 and legs sin θ and cos θ.",
          focus: "the small triangle on the left panel. Its legs are exactly the two normal components.",
        },
        {
          title: "Pythagoras guarantees the identity",
          text: "Because the hypotenuse is 1, sin²θ + cos²θ = 1. Given sin θ, compute cos θ = √(1 − sin²θ). Drag sin θ and watch the normal stay unit-length while its direction changes.",
          focus: "the 'Identity' HUD chip. It should stay at 1.0000 no matter where you drag.",
        },
      ],
      math: "The Pythagorean identity sin²θ + cos²θ = 1 comes from a right triangle with hypotenuse 1. It lets you recover one component of a unit normal from the other.",
      mathParts: [
        ["sin θ", "vertical component of the unit normal"],
        ["cos θ", "horizontal component of the unit normal"],
        ["1", "the length of a normalised normal"],
        ["sin² + cos²", "Pythagoras applied to the unit circle"],
      ],
      keys: {
        "cosine normal": {
          meaning: "The cosine component is the normal's horizontal share. Squaring it contributes to the unit-length identity.",
          here: "Cyan draws the horizontal leg of the identity triangle.",
        },
        "sine normal": {
          meaning: "The sine component is the normal's vertical share. It drives how much the surface faces up or down.",
          here: "The magenta normal arrow and vertical leg of the triangle.",
        },
        "light vector": {
          meaning: "A light vector points from the surface toward the light. Its angle with the normal determines brightness.",
          here: "The yellow orbiting light and the rays reaching the sphere.",
        },
      },
    },
    18: {
      story: [
        {
          title: "Find the launch angle that shoots farthest",
          text: "You are testing a projectile launcher. Speed is fixed by the mechanism, but you can choose the launch angle. Your goal is to maximise horizontal range on level ground.",
          focus: "the cannon, the yellow trajectory arc, the target ring, and the distance markers.",
        },
        {
          title: "The trajectory is a parabola",
          text: "Gravity pulls the projectile down while its horizontal velocity stays constant. That combination traces a parabola. The yellow line is the path; the magenta ball is the projectile at the current moment.",
          focus: "the target ring where the trajectory lands. The ring moves as the range changes.",
        },
        {
          title: "Double angle explains the 45° sweet spot",
          text: "Range depends on sin 2θ, which reaches its maximum at 90°, so θ = 45°. Speeds and angles that are symmetric around 45° produce the same range. Drag the angle and watch the range peak.",
          focus: "the 'Range R' HUD chip and the target ring. Try 30° and 60° — they land in the same place.",
        },
      ],
      math: "Range on level ground is R = v² sin(2θ)/g. The double-angle identity means the range peaks when 2θ = 90°, so the best launch angle is 45°.",
      mathParts: [
        ["v", "muzzle speed"],
        ["θ", "launch angle above horizontal"],
        ["g", "gravitational acceleration, 9.81 m/s²"],
        ["sin 2θ", "the double-angle factor that peaks at 45°"],
      ],
      keys: {
        "cosine": {
          meaning: "Cosine gives the horizontal share of the launch velocity, which stays constant during flight.",
          here: "Cyan marks the horizontal direction and the range axis.",
        },
        "sine": {
          meaning: "Sine gives the vertical share of the launch velocity, which gravity gradually removes.",
          here: "Magenta marks the projectile ball and the vertical rise of the path.",
        },
        "trajectory": {
          meaning: "A trajectory is the path a moving object follows through space. Here it is the parabolic arc of the cannonball.",
          here: "The yellow parabola from the muzzle to the target ring.",
        },
      },
    },
    19: {
      story: [
        {
          title: "Point a solar panel at the sun",
          text: "You are commissioning a sun-tracking solar array. The panel produces the most power when its surface faces the sun directly. You need the angle between the panel normal and the incoming sunlight.",
          focus: "the glowing sun, the tilted panel, the magenta normal arrow, and the yellow cross-product arrow.",
        },
        {
          title: "The cross product builds a perpendicular",
          text: "The panel edge a and the sun vector b define a plane. Their cross product a × b is perpendicular to both; its direction is the tilt axis and its length is |a||b| sin θ. That is why the yellow cross-product arrow swings as the panel turns.",
          focus: "the yellow cross-product arrow and the magenta panel normal. They are always at right angles to the panel.",
        },
        {
          title: "Alignment is a dot product in disguise",
          text: "Output is highest when the panel normal points at the sun, making the angle between them zero. The cross-product magnitude is largest when they are perpendicular. Drag the panel azimuth and watch the output ring and incidence readout.",
          focus: "the 'Panel output' percentage and the green ring. Peak output means the panel is square to the sun.",
        },
      ],
      math: "The cross product a × b is perpendicular to both vectors. Its magnitude is |a||b| sin θ, where θ is the angle between them. A solar panel's normal should align with the sun vector for maximum output.",
      mathParts: [
        ["a", "panel edge vector"],
        ["b", "sun direction vector"],
        ["|a × b|", "area/tilt measure, largest when a and b are perpendicular"],
        ["normal", "the direction the panel surface faces"],
      ],
      keys: {
        "cosine": {
          meaning: "Cosine measures alignment: it is 1 when two directions point the same way and 0 when they are perpendicular.",
          here: "Cyan marks the panel edge and the horizontal sun-tracking direction.",
        },
        "sine": {
          meaning: "Sine measures perpendicularity: it is 1 when two directions are at 90° and 0 when they align.",
          here: "Magenta marks the panel normal and the tilt response.",
        },
        "cross product": {
          meaning: "The cross product produces a vector perpendicular to two inputs. Its length depends on the sine of the angle between them.",
          here: "The yellow arrow rising from the panel. It defines the tilt axis and grows as the sun moves away from the panel normal.",
        },
      },
    },
    20: {
      story: [
        {
          title: "Pin a satellite above the Earth",
          text: "You are in mission control. A GPS satellite is described by latitude, longitude, and altitude. To draw it in a 3D engine, you must convert those spherical coordinates into x, y, z.",
          focus: "the wireframe globe, the magenta location pin, the yellow radius vector, and the orbiting satellite.",
        },
        {
          title: "Latitude, longitude, and radius",
          text: "Latitude φ measures how far north or south of the equator you are. Longitude λ measures how far around the planet you are. The radius r is Earth's radius plus altitude. Together they locate any point in 3D space.",
          focus: "the yellow radius line from Earth's centre to the pin. It is the r in the formula.",
        },
        {
          title: "Spherical to Cartesian",
          text: "x = r cos φ cos λ, y = r sin φ, and z = r cos φ sin λ. Latitude behaves like an elevation angle; longitude spins you around the y-axis. Drag the latitude and longitude sliders and watch the pin and x/y/z readouts move.",
          focus: "the x, y, z HUD chips. They are the same location expressed as three perpendicular distances.",
        },
      ],
      math: "Spherical coordinates (r, φ, λ) become Cartesian coordinates: x = r cos φ cos λ, y = r sin φ, z = r cos φ sin λ. Latitude φ is elevation from the equator and longitude λ is rotation around the polar axis.",
      mathParts: [
        ["r", "distance from Earth's centre: 6,371 km + altitude"],
        ["φ", "latitude, measured from the equator"],
        ["λ", "longitude, measured around the equator"],
        ["x, y, z", "Cartesian coordinates used by the 3D renderer"],
      ],
      keys: {
        "cosine": {
          meaning: "Cosine projects the radius onto the equatorial plane, based on latitude.",
          here: "Cyan is the globe's latitude/longitude grid and the cosine projection that keeps the pin on the surface.",
        },
        "sine": {
          meaning: "Sine gives the vertical component of the radius, which is the y-coordinate.",
          here: "Magenta marks the location pin and its height above the equator.",
        },
        "radius vector": {
          meaning: "The radius vector points from Earth's centre to the satellite or surface location. Its length is r.",
          here: "The yellow line from the globe's centre to the pin, plus the dashed beam up to the satellite.",
        },
      },
    },
  };

  const ONBOARD_KEY = "triglab3d.onboarded.v1";

  /* ------------------------------------------------------------------------
     2. Generative exercises — one distinct generator per module
     Every generator returns a fresh problem with a worked solution.
     ------------------------------------------------------------------------ */
  function exAngles() {
    const start = ri(8, 348);
    const turn = ri(25, 310) * pick([-1, 1]);
    const answer = norm360(start + turn);
    return {
      prompt: `A robotic arm starts at ${start}° and rotates ${signed(turn)}°. What is its final angle in the standard interval [0°, 360°)?`,
      context: "The arm's base encoder reports a signed relative rotation. Normalize the result so the controller always commands a positive standard-position angle.",
      givens: [["θ₀", `${start}°`], ["Δθ", `${signed(turn)}°`]],
      unit: "°",
      answer,
      tol: tolFor(answer),
      hint: "Add the signed rotation, then add or subtract 360° until the angle lands between 0° and 360°.",
      solution: [
        `Start with θ = ${start}° + (${turn}°) = ${start + turn}°.`,
        `Normalize modulo 360°: (${start + turn}° + 360k) lands in [0°, 360°).`,
        `Final standard angle = <code>${fmt(answer, 1)}°</code>.`,
      ],
    };
  }

  function exRadians() {
    const radiusCm = ri(28, 48);
    const rpm = ri(280, 980);
    const answer = ((rpm * 2 * Math.PI) / 60) * (radiusCm / 100) * 3.6;
    return {
      prompt: `A tire with radius ${radiusCm} cm rotates at ${rpm} rpm. What is the vehicle's linear speed in km/h?`,
      context: "Convert revolutions per minute to angular velocity in rad/s, then multiply by the tire radius to get m/s. Finally multiply by 3.6 for km/h.",
      givens: [["radius", `${radiusCm} cm`], ["N", `${rpm} rpm`]],
      unit: "km/h",
      answer,
      tol: tolFor(answer),
      hint: "ω = 2πN/60. Convert the radius to metres before multiplying.",
      solution: [
        `ω = 2π(${rpm})/60 = <code>${fmt((rpm * 2 * Math.PI) / 60, 3)} rad/s</code>.`,
        `v = ωr = ${fmt((rpm * 2 * Math.PI) / 60, 3)} × ${fmt(radiusCm / 100, 2)} = ${fmt((rpm * 2 * Math.PI * radiusCm) / 6000, 3)} m/s.`,
        `In km/h: ${fmt((rpm * 2 * Math.PI * radiusCm) / 6000, 3)} × 3.6 = <code>${fmt(answer, 1)} km/h</code>.`,
      ],
    };
  }

  function exClinometer() {
    const distance = ri(18, 78);
    const angle = ri(26, 58);
    const eye = 1.6;
    const answer = distance * Math.tan(rad(angle)) + eye;
    return {
      prompt: `A surveyor stands ${distance} m from a skyscraper and measures a ${angle}° clinometer angle to its roof. If eye height is 1.6 m, find the building height.`,
      context: "The horizontal distance is the adjacent side and the height above eye level is the opposite side. Use tan θ, then add eye height.",
      givens: [["adjacent", `${distance} m`], ["θ", `${angle}°`], ["eye", "1.6 m"]],
      unit: "m",
      answer,
      tol: tolFor(answer),
      hint: "Height above eye level = distance × tan θ. Do not forget the 1.6 m eye height.",
      solution: [
        `tan ${angle}° = opposite / ${distance}, so opposite = ${distance} × tan ${angle}° = <code>${fmt(distance * Math.tan(rad(angle)), 2)} m</code>.`,
        `Add eye height: ${fmt(distance * Math.tan(rad(angle)), 2)} + 1.6 = <code>${fmt(answer, 1)} m</code>.`,
      ],
    };
  }

  function exReciprocal() {
    const medium = pick(["air", "water"]);
    const n1 = medium === "water" ? 1.33 : 1.0;
    const n2 = pick([1.5, 1.6, 1.8, 2.0].filter((n) => n > n1));
    const theta1 = ri(22, 58);
    const answer = deg(Math.asin((n1 * Math.sin(rad(theta1))) / n2));
    return {
      prompt: `Light in ${medium} (n₁ = ${n1.toFixed(2)}) strikes a lens (n₂ = ${n2.toFixed(2)}) at an incidence angle of ${theta1}°. Find the refraction angle θ₂.`,
      context: "Apply Snell's law n₁ sin θ₁ = n₂ sin θ₂. The ratio of sines is the same kind of reciprocal relationship that connects sine, cosecant and secant.",
      givens: [["n₁", n1.toFixed(2)], ["n₂", n2.toFixed(2)], ["θ₁", `${theta1}°`]],
      unit: "°",
      answer,
      tol: tolFor(answer),
      hint: "sin θ₂ = (n₁/n₂) sin θ₁. Take the inverse sine at the end.",
      solution: [
        `n₁ sin θ₁ = ${n1.toFixed(2)} × sin ${theta1}° = ${fmt(n1 * Math.sin(rad(theta1)), 4)}.`,
        `sin θ₂ = ${fmt(n1 * Math.sin(rad(theta1)), 4)} / ${n2.toFixed(2)} = ${fmt((n1 * Math.sin(rad(theta1))) / n2, 4)}.`,
        `θ₂ = arcsin(${fmt((n1 * Math.sin(rad(theta1))) / n2, 4)}) = <code>${fmt(answer, 1)}°</code>.`,
      ],
    };
  }

  function exInverse() {
    const rise = ri(4, 14) / 10;
    const run = ri(60, 170) / 10;
    const answer = deg(Math.atan(rise / run));
    return {
      prompt: `A wheelchair ramp rises ${fmt(rise, 1)} m over a horizontal run of ${fmt(run, 1)} m. Find its incline angle θ.`,
      context: "The inspector recovers the angle from rise and run with the inverse tangent. Compare the result with the 4.8° accessibility threshold.",
      givens: [["rise", `${fmt(rise, 1)} m`], ["run", `${fmt(run, 1)} m`]],
      unit: "°",
      answer,
      tol: 0.05,
      hint: "tan θ = rise/run, so θ = arctan(rise/run).",
      solution: [
        `tan θ = ${fmt(rise, 1)} / ${fmt(run, 1)} = ${fmt(rise / run, 4)}.`,
        `θ = arctan(${fmt(rise / run, 4)}) = <code>${fmt(answer, 2)}°</code>.`,
        `This is ${answer <= 4.8 ? "within" : "above"} the 4.8° guidance.`,
      ],
    };
  }

  function exUnitCircle() {
    const angles = [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330];
    const angle = pick(angles);
    const fn = pick(["cos", "sin", "tan"]);
    const raw = fn === "cos" ? Math.cos(rad(angle)) : fn === "sin" ? Math.sin(rad(angle)) : Math.tan(rad(angle));
    const answer = Math.abs(raw) < 1e-10 ? 0 : raw;
    const q = quadrantOf(angle);
    const ref = refAngle(angle);
    return {
      prompt: `A joystick is pushed to ${angle}° on the unit-circle gate. Compute ${fn} ${angle}°.`,
      context: "The joystick's normalized position maps to (cos θ, sin θ). Use the reference angle and the ASTC signs for the quadrant.",
      givens: [["θ", `${angle}°`], ["quadrant", q], ["reference", `${ref}°`]],
      unit: "",
      answer,
      tol: 0.003,
      hint: `Reference angle is ${ref}°. Apply the ${q} quadrant sign to ${fn} ${ref}°.`,
      solution: [
        `θ = ${angle}° lies in Quadrant ${q}; reference angle = ${ref}°.`,
        `${fn} ${ref}° = ${fmt(fn === "cos" ? Math.cos(rad(ref)) : fn === "sin" ? Math.sin(rad(ref)) : Math.tan(rad(ref)), 4)}.`,
        `Apply the quadrant sign → <code>${fmt(answer, 4)}</code>.`,
      ],
    };
  }

  function exASTC() {
    const angle = pick([95, 110, 125, 140, 155, 170, 190, 205, 220, 235, 250, 265, 280, 295, 310, 325, 340, 355, 15, 40, 65, 80]);
    const fn = pick(["sin", "cos", "tan"]);
    const val = fn === "sin" ? Math.sin(rad(angle)) : fn === "cos" ? Math.cos(rad(angle)) : Math.tan(rad(angle));
    const positive = val >= 0;
    return {
      prompt: `An ATC target sits at bearing ${angle}°. Is ${fn} ${angle}° positive or negative?`,
      context: "Use ASTC: All are positive in QI, Sine in QII, Tangent in QIII, Cosine in QIV. The sign is what matters, not the magnitude.",
      givens: [["bearing", `${angle}°`], ["quadrant", quadrantOf(angle)], ["reference", `${refAngle(angle)}°`]],
      mode: "choice",
      choices: ["Positive", "Negative"],
      answerIndex: positive ? 0 : 1,
      hint: `Quadrant ${quadrantOf(angle)} — check which function ASTC leaves positive there.`,
      solution: [
        `Bearing ${angle}° → Quadrant ${quadrantOf(angle)}, reference angle ${refAngle(angle)}°.`,
        `ASTC sign rule for ${fn} in Q${quadrantOf(angle)}: ${positive ? "positive" : "negative"}.`,
        `Therefore ${fn} ${angle}° is <code>${positive ? "positive" : "negative"}</code>.`,
      ],
    };
  }

  function exSpecialTriangle() {
    if (Math.random() < 0.5) {
      const shortLeg = ri(3, 13);
      const askHyp = Math.random() < 0.5;
      const answer = askHyp ? 2 * shortLeg : shortLeg * Math.sqrt(3);
      return {
        prompt: `A roof truss forms a 30°–60°–90° triangle. The side opposite 30° is ${shortLeg} m. Find the ${askHyp ? "hypotenuse" : "long leg"}.`,
        context: "In a 30-60-90 triangle the sides are in ratio 1 : √3 : 2. The short leg is opposite 30°.",
        givens: [["short leg", `${shortLeg} m`], ["ratio", "1 : √3 : 2"]],
        unit: "m",
        answer,
        tol: 0.02,
        hint: askHyp ? "Hypotenuse = 2 × short leg." : "Long leg = short leg × √3.",
        solution: [
          `30-60-90 sides scale as 1 : √3 : 2.`,
          askHyp
            ? `Hypotenuse = 2 × ${shortLeg} = <code>${fmt(2 * shortLeg, 2)} m</code>.`
            : `Long leg = ${shortLeg} × √3 = <code>${fmt(shortLeg * Math.sqrt(3), 2)} m</code>.`,
        ],
      };
    }
    const leg = ri(4, 15);
    const answer = leg * Math.sqrt(2);
    return {
      prompt: `A 45°–45°–90° brace has equal legs of ${leg} m. Find the hypotenuse.`,
      context: "A 45-45-90 triangle is an isosceles right triangle, so the hypotenuse is leg × √2.",
      givens: [["leg", `${leg} m`], ["ratio", "1 : 1 : √2"]],
      unit: "m",
      answer,
      tol: 0.02,
      hint: "Hypotenuse = leg × √2.",
      solution: [
        `45-45-90 sides scale as 1 : 1 : √2.`,
        `Hypotenuse = ${leg}√2 = <code>${fmt(answer, 2)} m</code>.`,
      ],
    };
  }

  function exGenerator() {
    const peak = ri(80, 330);
    const freq = ri(40, 70);
    const tMs = ri(1, 18);
    const answer = peak * Math.sin(2 * Math.PI * freq * (tMs / 1000));
    return {
      prompt: `An AC generator outputs v(t) = ${peak} sin(2π·${freq}t) volts. Find the instantaneous voltage at t = ${tMs} ms.`,
      context: "Unrolling the generator's rotation produces a sine wave. Convert milliseconds to seconds before evaluating the phase.",
      givens: [["Vp", `${peak} V`], ["f", `${freq} Hz`], ["t", `${tMs} ms`]],
      unit: "V",
      answer,
      tol: tolFor(answer),
      hint: "Compute the phase 2πft with t in seconds, then multiply by Vp sin(phase).",
      solution: [
        `t = ${tMs} ms = ${fmt(tMs / 1000, 3)} s.`,
        `Phase = 2π × ${freq} × ${fmt(tMs / 1000, 3)} = ${fmt(2 * Math.PI * freq * (tMs / 1000), 4)} rad.`,
        `v = ${peak} × sin(${fmt(2 * Math.PI * freq * (tMs / 1000), 4)}) = <code>${fmt(answer, 2)} V</code>.`,
      ],
    };
  }

  function exPendulum() {
    const length = ri(12, 40) / 10;
    const angle = ri(12, 42);
    const answer = length * Math.sin(rad(angle));
    return {
      prompt: `A clock pendulum of length ${fmt(length, 1)} m hangs at ${angle}° from vertical. Find the bob's horizontal displacement from the vertical line.`,
      context: "The horizontal shadow of the pendulum is the opposite side of the angle: x = L sin θ. That projection is the cosine-like motion unrolled by the clock.",
      givens: [["L", `${fmt(length, 1)} m`], ["θ", `${angle}°`]],
      unit: "m",
      answer,
      tol: 0.005,
      hint: "x = L sin θ. Use the angle from vertical, not from horizontal.",
      solution: [
        `x = L sin θ = ${fmt(length, 1)} × sin ${angle}°.`,
        `sin ${angle}° = ${fmt(Math.sin(rad(angle)), 4)}.`,
        `x = <code>${fmt(answer, 3)} m</code>.`,
      ],
    };
  }

  function exTangent() {
    const height = ri(25, 90);
    const distance = ri(60, 260);
    const answer = deg(Math.atan(height / distance));
    return {
      prompt: `A lighthouse is ${height} m tall and its beam meets the shoreline ${distance} m away horizontally. Find the beam's depression angle below horizontal.`,
      context: "The tower height is opposite the depression angle and the shoreline distance is adjacent. As the distance shrinks, the angle climbs toward the 90° tangent asymptote.",
      givens: [["height", `${height} m`], ["distance", `${distance} m`]],
      unit: "°",
      answer,
      tol: 0.03,
      hint: "tan θ = height/distance, so θ = arctan(height/distance).",
      solution: [
        `tan θ = ${height} / ${distance} = ${fmt(height / distance, 4)}.`,
        `θ = arctan(${fmt(height / distance, 4)}) = <code>${fmt(answer, 2)}°</code>.`,
      ],
    };
  }

  function exRadio() {
    const frequency = ri(880, 1080) / 10;
    const answer = 300 / frequency;
    return {
      prompt: `An FM station broadcasts at ${fmt(frequency, 1)} MHz. What is its wavelength in metres?`,
      context: "Radio waves travel at the speed of light. Using c = 3 × 10⁸ m/s and frequency in MHz, λ = 300 / f metres.",
      givens: [["f", `${fmt(frequency, 1)} MHz`], ["c", "3 × 10⁸ m/s"]],
      unit: "m",
      answer,
      tol: tolFor(answer),
      hint: "Wavelength λ = 300 / f(MHz).",
      solution: [
        `λ = c/f = (3 × 10⁸) / (${fmt(frequency, 1)} × 10⁶).`,
        `Equivalent shortcut: 300 / ${fmt(frequency, 1)} = <code>${fmt(answer, 2)} m</code>.`,
      ],
    };
  }

  function exANC() {
    const amplitude = ri(20, 50) / 10;
    const phase = ri(20, 340);
    const answer = 2 * amplitude * Math.abs(Math.cos(rad(phase / 2)));
    return {
      prompt: `Two noise waves each have amplitude ${fmt(amplitude, 1)} V and a phase offset of ${phase}°. Find the amplitude of their superposition.`,
      context: "Equal-amplitude waves add by phasor geometry: the resultant is 2A cos(φ/2). At 180° the waves cancel completely.",
      givens: [["A", `${fmt(amplitude, 1)} V`], ["φ", `${phase}°`]],
      unit: "V",
      answer,
      tol: 0.01,
      hint: "Use A_sum = 2A|cos(φ/2)|.",
      solution: [
        `φ/2 = ${fmt(phase / 2, 1)}°. cos(${fmt(phase / 2, 1)}°) = ${fmt(Math.cos(rad(phase / 2)), 4)}.`,
        `A_sum = 2 × ${fmt(amplitude, 1)} × |${fmt(Math.cos(rad(phase / 2)), 4)}|.`,
        `A_sum = <code>${fmt(answer, 2)} V</code>.`,
      ],
    };
  }

  function exLawSines() {
    const baseline = ri(45, 125);
    const A = ri(35, 72);
    const B = ri(42, 78);
    const C = 180 - A - B;
    if (C <= 25) return exLawSines();
    const ac = (baseline * Math.sin(rad(B))) / Math.sin(rad(C));
    const answer = ac * Math.sin(rad(A));
    return {
      prompt: `A surveyor measures a baseline of ${baseline} m along a river. The sight angles to a landmark are A = ${A}° and B = ${B}°. Find the river width.`,
      context: "The third angle is C = 180° − A − B. Law of sines gives the far sightline AC; its perpendicular component is the river width.",
      givens: [["c", `${baseline} m`], ["A", `${A}°`], ["B", `${B}°`]],
      unit: "m",
      answer,
      tol: tolFor(answer),
      hint: "First find C, then AC = c sin B / sin C, then width = AC sin A.",
      solution: [
        `C = 180° − ${A}° − ${B}° = ${C}°.`,
        `AC = c sin B / sin C = ${baseline} × sin ${B}° / sin ${C}° = ${fmt(ac, 2)} m.`,
        `Width = AC sin A = ${fmt(ac, 2)} × sin ${A}° = <code>${fmt(answer, 1)} m</code>.`,
      ],
    };
  }

  function exSSA() {
    const a = ri(30, 140) / 10;
    const b = ri(50, 160) / 10;
    const A = ri(20, 70);
    const h = b * Math.sin(rad(A));
    const solutions = ssaSolutions(a, b, A);
    return {
      prompt: `A distress vessel is ${fmt(b, 1)} km from a station at bearing angle A = ${A}°. An interceptor can cover ${fmt(a, 1)} km. How many distinct intercept triangles satisfy the SSA data?`,
      context: "This is the ambiguous case. Compare a with the altitude h = b sin A and with b to count the possible triangles.",
      givens: [["a", `${fmt(a, 1)} km`], ["b", `${fmt(b, 1)} km`], ["A", `${A}°`]],
      mode: "choice",
      choices: ["0 triangles", "1 triangle", "2 triangles"],
      answerIndex: solutions === 0 ? 0 : solutions === 1 ? 1 : 2,
      hint: `Compute h = b sin A = ${fmt(h, 2)} km, then compare a = ${fmt(a, 1)} with h and b.`,
      solution: [
        `h = b sin A = ${fmt(b, 1)} × sin ${A}° = ${fmt(h, 2)} km.`,
        `a = ${fmt(a, 1)} km, b = ${fmt(b, 1)} km.`,
        solutions === 0
          ? `a &lt; h, so the interceptor circle never reaches the bearing line → <code>0 triangles</code>.`
          : solutions === 1
            ? `a = h (or a ≥ b), producing exactly <code>1 triangle</code>.`
            : `h &lt; a &lt; b, so the circle crosses the bearing line twice → <code>2 triangles</code>.`,
      ],
    };
  }

  function exLawCosines() {
    const a = ri(120, 430);
    const b = ri(90, 360);
    const C = ri(35, 145);
    const answer = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(rad(C)));
    return {
      prompt: `An aircraft flies leg a = ${a} km, then leg b = ${b} km with an included angle C = ${C}° between them. Find the closing ground distance c.`,
      context: "The two legs form a non-right triangle with included angle C. Law of cosines handles the side opposite that angle directly.",
      givens: [["a", `${a} km`], ["b", `${b} km`], ["C", `${C}°`]],
      unit: "km",
      answer,
      tol: tolFor(answer),
      hint: "c² = a² + b² − 2ab cos C.",
      solution: [
        `c² = ${a}² + ${b}² − 2(${a})(${b})cos ${C}°.`,
        `2ab cos C = ${fmt(2 * a * b * Math.cos(rad(C)), 1)}.`,
        `c² = ${a * a} + ${b * b} − ${fmt(2 * a * b * Math.cos(rad(C)), 1)} = ${fmt(a * a + b * b - 2 * a * b * Math.cos(rad(C)), 1)}.`,
        `c = <code>${fmt(answer, 1)} km</code>.`,
      ],
    };
  }

  function exPythag() {
    const s = ri(20, 90) / 100;
    const cosV = Math.sqrt(1 - s * s);
    return {
      prompt: `A normalized surface normal has sin θ = ${fmt(s, 2)} and lies in Quadrant I. Find cos θ using the Pythagorean identity.`,
      context: "Shader normals must remain unit length. The identity sin²θ + cos²θ = 1 recovers the missing component without another trig call.",
      givens: [["sin θ", fmt(s, 2)], ["quadrant", "I"]],
      unit: "",
      answer: cosV,
      tol: 0.003,
      hint: "cos θ = √(1 − sin²θ). Quadrant I means the positive root.",
      solution: [
        `cos²θ = 1 − sin²θ = 1 − ${fmt(s * s, 4)} = ${fmt(1 - s * s, 4)}.`,
        `cos θ = √${fmt(1 - s * s, 4)} = <code>${fmt(cosV, 4)}</code>.`,
        `Check: ${fmt(s * s, 4)} + ${fmt(cosV * cosV, 4)} = 1.`,
      ],
    };
  }

  function exProjectile() {
    const speed = ri(18, 56);
    const angle = ri(18, 76);
    const answer = (speed * speed * Math.sin(rad(2 * angle))) / 9.81;
    return {
      prompt: `A cannon fires at ${speed} m/s at a launch angle of ${angle}°. Find its horizontal range on level ground (g = 9.81 m/s²).`,
      context: "Range uses the double-angle identity: R = v² sin(2θ)/g. Notice how values symmetric about 45° produce the same range.",
      givens: [["v₀", `${speed} m/s`], ["θ", `${angle}°`], ["g", "9.81 m/s²"]],
      unit: "m",
      answer,
      tol: tolFor(answer),
      hint: "Multiply the angle by 2 first, then use R = v² sin(2θ)/g.",
      solution: [
        `2θ = ${2 * angle}°, sin ${2 * angle}° = ${fmt(Math.sin(rad(2 * angle)), 4)}.`,
        `R = ${speed}² × ${fmt(Math.sin(rad(2 * angle)), 4)} / 9.81.`,
        `R = <code>${fmt(answer, 1)} m</code>.`,
      ],
    };
  }

  function exCrossProduct() {
    const a = [ri(-4, 4), ri(-4, 4), ri(-4, 4)];
    let b = [ri(-4, 4), ri(-4, 4), ri(-4, 4)];
    if (a.every((v, i) => v === b[i])) b = [b[0] + 1, b[1], b[2]];
    const cross = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const answer = Math.sqrt(cross[0] ** 2 + cross[1] ** 2 + cross[2] ** 2);
    return {
      prompt: `A solar panel edge is a = (${a.join(", ")}) and the sun direction is b = (${b.join(", ")}). Find |a × b|.`,
      context: "The cross product gives the tilt axis; its magnitude is |a||b| sin θ and measures how perpendicular the sun is to the panel edge.",
      givens: [["a", `(${a.join(", ")})`], ["b", `(${b.join(", ")})`]],
      unit: "",
      answer,
      tol: 0.01,
      hint: "Compute a × b component-wise, then take the square root of the sum of squares.",
      solution: [
        `a × b = (${a[1]}·${b[2]} − ${a[2]}·${b[1]}, ${a[2]}·${b[0]} − ${a[0]}·${b[2]}, ${a[0]}·${b[1]} − ${a[1]}·${b[0]}).`,
        `a × b = (${cross.join(", ")}).`,
        `|a × b| = √(${cross.map((v) => v * v).join(" + ")}) = <code>${fmt(answer, 2)}</code>.`,
      ],
    };
  }

  function exSpherical() {
    const altitude = ri(40, 200) * 10;
    const lat = ri(-70, 70);
    const lon = ri(-170, 170);
    const r = 6371 + altitude;
    const answer = r * Math.cos(rad(lat)) * Math.cos(rad(lon));
    return {
      prompt: `A GPS satellite is at altitude ${altitude} km above latitude φ = ${lat}° and longitude λ = ${lon}°. Find its Cartesian x-coordinate, using Earth radius 6,371 km.`,
      context: "Spherical to Cartesian: x = r cos φ cos λ, y = r sin φ, z = r cos φ sin λ. Latitude acts as the elevation angle from the equator.",
      givens: [["r", `${r} km`], ["φ", `${lat}°`], ["λ", `${lon}°`]],
      unit: "km",
      answer,
      tol: tolFor(answer),
      hint: "x = r cos φ cos λ. Compute cos φ and cos λ separately.",
      solution: [
        `r = 6371 + ${altitude} = ${r} km.`,
        `x = ${r} × cos ${lat}° × cos ${lon}°.`,
        `x = ${r} × ${fmt(Math.cos(rad(lat)), 4)} × ${fmt(Math.cos(rad(lon)), 4)} = <code>${fmt(answer, 0)} km</code>.`,
      ],
    };
  }

  /* ------------------------------------------------------------------------
     3. Shared trigonometry helpers
     ------------------------------------------------------------------------ */
  function quadrantOf(angle) {
    const a = norm360(angle);
    if (a < 90) return "I";
    if (a < 180) return "II";
    if (a < 270) return "III";
    return "IV";
  }

  function refAngle(angle) {
    const a = norm360(angle);
    if (a <= 90) return a;
    if (a <= 180) return 180 - a;
    if (a <= 270) return a - 180;
    return 360 - a;
  }

  function ssaSolutions(a, b, A) {
    const h = b * Math.sin(rad(A));
    const eps = 0.015;
    if (A >= 90 - eps) return a > b + eps ? 1 : 0;
    if (a < h - eps) return 0;
    if (Math.abs(a - h) <= eps) return 1;
    if (a < b - eps) return 2;
    return 1;
  }

  function bandCheck(band, freq) {
    if (band === "FM") return freq >= 88 && freq <= 108 ? "in band" : "out of band";
    return freq >= 0.54 && freq <= 1.6 ? "in band" : "out of band";
  }

  /* ------------------------------------------------------------------------
     4. Three.js scene toolkit
     ------------------------------------------------------------------------ */
  const C = {
    cyan: 0x22d3ee,
    magenta: 0xf472b6,
    yellow: 0xfacc15,
    green: 0x4ade80,
    violet: 0xa78bfa,
    orange: 0xfb923c,
    red: 0xfb7185,
    blue: 0x38bdf8,
    teal: 0x2dd4bf,
    white: 0xdfefff,
    slate: 0x1e3a5f,
  };

  function sceneBase(accent, camPos = [10, 7, 13], target = [0, 1.5, 0], opts = {}) {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050b16, opts.fog != null ? opts.fog : 0.018);
    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 500);
    camera.position.set(camPos[0], camPos[1], camPos[2]);
    const targetVec = new THREE.Vector3(target[0], target[1], target[2]);
    camera.lookAt(targetVec);

    const hemi = new THREE.HemisphereLight(0x9bd8ff, 0x0a1322, 0.7);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(7, 12, 9);
    scene.add(key);
    const rim = new THREE.PointLight(new THREE.Color(accent), 1.6, 50, 1.8);
    rim.position.set(-7, 7, -5);
    scene.add(rim);
    const fill = new THREE.PointLight(0x2b6cb0, 0.8, 40, 2);
    fill.position.set(8, 3, 8);
    scene.add(fill);

    if (opts.grid !== false) {
      const grid = new THREE.GridHelper(30, 30, 0x1d4266, 0x10243a);
      grid.position.y = opts.gridY != null ? opts.gridY : 0;
      grid.material.transparent = true;
      grid.material.opacity = 0.62;
      scene.add(grid);
    }
    return { scene, camera, target: targetVec, accent: new THREE.Color(accent) };
  }

  function neon(color, opts = {}) {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color(color),
      emissiveIntensity: opts.e != null ? opts.e : 0.32,
      metalness: opts.metal != null ? opts.metal : 0.45,
      roughness: opts.rough != null ? opts.rough : 0.34,
      transparent: opts.opacity != null,
      opacity: opts.opacity != null ? opts.opacity : 1,
      side: opts.side != null ? opts.side : THREE.FrontSide,
      wireframe: !!opts.wireframe,
      depthWrite: opts.depthWrite != null ? opts.depthWrite : true,
    });
  }

  function glass(color, opacity = 0.18) {
    return new THREE.MeshPhongMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.08,
      transparent: true,
      opacity,
      shininess: 90,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  function basic(color, opacity = 1, blending) {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: opacity < 1,
      opacity,
      side: THREE.DoubleSide,
      blending: blending || THREE.NormalBlending,
      depthWrite: false,
    });
  }

  function box(parent, w, h, d, color, pos, opts = {}) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), opts.material || neon(color, opts));
    m.position.set(pos[0], pos[1], pos[2]);
    if (opts.rot) m.rotation.set(opts.rot[0], opts.rot[1], opts.rot[2]);
    parent.add(m);
    return m;
  }

  function cyl(parent, rt, rb, h, color, pos, opts = {}) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, opts.seg || 24, 1, !!opts.open), opts.material || neon(color, opts));
    m.position.set(pos[0], pos[1], pos[2]);
    if (opts.rot) m.rotation.set(opts.rot[0], opts.rot[1], opts.rot[2]);
    parent.add(m);
    return m;
  }

  function sph(parent, r, color, pos, opts = {}) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, opts.seg || 24, opts.seg2 || 16), opts.material || neon(color, opts));
    m.position.set(pos[0], pos[1], pos[2]);
    parent.add(m);
    return m;
  }

  function torus(parent, r, tube, color, pos, opts = {}) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, opts.seg || 12, opts.radial || 48, opts.arc || Math.PI * 2), opts.material || neon(color, opts));
    m.position.set(pos[0], pos[1], pos[2]);
    if (opts.rot) m.rotation.set(opts.rot[0], opts.rot[1], opts.rot[2]);
    parent.add(m);
    return m;
  }

  function line(points, color, opacity = 1, dashed = false, width = 1) {
    const geo = new THREE.BufferGeometry().setFromPoints(points.map(toVec));
    const m = dashed
      ? new THREE.LineDashedMaterial({ color: new THREE.Color(color), transparent: true, opacity, dashSize: 0.22, gapSize: 0.16, linewidth: width })
      : new THREE.LineBasicMaterial({ color: new THREE.Color(color), transparent: opacity < 1, opacity, linewidth: width });
    m.toneMapped = false;
    const l = new THREE.Line(geo, m);
    if (dashed) l.computeLineDistances();
    return l;
  }

  function updateLine(l, points) {
    if (!l) return;
    l.geometry.dispose();
    l.geometry = new THREE.BufferGeometry().setFromPoints(points.map(toVec));
    if (l.material.isLineDashedMaterial) l.computeLineDistances();
  }

  function toVec(p) {
    return p && p.isVector3 ? p : new THREE.Vector3(p[0], p[1], p[2]);
  }

  function beam(parent, a, b, radius, color, opts = {}) {
    const va = toVec(a);
    const vb = toVec(b);
    const dir = new THREE.Vector3().subVectors(vb, va);
    const len = dir.length();
    if (len < 1e-6) return null;
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, len, opts.seg || 10),
      opts.material || neon(color, { e: 0.5, metal: 0.3, rough: 0.4, opacity: opts.opacity })
    );
    m.position.copy(va).add(vb).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    parent.add(m);
    return m;
  }

  function arrow(parent, dir, origin, length, color, opts = {}) {
    const v = toVec(dir).clone().normalize();
    const o = toVec(origin);
    const a = new THREE.ArrowHelper(v, o, length, new THREE.Color(color), opts.head || Math.max(0.3, length * 0.2), opts.headWidth || Math.max(0.16, length * 0.09));
    a.line.material.toneMapped = false;
    a.cone.material.toneMapped = false;
    parent.add(a);
    return a;
  }

  function arcPoints(cx, cy, cz, r, a0, a1, n = 36, plane = "xy") {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      if (plane === "xz") pts.push([cx + r * Math.cos(a), cy, cz + r * Math.sin(a)]);
      else pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a), cz]);
    }
    return pts;
  }

  function circleLine(cx, cy, cz, r, color, opacity = 1, plane = "xy", dashed = false) {
    return line(arcPoints(cx, cy, cz, r, 0, Math.PI * 2, 72, plane), color, opacity, dashed);
  }

  function starfield(scene, count = 650, radius = 70) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const r = radius * (0.55 + Math.random() * 0.45);
      positions[i * 3] = r * Math.sqrt(1 - u * u) * Math.cos(th);
      positions[i * 3 + 1] = r * u;
      positions[i * 3 + 2] = r * Math.sqrt(1 - u * u) * Math.sin(th);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0x9fdcff, size: 0.34, transparent: true, opacity: 0.55, sizeAttenuation: true });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    return pts;
  }

  function clearGroup(group) {
    while (group.children.length) {
      const child = group.children.pop();
      child.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
    }
  }

  /* ------------------------------------------------------------------------
     5. The 20 interactive scenes
     ------------------------------------------------------------------------ */

  /* 01 — Robotic arm ------------------------------------------------------- */
  function buildArmScene(accent) {
    const base = sceneBase(accent, [9.5, 8, 13], [0, 2.3, 0]);
    const scene = base.scene;

    // Floor pad and safety ring
    cyl(scene, 2.3, 2.55, 0.32, C.slate, [0, 0.16, 0]);
    torus(scene, 2.42, 0.045, C.cyan, [0, 0.34, 0], { rot: [Math.PI / 2, 0, 0], e: 0.6 });
    const padRing = torus(scene, 2.8, 0.025, C.yellow, [0, 0.02, 0], { rot: [Math.PI / 2, 0, 0], opacity: 0.45 });
    padRing.scale.setScalar(1);

    // Turret
    const turret = new THREE.Group();
    turret.position.y = 0.34;
    scene.add(turret);
    cyl(turret, 1.2, 1.5, 1.0, 0x183653, [0, 0.5, 0]);
    cyl(turret, 0.82, 0.98, 0.26, C.cyan, [0, 1.1, 0], { e: 0.5 });
    const baseArc = line(arcPoints(0, 0.36, 0, 2.9, 0, 0, 48, "xz"), C.yellow, 0.85);
    scene.add(baseArc);

    // Shoulder joint
    const shoulder = new THREE.Group();
    shoulder.position.y = 1.25;
    turret.add(shoulder);
    sph(shoulder, 0.44, C.cyan, [0, 0, 0], { e: 0.55 });
    box(shoulder, 0.44, 2.7, 0.48, 0x2b6cb0, [0, 1.35, 0]);
    box(shoulder, 0.18, 2.45, 0.18, 0x9bdcff, [0.24, 1.36, 0], { e: 0.55, metal: 0.7 });

    // Elbow joint
    const elbow = new THREE.Group();
    elbow.position.y = 2.7;
    shoulder.add(elbow);
    sph(elbow, 0.36, C.magenta, [0, 0, 0], { e: 0.6 });
    box(elbow, 0.34, 2.2, 0.36, 0x2b6cb0, [0, 1.1, 0]);
    box(elbow, 0.14, 1.95, 0.14, 0xc084fc, [0.21, 1.08, 0], { e: 0.45 });

    // Wrist + gripper
    const wrist = new THREE.Group();
    wrist.position.y = 2.2;
    elbow.add(wrist);
    box(wrist, 0.7, 0.28, 0.62, C.yellow, [0, 0.03, 0], { e: 0.4 });
    const fingerL = box(wrist, 0.12, 0.62, 0.18, 0xf8fafc, [-0.22, 0.44, 0], { e: 0.2, metal: 0.8 });
    const fingerR = box(wrist, 0.12, 0.62, 0.18, 0xf8fafc, [0.22, 0.44, 0], { e: 0.2, metal: 0.8 });
    const tipLight = new THREE.PointLight(C.yellow, 0.9, 4, 2);
    tipLight.position.set(0, 0.65, 0);
    wrist.add(tipLight);
    sph(wrist, 0.09, C.yellow, [0, 0.72, 0], { e: 0.9 });

    // Crate target
    const crate = box(scene, 0.85, 0.85, 0.85, C.yellow, [4.1, 0.46, 1.4], { e: 0.16, rough: 0.7 });
    box(scene, 0.9, 0.08, 0.9, 0xfef3c7, [4.1, 0.9, 1.4], { e: 0.35 });
    const crateRing = torus(scene, 0.95, 0.025, C.yellow, [4.1, 0.03, 1.4], { rot: [Math.PI / 2, 0, 0], opacity: 0.6 });
    const beacon = sph(scene, 0.12, C.cyan, [4.1, 1.35, 1.4], { e: 0.9 });

    // Pick-and-place platform
    box(scene, 2.3, 0.18, 2.3, 0x142c44, [4.1, 0.09, 1.4]);
    for (let i = -1; i <= 1; i += 2) {
      box(scene, 0.08, 1.2, 0.08, C.cyan, [4.1 + i * 1.0, 0.6, 0.35], { e: 0.45, opacity: 0.8 });
      box(scene, 0.08, 1.2, 0.08, C.cyan, [4.1 + i * 1.0, 0.6, 2.45], { e: 0.45, opacity: 0.8 });
    }

    // Joint halos
    const halos = [];
    [shoulder, elbow].forEach((g, i) => {
      const h = torus(g, 0.58 + i * 0.05, 0.018, i ? C.magenta : C.cyan, [0, 0, 0], { opacity: 0.5 });
      halos.push(h);
    });

    const tmp = new THREE.Vector3();
    return {
      scene,
      camera: base.camera,
      target: base.target,
      update(t, s) {
        turret.rotation.y = rad(s.base);
        shoulder.rotation.z = rad(-s.shoulder);
        elbow.rotation.z = rad(s.elbow);
        const spread = 0.1 + (1 - s.grip) * 0.28;
        fingerL.position.x = -spread;
        fingerR.position.x = spread;
        fingerL.rotation.z = (1 - s.grip) * 0.12;
        fingerR.rotation.z = -(1 - s.grip) * 0.12;
        const sweep = norm360(s.base);
        updateLine(baseArc, arcPoints(0, 0.36, 0, 2.9, 0, rad(sweep), 52, "xz"));
        halos.forEach((h, i) => {
          h.rotation.z = t * (i ? -0.6 : 0.8);
          h.rotation.x = t * 0.35;
          h.material.opacity = 0.32 + 0.18 * Math.sin(t * 2 + i);
        });
        padRing.scale.setScalar(1 + 0.035 * Math.sin(t * 2.2));
        beacon.material.emissiveIntensity = 0.6 + 0.4 * Math.sin(t * 4);
        beacon.position.y = 1.35 + (s.auto ? 0.08 * Math.sin(t * 3) : 0);
        crateRing.rotation.z = t * 0.35;
        if (s.auto) tipLight.intensity = 0.7 + 0.35 * Math.sin(t * 3.7);
        tmp.set(0, 2.2, 0);
        wrist.localToWorld(tmp);
        tipLight.position.y = 0.65 + (s.auto ? 0.04 * Math.sin(t * 5) : 0);
      },
    };
  }

  /* 02 — Tire / speedometer ------------------------------------------------ */
  function buildWheelScene(accent) {
    const base = sceneBase(accent, [10, 7, 14], [0, 2.3, 0]);
    const scene = base.scene;

    // Road
    box(scene, 24, 0.12, 6.6, 0x0b1b2c, [0, -0.05, 0]);
    for (let x = -11; x < 12; x += 2.5) {
      box(scene, 1.2, 0.02, 0.12, C.yellow, [x, 0.02, 0], { e: 0.4, opacity: 0.6 });
    }
    box(scene, 24, 0.02, 0.1, C.cyan, [0, 0.03, -3.25], { opacity: 0.5 });
    box(scene, 24, 0.02, 0.1, C.cyan, [0, 0.03, 3.25], { opacity: 0.5 });

    const wheel = new THREE.Group();
    wheel.position.set(0, 2.35, 0);
    scene.add(wheel);
    const tireMat = neon(0x0f1f32, { e: 0.04, metal: 0.2, rough: 0.85 });
    const tire = torus(wheel, 1.75, 0.42, 0x0f1f32, [0, 0, 0], { material: tireMat, radial: 48 });
    const tread = torus(wheel, 1.75, 0.47, 0x24425f, [0, 0, 0], { material: neon(0x24425f, { e: 0.02, rough: 0.9 }), radial: 12, opacity: 0.7 });
    tread.scale.setScalar(1.0);
    torus(wheel, 1.15, 0.1, C.cyan, [0, 0, 0], { e: 0.6 });
    cyl(wheel, 0.28, 0.28, 0.5, C.cyan, [0, 0, 0], { rot: [Math.PI / 2, 0, 0], e: 0.6 });
    const spokes = [];
    for (let i = 0; i < 5; i++) {
      const sp = box(wheel, 0.1, 2.12, 0.08, 0x9bdcff, [0, 0, 0.0], { e: 0.35, metal: 0.7 });
      sp.rotation.z = (i * Math.PI * 2) / 5;
      spokes.push(sp);
    }
    // Hub glow
    const hub = sph(wheel, 0.19, C.yellow, [0, 0, 0.28], { e: 0.6 });

    // Velocity arrow
    const velArrow = arrow(scene, [1, 0, 0], [2.4, 0.35, 2.7], 3.4, C.yellow, { head: 0.55, headWidth: 0.25 });

    // Speedometer
    const gauge = new THREE.Group();
    gauge.position.set(4.3, 3.5, -2.7);
    scene.add(gauge);
    torus(gauge, 1.45, 0.06, 0x274b6e, [0, 0, 0], { material: neon(0x274b6e, { e: 0.1, rough: 0.6 }), seg: 8 });
    torus(gauge, 1.45, 0.02, C.cyan, [0, 0, 0], { opacity: 0.4 });
    const needle = box(gauge, 0.055, 1.22, 0.04, C.magenta, [0, 0, 0.1], { e: 0.9 });
    needle.geometry.translate(0, 0.61, 0);
    sph(gauge, 0.13, C.cyan, [0, 0, 0.12], { e: 0.8 });
    for (let i = 0; i <= 10; i++) {
      const a = rad(-220 + i * 26);
      const tick = box(gauge, 0.025, i % 2 === 0 ? 0.24 : 0.14, 0.02, i % 2 === 0 ? C.cyan : 0x547696, [Math.cos(a) * 1.22, Math.sin(a) * 1.22, 0.06], { e: 0.4 });
      tick.rotation.z = a - Math.PI / 2;
    }
    const gaugeLight = new THREE.PointLight(C.cyan, 0.8, 5, 2);
    gaugeLight.position.set(0, 0, 0.5);
    gauge.add(gaugeLight);
    gauge.rotation.y = -0.28;

    // Distance markers
    for (let i = 0; i < 5; i++) {
      box(scene, 0.08, 0.8, 0.08, 0x3a5a79, [-8 + i * 4, 0.4, 4.4]);
    }

    let angle = 0;
    let last = 0;
    return {
      scene,
      camera: base.camera,
      target: base.target,
      update(t, s) {
        const dt = Math.min(0.05, Math.max(0, t - last));
        last = t;
        const omega = (s.rpm * Math.PI * 2) / 60;
        if (s.auto) angle -= omega * dt;
        wheel.rotation.z = angle;
        const kmh = omega * (s.radius / 100) * 3.6;
        needle.rotation.z = rad(-220 + clamp(kmh / 120, 0, 1) * 260);
        velArrow.setLength(0.6 + clamp(kmh / 120, 0, 1) * 4.6, 0.32, 0.16);
        velArrow.position.set(2.4, 0.35, 2.7);
        hub.material.emissiveIntensity = 0.45 + 0.3 * Math.sin(t * 3);
        gaugeLight.intensity = 0.55 + 0.25 * Math.sin(t * 2.5);
        tread.rotation.z = angle * 0.98;
      },
    };
  }

  /* 03 — Clinometer -------------------------------------------------------- */
  function buildClinometerScene(accent) {
    const base = sceneBase(accent, [17, 11, 22], [4, 4, 0]);
    const scene = base.scene;
    const SCALE = 1 / 8;

    // Street
    box(scene, 34, 0.08, 8, 0x0c1c2e, [4, -0.02, 2]);
    for (let i = -3; i < 12; i++) {
      box(scene, 1.6, 0.01, 0.12, C.yellow, [i * 2, 0.03, 2], { opacity: 0.45, e: 0.3 });
    }

    // Building group: unit-height box scaled vertically
    const building = new THREE.Group();
    building.position.x = 0;
    scene.add(building);
    box(building, 2.6, 1, 2.0, 0x16324f, [0, 0.5, 0], { e: 0.06, metal: 0.5, rough: 0.55 });
    for (let i = 0; i < 12; i++) {
      box(building, 2.42, 0.012, 2.02, i % 3 === 0 ? C.cyan : 0x2d587e, [0, 0.06 + i * 0.075, 0], { e: 0.32, opacity: 0.72 });
    }
    const roof = box(building, 2.9, 0.05, 2.3, C.cyan, [0, 0.995, 0], { e: 0.5 });
    const antenna = cyl(building, 0.02, 0.03, 0.9, C.magenta, [0, 1.45, 0], { e: 0.6 });
    const roofLight = sph(scene, 0.09, C.magenta, [0, 0, 0], { e: 0.9 });
    const roofPoint = new THREE.Object3D();
    roofPoint.position.set(0, 1, 0);
    building.add(roofPoint);

    // Observer tripod / clinometer
    const observer = new THREE.Group();
    observer.position.set(0, 0, 0);
    scene.add(observer);
    const eyeY = 1.6 * SCALE;
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      const leg = cyl(observer, 0.018, 0.025, 0.85, 0x9cccf0, [Math.cos(a) * 0.18, 0.38, Math.sin(a) * 0.18], { e: 0.2, metal: 0.7 });
      leg.rotation.z = Math.cos(a) * 0.24;
      leg.rotation.x = -Math.sin(a) * 0.24;
    }
    sph(observer, 0.07, C.yellow, [0, eyeY, 0], { e: 0.8 });
    box(observer, 0.26, 0.12, 0.12, 0x7dd3fc, [0, eyeY, 0], { e: 0.4 });
    const sight = box(observer, 0.34, 0.035, 0.035, C.magenta, [0.16, eyeY, 0], { e: 0.7 });

    // Reference lines
    const horizontal = line([[0, eyeY, 0], [14, eyeY, 0]], C.cyan, 0.6, true);
    scene.add(horizontal);
    const vertical = line([[0, 0, 0], [0, 8, 0]], C.yellow, 0.5, true);
    scene.add(vertical);
    const sightLine = line([[0, eyeY, 0], [10, 5, 0]], C.magenta, 1);
    scene.add(sightLine);
    const angleArc = line(arcPoints(0, eyeY, 0, 1.35, 0, 0.6, 32, "xy"), C.yellow, 0.9);
    scene.add(angleArc);

    // Rooftop marker
    const topMarker = sph(scene, 0.12, C.magenta, [10, 6, 0], { e: 0.9 });
    const topHalo = torus(scene, 0.28, 0.018, C.magenta, [10, 6, 0], { opacity: 0.7 });
    topHalo.rotation.x = Math.PI / 2;

    const eyeHeightUnits = 1.6 * SCALE;
    const tmpRoof = new THREE.Vector3();
    return {
      scene,
      camera: base.camera,
      target: base.target,
      update(t, s) {
        const distUnits = s.distance * SCALE;
        const heightM = s.distance * Math.tan(rad(s.angle)) + s.eye;
        const heightUnits = heightM * SCALE;
        building.position.x = distUnits;
        building.scale.y = heightUnits;
        building.scale.x = 1;
        building.scale.z = 1;
        roof.scale.y = 1 / heightUnits;
        antenna.scale.y = 1 / heightUnits;
        antenna.position.y = 1 + 0.45 / heightUnits;
        roofPoint.position.y = 0.999;
        roofPoint.getWorldPosition(tmpRoof);
        building.position.x = distUnits;
        const top = new THREE.Vector3(distUnits, heightUnits, 0);
        roofLight.position.set(distUnits, heightUnits + 0.95, 0);
        roofLight.material.emissiveIntensity = 0.65 + 0.35 * Math.sin(t * 3.6);
        updateLine(sightLine, [[0, eyeHeightUnits, 0], top]);
        updateLine(horizontal, [[0, eyeHeightUnits, 0], [distUnits, eyeHeightUnits, 0]]);
        updateLine(vertical, [[distUnits, 0, 0], top]);
        const arcR = 1.4;
        updateLine(angleArc, arcPoints(0, eyeHeightUnits, 0, arcR, 0, rad(deg(Math.atan(s.height || 0))), 32, "xy"));
        // actual angle arc uses same computed angle
        const actualAngle = Math.atan((heightM - s.eye) / s.distance);
        updateLine(angleArc, arcPoints(0, eyeHeightUnits, 0, arcR, 0, actualAngle, 32, "xy"));
        topMarker.position.set(top.x, top.y, top.z);
        topHalo.position.copy(topMarker.position);
        topHalo.rotation.z = t * 0.9;
        topMarker.material.emissiveIntensity = 0.65 + 0.35 * Math.sin(t * 3.2);
        sightLine.material.opacity = 0.72 + 0.2 * Math.sin(t * 1.5);
        sight.rotation.z = actualAngle;
        vertical.position.z = 0;
      },
    };
  }

  /* 04 — Snell's law lens -------------------------------------------------- */
  function buildLensScene(accent) {
    const base = sceneBase(accent, [10, 6.5, 15], [0, 2.1, 0], { fog: 0.014 });
    const scene = base.scene;
    const center = new THREE.Vector3(0, 2.1, 0);

    // Optical bench
    box(scene, 14, 0.08, 3.4, 0x081a2b, [0, 0.02, 0]);
    box(scene, 14, 0.02, 0.08, C.violet, [0, 0.07, -1.5], { opacity: 0.4 });
    box(scene, 14, 0.02, 0.08, C.violet, [0, 0.07, 1.5], { opacity: 0.4 });

    // Lens (thin biconvex shape approximated by scaled sphere)
    const lensMat = glass(C.cyan, 0.2);
    const lens = sph(scene, 1.85, C.cyan, [0, 2.1, 0], { material: lensMat, seg: 40, seg2: 28 });
    lens.scale.set(0.26, 1.05, 1);
    const lensEdge = torus(scene, 1.9, 0.02, C.cyan, [0, 2.1, 0], { opacity: 0.5 });
    lensEdge.scale.set(0.26, 1.05, 1);
    lensEdge.rotation.y = Math.PI / 2;
    const lensCore = sph(scene, 0.12, C.cyan, [0, 2.1, 0], { e: 0.8, opacity: 0.8 });

    // Normal, incident, refracted rays
    const normal = line([[-4.8, 2.1, 0], [4.8, 2.1, 0]], 0x7e9bb5, 0.5, true);
    scene.add(normal);
    const incident = line([[-5, 3.1, 0], [0, 2.1, 0]], C.magenta, 1);
    scene.add(incident);
    const refracted = line([[0, 2.1, 0], [4.4, 3.2, 0]], C.cyan, 1);
    scene.add(refracted);
    const reflect = line([[0, 2.1, 0], [-4.4, 3.2, 0]], C.yellow, 0.9, true);
    reflect.visible = false;
    scene.add(reflect);
    const incArc = line(arcPoints(0, 2.1, 0, 1.2, 0, 0.7, 28), C.magenta, 0.75);
    scene.add(incArc);
    const refArc = line(arcPoints(0, 2.1, 0, 1.2, 0, 0.4, 28), C.cyan, 0.75);
    scene.add(refArc);

    // Laser source
    const laser = new THREE.Group();
    scene.add(laser);
    box(laser, 0.65, 0.32, 0.32, 0x2b3f58, [-5, 3.1, 0], { e: 0.1, metal: 0.8 });
    box(laser, 0.14, 0.18, 0.18, C.magenta, [-4.68, 3.1, 0], { e: 0.9 });
    const sourceGlow = new THREE.PointLight(C.magenta, 1.1, 5, 2);
    sourceGlow.position.set(-4.6, 3.1, 0);
    laser.add(sourceGlow);

    // Medium tint columns
    const airTint = box(scene, 0.02, 3.4, 3.3, 0x38bdf8, [-4.95, 2.0, 0], { opacity: 0.04, e: 0 });
    const glassTint = box(scene, 0.02, 3.4, 3.3, C.violet, [4.95, 2.0, 0], { opacity: 0.08, e: 0 });

    // Optical axis ring
    const axisRing = torus(scene, 0.2, 0.012, C.violet, [0, 2.1, 0], { opacity: 0.5 });

    return {
      scene,
      camera: base.camera,
      target: base.target,
      update(t, s) {
        const n1 = s.medium === "water" ? 1.33 : 1.0;
        const theta1 = rad(s.incidence);
        const sin2 = (n1 * Math.sin(theta1)) / s.n2;
        const tir = sin2 > 1;
        const theta2 = tir ? theta1 : Math.asin(clamp(sin2, -1, 1));
        const src = new THREE.Vector3(-Math.cos(theta1) * 4.5, 2.1 + Math.sin(theta1) * 4.5, 0);
        const out = tir
          ? new THREE.Vector3(-Math.cos(theta1) * 4.5, 2.1 + Math.sin(theta1) * 4.5, 0)
          : new THREE.Vector3(Math.cos(theta2) * 4.5, 2.1 + Math.sin(theta2) * 4.5, 0);
        // Incident always travels toward the lens from upper-left.
        const incStart = new THREE.Vector3(-4.5 * Math.cos(theta1), 2.1 + 4.5 * Math.sin(theta1), 0);
        updateLine(incident, [incStart, center]);
        const outEnd = tir
          ? new THREE.Vector3(-4.5 * Math.cos(theta1) * 0.85, 2.1 + 4.5 * Math.sin(theta1) * 0.85, 0)
          : new THREE.Vector3(4.5 * Math.cos(theta2), 2.1 + 4.5 * Math.sin(theta2), 0);
        updateLine(refracted, [center, outEnd]);
        refracted.material.color.set(tir ? C.yellow : C.cyan);
        refracted.material.opacity = 1;
        laser.position.set(incStart.x - 0.2, incStart.y, 0);
        laser.rotation.z = theta1;
        sourceGlow.position.set(0, 0, 0);
        const incStartVec = new THREE.Vector3(incStart.x, incStart.y, 0);
        updateLine(incArc, arcPoints(0, 2.1, 0, 1.25, Math.PI, Math.PI + theta1, 28, "xy"));
        updateLine(refArc, arcPoints(0, 2.1, 0, 1.25, 0, theta2, 28, "xy"));
        reflect.visible = tir;
        if (tir) updateLine(reflect, [center, outEnd]);
        lens.material.opacity = 0.16 + 0.05 * Math.sin(t * 2);
        lensCore.material.emissiveIntensity = 0.55 + 0.3 * Math.sin(t * 3.2);
        axisRing.rotation.x = t * 0.7;
        airTint.material.opacity = 0.03 + 0.02 * Math.sin(t);
        glassTint.material.opacity = 0.07 + 0.03 * Math.sin(t * 1.3);
        sourceGlow.intensity = 0.8 + 0.4 * Math.sin(t * 5);
        void src;
        void out;
        void incStartVec;
      },
    };
  }

  /* 05 — Wheelchair ramp --------------------------------------------------- */
  function buildRampScene(accent) {
    const base = sceneBase(accent, [11, 8, 16], [0, 1.8, 0]);
    const scene = base.scene;

    // Pavement and landing
    box(scene, 22, 0.08, 12, 0x0b1a2b, [0, -0.04, 0]);
    box(scene, 22, 0.02, 0.08, C.cyan, [0, 0.01, 5.9], { opacity: 0.35 });
    box(scene, 0.08, 0.02, 12, C.cyan, [10.9, 0.01, 0], { opacity: 0.35 });

    // Ramp pivots at left edge
    const ramp = new THREE.Group();
    ramp.position.set(-3.2, 0.16, 0);
    scene.add(ramp);
    const rampMat = neon(C.green, { e: 0.18, metal: 0.35, rough: 0.6 });
    const deck = box(ramp, 6.6, 0.18, 2.6, C.green, [3.3, 0, 0], { material: rampMat });
    for (let i = 0; i < 9; i++) {
      box(ramp, 0.06, 0.02, 2.5, 0xdff7ff, [0.3 + i * 0.72, 0.11, 0], { opacity: 0.45, e: 0.1 });
    }
    // Handrails
    const railL = new THREE.Group();
    const railR = new THREE.Group();
    ramp.add(railL, railR);
    [-1.18, 1.18].forEach((z, idx) => {
      const g = idx === 0 ? railL : railR;
      for (let i = 0; i <= 4; i++) {
        box(g, 0.06, 0.9, 0.06, 0x7dd3fc, [0.3 + i * 1.55, 0.48, z], { e: 0.3, metal: 0.7 });
      }
      box(g, 6.5, 0.06, 0.06, 0x7dd3fc, [3.3, 0.92, z], { e: 0.35, metal: 0.7 });
    });

    // Wheelchair
    const chair = new THREE.Group();
    chair.position.set(4.1, 0.18, 0);
    ramp.add(chair);
    const wheelGeo = new THREE.TorusGeometry(0.48, 0.075, 10, 32);
    const wheelMat = neon(0x203a52, { e: 0.05, metal: 0.5, rough: 0.6 });
    const wheelL = new THREE.Mesh(wheelGeo, wheelMat);
    wheelL.position.set(0, 0.5, 0.63);
    chair.add(wheelL);
    const wheelR = wheelL.clone();
    wheelR.position.z = -0.63;
    chair.add(wheelR);
    cyl(chair, 0.26, 0.26, 0.02, C.cyan, [0, 0.5, 0.71], { rot: [Math.PI / 2, 0, 0], e: 0.5 });
    cyl(chair, 0.26, 0.26, 0.02, C.cyan, [0, 0.5, -0.71], { rot: [Math.PI / 2, 0, 0], e: 0.5 });
    box(chair, 0.95, 0.08, 0.95, 0x46627d, [-0.05, 0.88, 0], { e: 0.05 });
    box(chair, 0.1, 1.0, 0.9, 0x46627d, [-0.55, 1.35, 0], { e: 0.05 });
    sph(chair, 0.24, 0xf1c7a5, [-0.18, 1.42, 0], { e: 0.02, rough: 0.8 });
    box(chair, 0.5, 0.55, 0.42, C.magenta, [-0.15, 1.17, 0], { e: 0.12 });
    box(chair, 0.7, 0.06, 0.8, 0x547696, [0.2, 0.2, 0], { e: 0.05 });
    const chairGlow = new THREE.PointLight(C.green, 0.6, 4, 2);
    chairGlow.position.set(0, 1, 0);
    chair.add(chairGlow);

    // Safety halo + threshold posts
    const safeRing = torus(scene, 1.0, 0.025, C.green, [0.5, 0.02, 0], { rot: [Math.PI / 2, 0, 0], opacity: 0.55 });
    const warning = box(scene, 0.4, 1.6, 0.08, C.yellow, [1.4, 0.8, 3.4], { e: 0.4, opacity: 0.8 });
    const warning2 = warning.clone();
    warning2.position.z = -3.4;
    scene.add(warning2);

    // Ground shadow / slope triangle
    const slopeLine = line([[0, 0.2, 0], [6, 0.2, 0]], C.cyan, 0.7, true);
    scene.add(slopeLine);
    const riseLine = line([[6, 0.2, 0], [6, 3, 0]], C.yellow, 0.6, true);
    scene.add(riseLine);

    let lastAngle = -1;
    let wheelAngle = 0;
    return {
      scene,
      camera: base.camera,
      target: base.target,
      update(t, s) {
        ramp.rotation.z = rad(s.angle);
        const safe = s.angle <= 4.8;
        const col = safe ? C.green : s.angle <= 8 ? C.yellow : C.red;
        rampMat.color.set(col);
        rampMat.emissive.set(col);
        rampMat.emissiveIntensity = 0.16 + 0.06 * Math.sin(t * 2);
        safeRing.material.color.set(col);
        safeRing.material.emissive.set(col);
        safeRing.rotation.z = t * 0.5;
        warning.material.color.set(col);
        warning2.material.color.set(col);
        chairGlow.color.set(col);
        if (s.auto) {
          chair.position.x = 3.0 + Math.sin(t * 0.55) * 1.65;
          wheelAngle -= Math.cos(t * 0.55) * 0.04;
          wheelL.rotation.z = wheelAngle;
          wheelR.rotation.z = wheelAngle;
        }
        chair.rotation.z = 0;
        updateLine(slopeLine, [[-3.2, 0.2, 0], [3.4, 0.2, 0]]);
        if (lastAngle !== s.angle) {
          const h = 6.6 * Math.sin(rad(s.angle));
          updateLine(riseLine, [[3.4, 0.2, 0], [3.4, 0.2 + h, 0]]);
          lastAngle = s.angle;
        }
      },
    };
  }

  /* 06 — Unit circle / joystick ------------------------------------------- */
  function buildUnitCircleScene(accent) {
    const base = sceneBase(accent, [0.8, 5.4, 13.5], [0, 3.1, 0], { grid: false, fog: 0.02 });
    const scene = base.scene;
    const cx = 0;
    const cy = 3.1;
    const R = 2.5;

    // Plane backdrop
    box(scene, 15, 10, 0.08, 0x071422, [0, 3, -1.4], { opacity: 0.55, e: 0 });
    // Axes
    arrow(scene, [1, 0, 0], [cx - 4.2, cy, 0], 8.4, C.cyan, { head: 0.3, headWidth: 0.12 });
    arrow(scene, [0, 1, 0], [cx, cy - 4.2, 0], 8.4, C.magenta, { head: 0.3, headWidth: 0.12 });
    const circle = circleLine(cx, cy, 0, R, 0x9bdcff, 0.55);
    scene.add(circle);
    const circleGlow = circleLine(cx, cy, 0, R, C.cyan, 0.18);
    scene.add(circleGlow);
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const r1 = i % 6 === 0 ? R - 0.18 : R - 0.09;
      const tick = line(
        [
          [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, 0],
          [cx + Math.cos(a) * R, cy + Math.sin(a) * R, 0],
        ],
        i % 6 === 0 ? C.yellow : 0x6c9dbb,
        i % 6 === 0 ? 0.8 : 0.35
      );
      scene.add(tick);
    }

    // Radius and projections
    const radius = line([[cx, cy, 0], [cx + R, cy, 0]], C.yellow, 1);
    scene.add(radius);
    const cosLine = line([[cx + R, cy, 0], [cx + R, cy, 0]], C.cyan, 1);
    scene.add(cosLine);
    const sinLine = line([[cx + R, cy, 0], [cx, cy + R, 0]], C.magenta, 1);
    scene.add(sinLine);
    const point = sph(scene, 0.13, C.magenta, [cx + R, cy, 0], { e: 0.9 });
    const pointGlow = torus(scene, 0.3, 0.015, C.magenta, [cx + R, cy, 0], { opacity: 0.7 });
    const tangent = line([[cx + R, cy, 0], [cx + R, cy, 0]], C.yellow, 0.9);
    scene.add(tangent);
    const tangentTop = sph(scene, 0.06, C.yellow, [cx + R, cy, 0], { e: 0.8 });

    // Unit marker
    sph(scene, 0.035, C.white, [cx, cy, 0], { e: 0.2 });

    // Joystick controller
    const stick = new THREE.Group();
    stick.position.set(4.8, 0.3, 3.2);
    scene.add(stick);
    cyl(stick, 0.85, 1.0, 0.3, 0x1a3450, [0, 0.15, 0], { e: 0.1 });
    torus(stick, 0.88, 0.03, C.cyan, [0, 0.32, 0], { rot: [Math.PI / 2, 0, 0], opacity: 0.7 });
    const stickPivot = new THREE.Group();
    stickPivot.position.set(0, 0.32, 0);
    stick.add(stickPivot);
    cyl(stickPivot, 0.06, 0.08, 1.2, 0x89b5d6, [0, 0.6, 0], { e: 0.25, metal: 0.8 });
    sph(stickPivot, 0.2, C.magenta, [0, 1.24, 0], { e: 0.5 });
    const stickLight = new THREE.PointLight(C.magenta, 0.7, 4, 2);
    stickLight.position.set(0, 1.2, 0);
    stickPivot.add(stickLight);

    // Character platform
    const charBase = new THREE.Group();
    charBase.position.set(-4.7, 0.2, 2.8);
    scene.add(charBase);
    cyl(charBase, 1.1, 1.25, 0.2, 0x142b42, [0, 0, 0], { e: 0.08 });
    const avatar = new THREE.Group();
    avatar.position.y = 0.2;
    charBase.add(avatar);
    sph(avatar, 0.3, C.cyan, [0, 1.0, 0], { e: 0.4 });
    cyl(avatar, 0.2, 0.28, 0.8, C.cyan, [0, 0.3, 0], { e: 0.35 });
    cyl(avatar, 0.06, 0.06, 0.8, C.magenta, [0.32, 0.5, 0], { e: 0.5 });
    cyl(avatar, 0.06, 0.06, 0.8, C.magenta, [-0.32, 0.5, 0], { e: 0.5 });

    return {
      scene,
      camera: base.camera,
      target: base.target,
      update(t, s) {
        const a = rad(s.angle);
        const px = cx + R * Math.cos(a);
        const py = cy + R * Math.sin(a);
        const tanV = Math.tan(a);
        const tanClamp = clamp(tanV, -4.5, 4.5);
        point.position.set(px, py, 0);
        pointGlow.position.copy(point.position);
        pointGlow.rotation.z = t * 1.2;
        updateLine(radius, [[cx, cy, 0], [px, py, 0]]);
        updateLine(cosLine, [[px, py, 0], [px, cy, 0]]);
        updateLine(sinLine, [[px, py, 0], [cx, py, 0]]);
        updateLine(tangent, [[cx + R, cy, 0], [cx + R, cy + tanClamp, 0]]);
        tangentTop.position.set(cx + R, cy + tanClamp, 0);
        tangentTop.material.emissiveIntensity = 0.55 + 0.3 * Math.sin(t * 4);
        stickPivot.rotation.z = -a * Math.cos(a) * 0.22;
        stickPivot.rotation.x = -a * Math.sin(a) * 0.22;
        avatar.rotation.y = -a;
        avatar.position.y = 0.2 + (s.auto ? 0.03 * Math.sin(t * 4) : 0);
        stickLight.intensity = 0.55 + 0.25 * Math.sin(t * 3);
        circleGlow.rotation.z = t * 0.1;
        if (s.auto) {
          circleGlow.material.opacity = 0.1 + 0.07 * Math.sin(t * 2);
        }
      },
    };
  }

  /* 07 — ATC radar --------------------------------------------------------- */
  function buildRadarScene(accent) {
    const base = sceneBase(accent, [11, 11, 13], [0, 0, 0], { grid: false, fog: 0.02 });
    const scene = base.scene;
    const planeY = 0.15;

    // Radar floor
    const floor = new THREE.Mesh(new THREE.CircleGeometry(6.4, 64), new THREE.MeshStandardMaterial({ color: 0x071a2a, metalness: 0.5, roughness: 0.7, transparent: true, opacity: 0.9 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);
    for (let r = 1; r <= 5; r++) {
      const ring = circleLine(0, planeY, 0, r, r === 5 ? C.teal : 0x2a5878, r === 5 ? 0.8 : 0.42, "xz");
      scene.add(ring);
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      scene.add(line([[0, planeY, 0], [Math.cos(a) * 5.1, planeY, Math.sin(a) * 5.1]], 0x2a5878, 0.32, i % 3 === 0 ? false : true));
    }
    // Quadrant tint wedges
    const tints = [
      { a0: 0, color: C.teal, op: 0.035 },
      { a0: Math.PI / 2, color: C.cyan, op: 0.03 },
      { a0: Math.PI, color: C.magenta, op: 0.025 },
      { a0: (3 * Math.PI) / 2, color: C.yellow, op: 0.025 },
    ];
    tints.forEach((q) => {
      const g = new THREE.CircleGeometry(5, 24, q.a0, Math.PI / 2);
      const m = new THREE.Mesh(g, basic(q.color, q.op, THREE.AdditiveBlending));
      m.rotation.x = -Math.PI / 2;
      m.position.y = 0.11;
      scene.add(m);
    });

    // Sweep
    const sweepPivot = new THREE.Group();
    scene.add(sweepPivot);
    const sweepGeo = new THREE.CircleGeometry(5, 32, 0, 0.55);
    const sweep = new THREE.Mesh(sweepGeo, basic(C.teal, 0.13, THREE.AdditiveBlending));
    sweep.rotation.x = -Math.PI / 2;
    sweep.position.y = 0.16;
    sweepPivot.add(sweep);
    const sweepEdge = line([[0, 0.18, 0], [5, 0.18, 0]], C.teal, 0.9);
    sweepPivot.add(sweepEdge);

    // Station tower
    const tower = new THREE.Group();
    scene.add(tower);
    cyl(tower, 0.38, 0.55, 1.5, 0x24445f, [0, 0.75, 0], { e: 0.12 });
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.75, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), neon(C.teal, { e: 0.3, metal: 0.7, side: THREE.DoubleSide }));
    dish.position.set(0, 1.75, 0);
    dish.rotation.x = Math.PI;
    dish.rotation.z = 0.3;
    tower.add(dish);
    const towerLight = new THREE.PointLight(C.teal, 1.0, 8, 2);
    towerLight.position.set(0, 2, 0);
    tower.add(towerLight);

    // Target
    const targetGroup = new THREE.Group();
    scene.add(targetGroup);
    const blip = sph(targetGroup, 0.16, C.yellow, [0, 0.4, 0], { e: 0.95 });
    const blipRing = torus(targetGroup, 0.4, 0.022, C.yellow, [0, 0.22, 0], { rot: [Math.PI / 2, 0, 0], opacity: 0.8 });
    const blipBeacon = line([[0, 0.2, 0], [0, 1.4, 0]], C.yellow, 0.5, true);
    targetGroup.add(blipBeacon);
    const blipDot = sph(targetGroup, 0.07, C.yellow, [0, 1.4, 0], { e: 0.7 });

    // Heading arrow
    const bearingArrow = arrow(scene, [1, 0, 0], [0, 0.25, 0], 5.4, C.teal, { head: 0.35, headWidth: 0.15 });

    return {
      scene,
      camera: base.camera,
      target: base.target,
      update(t, s) {
        const a = rad(s.angle);
        const tx = Math.cos(a) * s.radius;
        const tz = Math.sin(a) * s.radius;
        targetGroup.position.set(tx, 0, tz);
        blip.position.y = 0.42 + 0.15 * Math.sin(t * 3);
        blipRing.position.y = 0.24;
        blipRing.scale.setScalar(1 + 0.2 * Math.sin(t * 2.6));
        blipBeacon.position.y = 0;
        blipDot.position.y = 1.4;
        bearingArrow.setDirection(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
        sweepPivot.rotation.y = s.sweep ? -t * 0.9 : -a;
        const active = norm360(deg(sweepPivot.rotation.y));
        const delta = Math.abs(((active - norm360(deg(a)) + 540) % 360) - 180);
        blip.material.emissiveIntensity = delta < 55 ? 1.2 : 0.45;
        blipRing.material.opacity = delta < 55 ? 0.9 : 0.3;
        towerLight.intensity = 0.7 + 0.3 * Math.sin(t * 2);
        dish.rotation.y = t * 0.2;
        void ringGroup;
      },
    };
  }

  /* 08 — Roof truss -------------------------------------------------------- */
  function buildTrussScene(accent) {
    const base = sceneBase(accent, [13, 9, 16], [0, 3, 0]);
    const scene = base.scene;
    const scale = 0.72;
    const trussGroup = new THREE.Group();
    scene.add(trussGroup);
    const houseGroup = new THREE.Group();
    scene.add(houseGroup);

    // Small ground plot
    box(scene, 16, 0.08, 10, 0x0a1a29, [0, -0.02, 0]);
    for (let i = -3; i <= 3; i++) {
      box(scene, 0.06, 0.02, 10, 0x17334b, [i * 2.1, 0.03, 0], { opacity: 0.45 });
    }

    // Wall block
    box(houseGroup, 1, 1, 1, 0x18344f, [0, 1, 0], { e: 0.05, metal: 0.4, rough: 0.65 });
    const door = box(houseGroup, 0.18, 0.38, 0.02, C.yellow, [0, 0.55, 0.51], { e: 0.3 });
    const winMat = glass(C.cyan, 0.32);
    box(houseGroup, 0.18, 0.18, 0.02, C.cyan, [-0.28, 1.2, 0.51], { material: winMat, e: 0.3 });
    box(houseGroup, 0.18, 0.18, 0.02, C.cyan, [0.28, 1.2, 0.51], { material: winMat, e: 0.3 });
    const wallGlow = new THREE.PointLight(C.cyan, 0.5, 8, 2);
    wallGlow.position.set(0, 1.2, 1.5);
    houseGroup.add(wallGlow);

    const roofMat = neon(C.orange, { e: 0.12, metal: 0.25, rough: 0.7, side: THREE.DoubleSide, opacity: 0.36 });
    let signature = "";
    let roofPanels = [];

    function rebuild(span, pitch) {
      clearGroup(trussGroup);
      roofPanels.forEach((p) => {
        p.geometry.dispose();
        p.material.dispose();
      });
      roofPanels = [];
      const half = (span / 2) * scale;
      const rise = (span / 2) * Math.tan(rad(pitch)) * scale;
      const wallH = 2.0;
      const apex = new THREE.Vector3(0, wallH + rise, 0);
      const left = new THREE.Vector3(-half, wallH, 0);
      const right = new THREE.Vector3(half, wallH, 0);
      const depth = 2.4 * scale;

      houseGroup.scale.set(span * scale, wallH, 2.0);
      door.scale.set(1, 1, 1);
      winMat.opacity = 0.32;

      for (const z of [-depth, depth]) {
        const fl = left.clone().setZ(z);
        const fr = right.clone().setZ(z);
        const fa = apex.clone().setZ(z);
        beam(trussGroup, fl, fr, 0.075, C.orange);
        beam(trussGroup, fl, fa, 0.085, C.yellow);
        beam(trussGroup, fr, fa, 0.085, C.yellow);
        beam(trussGroup, fl, new THREE.Vector3(0, wallH, z), 0.045, C.orange, { opacity: 0.8 });
        beam(trussGroup, new THREE.Vector3(0, wallH + rise * 0.02, z), new THREE.Vector3(0, wallH + rise, z), 0.04, C.orange);
        // web members
        beam(trussGroup, new THREE.Vector3(-half / 2, wallH, z), new THREE.Vector3(0, wallH + rise / 2, z), 0.035, 0x7dd3fc, { opacity: 0.7 });
        beam(trussGroup, new THREE.Vector3(half / 2, wallH, z), new THREE.Vector3(0, wallH + rise / 2, z), 0.035, 0x7dd3fc, { opacity: 0.7 });
        beam(trussGroup, new THREE.Vector3(-half / 2, wallH, z), new THREE.Vector3(0, wallH, z), 0.03, 0x7dd3fc, { opacity: 0.55 });
        beam(trussGroup, new THREE.Vector3(half / 2, wallH, z), new THREE.Vector3(0, wallH, z), 0.03, 0x7dd3fc, { opacity: 0.55 });
        // joints
        [fl, fr, fa, new THREE.Vector3(0, wallH, z)].forEach((p, i) => {
          sph(trussGroup, i === 2 ? 0.13 : 0.09, i === 2 ? C.magenta : C.yellow, [p.x, p.y, p.z], { e: 0.7 });
        });
      }
      // ridge
      beam(trussGroup, new THREE.Vector3(0, wallH + rise, -depth), new THREE.Vector3(0, wallH + rise, depth), 0.07, C.magenta);
      // roof planes
      const makePanel = (side) => {
        const geo = new THREE.BufferGeometry();
        const pts = side === "left"
          ? [new THREE.Vector3(-half, wallH, -depth), new THREE.Vector3(0, wallH + rise, -depth), new THREE.Vector3(0, wallH + rise, depth), new THREE.Vector3(-half, wallH, depth)]
          : [new THREE.Vector3(0, wallH + rise, -depth), new THREE.Vector3(half, wallH, -depth), new THREE.Vector3(half, wallH, depth), new THREE.Vector3(0, wallH + rise, depth)];
        geo.setFromPoints(pts);
        geo.setIndex([0, 1, 2, 0, 2, 3]);
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, roofMat);
        trussGroup.add(mesh);
        roofPanels.push(mesh);
      };
      makePanel("left");
      makePanel("right");
      // altitude dashed
      const altLine = line([[0, wallH, 0], [0, wallH + rise, 0]], C.cyan, 0.55, true);
      trussGroup.add(altLine);
      // ratio markers
      const halfLine = line([[-half, wallH, depth + 0.4], [0, wallH, depth + 0.4]], C.cyan, 0.5, true);
      trussGroup.add(halfLine);
      const riseLine = line([[half + 0.4, wallH, 0], [half + 0.4, wallH + rise, 0]], C.yellow, 0.5, true);
      trussGroup.add(riseLine);
      signature = `${span}-${pitch}`;
    }

    return {
      scene,
      camera: base.camera,
      target: base.target,
      update(t, s) {
        const sig = `${s.span}-${s.pitch}`;
        if (sig !== signature) rebuild(s.span, s.pitch);
        roofMat.emissiveIntensity = 0.1 + 0.04 * Math.sin(t * 1.7);
        wallGlow.intensity = 0.4 + 0.15 * Math.sin(t * 1.9);
        trussGroup.rotation.y = 0;
      },
    };
  }

  /* 09 — AC generator ------------------------------------------------------ */
  function buildGeneratorScene(accent) {
    const base = sceneBase(accent, [10, 7.5, 15], [0, 2.4, 0]);
    const scene = base.scene;

    // Base
    box(scene, 9, 0.4, 4.5, 0x10283f, [0, 0.2, 0]);
    for (let i = -3; i <= 3; i++) {
      box(scene, 0.06, 0.05, 4.2, C.cyan, [i * 1.2, 0.42, 0], { opacity: 0.35, e: 0.2 });
    }
    // Magnet poles
    const poleN = box(scene, 1.5, 3.2, 3.0, 0x8b2d42, [-4.2, 2.4, 0], { e: 0.15, metal: 0.5, rough: 0.5 });
    const poleS = box(scene, 1.5, 3.2, 3.0, 0x1f4e7a, [4.2, 2.4, 0], { e: 0.15, metal: 0.5, rough: 0.5 });
    box(scene, 1.52, 0.2, 3.02, C.yellow, [-4.2, 3.95, 0], { e: 0.4 });
    box(scene, 1.52, 0.2, 3.02, C.magenta, [4.2, 3.95, 0], { e: 0.4 });
    // Field arrows
    for (let i = -1; i <= 1; i++) {
      arrow(scene, [1, 0, 0], [-3.35, 1.4 + i * 0.9, 0], 6.7, C.cyan, { head: 0.3, headWidth: 0.12 });
    }

    // Coil assembly
    const coil = new THREE.Group();
    coil.position.set(0, 2.5, 0);
    scene.add(coil);
    const coilMat = neon(C.magenta, { e: 0.55, metal: 0.7, rough: 0.25 });
    const coilW = 2.1;
    const coilH = 3.0;
    const coilPts = [
      [-coilW / 2, -coilH / 2, 0.5],
      [coilW / 2, -coilH / 2, 0.5],
      [coilW / 2, coilH / 2, 0.5],
      [-coilW / 2, coilH / 2, 0.5],
    ];
    for (let i = 0; i < 4; i++) {
      beam(coil, coilPts[i], coilPts[(i + 1) % 4], 0.075, C.magenta, { material: coilMat });
    }
    // back loop for depth
    const coilPts2 = coilPts.map((p) => [p[0], p[1], -0.5]);
    for (let i = 0; i < 4; i++) {
      beam(coil, coilPts2[i], coilPts2[(i + 1) % 4], 0.045, C.magenta, { material: coilMat, opacity: 0.65 });
    }
    for (let i = 0; i < 4; i++) {
      beam(coil, coilPts[i], coilPts2[i], 0.04, C.magenta, { material: coilMat, opacity: 0.65 });
    }
    // Slip ring / shaft
    const shaft = cyl(coil, 0.08, 0.08, 4.4, 0x9cccf0, [0, 0, 0], { rot: [Math.PI / 2, 0, 0], e: 0.3, metal: 0.8 });
    const slipA = torus(coil, 0.26, 0.055, C.yellow, [0, 0, 1.7], { e: 0.6 });
    const slipB = torus(coil, 0.26, 0.055, C.cyan, [0, 0, 1.45], { e: 0.6 });
    const coilGlow = new THREE.PointLight(C.magenta, 0.9, 7, 2);
    coilGlow.position.set(0, 0, 0.6);
    coil.add(coilGlow);

    // Sine scope plane
    const scope = new THREE.Group();
    scope.position.set(0, 5.3, -2.2);
    scene.add(scope);
    box(scope, 7.4, 0.03, 2.4, 0x06131f, [0, 0, 0], { opacity: 0.85, e: 0 });
    for (let i = -3; i <= 3; i++) {
      box(scope, 0.015, 0.02, 2.2, 0x1e4d70, [i, 0.03, 0], { opacity: 0.5 });
    }
    const wave = line([], C.magenta, 1);
    scope.add(wave);
    const waveGlow = line([], C.magenta, 0.18);
    scope.add(waveGlow);
    const dot = sph(scope, 0.07, C.yellow, [0, 0.05, 0], { e: 0.9 });
    // Scope axes
    box(scope, 7.4, 0.015, 0.02, C.cyan, [0, 0.05, 0.9], { opacity: 0.45 });
    box(scope, 0.02, 0.015, 2.2, C.cyan, [0, 0.05, 0], { opacity: 0.35 });

    let last = 0;
    let phase = 0;
    return {
      scene,
      camera: base.camera,
      target: base.target,
      update(t, s) {
        const dt = Math.min(0.05, Math.max(0, t - last));
        last = t;
        if (s.auto) phase += (s.freq / 50) * dt * 2.2;
        coil.rotation.z = -phase;
        coilGlow.intensity = 0.6 + 0.5 * Math.abs(Math.sin(phase));
        const pts = [];
        const glowPts = [];
        const n = 100;
        for (let i = 0; i <= n; i++) {
          const x = -3.5 + (7 * i) / n;
          const y = (s.peak / 340) * 0.9 * Math.sin(x * 2.2 - phase * 2);
          pts.push([x, y, 0.08]);
          glowPts.push([x, y + 0.02, 0.06]);
        }
        updateLine(wave, pts);
        updateLine(waveGlow, glowPts);
        const px = -3.5 + (7 * ((phase * 0.35) % 1));
        const py = (s.peak / 340) * 0.9 * Math.sin(px * 2.2 - phase * 2);
        dot.position.set(px, py + 0.08, 0.1);
        dot.material.emissiveIntensity = 0.7 + 0.3 * Math.sin(t * 5);
        slipA.material.emissiveIntensity = 0.35 + 0.3 * Math.abs(Math.sin(phase));
        slipB.material.emissiveIntensity = 0.35 + 0.3 * Math.abs(Math.cos(phase));
      },
    };
  }

  /* 10 — Pendulum ---------------------------------------------------------- */
  function buildPendulumScene(accent) {
    const base = sceneBase(accent, [0.5, 4.8, 14.5], [0, 3.8, 0], { grid: false, fog: 0.018 });
    const scene = base.scene;
    const pivotY = 7.0;
    const scale = 1.05;

    // Backdrop clock face
    box(scene, 14, 9, 0.06, 0x071321, [0, 4, -2.0], { opacity: 0.7, e: 0 });
    torus(scene, 3.1, 0.035, 0x1e4a6e, [0, 4.4, -1.9], { opacity: 0.6 });
    torus(scene, 3.35, 0.012, C.cyan, [0, 4.4, -1.9], { opacity: 0.3 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      box(scene, 0.03, i % 3 === 0 ? 0.28 : 0.15, 0.02, i % 3 === 0 ? C.cyan : 0x4a7799, [Math.cos(a) * 2.85, 4.4 + Math.sin(a) * 2.85, -1.85], { e: 0.3 });
    }

    // Frame
    for (let x = -3.3; x <= 3.3; x += 6.6) {
      box(scene, 0.16, pivotY, 0.16, 0x31566f, [x, pivotY / 2, 0], { e: 0.12, metal: 0.6 });
      box(scene, 0.7, 0.12, 0.7, 0x1c3b55, [x, 0.06, 0]);
    }
    box(scene, 7.0, 0.18, 0.2, C.cyan, [0, pivotY, 0], { e: 0.4 });
    box(scene, 7.0, 0.06, 0.06, 0x7dd3fc, [0, pivotY + 0.25, 0], { opacity: 0.5 });
    // Support braces
    beam(scene, [-3.2, 5.4, 0], [-1.6, pivotY, 0], 0.045, 0x31566f, { opacity: 0.7 });
    beam(scene, [3.2, 5.4, 0], [1.6, pivotY, 0], 0.045, 0x31566f, { opacity: 0.7 });

    // Pendulum
    const pivot = new THREE.Group();
    pivot.position.set(0, pivotY, 0);
    scene.add(pivot);
    sph(pivot, 0.17, C.cyan, [0, 0, 0], { e: 0.6 });
    const rod = cyl(pivot, 0.035, 0.045, 1, 0xdff7ff, [0, -0.5, 0], { e: 0.25, metal: 0.8 });
    const bob = sph(pivot, 0.42, C.magenta, [0, -1, 0], { e: 0.5, metal: 0.65, rough: 0.22, seg: 32, seg2: 24 });
    const bobHalo = torus(pivot, 0.55, 0.018, C.magenta, [0, -1, 0], { opacity: 0.6 });
    const bobLight = new THREE.PointLight(C.magenta, 0.8, 5, 2);
    bobLight.position.set(0, -1, 0.4);
    pivot.add(bobLight);

    // Vertical reference
    const vertical = line([[0, pivotY, 0], [0, 0, 0]], 0x6c9dbb, 0.4, true);
    scene.add(vertical);
    const angleArc = line(arcPoints(0, pivotY, 0, 1.0, -Math.PI / 2, -Math.PI / 2, 32), C.yellow, 0.8);
    scene.add(angleArc);
    const shadowLine = line([[0, 0.05, 0], [0, 0.05, 0]], C.cyan, 0.8, true);
    scene.add(shadowLine);

    // Cosine trace panel on right
    const trace = new THREE.Group();
    trace.position.set(3.4, 5.2, -1.8);
    scene.add(trace);
    box(trace, 5.0, 3.0, 0.03, 0x06131f, [0, 0, 0], { opacity: 0.82, e: 0 });
    box(trace, 4.8, 0.012, 0.02, 0x2b5878, [0, 0, 0.03], { opacity: 0.5 });
    box(trace, 0.012, 2.8, 0.02, 0x2b5878, [0, 0, 0.03], { opacity: 0.5 });
    const cosWave = line([], C.cyan, 0.9);
    trace.add(cosWave);
    const traceDot = sph(trace, 0.06, C.yellow, [0, 0, 0.05], { e: 0.9 });

    let last = 0;
    let swingPhase = 0;
    return {
      scene,
      camera: base.camera,
      target: base.target,
      update(t, s) {
        const dt = Math.min(0.05, Math.max(0, t - last));
        last = t;
        const omega = Math.sqrt(9.81 / s.length);
        if (s.auto) swingPhase += dt * omega;
        const theta = s.auto ? s.amplitude * Math.cos(swingPhase) : s.amplitude;
        const len = s.length * scale;
        rod.scale.y = len;
        rod.position.y = -len / 2;
        bob.position.y = -len;
        bobHalo.position.y = -len;
        bobLight.position.y = -len;
        pivot.rotation.z = rad(theta);
        updateLine(angleArc, arcPoints(0, pivotY, 0, 1.05, -Math.PI / 2, -Math.PI / 2 + rad(theta), 36));
        const bobWorldX = Math.sin(rad(theta)) * len;
        const bobWorldY = pivotY - Math.cos(rad(theta)) * len;
        updateLine(shadowLine, [[0, 0.07, 0], [bobWorldX, 0.07, 0]]);
        bobHalo.rotation.z = t * 0.8;
        bobLight.intensity = 0.6 + 0.3 * Math.sin(t * 3);
        const tracePts = [];
        for (let i = 0; i <= 80; i++) {
          const u = (i / 80) * 4;
          tracePts.push([-2.3 + (u / 4) * 4.6, 0.95 * Math.cos(u * 2 + (s.auto ? swingPhase : 0)) * (s.amplitude / 45), 0.04]);
        }
        updateLine(cosWave, tracePts);
        const tp = -2.3 + 4.6 * (((swingPhase / (Math.PI * 2)) % 1 + 1) % 1);
        traceDot.position.set(tp, 0.95 * Math.cos(((tp + 2.3) / 4.6) * 4 + (s.auto ? swingPhase : 0)) * (s.amplitude / 45), 0.06);
        void bobWorldY;
      },
    };
  }

  /* 11 — Lighthouse -------------------------------------------------------- */
  function buildLighthouseScene(accent) {
    const base = sceneBase(accent, [15, 10, 20], [2, 3.2, 0], { fog: 0.02 });
    const scene = base.scene;

    // Sea
    const sea = new THREE.Mesh(
      new THREE.PlaneGeometry(46, 34, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x0a3550, metalness: 0.45, roughness: 0.28, transparent: true, opacity: 0.9 })
    );
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(4, 0, 0);
    scene.add(sea);
    // Shoreline strip
    box(scene, 0.28, 0.04, 34, C.yellow, [0, 0.04, 0], { opacity: 0.55, e: 0.35 });
    // Breaking waves
    for (let i = 0; i < 9; i++) {
      const w = torus(scene, 0.5 + Math.random() * 0.5, 0.008, 0x4b9ec4, [6 + Math.random() * 13, 0.05, -8 + Math.random() * 16], { rot: [Math.PI / 2, 0, 0], opacity: 0.35 });
      w.scale.set(1, 0.5, 1);
    }

    // Rock base
    for (let i = 0; i < 7; i++) {
      const r = 0.9 + Math.random() * 1.4;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), neon(0x1c3549, { e: 0.03, rough: 0.9, metal: 0.1 }));
      rock.position.set((Math.random() - 0.5) * 3.5, 0.1, (Math.random() - 0.5) * 3.5);
      rock.scale.y = 0.55;
      scene.add(rock);
    }

    // Tower (unit height, scale y dynamically)
    const tower = new THREE.Group();
    scene.add(tower);
    const body = cyl(tower, 0.62, 1.25, 1, 0xe9f4ff, [0, 0.5, 0], { e: 0.18, metal: 0.2, rough: 0.65 });
    const bandA = cyl(tower, 0.72, 0.83, 0.12, 0xb91c1c, [0, 0.34, 0], { e: 0.25 });
    const bandB = cyl(tower, 0.65, 0.7, 0.1, 0xb91c1c, [0, 0.68, 0], { e: 0.25 });
    const gallery = cyl(tower, 1.0, 1.0, 0.08, 0x24445f, [0, 1.0, 0], { e: 0.15 });
    const lampRoom = cyl(tower, 0.5, 0.5, 0.44, C.yellow, [0, 1.24, 0], { e: 0.6, opacity: 0.72 });
    const roof = cyl(tower, 0.08, 0.62, 0.32, 0xb91c1c, [0, 1.6, 0], { e: 0.25 });
    const lampGlow = new THREE.PointLight(C.yellow, 1.4, 22, 2);
    lampGlow.position.set(0, 1.24, 0);
    tower.add(lampGlow);
    const lampOrb = sph(tower, 0.24, C.yellow, [0, 1.24, 0], { e: 1.0 });

    // Shore endpoint / boat
    const boat = new THREE.Group();
    scene.add(boat);
    box(boat, 0.9, 0.18, 0.36, 0xe2e8f0, [0, 0.16, 0], { e: 0.08 });
    box(boat, 0.18, 0.3, 0.2, C.cyan, [0.12, 0.35, 0], { e: 0.35 });
    box(boat, 0.04, 0.55, 0.04, 0xdff7ff, [-0.12, 0.5, 0], { e: 0.2 });
    box(boat, 0.22, 0.16, 0.015, C.yellow, [-0.2, 0.5, 0], { e: 0.4 });

    // Beam
    const beamCone = new THREE.Mesh(
      new THREE.ConeGeometry(1.0, 1, 28, 1, true),
      basic(C.yellow, 0.11, THREE.AdditiveBlending)
    );
    beamCone.rotation.x = Math.PI;
    scene.add(beamCone);
    const beamLine = line([[0, 0, 0], [5, 0, 0]], C.yellow, 1);
    scene.add(beamLine);
    const beamGlow = line([[0, 0, 0], [5, 0, 0]], C.yellow, 0.25);
    scene.add(beamGlow);
    const asymptote = line([[0, 0, -6], [0, 12, -6]], 0x7e9bb5, 0.4, true);
    scene.add(asymptote);

    // Right-triangle reference
    const vertRef = line([[0, 0, 0], [0, 5, 0]], C.cyan, 0.55, true);
    scene.add(vertRef);
    const shoreRef = line([[0, 0, 0], [7, 0, 0]], C.cyan, 0.55, true);
    scene.add(shoreRef);
    const shoreRing = torus(scene, 0.5, 0.02, C.yellow, [7, 0.06, 0], { rot: [Math.PI / 2, 0, 0], opacity: 0.6 });

    const up = new THREE.Vector3(0, 1, 0);
    const tmpDir = new THREE.Vector3();
    let lastSig = "";
    return {
      scene,
      camera: base.camera,
      target: base.target,
      update(t, s) {
        const h = s.height / 10; // 20-90 m -> 2-9 units
        const d = s.distance / 20; // 60-280 m -> 3-14 units
        tower.scale.y = h;
        body.scale.y = 1;
        lampGlow.position.y = 1.24;
        lampGlow.intensity = 1.1 + 0.3 * Math.sin(t * 4);
        lampOrb.material.emissiveIntensity = 0.8 + 0.25 * Math.sin(t * 4);
        const lamp = new THREE.Vector3(0, h * 1.24, 0);
        const shore = new THREE.Vector3(d, 0.06, 0);
        updateLine(beamLine, [lamp, shore]);
        updateLine(beamGlow, [lamp, shore]);
        updateLine(vertRef, [[0, 0, 0], [0, lamp.y, 0]]);
        updateLine(shoreRef, [[0, 0.05, 0], [d, 0.05, 0]]);
        shoreRing.position.set(d, 0.07, 0);
        boat.position.set(d, 0, 1.2);
        boat.rotation.y = Math.sin(t * 0.5) * 0.15;
        // Cone oriented along beam
        const len = lamp.distanceTo(shore);
        beamCone.scale.set(1 + len * 0.18, len, 1 + len * 0.18);
        tmpDir.copy(shore).sub(lamp).normalize();
        beamCone.position.copy(lamp).add(shore).multiplyScalar(0.5);
        beamCone.quaternion.setFromUnitVectors(up, tmpDir.clone().negate());
        beamCone.material.opacity = 0.075 + 0.03 * Math.sin(t * 2);
        // rotating beacon flare
        lampOrb.scale.setScalar(1 + 0.12 * Math.sin(t * 8));
        const sig = `${s.height}-${s.distance}`;
        if (sig !== lastSig) {
          asymptote.position.x = 0;
          lastSig = sig;
        }
        shoreRing.rotation.z = t * 0.8;
      },
    };
  }

  /* 12 — Radio tuner ------------------------------------------------------- */
  function buildRadioScene(accent) {
    const base = sceneBase(accent, [12, 8, 16], [0, 4, 0]);
    const scene = base.scene;

    // Ground / studio pad
    box(scene, 18, 0.08, 12, 0x081725, [0, 0, 0]);
    for (let i = -4; i <= 4; i++) {
      box(scene, 0.05, 0.02, 11, 0x1c405d, [i * 2, 0.03, 0], { opacity: 0.4 });
    }

    // Transmitter building
    box(scene, 4.4, 1.8, 3.2, 0x14304a, [-5.2, 0.9, 0], { e: 0.07, metal: 0.5, rough: 0.55 });
    box(scene, 4.5, 0.08, 3.3, C.cyan, [-5.2, 1.82, 0], { e: 0.4 });
    for (let i = 0; i < 4; i++) {
      box(scene, 0.28, 0.28, 0.02, C.cyan, [-6.4 + i * 0.8, 1.0, 1.62], { e: 0.4, opacity: 0.75 });
    }
    const txLight = new THREE.PointLight(C.cyan, 0.8, 6, 2);
    txLight.position.set(-5.2, 1.2, 1.8);
    scene.add(txLight);

    // Antenna mast
    const mast = new THREE.Group();
    mast.position.set(-5.2, 0, 0);
    scene.add(mast);
    for (let i = 0; i < 5; i++) {
      const y = 2 + i * 1.6;
      const w = 0.9 - i * 0.14;
      beam(mast, [-w, y, -w * 0.6], [w, y + 1.6, w * 0.6], 0.022, 0x8ab9d8, { opacity: 0.7 });
      beam(mast, [w, y, -w * 0.6], [-w, y + 1.6, w * 0.6], 0.022, 0x8ab9d8, { opacity: 0.7 });
      box(mast, w * 2.2, 0.04, 0.04, 0x8ab9d8, [0, y, 0], { opacity: 0.6 });
    }
    const mastTop = sph(mast, 0.18, C.magenta, [0, 10.2, 0], { e: 0.9 });
    const topLight = new THREE.PointLight(C.magenta, 1.0, 9, 2);
    topLight.position.set(0, 10.2, 0);
    mast.add(topLight);

    // Expanding wavefront rings
    const rings = [];
    for (let i = 0; i < 7; i++) {
      const r = torus(scene, 1, 0.018, C.cyan, [-5.2, 5.5 + i * 0.55, 0], { rot: [Math.PI / 2, 0, 0], opacity: 0.4 });
      rings.push(r);
    }

    // Waveform
    const wave = line([], C.magenta, 1);
    scene.add(wave);
    const waveGhost = line([], C.magenta, 0.15);
    scene.add(waveGhost);
    // Wave axes
    box(scene, 7.4, 0.015, 0.02, 0x2b5878, [3.4, 2.2, -3.1], { opacity: 0.6 });
    box(scene, 0.015, 2.4, 0.02, 0x2b5878, [0, 3.4, -3.1], { opacity: 0.6 });

    // Receiver display
    const rx = new THREE.Group();
    rx.position.set(4.6, 1.0, 2.2);
    scene.add(rx);
    box(rx, 2.0, 1.1, 1.2, 0x1a2f47, [0, 0, 0], { e: 0.06, metal: 0.6 });
    box(rx, 1.6, 0.55, 0.02, 0x06131f, [0, 0.1, 0.62], { e: 0.02 });
    box(rx, 1.45, 0.03, 0.02, C.cyan, [0, 0.28, 0.64], { e: 0.6 });
    cyl(rx, 0.22, 0.22, 0.06, C.yellow, [0.55, -0.34, 0.6], { rot: [Math.PI / 2, 0, 0], e: 0.5 });
    cyl(rx, 0.18, 0.18, 0.06, 0x89b5d6, [-0.15, -0.34, 0.6], { rot: [Math.PI / 2, 0, 0], e: 0.2 });
    const rxLight = new THREE.PointLight(C.magenta, 0.7, 6, 2);
    rxLight.position.set(0, 0.1, 1);
    rx.add(rxLight);

    return {
      scene,
      camera: base.camera,
      target: base.target,
      update(t, s) {
        const fm = s.band === "FM";
        const col = fm ? C.cyan : C.yellow;
        const speed = 0.7 + (s.frequency / 108) * 2.6;
        rings.forEach((r, i) => {
          const phase = ((t * speed + i / rings.length) % 1);
          const radius = 2.2 + phase * 7.5;
          r.position.y = 5.2 + i * 0.55;
          r.scale.set(radius, radius, radius);
          r.material.opacity = (1 - phase) * 0.34;
          r.material.color.set(col);
          r.material.emissive.set(col);
        });
        const pts = [];
        const ghost = [];
        const n = 100;
        const amp = s.amplitude * 0.22;
        const k = 1.2 + (s.frequency / 108) * 3.4;
        for (let i = 0; i <= n; i++) {
          const x = -3.6 + (7.2 * i) / n;
          const y = 3.3 + amp * Math.sin(k * x - t * (2 + s.frequency * 0.05));
          pts.push([x, y, -3.06]);
          ghost.push([x, y + 0.02, -3.04]);
        }
        updateLine(wave, pts);
        updateLine(waveGhost, ghost);
        wave.material.color.set(col);
        waveGhost.material.color.set(col);
        mastTop.material.emissiveIntensity = 0.6 + 0.4 * Math.sin(t * 6);
        topLight.intensity = 0.7 + 0.4 * Math.sin(t * 5);
        rxLight.intensity = 0.5 + 0.3 * Math.sin(t * 3);
        const inBand = bandCheck(s.band, s.frequency) === "in band";
        rx.children[1].material.color.set(inBand ? col : C.red);
        rx.children[1].material.emissive.set(inBand ? col : C.red);
        rx.children[1].material.emissiveIntensity = 0.3 + 0.2 * Math.sin(t * 2);
      },
    };
  }

  /* 13 — ANC waves --------------------------------------------------------- */
  function buildANCScene(accent) {
    const base = sceneBase(accent, [12, 7, 16], [0, 3, 0]);
    const scene = base.scene;

    // Acoustic chamber
    box(scene, 15, 0.08, 8, 0x081725, [0, 0, 0]);
    for (let i = -3; i <= 3; i++) {
      box(scene, 0.04, 0.02, 7.6, 0x1f405b, [i * 2.2, 0.03, 0], { opacity: 0.35 });
    }

    // Speakers
    const spkA = new THREE.Group();
    spkA.position.set(-6.2, 3.2, -2.4);
    scene.add(spkA);
    box(spkA, 1.0, 1.7, 0.8, 0x1c3349, [0, 0, 0], { e: 0.05 });
    cyl(spkA, 0.33, 0.33, 0.12, C.magenta, [0.5, 0.3, 0], { rot: [0, 0, Math.PI / 2], e: 0.5 });
    cyl(spkA, 0.2, 0.2, 0.12, C.magenta, [0.5, -0.4, 0], { rot: [0, 0, Math.PI / 2], e: 0.35 });
    const spkB = spkA.clone();
    spkB.position.set(6.2, 3.2, 2.4);
    spkB.rotation.y = Math.PI;
    scene.add(spkB);

    // Wave lines
    const noiseLine = line([], C.magenta, 0.9);
    scene.add(noiseLine);
    const antiLine = line([], C.cyan, 0.9);
    scene.add(antiLine);
    const sumLine = line([], C.green, 1);
    scene.add(sumLine);
    const sumGlow = line([], C.green, 0.2);
    scene.add(sumGlow);

    // Panel labels as 3D bars
    box(scene, 1.2, 0.04, 0.12, C.magenta, [-5.5, 5.8, -2.5], { e: 0.4 });
    box(scene, 1.2, 0.04, 0.12, C.cyan, [-5.5, 5.8, 0], { e: 0.4 });
    box(scene, 1.2, 0.04, 0.12, C.green, [-5.5, 5.8, 2.5], { e: 0.4 });

    // Cancellation meter ring
    const meter = torus(scene, 0.7, 0.04, C.green, [6, 4.4, 0], { opacity: 0.6 });
    const meterNeedle = box(scene, 0.05, 0.6, 0.04, C.green, [6, 4.55, 0.08], { e: 0.8 });
    meterNeedle.geometry.translate(0, 0.3, 0);
    const meterRing2 = torus(scene, 0.78, 0.015, 0x2b5878, [6, 4.4, 0], { opacity: 0.5 });

    return {
      scene,
      camera: base.camera,
      target: base.target,
      update(t, s) {
        const noise = [];
        const anti = [];
        const sum = [];
        const glow = [];
        const n = 110;
        const k = 1.3;
        const omega = 2.1;
        for (let i = 0; i <= n; i++) {
          const x = -5.2 + (10.4 * i) / n;
          const baseY1 = 3.6;
          const baseY2 = 1.7;
          const baseY3 = 5.5;
          const wave1 = s.amplitude * 0.42 * Math.sin(k * x - omega * t);
          const wave2 = -s.amplitude * 0.42 * Math.sin(k * x - omega * t + rad(s.phase));
          noise.push([x, baseY1 + wave1, -2.4]);
          anti.push([x, baseY2 + wave2, 0]);
          sum.push([x, baseY3 + wave1 + wave2, 2.4]);
          glow.push([x, baseY3 + wave1 + wave2 + 0.02, 2.4]);
        }
        updateLine(noiseLine, noise);
        updateLine(antiLine, anti);
        updateLine(sumLine, sum);
        updateLine(sumGlow, glow);
        const cancel = 100 - Math.abs(Math.cos(rad(s.phase / 2))) * 100;
        const col = cancel > 85 ? C.green : cancel > 45 ? C.yellow : C.red;
        sumLine.material.color.set(col);
        sumGlow.material.color.set(col);
        meter.material.color.set(col);
        meter.material.emissive.set(col);
        meterNeedle.material.color.set(col);
        meterNeedle.material.emissive.set(col);
        meterNeedle.rotation.z = rad(120 - clamp(cancel, 0, 100) * 2.2);
        meter.rotation.z = t * 0.2;
        meterRing2.rotation.z = -t * 0.1;
        noiseLine.material.opacity = 0.7 + 0.2 * Math.sin(t * 2);
        antiLine.material.opacity = 0.7 + 0.2 * Math.sin(t * 2 + 1);
        spkA.children[1].material.emissiveIntensity = 0.35 + 0.3 * Math.abs(Math.sin(t * 3));
        spkB.children[1].material.emissiveIntensity = 0.35 + 0.3 * Math.abs(Math.sin(t * 3 + 1.8));
      },
    };
  }

  /* 14 — River survey ------------------------------------------------------ */
  function buildRiverScene(accent) {
    const base = sceneBase(accent, [16, 13, 18], [3, 0, 4], { fog: 0.02 });
    const scene = base.scene;
    const scale = 0.085;

    // River plane
    const river = new THREE.Mesh(
      new THREE.PlaneGeometry(38, 34),
      new THREE.MeshStandardMaterial({ color: 0x0a3857, metalness: 0.5, roughness: 0.25, transparent: true, opacity: 0.88 })
    );
    river.rotation.x = -Math.PI / 2;
    river.position.set(5, 0, 10);
    scene.add(river);
    // Banks
    box(scene, 38, 0.16, 2.4, 0x1d3c2c, [5, 0.06, -1.0]);
    box(scene, 38, 0.16, 2.4, 0x1d3c2c, [5, 0.06, 21.5]);
    for (let i = 0; i < 16; i++) {
      const x = -12 + Math.random() * 34;
      box(scene, 0.14, 0.5 + Math.random() * 0.7, 0.14, 0x2a6b48, [x, 0.35, -1.8 + Math.random() * 1.3], { e: 0.05 });
    }
    // Water glints
    for (let i = 0; i < 18; i++) {
      box(scene, 0.5 + Math.random(), 0.008, 0.03, 0x6ec6e8, [Math.random() * 30 - 10, 0.03, 1 + Math.random() * 18], { opacity: 0.22, e: 0 });
    }

    // Survey triangle dynamic
    const triGroup = new THREE.Group();
    scene.add(triGroup);
    const abLine = line([[0, 0.3, 0], [1, 0.3, 0]], C.cyan, 1);
    const acLine = line([[0, 0.3, 0], [1, 0.3, 0]], C.yellow, 1);
    const bcLine = line([[0, 0.3, 0], [1, 0.3, 0]], C.magenta, 1);
    const widthLine = line([[0, 0.3, 0], [0, 0.3, 0]], C.yellow, 0.8, true);
    triGroup.add(abLine, acLine, bcLine, widthLine);
    const pointA = sph(triGroup, 0.16, C.cyan, [0, 0.3, 0], { e: 0.8 });
    const pointB = sph(triGroup, 0.16, C.cyan, [0, 0.3, 0], { e: 0.8 });
    const pointC = sph(triGroup, 0.16, C.yellow, [0, 0.3, 0], { e: 0.8 });
    const ringA = torus(triGroup, 0.3, 0.02, C.cyan, [0, 0.32, 0], { rot: [Math.PI / 2, 0, 0], opacity: 0.6 });
    const ringB = torus(triGroup, 0.3, 0.02, C.cyan, [0, 0.32, 0], { rot: [Math.PI / 2, 0, 0], opacity: 0.6 });

    // Tree landmark
    const tree = new THREE.Group();
    scene.add(tree);
    cyl(tree, 0.12, 0.18, 1.0, 0x7c5a3a, [0, 0.5, 0], { e: 0.03, rough: 0.9 });
    const cone1 = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.8, 9), neon(0x2f7d54, { e: 0.06, rough: 0.9 }));
    cone1.position.y = 1.65;
    tree.add(cone1);
    const cone2 = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.4, 9), neon(0x3f9c69, { e: 0.06, rough: 0.9 }));
    cone2.position.y = 2.45;
    tree.add(cone2);
    const treeHalo = torus(tree, 0.9, 0.02, C.yellow, [0, 0.1, 0], { rot: [Math.PI / 2, 0, 0], opacity: 0.5 });

    // Range poles
    const poleA = new THREE.Group();
    const poleB = new THREE.Group();
    scene.add(poleA, poleB);
    [poleA, poleB].forEach((p) => {
      cyl(p, 0.035, 0.045, 2.2, 0xe2e8f0, [0, 1.1, 0], { e: 0.15, metal: 0.6 });
      box(p, 0.35, 0.2, 0.04, C.magenta, [0, 1.8, 0], { e: 0.5 });
      box(p, 0.35, 0.2, 0.04, C.cyan, [0, 1.55, 0], { e: 0.5 });
    });

    return {
      scene,
      camera: base.camera,
      target: base.target,
      update(t, s) {
        const c = s.baseline * scale;
        const A = s.angleA;
        const B = s.angleB;
        const Cang = 180 - A - B;
        const acM = (s.baseline * Math.sin(rad(B))) / Math.sin(rad(Cang));
        const ac = acM * scale;
        const Ax = -c / 2;
        const Az = 0.3;
        const Bx = c / 2;
        const Cx = Ax + ac * Math.cos(rad(A));
        const Cz = Az + ac * Math.sin(rad(A));
        pointA.position.set(Ax, 0.3, Az);
        pointB.position.set(Bx, 0.3, Az);
        pointC.position.set(Cx, 0.3, Cz);
        ringA.position.set(Ax, 0.32, Az);
        ringB.position.set(Bx, 0.32, Az);
        poleA.position.set(Ax, 0.08, Az);
        poleB.position.set(Bx, 0.08, Az);
        updateLine(abLine, [[Ax, 0.3, Az], [Bx, 0.3, Az]]);
        updateLine(acLine, [[Ax, 0.3, Az], [Cx, 0.3, Cz]]);
        updateLine(bcLine, [[Bx, 0.3, Az], [Cx, 0.3, Cz]]);
        const widthM = acM * Math.sin(rad(A));
        updateLine(widthLine, [[Cx, 0.3, Cz], [Cx, 0.3, Az]]);
        tree.position.set(Cx, 0, Cz);
        treeHalo.position.y = 0.12;
        tree.rotation.y = t * 0.05;
        ringA.rotation.z = t * 0.7;
        ringB.rotation.z = -t * 0.6;
        abLine.material.opacity = 0.85 + 0.15 * Math.sin(t * 2);
        // angle arcs at A and B
        if (!this._arcA) {
          this._arcA = line(arcPoints(Ax, 0.32, Az, 0.8, 0, rad(A), 24, "xz"), C.yellow, 0.7);
          this._arcB = line(arcPoints(Bx, 0.32, Az, 0.8, Math.PI, Math.PI - rad(B), 24, "xz"), C.magenta, 0.7);
          triGroup.add(this._arcA, this._arcB);
        }
        updateLine(this._arcA, arcPoints(Ax, 0.32, Az, 0.8, 0, rad(A), 24, "xz"));
        updateLine(this._arcB, arcPoints(Bx, 0.32, Az, 0.8, Math.PI, Math.PI - rad(B), 24, "xz"));
        void widthM;
      },
    };
  }

  /* 15 — SSA coast guard --------------------------------------------------- */
  function buildSSAScene(accent) {
    const base = sceneBase(accent, [13, 12, 16], [0, 0, 3], { fog: 0.02 });
    const scene = base.scene;
    const scale = 0.48;

    // Sea
    const sea = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 36),
      new THREE.MeshStandardMaterial({ color: 0x0a3552, metalness: 0.5, roughness: 0.25, transparent: true, opacity: 0.9 })
    );
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = 0;
    scene.add(sea);
    for (let i = 0; i < 22; i++) {
      box(scene, 0.6 + Math.random(), 0.01, 0.03, 0x73c7e8, [(Math.random() - 0.5) * 30, 0.035, (Math.random() - 0.5) * 30], { opacity: 0.18, e: 0 });
    }

    // Station at A
    const station = new THREE.Group();
    station.position.set(-1.5, 0, 0);
    scene.add(station);
    box(station, 1.2, 0.35, 0.8, 0x2a4a63, [0, 0.25, 0], { e: 0.1 });
    box(station, 0.7, 0.55, 0.5, 0xe2e8f0, [0.1, 0.7, 0], { e: 0.08 });
    box(station, 0.25, 0.28, 0.25, C.cyan, [0.1, 1.05, 0], { e: 0.4 });
    const stationLight = new THREE.PointLight(C.cyan, 0.7, 8, 2);
    stationLight.position.set(0.1, 1.2, 0);
    station.add(stationLight);

    // Distress vessel marker
    const distress = new THREE.Group();
    scene.add(distress);
    box(distress, 1.0, 0.22, 0.42, 0xe2e8f0, [0, 0.2, 0], { e: 0.1 });
    box(distress, 0.2, 0.35, 0.24, C.red, [-0.1, 0.45, 0], { e: 0.35 });
    cyl(distress, 0.025, 0.025, 1.0, C.yellow, [0.22, 0.6, 0], { e: 0.5 });
    const distressLight = sph(distress, 0.1, C.red, [0.22, 1.12, 0], { e: 1.0 });
    const distressGlow = new THREE.PointLight(C.red, 1.0, 8, 2);
    distressGlow.position.set(0, 1.1, 0);
    distress.add(distressGlow);

    // Dynamic geometry
    const dynamic = new THREE.Group();
    scene.add(dynamic);
    const bearingLine = line([[0, 0.12, 0], [1, 0.12, 0]], C.yellow, 1);
    const baseline = line([[-1.5, 0.12, 0], [1, 0.12, 0]], C.cyan, 0.8, true);
    dynamic.add(bearingLine, baseline);
    const circleLineA = line([], C.cyan, 0.6, true);
    dynamic.add(circleLineA);

    const courseGroups = [0, 1].map(() => {
      const g = new THREE.Group();
      scene.add(g);
      return g;
    });
    const heightLine = line([], C.magenta, 0.7, true);
    dynamic.add(heightLine);

    let signature = "";
    function rebuild(s) {
      const a = s.a * scale;
      const b = s.b * scale;
      const A = rad(s.angleA);
      const bx = b * Math.cos(A);
      const by = b * Math.sin(A);
      const h = b * Math.sin(A);
      const disc = a * a - h * h;
      const solutions = ssaSolutions(s.a, s.b, s.angleA);
      distress.position.set(-1.5 + bx, 0, by);
      updateLine(bearingLine, [[-1.5, 0.12, 0], [-1.5 + bx, 0.12, by]]);
      updateLine(baseline, [[-1.5, 0.12, 0], [-1.5 + b * Math.cos(A), 0.12, 0]]);
      updateLine(heightLine, [[-1.5 + bx, 0.12, by], [-1.5 + bx, 0.12, 0]]);
      // circle centered at distress with radius a
      updateLine(circleLineA, arcPoints(-1.5 + bx, 0.14, by, a, 0, Math.PI * 2, 90, "xz"));
      const xs = disc < 0 ? [] : [bx - Math.sqrt(disc), bx + Math.sqrt(disc)];
      const uniq = [];
      xs.forEach((x) => {
        if (!uniq.some((u) => Math.abs(u - x) < 0.02)) uniq.push(x);
      });
      courseGroups.forEach((g, idx) => {
        clearGroup(g);
        const x = uniq[idx];
        if (x == null) return;
        const bxw = -1.5 + x;
        const color = idx === 0 ? C.cyan : C.magenta;
        g.add(line([[-1.5, 0.14, 0], [bxw, 0.14, 0]], C.cyan, 0.9));
        g.add(line([[-1.5, 0.14, 0], [-1.5 + bx, 0.14, by]], C.yellow, 0.9));
        g.add(line([[bxw, 0.14, 0], [-1.5 + bx, 0.14, by]], color, 0.9, idx === 1));
        const p = sph(g, 0.13, color, [bxw, 0.28, 0], { e: 0.8 });
        const ring = torus(g, 0.28, 0.018, color, [bxw, 0.16, 0], { rot: [Math.PI / 2, 0, 0], opacity: 0.6 });
        void p;
        void ring;
      });
      signature = `${s.a}-${s.b}-${s.angleA}`;
      return solutions;
    }

    return {
      scene,
      camera: base.camera,
      target: base.target,
      update(t, s) {
        const sig = `${s.a}-${s.b}-${s.angleA}`;
        if (sig !== signature) rebuild(s);
        distress.position.y = s.auto ? 0 : 0;
        distress.position.y = 0.02 + 0.05 * Math.sin(t * 1.4);
        distress.rotation.z = Math.sin(t * 0.8) * 0.04;
        stationLight.intensity = 0.6 + 0.25 * Math.sin(t * 3);
        distressLight.intensity = 0.7 + 0.5 * Math.abs(Math.sin(t * 4));
        distressGlow.intensity = 0.6 + 0.4 * Math.abs(Math.sin(t * 4));
        circleLineA.material.opacity = 0.35 + 0.18 * Math.sin(t * 1.8);
      },
    };
  }

  /* 16 — Aviation law of cosines ------------------------------------------- */
  function buildAviationScene(accent) {
    const base = sceneBase(accent, [15, 12, 20], [3, 1, 2], { fog: 0.018 });
    const scene = base.scene;
    const scale = 0.02;

    // Map / ground
    box(scene, 30, 0.08, 24, 0x081827, [3, -0.04, 2]);
    for (let i = -3; i <= 12; i += 2.5) {
      box(scene, 0.03, 0.02, 22, 0x1b405c, [i, 0.02, 2], { opacity: 0.4 });
    }
    for (let i = -8; i <= 12; i += 2.5) {
      box(scene, 28, 0.02, 0.03, 0x1b405c, [3, 0.02, i], { opacity: 0.4 });
    }

    // Airport at A
    const airport = new THREE.Group();
    scene.add(airport);
    box(airport, 2.4, 0.12, 0.8, 0x2c4a63, [0, 0.08, 0], { e: 0.08 });
    for (let i = -4; i <= 4; i++) {
      box(airport, 0.18, 0.02, 0.08, C.yellow, [i * 0.26, 0.15, 0], { e: 0.5 });
    }
    box(airport, 0.4, 1.2, 0.4, 0xdff7ff, [-1.5, 0.6, 0.7], { e: 0.15 });
    box(airport, 0.55, 0.35, 0.55, C.cyan, [-1.5, 1.35, 0.7], { e: 0.45 });
    const towerLight = new THREE.PointLight(C.cyan, 0.9, 9, 2);
    towerLight.position.set(-1.5, 1.5, 0.7);
    airport.add(towerLight);
    const compass = circleLine(0, 0.18, 0, 3.4, C.cyan, 0.25, "xz");
    scene.add(compass);

    // Route lines
    const legA = line([], C.cyan, 1);
    const legB = line([], C.yellow, 1);
    const legC = line([], C.magenta, 1);
    scene.add(legA, legB, legC);
    const legAGlow = line([], C.cyan, 0.2);
    const legBGlow = line([], C.yellow, 0.2);
    scene.add(legAGlow, legBGlow);
    const angleArc = line([], C.yellow, 0.8);
    scene.add(angleArc);

    // Planes
    function makePlane(color) {
      const g = new THREE.Group();
      const body = box(g, 1.3, 0.18, 0.22, color, [0, 0, 0], { e: 0.3, metal: 0.6 });
      box(g, 0.35, 0.06, 1.4, color, [-0.05, 0.05, 0], { e: 0.25, metal: 0.6 });
      box(g, 0.22, 0.32, 0.06, color, [-0.55, 0.18, 0], { e: 0.3 });
      box(g, 0.02, 0.02, 0.5, C.white, [0.62, 0, 0], { e: 0.5 });
      const glow = new THREE.PointLight(color, 0.6, 4, 2);
      glow.position.set(0, 0.3, 0);
      g.add(glow);
      void body;
      return g;
    }
    const planeA = makePlane(C.cyan);
    const planeB = makePlane(C.magenta);
    scene.add(planeA, planeB);

    // Wind arrow
    const wind = arrow(scene, [1, 0, 0], [0, 1.4, -4], 2.2, C.yellow, { head: 0.3, headWidth: 0.13 });

    // Marker rings at B and C
    const ringB = torus(scene, 0.4, 0.02, C.cyan, [0, 0.15, 0], { rot: [Math.PI / 2, 0, 0], opacity: 0.7 });
    const ringC = torus(scene, 0.4, 0.02, C.magenta, [0, 0.15, 0], { rot: [Math.PI / 2, 0, 0], opacity: 0.7 });
    scene.add(ringB, ringC);

    return {
      scene,
      camera: base.camera,
      target: base.target,
      update(t, s) {
        const A = new THREE.Vector3(0, 0.16, 0);
        const B = new THREE.Vector3(s.legA * scale, 0.16, 0);
        const Cv = new THREE.Vector3(s.legB * scale * Math.cos(rad(s.angle)), 0.16, s.legB * scale * Math.sin(rad(s.angle)));
        updateLine(legA, [A, B]);
        updateLine(legB, [A, Cv]);
        updateLine(legC, [B, Cv]);
        updateLine(legAGlow, [A, B]);
        updateLine(legBGlow, [A, Cv]);
        updateLine(angleArc, arcPoints(0, 0.2, 0, 1.4, 0, rad(s.angle), 30, "xz"));
        ringB.position.set(B.x, 0.2, B.z);
        ringC.position.set(Cv.x, 0.2, Cv.z);
        const c = Math.sqrt(s.legA ** 2 + s.legB ** 2 - 2 * s.legA * s.legB * Math.cos(rad(s.angle)));
        const prog = (t * 0.12) % 1;
        // Plane A travels A -> B
        const p1 = new THREE.Vector3().lerpVectors(A, B, (prog * 2) % 1);
        // Plane B travels B -> C
        const p2 = new THREE.Vector3().lerpVectors(B, Cv, (prog * 2 + 0.2) % 1);
        planeA.position.copy(p1);
        planeB.position.copy(p2);
        const dir1 = new THREE.Vector3().subVectors(B, A).normalize();
        const dir2 = new THREE.Vector3().subVectors(Cv, B).normalize();
        planeA.rotation.y = -Math.atan2(dir1.z, dir1.x);
        planeB.rotation.y = -Math.atan2(dir2.z, dir2.x);
        planeA.position.y = 0.5 + 0.2 * Math.sin(t * 1.5);
        planeB.position.y = 0.62 + 0.2 * Math.sin(t * 1.7 + 1);
        ringB.rotation.z = t * 0.8;
        ringC.rotation.z = -t * 0.7;
        towerLight.intensity = 0.6 + 0.3 * Math.sin(t * 3);
        wind.position.set(-1.2, 1.1, -3.2);
        wind.setDirection(new THREE.Vector3(Math.cos(t * 0.2), 0.1, Math.sin(t * 0.2)).normalize());
        void c;
      },
    };
  }

  /* 17 — Shader normalizer ------------------------------------------------ */
  function buildShaderScene(accent) {
    const base = sceneBase(accent, [10, 7.5, 14], [0, 2.8, 0], { fog: 0.015 });
    const scene = base.scene;

    // Pedestal
    cyl(scene, 1.4, 1.8, 0.3, 0x122b44, [0, 0.15, 0], { e: 0.08 });
    torus(scene, 1.55, 0.025, C.cyan, [0, 0.32, 0], { rot: [Math.PI / 2, 0, 0], opacity: 0.6 });

    // Metallic sphere + wireframe shell
    const sphere = sph(scene, 2.1, 0x1c3b59, [0, 2.8, 0], { e: 0.12, metal: 0.95, rough: 0.16, seg: 48, seg2: 32 });
    const shell = new THREE.Mesh(new THREE.SphereGeometry(2.13, 24, 16), new THREE.MeshBasicMaterial({ color: C.magenta, wireframe: true, transparent: true, opacity: 0.1 }));
    shell.position.set(0, 2.8, 0);
    scene.add(shell);
    const innerGlow = new THREE.PointLight(C.magenta, 0.8, 8, 2);
    innerGlow.position.set(0, 2.8, 0);
    scene.add(innerGlow);

    // Surface normal arrow
    const normalArrow = arrow(scene, [1, 0, 0], [0, 2.8, 0], 2.15, C.magenta, { head: 0.45, headWidth: 0.2 });
    const normalTip = sph(scene, 0.11, C.magenta, [2.1, 2.8, 0], { e: 0.9 });
    // Surface patch
    const patch = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), neon(C.magenta, { e: 0.3, opacity: 0.35, side: THREE.DoubleSide }));
    scene.add(patch);

    // Orbiting light
    const lightOrb = sph(scene, 0.22, C.yellow, [5, 5, 0], { e: 1.0 });
    const lightGlow = new THREE.PointLight(C.yellow, 1.4, 14, 2);
    lightGlow.position.copy(lightOrb.position);
    scene.add(lightGlow);
    const orbit = circleLine(0, 2.8, 0, 4.6, C.yellow, 0.25, "xz");
    scene.add(orbit);

    // Right-triangle identity diagram
    const diagram = new THREE.Group();
    diagram.position.set(-5.4, 2.4, 0.4);
    scene.add(diagram);
    box(diagram, 4.4, 3.4, 0.04, 0x06131f, [0, 0, 0], { opacity: 0.82, e: 0 });
    const hyp = line([], C.yellow, 1);
    const cosLeg = line([], C.cyan, 1);
    const sinLeg = line([], C.magenta, 1);
    diagram.add(hyp, cosLeg, sinLeg);
    const corner = line([], 0x7e9bb5, 0.6);
    diagram.add(corner);
    const labelBars = [C.cyan, C.magenta, C.yellow].map((c, i) => box(diagram, 0.7, 0.03, 0.02, c, [-1.5, 1.2 - i * 0.25, 0.05], { e: 0.5 }));
    const diagramGlow = new THREE.PointLight(C.magenta, 0.4, 5, 2);
    diagramGlow.position.set(0, 0, 0.5);
    diagram.add(diagramGlow);

    return {
      scene,
      camera: base.camera,
      target: base.target,
      update(t, s) {
        const cosV = Math.sqrt(1 - s.sinValue * s.sinValue);
        const dir = new THREE.Vector3(cosV, s.sinValue, 0.18).normalize();
        normalArrow.position.set(0, 2.8, 0);
        normalArrow.setDirection(dir);
        normalArrow.setLength(2.3, 0.42, 0.18);
        normalTip.position.set(dir.x * 2.3, 2.8 + dir.y * 2.3, dir.z * 2.3);
        patch.position.copy(normalTip.position);
        patch.lookAt(0, 2.8, 0);
        patch.rotateX(Math.PI / 2);
        const la = rad(s.light);
        lightOrb.position.set(Math.cos(la) * 4.6, 3.4 + Math.sin(la * 2) * 1.2, Math.sin(la) * 4.6);
        lightGlow.position.copy(lightOrb.position);
        lightGlow.intensity = 1.0 + 0.35 * Math.sin(t * 2);
        shell.rotation.y = t * 0.15;
        innerGlow.intensity = 0.5 + 0.25 * Math.sin(t * 1.4);
        // identity diagram
        const R = 1.5;
        const a = Math.atan2(s.sinValue, cosV);
        updateLine(hyp, [[0, -0.6, 0.05], [R * cosV, -0.6 + R * s.sinValue, 0.05]]);
        updateLine(cosLeg, [[0, -0.6, 0.05], [R * cosV, -0.6, 0.05]]);
        updateLine(sinLeg, [[R * cosV, -0.6, 0.05], [R * cosV, -0.6 + R * s.sinValue, 0.05]]);
        updateLine(corner, [[R * cosV * 0.82, -0.6, 0.05], [R * cosV * 0.82, -0.6 + R * s.sinValue * 0.18, 0.05], [R * cosV, -0.6 + R * s.sinValue * 0.18, 0.05]]);
        labelBars[0].scale.x = 0.5 + cosV * 0.8;
        labelBars[1].scale.x = 0.5 + s.sinValue * 0.8;
        labelBars[2].scale.x = 1.1;
        diagramGlow.intensity = 0.35 + 0.2 * Math.sin(t * 2);
        void a;
      },
    };
  }

  /* 18 — Projectile -------------------------------------------------------- */
  function buildProjectileScene(accent) {
    const base = sceneBase(accent, [15, 9, 21], [7, 2, 0], { fog: 0.016 });
    const scene = base.scene;
    const scale = 0.052;

    // Range ground
    box(scene, 28, 0.08, 8, 0x0a1b2b, [8, -0.02, 0]);
    for (let i = 0; i < 22; i++) {
      const x = -2 + i * 1.3;
      box(scene, 0.04, 0.02, i % 5 === 0 ? 1.8 : 0.8, i % 5 === 0 ? C.yellow : 0x2f5a78, [x, 0.03, 0], { opacity: i % 5 === 0 ? 0.5 : 0.28, e: i % 5 === 0 ? 0.4 : 0 });
    }

    // Cannon
    const cannon = new THREE.Group();
    cannon.position.set(0, 0.2, 0);
    scene.add(cannon);
    cyl(cannon, 0.55, 0.75, 0.45, 0x1c3b55, [0, 0.22, 0], { e: 0.12 });
    torus(cannon, 0.6, 0.03, C.cyan, [0, 0.46, 0], { rot: [Math.PI / 2, 0, 0], opacity: 0.6 });
    const barrelPivot = new THREE.Group();
    barrelPivot.position.set(0, 0.75, 0);
    cannon.add(barrelPivot);
    const barrel = cyl(barrelPivot, 0.18, 0.28, 2.8, 0x35597a, [0.8, 0.05, 0], { rot: [0, 0, -Math.PI / 2], e: 0.12, metal: 0.7 });
    cyl(barrelPivot, 0.23, 0.23, 0.45, C.yellow, [2.15, 0.05, 0], { rot: [0, 0, -Math.PI / 2], e: 0.5 });
    const wheel1 = torus(cannon, 0.55, 0.1, 0x203a52, [-0.2, 0.55, 0.62], { rot: [0, 0, 0], e: 0.05, metal: 0.6 });
    const wheel2 = torus(cannon, 0.55, 0.1, 0x203a52, [-0.2, 0.55, -0.62], { rot: [0, 0, 0], e: 0.05, metal: 0.6 });
    void wheel1;
    void wheel2;
    const muzzle = new THREE.Object3D();
    muzzle.position.set(2.4, 0.05, 0);
    barrelPivot.add(muzzle);
    const flash = sph(barrelPivot, 0.3, C.yellow, [2.5, 0.05, 0], { e: 0.9, opacity: 0.7 });
    flash.visible = false;

    // Trajectory
    const path = line([], C.yellow, 1.0);
    const pathGlow = line([], C.yellow, 0.18);
    scene.add(path, pathGlow);
    const projectile = sph(scene, 0.2, C.magenta, [0, 0.8, 0], { e: 0.8 });
    const projectileTrail = line([], C.magenta, 0.35);
    scene.add(projectileTrail);
    const targetRing = torus(scene, 0.8, 0.03, C.magenta, [10, 0.12, 0], { rot: [Math.PI / 2, 0, 0], opacity: 0.7 });
    scene.add(targetRing);
    const targetRing2 = torus(scene, 0.45, 0.02, C.yellow, [10, 0.12, 0], { rot: [Math.PI / 2, 0, 0], opacity: 0.6 });
    scene.add(targetRing2);
    const apexMarker = sph(scene, 0.1, C.cyan, [0, 3, 0], { e: 0.6 });

    return {
      scene,
      camera: base.camera,
      target: base.target,
      update(t, s) {
        const theta = rad(s.angle);
        const v = s.speed;
        const g = 9.81;
        const range = (v * v * Math.sin(2 * theta)) / g;
        const maxH = (v * v * Math.sin(theta) ** 2) / (2 * g);
        barrelPivot.rotation.z = theta;
        flash.visible = s.auto && t % 2.4 < 0.18;
        flash.scale.setScalar(0.7 + Math.random() * 0.7);
        const pts = [];
        const glow = [];
        const steps = 90;
        for (let i = 0; i <= steps; i++) {
          const xm = (range * i) / steps;
          const ym = xm * Math.tan(theta) - (g * xm * xm) / (2 * v * v * Math.cos(theta) ** 2);
          pts.push([xm * scale, 0.8 + ym * scale, 0]);
          glow.push([xm * scale, 0.8 + ym * scale + 0.01, 0]);
        }
        updateLine(path, pts);
        updateLine(pathGlow, glow);
        targetRing.position.x = range * scale;
        targetRing2.position.x = range * scale;
        targetRing.rotation.z = t * 0.6;
        targetRing2.rotation.z = -t * 0.9;
        targetRing.scale.setScalar(1 + 0.08 * Math.sin(t * 2));
        const flightT = (2 * v * Math.sin(theta)) / g;
        const progress = s.auto ? (t % 2.4) / 2.4 : 0.5;
        const xm = range * progress;
        const ym = xm * Math.tan(theta) - (g * xm * xm) / (2 * v * v * Math.cos(theta) ** 2);
        projectile.position.set(xm * scale, 0.8 + Math.max(0, ym) * scale, 0);
        projectile.material.emissiveIntensity = 0.6 + 0.3 * Math.sin(t * 5);
        const trail = [];
        for (let i = 0; i <= 18; i++) {
          const p = Math.max(0, progress - i * 0.018);
          const x2 = range * p;
          const y2 = x2 * Math.tan(theta) - (g * x2 * x2) / (2 * v * v * Math.cos(theta) ** 2);
          trail.push([x2 * scale, 0.8 + Math.max(0, y2) * scale, 0]);
        }
        updateLine(projectileTrail, trail);
        apexMarker.position.set((range / 2) * scale, 0.8 + maxH * scale, 0);
        apexMarker.material.emissiveIntensity = 0.45 + 0.3 * Math.sin(t * 2);
        void flightT;
      },
    };
  }

  /* 19 — Solar panel / cross product --------------------------------------- */
  function buildSolarScene(accent) {
    const base = sceneBase(accent, [12, 8, 15], [0, 2.8, 0], { fog: 0.016 });
    const scene = base.scene;

    // Ground array
    box(scene, 16, 0.08, 12, 0x0a1a28, [0, -0.02, 0]);
    for (let i = -3; i <= 3; i++) {
      box(scene, 0.03, 0.02, 11, 0x23475f, [i * 2.1, 0.03, 0], { opacity: 0.35 });
    }

    // Sun
    const sun = sph(scene, 0.8, C.yellow, [7, 7, 0], { e: 1.0, opacity: 0.95, seg: 32, seg2: 24 });
    const sunGlow = torus(scene, 1.2, 0.035, C.yellow, [7, 7, 0], { opacity: 0.5 });
    const sunGlow2 = torus(scene, 1.55, 0.02, C.yellow, [7, 7, 0], { opacity: 0.3 });
    const sunLight = new THREE.PointLight(C.yellow, 2.0, 40, 1.7);
    sunLight.position.set(7, 7, 0);
    scene.add(sunLight);
    const ray = arrow(scene, [-1, -1, 0], [6.5, 6.5, 0], 4.5, C.yellow, { head: 0.4, headWidth: 0.18 });

    // Panel stand
    const stand = new THREE.Group();
    scene.add(stand);
    cyl(stand, 0.32, 0.45, 1.0, 0x1c3b55, [0, 0.5, 0], { e: 0.1 });
    const panelPivot = new THREE.Group();
    panelPivot.position.set(0, 1.1, 0);
    stand.add(panelPivot);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x0e3a5c, metalness: 0.7, roughness: 0.22, emissive: new THREE.Color(C.cyan), emissiveIntensity: 0.12 });
    const panel = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.12, 2.8), panelMat);
    panelPivot.add(panel);
    // Grid lines on panel
    for (let i = -3; i <= 3; i++) {
      box(panelPivot, 0.025, 0.06, 2.75, 0x4aa3c7, [i * 0.55, 0.08, 0], { opacity: 0.5, e: 0.2 });
    }
    for (let i = -2; i <= 2; i++) {
      box(panelPivot, 4.35, 0.06, 0.025, 0x4aa3c7, [0, 0.08, i * 0.55], { opacity: 0.5, e: 0.2 });
    }
    const panelEdge = box(panelPivot, 4.5, 0.18, 0.08, C.cyan, [0, 0.02, 1.42], { e: 0.4 });
    void panelEdge;
    const panelNormal = arrow(panelPivot, [0, 1, 0], [0, 0.1, 0], 2.2, C.magenta, { head: 0.45, headWidth: 0.2 });
    // Panel edge vector a + sun vector b + cross product
    const edgeArrow = arrow(panelPivot, [1, 0, 0], [0, 0.12, 0], 3.0, C.cyan, { head: 0.4, headWidth: 0.18 });
    const edgeTip = sph(panelPivot, 0.1, C.cyan, [3.0, 0.12, 0], { e: 0.8 });

    // Cross product arrow in world space
    const crossArrow = arrow(scene, [0, 1, 0], [0, 1.2, 0], 2.6, C.yellow, { head: 0.45, headWidth: 0.2 });
    const crossTip = sph(scene, 0.12, C.yellow, [0, 1.2, 0], { e: 0.9 });
    const sunVec = arrow(scene, [1, 0, 0], [0, 1.2, 0], 3.0, C.yellow, { head: 0.35, headWidth: 0.14 });

    // Light rays
    const rays = [];
    for (let i = 0; i < 4; i++) {
      const r = line([], C.yellow, 0.35);
      scene.add(r);
      rays.push(r);
    }

    // Output ring
    const outputRing = torus(scene, 1.2, 0.04, C.green, [4.5, 0.15, 2.5], { rot: [Math.PI / 2, 0, 0], opacity: 0.6 });
    const outputRing2 = torus(scene, 0.9, 0.02, 0x2b5878, [4.5, 0.15, 2.5], { rot: [Math.PI / 2, 0, 0], opacity: 0.4 });

    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const tmpA = new THREE.Vector3();
    const tmpB = new THREE.Vector3();
    return {
      scene,
      camera: base.camera,
      target: base.target,
      update(t, s) {
        const el = rad(s.elevation);
        const az = rad(s.azimuth);
        const sunPos = new THREE.Vector3(Math.cos(el) * Math.cos(az) * 8, Math.sin(el) * 8, Math.cos(el) * Math.sin(az) * 8);
        sun.position.copy(sunPos);
        sunGlow.position.copy(sunPos);
        sunGlow2.position.copy(sunPos);
        sunLight.position.copy(sunPos);
        sunGlow.rotation.z = t * 0.4;
        sunGlow2.rotation.z = -t * 0.25;
        sunGlow.scale.setScalar(1 + 0.06 * Math.sin(t * 2));
        const sunDir = sunPos.clone().normalize();
        // Panel normal aims at sun; rotate panel by panel azimuth offset
        const panelAz = rad(s.panelAz);
        const targetNormal = new THREE.Vector3(Math.cos(el) * Math.cos(panelAz), Math.sin(el), Math.cos(el) * Math.sin(panelAz)).normalize();
        q.setFromUnitVectors(up, targetNormal);
        panelPivot.quaternion.slerp(q, 0.12);
        // edge vector a = panel local +X transformed
        tmpA.set(1, 0, 0).applyQuaternion(panelPivot.quaternion).normalize();
        tmpB.copy(sunDir);
        const cross = new THREE.Vector3().crossVectors(tmpA, tmpB);
        const crossMag = cross.length();
        if (crossMag > 1e-5) {
          cross.normalize();
          crossArrow.setDirection(cross);
          crossArrow.setLength(0.8 + crossMag * 2.4, 0.4, 0.18);
          crossTip.position.copy(crossArrow.position).addScaledVector(cross, 0.8 + crossMag * 2.4);
        }
        crossArrow.position.set(0, 1.2, 0);
        sunVec.position.set(0, 1.2, 0);
        sunVec.setDirection(tmpB);
        sunVec.setLength(4.0, 0.35, 0.14);
        edgeTip.position.copy(edgeArrow.position).addScaledVector(tmpA, 3.0);
        // rays
        rays.forEach((r, i) => {
          const start = sunPos.clone().multiplyScalar(0.85);
          const end = new THREE.Vector3(tmpA.x * (i - 1.5) * 0.6, 1.3, tmpA.z * (i - 1.5) * 0.6);
          updateLine(r, [start, end]);
        });
        const eff = Math.max(0, new THREE.Vector3(0, 1, 0).dot(tmpB)) * 100;
        const col = eff > 65 ? C.green : eff > 30 ? C.yellow : C.red;
        outputRing.material.color.set(col);
        outputRing.material.emissive.set(col);
        outputRing.scale.setScalar(0.8 + (eff / 100) * 0.45);
        outputRing.rotation.z = t * 0.5;
        panelMat.emissiveIntensity = 0.08 + (eff / 100) * 0.18;
        sunLight.intensity = 1.5 + 0.3 * Math.sin(t * 1.8);
        void ray;
      },
    };
  }

  /* 20 — GPS / spherical globe --------------------------------------------- */
  function buildGlobeScene(accent) {
    const base = sceneBase(accent, [8, 6, 13], [0, 0, 0], { grid: false, fog: 0 });
    const scene = base.scene;
    scene.fog = null;
    starfield(scene, 900, 80);

    // Earth
    const earth = sph(scene, 3, 0x0c2d4a, [0, 0, 0], { e: 0.12, metal: 0.55, rough: 0.42, seg: 64, seg2: 48 });
    const wire = new THREE.Mesh(
      new THREE.SphereGeometry(3.02, 36, 24),
      new THREE.MeshBasicMaterial({ color: C.cyan, wireframe: true, transparent: true, opacity: 0.16 })
    );
    scene.add(wire);
    // Latitude rings
    for (let lat = -60; lat <= 60; lat += 30) {
      const r = 3.025 * Math.cos(rad(lat));
      const y = 3.025 * Math.sin(rad(lat));
      const ring = line(arcPoints(0, y, 0, r, 0, Math.PI * 2, 72, "xz"), C.cyan, lat === 0 ? 0.42 : 0.2);
      scene.add(ring);
    }
    // Longitude rings
    for (let lon = 0; lon < 180; lon += 30) {
      const g = new THREE.Group();
      g.rotation.y = rad(lon);
      const ring = line(arcPoints(0, 0, 0, 3.025, 0, Math.PI * 2, 72), C.cyan, lon === 0 ? 0.36 : 0.14);
      g.add(ring);
      scene.add(g);
    }
    // Axis
    const axis = line([[0, -3.7, 0], [0, 3.7, 0]], C.yellow, 0.5, true);
    scene.add(axis);
    const north = sph(scene, 0.08, C.yellow, [0, 3.12, 0], { e: 0.8 });
    void north;

    // Location marker + radius vector
    const pin = new THREE.Group();
    scene.add(pin);
    const pinSphere = sph(pin, 0.12, C.magenta, [0, 0, 0], { e: 0.9 });
    const pinCone = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.5, 12), neon(C.magenta, { e: 0.7 }));
    pinCone.position.y = -0.3;
    pinCone.rotation.x = Math.PI;
    pin.add(pinCone);
    const pinPulse = torus(pin, 0.32, 0.02, C.magenta, [0, 0.1, 0], { rot: [Math.PI / 2, 0, 0], opacity: 0.7 });
    const radiusLine = line([[0, 0, 0], [0, 0, 0]], C.yellow, 0.9);
    scene.add(radiusLine);
    const locationBeam = line([[0, 0, 0], [0, 0, 0]], C.magenta, 0.35, true);
    scene.add(locationBeam);
    const origin = sph(scene, 0.08, C.white, [0, 0, 0], { e: 0.4 });

    // Flight arc
    const arcPts = [];
    for (let i = 0; i <= 60; i++) {
      const u = i / 60;
      const lat = rad(13.7 + (40 - 13.7) * u);
      const lon = rad(100.5 + (-70 - 100.5) * u);
      const r = 3.06 + Math.sin(u * Math.PI) * 0.5;
      arcPts.push([r * Math.cos(lat) * Math.cos(lon), r * Math.sin(lat), r * Math.cos(lat) * Math.sin(lon)]);
    }
    const flightArc = line(arcPts, C.yellow, 0.75);
    scene.add(flightArc);
    const flightDot = sph(scene, 0.07, C.yellow, [0, 0, 0], { e: 0.9 });

    // Satellite orbit
    const orbitGroup = new THREE.Group();
    orbitGroup.rotation.z = rad(42);
    orbitGroup.rotation.x = rad(18);
    scene.add(orbitGroup);
    const orbitLine = circleLine(0, 0, 0, 5.3, C.yellow, 0.4, "xz");
    orbitGroup.add(orbitLine);
    const sat = new THREE.Group();
    orbitGroup.add(sat);
    box(sat, 0.28, 0.28, 0.28, 0xe2e8f0, [0, 0, 0], { e: 0.3, metal: 0.7 });
    box(sat, 1.4, 0.04, 0.3, C.cyan, [0, 0, 0], { e: 0.45 });
    box(sat, 0.04, 0.3, 0.7, C.cyan, [0, 0, 0], { e: 0.35 });
    const satLight = new THREE.PointLight(C.cyan, 0.8, 4, 2);
    satLight.position.set(0, 0.4, 0);
    sat.add(satLight);

    // Satellite link
    const link = line([[0, 0, 0], [0, 0, 0]], C.cyan, 0.25, true);
    scene.add(link);

    // Atmosphere halo
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(3.16, 48, 32),
      new THREE.MeshBasicMaterial({ color: C.cyan, transparent: true, opacity: 0.055, side: THREE.BackSide })
    );
    scene.add(atmosphere);

    return {
      scene,
      camera: base.camera,
      target: base.target,
      update(t, s) {
        const lat = rad(s.lat);
        const lon = rad(s.lon);
        const surf = new THREE.Vector3(3.04 * Math.cos(lat) * Math.cos(lon), 3.04 * Math.sin(lat), 3.04 * Math.cos(lat) * Math.sin(lon));
        pin.position.copy(surf);
        pinCone.position.set(0, -0.3, 0);
        pinCone.rotation.x = Math.PI;
        pinPulse.position.set(0, 0, 0);
        pinPulse.rotation.x = Math.PI / 2 + lat * 0.2;
        pinPulse.scale.setScalar(1 + 0.2 * Math.sin(t * 2.5));
        pinSphere.material.emissiveIntensity = 0.65 + 0.35 * Math.sin(t * 4);
        updateLine(radiusLine, [[0, 0, 0], surf]);
        const alto = new THREE.Vector3().copy(surf).normalize().multiplyScalar(3.04 + s.altitude / 900);
        updateLine(locationBeam, [surf, alto]);
        const satAngle = t * 0.35;
        const orbitR = 5.3;
        sat.position.set(Math.cos(satAngle) * orbitR, 0, Math.sin(satAngle) * orbitR);
        sat.rotation.y = -satAngle;
        sat.rotation.z = 0.3;
        satLight.intensity = 0.6 + 0.25 * Math.sin(t * 3);
        const satWorld = new THREE.Vector3();
        sat.getWorldPosition(satWorld);
        updateLine(link, [satWorld, surf]);
        link.material.opacity = 0.16 + 0.08 * Math.sin(t * 2);
        // flight dot
        const u = (t * 0.08) % 1;
        const flat = rad(13.7 + (40 - 13.7) * u);
        const flon = rad(100.5 + (-70 - 100.5) * u);
        const fr = 3.06 + Math.sin(u * Math.PI) * 0.5;
        flightDot.position.set(fr * Math.cos(flat) * Math.cos(flon), fr * Math.sin(flat), fr * Math.cos(flat) * Math.sin(flon));
        flightDot.material.emissiveIntensity = 0.6 + 0.3 * Math.sin(t * 4);
        wire.rotation.y = t * 0.025;
        atmosphere.material.opacity = 0.045 + 0.015 * Math.sin(t * 1.2);
        origin.material.emissiveIntensity = 0.3 + 0.2 * Math.sin(t * 2);
        orbitGroup.rotation.y = t * 0.03;
        void pin;
        void locationBeam;
        void radiusLine;
        void flightArc;
      },
    };
  }

  /* ------------------------------------------------------------------------
     6. SRS state engine
     ------------------------------------------------------------------------ */
  function defaultTab() {
    return { status: "New", lastReviewed: null, reviewCount: 0, nextReviewDue: null };
  }

  function defaultState() {
    const tabs = {};
    for (let i = 1; i <= TAB_COUNT; i++) tabs[i] = defaultTab();
    return {
      version: 1,
      createdAt: new Date().toISOString(),
      score: 0,
      totalReviews: 0,
      tabs,
    };
  }

  function safeDate(value) {
    if (!value) return null;
    const t = new Date(value).getTime();
    return Number.isFinite(t) ? new Date(t).toISOString() : null;
  }

  function normalizeState(raw) {
    const base = defaultState();
    if (!raw || typeof raw !== "object") return base;
    base.score = Number.isFinite(Number(raw.score)) ? Math.max(0, Math.floor(Number(raw.score))) : 0;
    base.createdAt = safeDate(raw.createdAt) || new Date().toISOString();
    const rawTabs = raw.tabs && typeof raw.tabs === "object" ? raw.tabs : {};
    let counted = 0;
    for (let i = 1; i <= TAB_COUNT; i++) {
      const src = rawTabs[i] || rawTabs[String(i)] || {};
      const count = Number.isFinite(Number(src.reviewCount)) ? Math.max(0, Math.floor(Number(src.reviewCount))) : 0;
      const lastReviewed = safeDate(src.lastReviewed);
      let nextReviewDue = safeDate(src.nextReviewDue);
      const allowed = ["New", "Practicing", "Mastered"];
      let status = allowed.includes(src.status) ? src.status : "New";
      if (count >= 6) status = "Mastered";
      else if (count > 0 && status === "New") status = "Practicing";
      if (count > 0 && !nextReviewDue) {
        const anchor = lastReviewed ? new Date(lastReviewed).getTime() : Date.now();
        nextReviewDue = new Date(anchor + intervalDays(count) * DAY_MS).toISOString();
      }
      base.tabs[i] = { status, lastReviewed, reviewCount: count, nextReviewDue };
      counted += count;
    }
    base.totalReviews = Number.isFinite(Number(raw.totalReviews)) ? Math.max(0, Math.floor(Number(raw.totalReviews))) : counted;
    if (base.totalReviews < counted) base.totalReviews = counted;
    return base;
  }

  function intervalDays(count) {
    if (count <= 1) return SRS_INTERVALS[1];
    if (count <= 3) return SRS_INTERVALS[2];
    if (count <= 5) return SRS_INTERVALS[3];
    return SRS_INTERVALS[4];
  }

  function levelFor(count) {
    if (count >= 6) return 4;
    if (count >= 4) return 3;
    if (count >= 2) return 2;
    return 1;
  }

  function isDue(tab) {
    if (!tab || !tab.nextReviewDue) return false;
    const t = new Date(tab.nextReviewDue).getTime();
    return Number.isFinite(t) && t <= Date.now();
  }

  function dueCount() {
    let n = 0;
    for (let i = 1; i <= TAB_COUNT; i++) if (isDue(state.tabs[i])) n++;
    return n;
  }

  function masteredCount() {
    let n = 0;
    for (let i = 1; i <= TAB_COUNT; i++) if (state.tabs[i].status === "Mastered") n++;
    return n;
  }

  function badgeFor(tab) {
    if (isDue(tab)) return "🟡";
    if (tab.status === "Mastered") return "🟢";
    if (tab.status === "Practicing") return "🔵";
    return "🔴";
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      return normalizeState(JSON.parse(raw));
    } catch (err) {
      console.warn("TrigLab: could not read saved progress", err);
      return defaultState();
    }
  }

  function saveStateNow() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (err) {
      console.warn("TrigLab: could not save progress", err);
      return false;
    }
  }

  let saveTimer = null;
  function saveStateSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveStateNow, 160);
  }

  let state = loadState();
  const simStates = {};
  const exercises = {};
  const choices = {};
  const attempts = {};
  const storyStep = {};
  let activeTab = 1;
  let dueMode = false;
  let speechUtterance = null;
  let speechModule = null;

  MODULES.forEach((meta) => {
    const s = {};
    meta.controls.forEach((ctrl) => {
      s[ctrl.key] = ctrl.type === "toggle" ? !!ctrl.value : ctrl.type === "select" ? ctrl.value : Number(ctrl.value);
    });
    simStates[meta.id] = s;
  });

  /* ------------------------------------------------------------------------
     7. Small UI helpers
     ------------------------------------------------------------------------ */
  function toast(message, type = "ok", icon) {
    const host = $("#toastHost");
    if (!host) return;
    const icons = { ok: "✓", warn: "!", bad: "×", info: "i" };
    const el = document.createElement("div");
    el.className = `toast toast--${type}`;
    el.innerHTML = `<span class="toast__icon">${icon || icons[type] || "i"}</span><span>${escapeHtml(message)}</span>`;
    host.appendChild(el);
    while (host.children.length > 4) host.removeChild(host.firstElementChild);
    setTimeout(() => {
      el.classList.add("is-out");
      setTimeout(() => el.remove(), 320);
    }, 4200);
  }

  function openModal(html) {
    const backdrop = $("#modalBackdrop");
    $("#modalContent").innerHTML = html;
    backdrop.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if ($("#modalContent").querySelector("[data-welcome]")) markOnboarded();
    $("#modalBackdrop").hidden = true;
    document.body.style.overflow = "";
  }

  function statusChip(id) {
    const tab = state.tabs[id];
    if (isDue(tab)) return `<span class="status-chip status-chip--due">🟡 Due now</span>`;
    if (tab.status === "Mastered") return `<span class="status-chip status-chip--mastered">🟢 Mastered</span>`;
    if (tab.status === "Practicing") return `<span class="status-chip status-chip--practicing">🔵 Practicing</span>`;
    return `<span class="status-chip status-chip--new">🔴 New</span>`;
  }

  function reviewFooterMarkup(id) {
    const tab = state.tabs[id];
    const count = tab.reviewCount;
    const level = levelFor(count);
    const dots = Array.from({ length: 8 }, (_, i) => `<span class="review-dot${i < Math.min(count, 8) ? " is-on" : ""}"></span>`).join("");
    const dueText = tab.nextReviewDue ? `Next ${isDue(tab) ? "now" : relTime(tab.nextReviewDue)}` : "No review scheduled";
    return `
      <div class="review-meter" title="${escapeHtml(dueText)}">
        <div class="review-meter__dots" aria-hidden="true">${dots}</div>
        <span class="review-label">${count} review${count === 1 ? "" : "s"} · ${SRS_LEVEL_NAMES[level]}</span>
      </div>
      ${statusChip(id)}`;
  }

  function updateExerciseFooter(id) {
    const el = $(`[data-review-footer="${id}"]`);
    if (el) el.innerHTML = reviewFooterMarkup(id);
  }

  function updateAllFooters() {
    MODULES.forEach((m) => updateExerciseFooter(m.id));
  }

  function updateHud(id) {
    const meta = MODULES[id - 1];
    const el = $(`[data-hud="${id}"]`);
    if (!el || !meta) return;
    const rows = meta.hud(simStates[id]) || [];
    el.innerHTML = rows
      .slice(0, 4)
      .map(
        ([label, value], i) =>
          `<div class="hud-chip${i === 0 ? " hud-chip--accent" : ""}"><span class="hud-chip__label">${escapeHtml(label)}</span><span class="hud-chip__value">${escapeHtml(value)}</span></div>`
      )
      .join("");
  }

  function updateReadout(id) {
    const meta = MODULES[id - 1];
    const el = $(`[data-readout="${id}"]`);
    if (!el || !meta) return;
    el.textContent = meta.readout(simStates[id]);
  }

  function updateControlDisplay(input) {
    const field = input.closest(".control-field");
    if (!field) return;
    const output = field.querySelector("output");
    if (output && input.type === "range") {
      const step = Number(input.step) || 1;
      const decimals = step < 0.1 ? 2 : step < 1 ? 1 : 0;
      const unit = input.dataset.unit || "";
      output.textContent = `${Number(input.value).toFixed(decimals)}${unit}`;
    }
    if (input.type === "range") {
      const min = Number(input.min);
      const max = Number(input.max);
      const pct = ((Number(input.value) - min) / (max - min)) * 100;
      input.style.setProperty("--val", `${clamp(pct, 0, 100)}%`);
    }
  }

  function refreshGlobalUI() {
    const mastered = masteredCount();
    const due = dueCount();
    const total = state.totalReviews;

    $("#statMastered").textContent = `${mastered}/${TAB_COUNT}`;
    $("#statDue").textContent = String(due);
    $("#statReviews").textContent = String(total);
    $("#statScore").textContent = String(state.score);
    $("#dueFilterCount").textContent = String(due);
    $("#progressPercent").textContent = `${Math.round((mastered / TAB_COUNT) * 100)}%`;
    $("#progressCount").textContent = `${mastered} of ${TAB_COUNT} mastered`;
    $("#progressFill").style.width = `${(mastered / TAB_COUNT) * 100}%`;
    $("#progressBar").setAttribute("aria-valuenow", String(mastered));

    if (due > 0) {
      $("#dueHint").textContent = `${due} chapter${due === 1 ? "" : "s"} ready for retrieval practice — clear the amber badges.`;
    } else if (mastered === TAB_COUNT) {
      $("#dueHint").textContent = "All 20 chapters mastered. Keep the 30-day reviews rolling.";
    } else {
      const future = MODULES.map((m) => state.tabs[m.id].nextReviewDue)
        .filter(Boolean)
        .map((d) => new Date(d).getTime())
        .filter((t) => t > Date.now())
        .sort((a, b) => a - b)[0];
      $("#dueHint").textContent = future
        ? `Next review scheduled ${relTime(new Date(future).toISOString())}. Complete more exercises to climb the SRS ladder.`
        : "Complete an exercise to schedule your first review.";
    }

    $$(".tab-btn").forEach((btn) => {
      const id = Number(btn.dataset.tab);
      const tab = state.tabs[id];
      const badge = btn.querySelector(".tab-btn__badge");
      if (badge) badge.textContent = badgeFor(tab);
      btn.classList.toggle("is-due", isDue(tab));
      const dueText = tab.nextReviewDue ? (isDue(tab) ? "review due now" : `next review ${relTime(tab.nextReviewDue)}`) : "not reviewed yet";
      btn.title = `${String(id).padStart(2, "0")} · ${MODULES[id - 1].title} — ${tab.status}, ${dueText}`;
    });

    const banner = $("#dueBanner");
    banner.hidden = due === 0;
    if (due > 0) {
      $("#dueBannerCount").textContent = String(due);
      $("#dueBannerPlural").textContent = due === 1 ? "" : "s";
    }
    const dueBtn = $("#dueFilter");
    dueBtn.setAttribute("aria-pressed", dueMode ? "true" : "false");
    updateAllFooters();
  }

  /* ------------------------------------------------------------------------
     8. Module UI construction
     ------------------------------------------------------------------------ */
  const LEGEND_COLOR_MAP = {
    "cosine": "#22d3ee",
    "sine": "#f472b6",
    "rotation arc": "#facc15",
    "velocity vector": "#facc15",
    "tangent height": "#facc15",
    "refracted beam": "#22d3ee",
    "slope vector": "#facc15",
    "cosine X": "#22d3ee",
    "sine Y": "#f472b6",
    "tangent": "#facc15",
    "target": "#facc15",
    "rafters": "#facc15",
    "sine EMF": "#f472b6",
    "coil": "#f472b6",
    "cosine shadow": "#22d3ee",
    "sine bob": "#f472b6",
    "trace": "#22d3ee",
    "tangent beam": "#facc15",
    "sine carrier": "#f472b6",
    "wavefronts": "#22d3ee",
    "anti-noise": "#22d3ee",
    "noise": "#f472b6",
    "resultant": "#4ade80",
    "cosine baseline": "#22d3ee",
    "sine sightline": "#facc15",
    "survey triangle": "#facc15",
    "possible courses": "#4ade80",
    "cosine leg": "#22d3ee",
    "sine leg": "#facc15",
    "ground track": "#f472b6",
    "cosine normal": "#22d3ee",
    "sine normal": "#f472b6",
    "light vector": "#facc15",
    "trajectory": "#facc15",
    "cross product": "#facc15",
    "radius vector": "#facc15",
  };

  function legendColor(label) {
    if (LEGEND_COLOR_MAP[label]) return LEGEND_COLOR_MAP[label];
    const l = label.toLowerCase();
    if (l.includes("cos")) return "#22d3ee";
    if (l.includes("sin")) return "#f472b6";
    if (l.includes("vector") || l.includes("tangent") || l.includes("trajectory") || l.includes("beam") || l.includes("cross") || l.includes("path") || l.includes("radius") || l.includes("light")) return "#facc15";
    if (l.includes("target") || l.includes("possible") || l.includes("trace")) return "#4ade80";
    return "#a78bfa";
  }

  function markOnboarded() {
    try {
      localStorage.setItem(ONBOARD_KEY, "1");
    } catch (err) {
      /* non-fatal */
    }
  }

  function stopStorySpeech() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    speechUtterance = null;
    speechModule = null;
    document.querySelectorAll('[data-story="listen"]').forEach((btn) => {
      btn.textContent = "🔊 Listen";
      btn.classList.remove("is-speaking");
    });
  }

  function speakStory(id) {
    if (!("speechSynthesis" in window)) {
      toast("This browser cannot read the story aloud. Use the step buttons and text instead.", "info", "🔊");
      return;
    }
    if (speechModule === id && window.speechSynthesis.speaking) {
      stopStorySpeech();
      return;
    }
    const narr = NARRATIVES[id];
    if (!narr) return;
    stopStorySpeech();
    const step = narr.story[storyStep[id] || 0];
    const utter = new SpeechSynthesisUtterance(`${step.title}. ${step.text} Look for ${step.focus}`);
    utter.rate = 0.93;
    utter.pitch = 1;
    utter.lang = "en-US";
    utter.onend = () => {
      speechModule = null;
      speechUtterance = null;
      const panel = $(`[data-narrator="${id}"]`);
      const btn = panel && panel.querySelector('[data-story="listen"]');
      if (btn) {
        btn.textContent = "🔊 Listen";
        btn.classList.remove("is-speaking");
      }
    };
    utter.onerror = () => stopStorySpeech();
    speechUtterance = utter;
    speechModule = id;
    const panel = $(`[data-narrator="${id}"]`);
    const btn = panel && panel.querySelector('[data-story="listen"]');
    if (btn) {
      btn.textContent = "⏹ Stop";
      btn.classList.add("is-speaking");
    }
    window.speechSynthesis.speak(utter);
    void speechUtterance;
  }

  function setStoryStep(id, index, animate = true) {
    const narr = NARRATIVES[id];
    const panel = $(`[data-narrator="${id}"]`);
    if (!narr || !panel) return;
    if (speechModule === id) stopStorySpeech();
    const total = narr.story.length;
    const idx = clamp(Number(index) || 0, 0, total - 1);
    storyStep[id] = idx;
    const step = narr.story[idx];
    const el = panel.querySelector("[data-story-title]");
    if (el) el.textContent = step.title;
    const text = panel.querySelector("[data-story-text]");
    if (text) text.textContent = step.text;
    const focus = panel.querySelector("[data-story-focus]");
    if (focus) focus.textContent = step.focus;
    const count = panel.querySelector("[data-story-count]");
    if (count) count.textContent = `${idx + 1} / ${total}`;
    panel.querySelectorAll("[data-story-step]").forEach((dot) => {
      const on = Number(dot.dataset.storyStep) === idx;
      dot.classList.toggle("is-active", on);
      dot.setAttribute("aria-current", on ? "step" : "false");
    });
    const prev = panel.querySelector('[data-story="prev"]');
    if (prev) prev.disabled = idx === 0;
    const next = panel.querySelector('[data-story="next"]');
    if (next) next.textContent = idx === total - 1 ? "Replay ↺" : "Next →";
    if (animate) {
      panel.classList.remove("is-swapping");
      void panel.offsetWidth;
      panel.classList.add("is-swapping");
    }
  }

  function openVisualKey(meta) {
    const narr = NARRATIVES[meta.id];
    const rows = meta.legend
      .map((label) => {
        const guide = (narr && narr.keys[label]) || {};
        const color = legendColor(label);
        const meaning = guide.meaning || `A visual shorthand for ${label} in this simulator.`;
        return `
          <button class="key-row" type="button" data-legend-jump="${escapeHtml(label)}" data-legend-id="${meta.id}">
            <span class="legend-swatch" style="background:${color};box-shadow:0 0 10px ${color}"></span>
            <span><span class="key-row__label">${escapeHtml(label)}</span><span class="key-row__meaning">${escapeHtml(meaning)}</span></span>
            <span class="key-row__arrow">›</span>
          </button>`;
      })
      .join("");
    openModal(`
      <p class="modal-kicker">Colour key · Chapter ${String(meta.id).padStart(2, "0")}</p>
      <h2>How to read this scene</h2>
      <p>Colours are labels, not decoration. Tap any key to get the plain-English meaning and what it is doing in this specific simulator.</p>
      <div class="key-list">${rows}</div>
      <p class="modal-note">The full palette: <strong style="color:#22d3ee">cyan for cosine / horizontal</strong>, <strong style="color:#f472b6">magenta for sine / vertical</strong>, and <strong style="color:#facc15">yellow for tangent, vectors and measurements</strong>.</p>
      <div class="modal-actions">
        <button class="btn btn-primary" type="button" data-modal="close">Back to the lab</button>
        <button class="btn" type="button" data-story-jump="${meta.id}">Read the story again</button>
      </div>
    `);
  }

  function openLegend(meta, label) {
    const narr = NARRATIVES[meta.id];
    const guide = (narr && narr.keys[label]) || {
      meaning: `A visual shorthand for ${label} in this chapter.`,
      here: meta.note,
    };
    const color = legendColor(label);
    openModal(`
      <p class="modal-kicker">Colour key · Chapter ${String(meta.id).padStart(2, "0")}</p>
      <div class="legend-title">
        <span class="legend-swatch legend-swatch--lg" style="background:${color};box-shadow:0 0 16px ${color}"></span>
        <h2>${escapeHtml(label)}</h2>
      </div>
      <h3>What it means</h3>
      <p>${escapeHtml(guide.meaning)}</p>
      <h3>In this simulator</h3>
      <p>${escapeHtml(guide.here || meta.note)}</p>
      <h3>How to use it</h3>
      <p>Watch that colour while you move the simulator controls. The HUD chips and the worked exercise use the same idea in numbers.</p>
      <div class="modal-actions">
        <button class="btn btn-primary" type="button" data-modal="close">Got it</button>
        <button class="btn" type="button" data-key-all="${meta.id}">See all colour keys</button>
        <button class="btn" type="button" data-story-jump="${meta.id}">Back to story</button>
      </div>
    `);
  }

  function openFormula(meta) {
    const narr = NARRATIVES[meta.id];
    const math = narr ? narr.math : meta.note;
    const parts = narr && narr.mathParts ? narr.mathParts : [];
    const rows = parts
      .map(([symbol, meaning]) => `<tr><td><code>${escapeHtml(symbol)}</code></td><td>${escapeHtml(meaning)}</td></tr>`)
      .join("");
    openModal(`
      <p class="modal-kicker">Formula decoder · Chapter ${String(meta.id).padStart(2, "0")}</p>
      <h2>${escapeHtml(meta.title)}</h2>
      <div class="formula-banner">${escapeHtml(meta.formula)}</div>
      <p>${escapeHtml(math)}</p>
      ${rows ? `<h3>What each symbol means</h3><table class="formula-table"><thead><tr><th>Symbol</th><th>Plain English</th></tr></thead><tbody>${rows}</tbody></table>` : ""}
      <h3>Then look for</h3>
      <p>${escapeHtml((narr && narr.story[2] && narr.story[2].focus) || meta.note)}</p>
      <div class="modal-actions">
        <button class="btn btn-primary" type="button" data-modal="close">Got it</button>
        <button class="btn" type="button" data-story-jump="${meta.id}">Show me in the 3D scene</button>
      </div>
    `);
  }

  function showWelcome() {
    openModal(`
      <div data-welcome="1">
        <p class="modal-kicker">New learner briefing</p>
        <h2>Welcome to TrigLab 3D</h2>
        <p>You are the new engineer in a virtual STEM lab. Each chapter gives you a story, a live machine, and a short drill. You do not need to know trigonometry yet — the narrator explains every symbol before you use it.</p>
        <div class="welcome-grid">
          <div class="welcome-step"><span>1</span><h3>Read the story</h3><p>Three short steps explain the real-world job, what the colours mean, and what the maths is doing.</p></div>
          <div class="welcome-step"><span>2</span><h3>Play with the model</h3><p>Move the sliders. Watch the HUD, the formula, and the 3D scene respond together.</p></div>
          <div class="welcome-step"><span>3</span><h3>Prove it</h3><p>Solve the generated drill. A correct answer schedules your next spaced review.</p></div>
        </div>
        <h3>The colour language</h3>
        <div class="colour-legend">
          <span><i style="background:#22d3ee"></i><strong>Cyan</strong> — cosine / horizontal share</span>
          <span><i style="background:#f472b6"></i><strong>Magenta</strong> — sine / vertical share</span>
          <span><i style="background:#facc15"></i><strong>Yellow</strong> — tangent, vectors, measurements</span>
        </div>
        <p class="modal-note">Tap any coloured key in the 3D viewport, or tap the formula pill, for a plain-English pop-up. Use the <strong>Colour key</strong> and <strong>?</strong> buttons any time you feel lost.</p>
        <div class="modal-actions">
          <button class="btn btn-primary" type="button" data-modal="welcome-start">Start with Chapter 01</button>
          <button class="btn" type="button" data-modal="guide">Open the full guide</button>
        </div>
      </div>
    `);
  }

  function controlMarkup(meta, ctrl) {
    const id = `ctrl-${meta.id}-${ctrl.key}`;
    if (ctrl.type === "toggle") {
      return `
        <div class="control-field control-field--wide">
          <div class="toggle-row">
            <span>${escapeHtml(ctrl.label)}</span>
            <label class="switch">
              <input type="checkbox" id="${id}" data-key="${ctrl.key}" data-type="toggle" ${simStates[meta.id][ctrl.key] ? "checked" : ""} aria-label="${escapeHtml(ctrl.label)}">
              <span class="switch__track"></span>
            </label>
          </div>
        </div>`;
    }
    if (ctrl.type === "select") {
      const opts = ctrl.options
        .map((o) => `<option value="${escapeHtml(o.value)}" ${simStates[meta.id][ctrl.key] === o.value ? "selected" : ""}>${escapeHtml(o.label)}</option>`)
        .join("");
      return `
        <div class="control-field ${ctrl.wide ? "control-field--wide" : ""}">
          <label class="control-label" for="${id}"><span>${escapeHtml(ctrl.label)}</span></label>
          <select id="${id}" data-key="${ctrl.key}" data-type="select">${opts}</select>
        </div>`;
    }
    const step = Number(ctrl.step);
    const decimals = step < 0.1 ? 2 : step < 1 ? 1 : 0;
    const pct = ((Number(ctrl.value) - Number(ctrl.min)) / (Number(ctrl.max) - Number(ctrl.min))) * 100;
    return `
      <div class="control-field ${ctrl.wide ? "control-field--wide" : ""}">
        <label class="control-label" for="${id}">
          <span>${escapeHtml(ctrl.label)}</span>
          <output for="${id}">${Number(ctrl.value).toFixed(decimals)}${ctrl.unit || ""}</output>
        </label>
        <input type="range" id="${id}" data-key="${ctrl.key}" data-type="range" min="${ctrl.min}" max="${ctrl.max}" step="${ctrl.step}" value="${ctrl.value}" data-unit="${escapeHtml(ctrl.unit || "")}" style="--val:${pct}%" aria-label="${escapeHtml(ctrl.label)}">
      </div>`;
  }

  function buildTabsAndPanels() {
    const tabScroll = $("#tabScroll");
    const host = $("#moduleHost");
    tabScroll.innerHTML = "";
    host.innerHTML = "";

    MODULES.forEach((meta) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tab-btn";
      btn.id = `tab-${meta.id}`;
      btn.dataset.tab = String(meta.id);
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-controls", `panel-${meta.id}`);
      btn.setAttribute("aria-selected", "false");
      btn.tabIndex = -1;
      btn.style.setProperty("--tab-accent", meta.accent);
      btn.innerHTML = `
        <span class="tab-btn__top">
          <span class="tab-btn__num">CH ${String(meta.id).padStart(2, "0")}</span>
          <span class="tab-btn__badge">${badgeFor(state.tabs[meta.id])}</span>
        </span>
        <span class="tab-btn__title">${escapeHtml(meta.title)}</span>`;
      tabScroll.appendChild(btn);

      const panel = document.createElement("section");
      panel.className = "module-panel";
      panel.id = `panel-${meta.id}`;
      panel.dataset.tab = String(meta.id);
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", `tab-${meta.id}`);
      panel.style.setProperty("--accent", meta.accent);
      panel.hidden = true;

      const narr = NARRATIVES[meta.id];
      const firstStep = narr.story[0];
      const legend = meta.legend
        .map(
          (l) =>
            `<button class="legend__item" type="button" data-legend="${escapeHtml(l)}" title="Explain ${escapeHtml(l)}"><i style="background:${legendColor(l)};box-shadow:0 0 6px ${legendColor(l)}"></i><span>${escapeHtml(l)}</span></button>`
        )
        .join("");
      const dots = narr.story
        .map(
          (_, i) =>
            `<button class="narrator__dot${i === 0 ? " is-active" : ""}" type="button" data-story-step="${i}" aria-label="Story step ${i + 1}" aria-current="${i === 0 ? "step" : "false"}"></button>`
        )
        .join("");

      panel.innerHTML = `
        <div class="module-hero">
          <div class="module-hero__main">
            <div class="module-index">${String(meta.id).padStart(2, "0")}</div>
            <div class="module-heading">
              <div class="module-kicker">
                <span>${meta.icon} Chapter ${String(meta.id).padStart(2, "0")}</span>
                <span class="sim-sep">/</span>
                <span class="sim-name">${escapeHtml(meta.sim)}</span>
              </div>
              <h1 class="module-title">${escapeHtml(meta.title)}</h1>
              <p class="module-sub">${escapeHtml(meta.blurb)}</p>
            </div>
          </div>
          <button class="module-hero__formula" type="button" data-formula="${meta.id}" aria-label="Decode the formula: ${escapeHtml(meta.formula)}">
            <span>${escapeHtml(meta.formula)}</span>
            <span class="formula-explain">explain</span>
          </button>
        </div>
        <section class="narrator" data-narrator="${meta.id}" aria-label="Guided story" aria-live="polite">
          <div class="narrator__icon" aria-hidden="true">${meta.icon}</div>
          <div class="narrator__body">
            <div class="narrator__top">
              <span class="narrator__kicker">Guided story</span>
              <span class="narrator__count" data-story-count>1 / ${narr.story.length}</span>
              <div class="narrator__dots">${dots}</div>
              <div class="narrator__links">
                <button type="button" class="narrator__guide" data-story="keys">Colour key</button>
                <button type="button" class="narrator__guide" data-story="guide">Lab guide</button>
              </div>
            </div>
            <h2 class="narrator__title" data-story-title>${escapeHtml(firstStep.title)}</h2>
            <p class="narrator__text" data-story-text>${escapeHtml(firstStep.text)}</p>
            <p class="narrator__focus"><span>Look for</span><span data-story-focus>${escapeHtml(firstStep.focus)}</span></p>
          </div>
          <div class="narrator__actions">
            <button class="btn btn-subtle narrator__btn" type="button" data-story="prev" disabled>← Back</button>
            <button class="btn narrator__btn narrator__btn--next" type="button" data-story="next">Next →</button>
            <button class="btn btn-subtle narrator__btn" type="button" data-story="listen">🔊 Listen</button>
          </div>
        </section>
        <div class="module-grid">
          <div class="viewport-card">
            <div class="viewport-slot" data-slot="${meta.id}"></div>
            <div class="viewport-top">
              <span class="viewport-tag"><span class="live-dot" aria-hidden="true"></span>Live 3D · ${escapeHtml(meta.sim)}</span>
              <div class="legend">${legend}</div>
            </div>
            <div class="viewport-bottom">
              <div class="hud-strip" data-hud="${meta.id}"></div>
              <span class="orbit-hint">drag orbit · scroll zoom · touch pinch</span>
            </div>
          </div>
          <div class="side-column">
            <section class="glass-card sim-card" aria-label="Simulator controls">
              <div class="card-head">
                <h2 class="card-head__title"><span class="icon">${meta.icon}</span>Real-world simulator</h2>
                <span class="card-head__meta">${escapeHtml(meta.sim)}</span>
              </div>
              <div class="sim-body">
                <p class="sim-note">${escapeHtml(meta.note)}</p>
                <div class="control-grid" data-controls="${meta.id}">
                  ${meta.controls.map((c) => controlMarkup(meta, c)).join("")}
                </div>
                <div class="sim-readout-row">
                  <span>Live model</span>
                  <strong data-readout="${meta.id}">—</strong>
                </div>
              </div>
            </section>
            <section class="glass-card exercise-card" aria-label="Generative exercise">
              <div class="card-head">
                <h2 class="card-head__title"><span class="icon">🎯</span>Generative drill</h2>
                <span class="card-head__meta">+10 pts · SRS logged</span>
              </div>
              <div class="exercise-body" data-exercise="${meta.id}"></div>
            </section>
          </div>
        </div>`;
      host.appendChild(panel);
    });

    // Guided story, colour-key, and formula interactions (delegated once).
    host.addEventListener("click", (e) => {
      const legendBtn = e.target.closest("[data-legend]");
      if (legendBtn) {
        const panel = legendBtn.closest(".module-panel");
        const id = Number(panel.dataset.tab);
        openLegend(MODULES[id - 1], legendBtn.dataset.legend);
        return;
      }
      const formulaBtn = e.target.closest("[data-formula]");
      if (formulaBtn) {
        openFormula(MODULES[Number(formulaBtn.dataset.formula) - 1]);
        return;
      }
      const stepBtn = e.target.closest("[data-story-step]");
      if (stepBtn) {
        const panel = stepBtn.closest("[data-narrator]");
        setStoryStep(Number(panel.dataset.narrator), Number(stepBtn.dataset.storyStep));
        return;
      }
      const actionEl = e.target.closest("[data-story]");
      if (!actionEl) return;
      const narrator = actionEl.closest("[data-narrator]");
      const id = Number(narrator.dataset.narrator);
      const action = actionEl.dataset.story;
      if (action === "prev") setStoryStep(id, (storyStep[id] || 0) - 1);
      else if (action === "next") {
        const total = NARRATIVES[id].story.length;
        setStoryStep(id, (storyStep[id] || 0) + 1 >= total ? 0 : (storyStep[id] || 0) + 1);
      } else if (action === "listen") speakStory(id);
      else if (action === "keys") openVisualKey(MODULES[id - 1]);
      else if (action === "guide") openHelp();
    });

    // Tab interactions
    $$(".tab-btn", tabScroll).forEach((btn) => {
      btn.addEventListener("click", () => activateTab(Number(btn.dataset.tab)));
      btn.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          const dir = e.key === "ArrowRight" ? 1 : -1;
          const next = ((Number(btn.dataset.tab) - 1 + dir + TAB_COUNT) % TAB_COUNT) + 1;
          activateTab(next);
          $(`#tab-${next}`).focus();
        }
      });
    });

    // Controls
    $$(".control-grid").forEach((grid) => {
      const id = Number(grid.dataset.controls);
      grid.addEventListener("input", (e) => {
        const input = e.target;
        if (!input.dataset.key) return;
        const key = input.dataset.key;
        const type = input.dataset.type;
        if (type === "range") simStates[id][key] = Number(input.value);
        else if (type === "select") simStates[id][key] = input.value;
        else if (type === "toggle") simStates[id][key] = input.checked;
        updateControlDisplay(input);
        updateHud(id);
        updateReadout(id);
      });
      grid.addEventListener("change", (e) => {
        const input = e.target;
        if (input.tagName !== "SELECT") return;
        const key = input.dataset.key;
        simStates[id][key] = input.value;
        updateHud(id);
        updateReadout(id);
      });
    });

    // Exercise delegation (listeners persist across innerHTML re-renders)
    $$(".exercise-body").forEach((body) => {
      const id = Number(body.dataset.exercise);
      body.addEventListener("click", (e) => {
        const choice = e.target.closest("[data-choice]");
        if (choice && !choice.disabled) {
          choices[id] = Number(choice.dataset.choice);
          body.querySelectorAll("[data-choice]").forEach((b) => b.classList.toggle("is-selected", b === choice));
          return;
        }
        const action = e.target.closest("[data-action]");
        if (!action) return;
        const a = action.dataset.action;
        if (a === "check") checkAnswer(id);
        else if (a === "next") renderExercise(id);
        else if (a === "hint") showHint(id);
        else if (a === "steps") showSolution(id);
      });
      body.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && e.target.matches("input")) {
          e.preventDefault();
          const ex = exercises[id];
          if (ex && ex.completed) renderExercise(id);
          else checkAnswer(id);
        }
      });
    });

    MODULES.forEach((meta) => {
      setStoryStep(meta.id, 0, false);
      updateHud(meta.id);
      updateReadout(meta.id);
      renderExercise(meta.id);
    });
  }

  /* ------------------------------------------------------------------------
     9. Exercise rendering, grading and review logging
     ------------------------------------------------------------------------ */
  function renderExercise(id) {
    const meta = MODULES[id - 1];
    const ex = meta.exercise();
    if (!ex || (!Number.isFinite(ex.answer) && ex.mode !== "choice")) {
      console.warn(`TrigLab: exercise ${id} failed to generate`, ex);
      return;
    }
    ex.completed = false;
    exercises[id] = ex;
    choices[id] = null;
    attempts[id] = 0;
    const body = $(`[data-exercise="${id}"]`);
    if (!body) return;

    const level = levelFor(state.tabs[id].reviewCount);
    const given = (ex.givens || []).map(([k, v]) => `<span class="given-chip">${escapeHtml(k)} = <b>${escapeHtml(v)}</b></span>`).join("");
    const answerUi =
      ex.mode === "choice"
        ? `<div class="choice-grid">${ex.choices
            .map((c, i) => `<button type="button" class="choice-btn" data-choice="${i}">${escapeHtml(c)}</button>`)
            .join("")}</div>`
        : `<div class="answer-zone">
            <input class="text-input" id="answer-${id}" type="number" step="any" inputmode="decimal" autocomplete="off" placeholder="Enter a numeric answer" aria-label="Your answer">
            <span class="answer-unit">${escapeHtml(ex.unit || "value")}</span>
          </div>`;

    body.innerHTML = `
      <div class="exercise-tags">
        <span class="pill pill--accent">✦ Generative</span>
        <span class="pill">SRS logged</span>
        <span class="pill pill--level" data-level-tag>Level ${level} · ${SRS_LEVEL_NAMES[level]}</span>
      </div>
      <p class="exercise-prompt">${ex.prompt}</p>
      <p class="exercise-context">${ex.context}</p>
      <div class="exercise-given">${given}</div>
      ${answerUi}
      <div class="exercise-actions">
        <button class="btn btn-primary" type="button" data-action="check">Check Answer</button>
        <button class="btn btn-subtle" type="button" data-action="hint">Hint</button>
        <button class="btn btn-subtle" type="button" data-action="steps">Show Steps</button>
      </div>
      <div class="feedback" data-feedback hidden></div>
      <div class="solution" data-solution hidden>
        <div class="solution__head">◈ Worked solution</div>
        <ol>${ex.solution.map((s) => `<li>${s}</li>`).join("")}</ol>
      </div>
      <div class="exercise-footer" data-review-footer="${id}">${reviewFooterMarkup(id)}</div>`;

    // Initial focus only when the panel is visible
    if (!document.getElementById(`panel-${id}`).hidden) {
      setTimeout(() => {
        const input = body.querySelector(`#answer-${id}`);
        if (input) input.focus({ preventScroll: true });
      }, 60);
    }
  }

  function readNumericInput(id) {
    const input = $(`#answer-${id}`);
    if (!input) return null;
    const raw = input.value.trim().replace(/,/g, "");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  function checkAnswer(id) {
    const ex = exercises[id];
    if (!ex || ex.completed) return;
    const body = $(`[data-exercise="${id}"]`);
    const feedback = body.querySelector("[data-feedback]");
    const solution = body.querySelector("[data-solution]");
    let correct = false;
    let userValue = null;

    if (ex.mode === "choice") {
      if (choices[id] == null) {
        feedback.hidden = false;
        feedback.className = "feedback feedback--warn";
        feedback.textContent = "Choose one of the options first.";
        return;
      }
      userValue = choices[id];
      correct = userValue === ex.answerIndex;
      body.querySelectorAll("[data-choice]").forEach((b, i) => {
        if (i === ex.answerIndex) b.classList.add("is-correct");
        else if (i === userValue) b.classList.add("is-wrong");
        b.disabled = true;
      });
    } else {
      userValue = readNumericInput(id);
      if (userValue == null) {
        feedback.hidden = false;
        feedback.className = "feedback feedback--warn";
        feedback.textContent = "Enter a numeric answer first — units are already provided.";
        const input = $(`#answer-${id}`);
        if (input) input.focus();
        return;
      }
      const tol = Math.max(ex.tol || 0.005, Math.abs(ex.answer) * 1e-6);
      correct = Math.abs(userValue - ex.answer) <= tol;
    }

    if (correct) {
      ex.completed = true;
      const tab = state.tabs[id];
      const wasDue = isDue(tab);
      const newCount = tab.reviewCount + 1;
      const days = intervalDays(newCount);
      const now = new Date();
      tab.reviewCount = newCount;
      tab.lastReviewed = now.toISOString();
      tab.nextReviewDue = new Date(now.getTime() + days * DAY_MS).toISOString();
      tab.status = newCount >= 6 ? "Mastered" : "Practicing";
      state.totalReviews += 1;
      state.score += 10;
      saveStateNow();
      refreshGlobalUI();

      feedback.hidden = false;
      feedback.className = "feedback feedback--ok";
      feedback.innerHTML = `<strong>Correct.</strong> +10 points. Review #${newCount} logged — next review in <strong>${days} day${days === 1 ? "" : "s"}</strong>${wasDue ? " (cleared a due badge!)" : ""}.`;
      solution.hidden = false;
      const input = $(`#answer-${id}`);
      if (input) {
        input.disabled = true;
        input.classList.add("is-correct");
      }
      const checkBtn = body.querySelector('[data-action="check"]');
      if (checkBtn) {
        checkBtn.dataset.action = "next";
        checkBtn.textContent = "Next Problem →";
      }
      const levelTag = body.querySelector("[data-level-tag]");
      if (levelTag) levelTag.textContent = `Level ${levelFor(newCount)} · ${SRS_LEVEL_NAMES[levelFor(newCount)]}`;
      body.querySelectorAll('[data-action="hint"], [data-action="steps"]').forEach((b) => (b.disabled = true));
      toast(`Chapter ${String(id).padStart(2, "0")} review logged · +10 pts`, "ok", "✓");
      updateExerciseFooter(id);
    } else {
      attempts[id] = (attempts[id] || 0) + 1;
      feedback.hidden = false;
      feedback.className = "feedback feedback--bad";
      const close = ex.mode === "choice" ? "" : ` Your answer: ${userValue}.`;
      feedback.innerHTML = `<strong>Not quite.</strong>${close} ${escapeHtml(ex.hint || "Re-read the given values and try again.")}`;
      if (attempts[id] >= 2) {
        solution.hidden = false;
        feedback.innerHTML += " The worked solution is open below — follow it, then enter the final answer.";
      }
    }
  }

  function showHint(id) {
    const ex = exercises[id];
    if (!ex) return;
    const body = $(`[data-exercise="${id}"]`);
    const feedback = body.querySelector("[data-feedback]");
    feedback.hidden = false;
    feedback.className = "feedback feedback--warn";
    feedback.innerHTML = `<strong>Hint.</strong> ${escapeHtml(ex.hint || "Break the problem into the given sides and the unknown.")}`;
  }

  function showSolution(id) {
    const ex = exercises[id];
    if (!ex) return;
    const body = $(`[data-exercise="${id}"]`);
    const solution = body.querySelector("[data-solution]");
    solution.hidden = !solution.hidden;
    if (!solution.hidden) {
      const feedback = body.querySelector("[data-feedback]");
      if (!ex.completed) {
        feedback.hidden = false;
        feedback.className = "feedback feedback--warn";
        feedback.innerHTML = "Worked solution revealed. Enter the final answer to log this review — reading alone does not count.";
      }
    }
  }

  /* ------------------------------------------------------------------------
     10. Shared Three.js viewer (one WebGL context, 20 lazy scenes)
     ------------------------------------------------------------------------ */
  class FallbackOrbit {
    constructor(camera, dom) {
      this.object = camera;
      this.domElement = dom;
      this.target = new THREE.Vector3();
      this.enabled = true;
      this.minDistance = 3;
      this.maxDistance = 45;
      this._sph = new THREE.Spherical();
      this._dragging = false;
      this._px = 0;
      this._py = 0;
      this._onDown = (e) => {
        this._dragging = true;
        this._px = e.clientX;
        this._py = e.clientY;
        dom.setPointerCapture && dom.setPointerCapture(e.pointerId);
      };
      this._onMove = (e) => {
        if (!this._dragging) return;
        const dx = e.clientX - this._px;
        const dy = e.clientY - this._py;
        this._px = e.clientX;
        this._py = e.clientY;
        const off = new THREE.Vector3().subVectors(this.object.position, this.target);
        this._sph.setFromVector3(off);
        this._sph.theta -= dx * 0.008;
        this._sph.phi = clamp(this._sph.phi - dy * 0.008, 0.1, Math.PI - 0.1);
        off.setFromSpherical(this._sph);
        this.object.position.copy(this.target).add(off);
        this.object.lookAt(this.target);
      };
      this._onUp = () => (this._dragging = false);
      this._onWheel = (e) => {
        e.preventDefault();
        const off = new THREE.Vector3().subVectors(this.object.position, this.target);
        const scale = 1 + Math.sign(e.deltaY) * 0.08;
        off.multiplyScalar(scale);
        const d = off.length();
        if (d > this.minDistance && d < this.maxDistance) {
          this.object.position.copy(this.target).add(off);
          this.object.lookAt(this.target);
        }
      };
      dom.addEventListener("pointerdown", this._onDown);
      window.addEventListener("pointermove", this._onMove);
      window.addEventListener("pointerup", this._onUp);
      dom.addEventListener("wheel", this._onWheel, { passive: false });
    }
    update() {}
    dispose() {
      this.domElement.removeEventListener("pointerdown", this._onDown);
      window.removeEventListener("pointermove", this._onMove);
      window.removeEventListener("pointerup", this._onUp);
      this.domElement.removeEventListener("wheel", this._onWheel);
    }
  }

  const Viewer = {
    renderer: null,
    controls: null,
    records: new Map(),
    activeId: null,
    failed: false,
    _loopBound: null,
    init() {
      if (!window.THREE) {
        this.failed = true;
        return false;
      }
      try {
        const canvas = document.createElement("canvas");
        canvas.setAttribute("aria-label", "Interactive 3D viewport. Drag to orbit and scroll to zoom.");
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setClearColor(0x050b16, 0);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.08;
        this._loopBound = (ms) => this.loop(ms);
        requestAnimationFrame(this._loopBound);
        window.addEventListener("resize", () => this.resize());
        return true;
      } catch (err) {
        console.error("TrigLab: WebGL initialisation failed", err);
        this.failed = true;
        return false;
      }
    },
    makeControls(camera, dom) {
      if (window.THREE && THREE.OrbitControls) {
        const ctrl = new THREE.OrbitControls(camera, dom);
        ctrl.enableDamping = true;
        ctrl.dampingFactor = 0.07;
        ctrl.rotateSpeed = 0.75;
        ctrl.zoomSpeed = 0.8;
        ctrl.panSpeed = 0.6;
        ctrl.minDistance = 3.2;
        ctrl.maxDistance = 42;
        ctrl.maxPolarAngle = Math.PI * 0.94;
        ctrl.minPolarAngle = 0.08;
        ctrl.enablePan = true;
        ctrl.screenSpacePanning = true;
        return ctrl;
      }
      return new FallbackOrbit(camera, dom);
    },
    ensureRecord(id) {
      if (this.records.has(id)) return this.records.get(id);
      const meta = MODULES[id - 1];
      let rec;
      try {
        rec = meta.build(meta.accent);
      } catch (err) {
        console.error(`TrigLab: scene ${id} failed to build`, err);
        rec = null;
      }
      if (!rec) {
        rec = {
          scene: new THREE.Scene(),
          camera: new THREE.PerspectiveCamera(45, 1, 0.1, 100),
          target: new THREE.Vector3(0, 1, 0),
          update: () => {},
        };
        rec.camera.position.set(0, 3, 10);
      }
      if (!rec.camera) {
        rec.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
        rec.camera.position.set(0, 4, 12);
        rec.camera.lookAt(rec.target || new THREE.Vector3());
      }
      if (!rec.target) rec.target = new THREE.Vector3(0, 1, 0);
      rec.lastT = 0;
      this.records.set(id, rec);
      return rec;
    },
    activate(id) {
      this.activeId = id;
      if (!this.renderer) return;
      const slot = $(`[data-slot="${id}"]`);
      if (!slot) return;
      if (this.renderer.domElement.parentElement !== slot) slot.appendChild(this.renderer.domElement);
      const rec = this.ensureRecord(id);
      if (this.controls) this.controls.dispose();
      this.controls = this.makeControls(rec.camera, this.renderer.domElement);
      this.controls.target.copy(rec.target);
      this.controls.update();
      rec.camera.lookAt(rec.target);
      this.resize();
    },
    resize() {
      if (!this.renderer || !this.activeId) return;
      const slot = $(`[data-slot="${this.activeId}"]`);
      if (!slot) return;
      const w = Math.max(1, slot.clientWidth);
      const h = Math.max(1, slot.clientHeight);
      this.renderer.setSize(w, h, false);
      const rec = this.records.get(this.activeId);
      if (rec) {
        rec.camera.aspect = w / h;
        rec.camera.updateProjectionMatrix();
      }
    },
    loop(ms) {
      requestAnimationFrame(this._loopBound);
      if (!this.renderer || !this.activeId) return;
      const rec = this.records.get(this.activeId);
      if (!rec) return;
      const t = ms / 1000;
      try {
        rec.update(t, simStates[this.activeId]);
      } catch (err) {
        if (!rec._warned) {
          console.warn("TrigLab: scene update error", err);
          rec._warned = true;
        }
      }
      if (this.controls) this.controls.update();
      this.renderer.render(rec.scene, rec.camera);
    },
  };

  /* ------------------------------------------------------------------------
     11. Tab activation, filters, import/export, dialogs
     ------------------------------------------------------------------------ */
  function activateTab(id, opts = {}) {
    id = clamp(Math.round(id), 1, TAB_COUNT);
    stopStorySpeech();
    activeTab = id;
    $$(".module-panel").forEach((p) => (p.hidden = Number(p.dataset.tab) !== id));
    $$(".tab-btn").forEach((b) => {
      const on = Number(b.dataset.tab) === id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
    });
    const btn = $(`#tab-${id}`);
    if (btn && opts.scroll !== false) btn.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    if (Viewer.renderer) {
      Viewer.activate(id);
      setTimeout(() => Viewer.resize(), 40);
      setTimeout(() => Viewer.resize(), 300);
    } else {
      const slot = $(`[data-slot="${id}"]`);
      if (slot && !slot.querySelector(".webgl-fallback")) {
        slot.innerHTML = `<div class="webgl-fallback" style="position:absolute;inset:0;display:grid;place-items:center;padding:30px;text-align:center;color:#8aa4c0;font-size:.8rem;line-height:1.6"><div><div style="font-size:2rem;margin-bottom:10px">🛰️</div><strong style="color:#eaf4ff">3D engine couldn't load</strong><br>The equations and exercises still work. Check your network for the Three.js CDN, then refresh.</div></div>`;
      }
    }
    updateHud(id);
    updateReadout(id);
    updateExerciseFooter(id);
    if (opts.updateHash !== false) {
      try {
        history.replaceState(null, "", `#tab-${String(id).padStart(2, "0")}`);
      } catch (err) {
        /* static file:// contexts can restrict history */
      }
    }
    if (opts.focus !== false) {
      setTimeout(() => {
        const input = $(`#answer-${id}`);
        if (input && document.activeElement === document.body) input.focus({ preventScroll: true });
      }, 120);
    }
  }

  function jumpToNextDue() {
    const due = MODULES.filter((m) => isDue(state.tabs[m.id]));
    if (!due.length) {
      toast("Nothing is due right now — new chapters are ready to learn.", "info", "🔔");
      return;
    }
    const currentIdx = due.findIndex((m) => m.id === activeTab);
    const next = due[(currentIdx + 1) % due.length];
    activateTab(next.id);
  }

  function toggleDueFilter() {
    dueMode = !dueMode;
    document.querySelector(".app-shell").classList.toggle("due-mode", dueMode);
    $("#dueFilter").setAttribute("aria-pressed", dueMode ? "true" : "false");
    const due = dueCount();
    if (dueMode) {
      if (due === 0) toast("No chapters due today. The filter is on — amber badges appear when reviews come due.", "info", "🔔");
      else toast(`${due} chapter${due === 1 ? "" : "s"} due. Amber chapters are highlighted.`, "warn", "🔔");
    } else {
      toast("Showing the full booklet.", "info", "📚");
    }
  }

  function saveProgressFile() {
    saveStateNow();
    const payload = {
      app: "TrigLab 3D — 20-Tab Trigonometry Master Booklet & SRS Learning Studio",
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      credits: { engine: "OpenCode", model: "DeepSeek V4.1 Flash", three: "r128" },
      state,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trig_srs_progress.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast("Progress file downloaded: trig_srs_progress.json", "ok", "💾");
  }

  function importProgressFile(file) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast("That file is too large to be a progress file.", "bad", "×");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const raw = parsed && parsed.state ? parsed.state : parsed;
        if (!raw || typeof raw !== "object" || (!raw.tabs && !raw.score)) throw new Error("Not a TrigLab progress file");
        state = normalizeState(raw);
        saveStateNow();
        refreshGlobalUI();
        updateAllFooters();
        // Refresh the active drill so its level tag matches the imported counts.
        const activeEx = exercises[activeTab];
        if (activeEx) {
          const levelTag = $(`[data-exercise="${activeTab}"] [data-level-tag]`);
          if (levelTag) {
            const lv = levelFor(state.tabs[activeTab].reviewCount);
            levelTag.textContent = `Level ${lv} · ${SRS_LEVEL_NAMES[lv]}`;
          }
        }
        const importedMastered = masteredCount();
        toast(`Progress restored: ${state.totalReviews} reviews, ${importedMastered}/20 mastered, ${state.score} points.`, "ok", "📂");
      } catch (err) {
        console.warn("TrigLab: import failed", err);
        toast("Could not load that file. Choose a valid trig_srs_progress.json export.", "bad", "×");
      }
    };
    reader.onerror = () => toast("Could not read that file.", "bad", "×");
    reader.readAsText(file);
  }

  function resetProgress() {
    state = defaultState();
    saveStateNow();
    refreshGlobalUI();
    updateAllFooters();
    closeModal();
    toast("All local progress reset. Fresh notebook, same 20 chapters.", "warn", "↺");
  }

  function openHelp() {
    openModal(`
      <p class="modal-kicker">Operating manual</p>
      <h2>How TrigLab 3D works</h2>
      <p>You are the new engineer in a virtual STEM lab. Every chapter gives you a story, a live machine, and a short drill. You can start with zero trigonometry knowledge.</p>
      <h3>Guided story</h3>
      <p>Each chapter opens with a three-step narrator: <strong>the mission</strong>, <strong>what the colours mean</strong>, and <strong>what the formula is doing</strong>. Use <strong>Back / Next</strong> to move through it. Tap <strong>🔊 Listen</strong> to hear the current step read aloud.</p>
      <h3>Colour keys and formula decoder</h3>
      <p>The chips in the top-right of the 3D viewport are buttons. Tap one for a plain-English explanation of that colour in this specific simulator. Tap the formula pill next to the chapter title for a symbol-by-symbol decoder. On a phone, use the <strong>Colour key</strong> button above the 3D scene.</p>
      <ul>
        <li><strong style="color:#22d3ee">Cyan</strong> — cosine / horizontal share.</li>
        <li><strong style="color:#f472b6">Magenta</strong> — sine / vertical share.</li>
        <li><strong style="color:#facc15">Yellow</strong> — tangent, vectors, beams, and measurements.</li>
      </ul>
      <h3>Spaced repetition ladder</h3>
      <table>
        <thead><tr><th>Level</th><th>Review count</th><th>Next interval</th></tr></thead>
        <tbody>
          <tr><td>L1 · Learn</td><td>1st review</td><td>+1 day</td></tr>
          <tr><td>L2 · Practicing</td><td>2nd–3rd</td><td>+3 days</td></tr>
          <tr><td>L3 · Reinforcing</td><td>4th–5th</td><td>+7 days</td></tr>
          <tr><td>L4 · Mastered</td><td>6+</td><td>+30 days</td></tr>
        </tbody>
      </table>
      <h3>Badges &amp; filter</h3>
      <ul>
        <li>🟢 Mastered · 🟡 Review due · 🔴 New · 🔵 Practicing (not yet due).</li>
        <li><strong>Due Today 🔔</strong> dims everything that is not due and highlights the amber chapters.</li>
      </ul>
      <h3>Portable progress</h3>
      <p><strong>Save Progress File</strong> downloads <code>trig_srs_progress.json</code> with every timestamp, review count, status and score. <strong>Load Progress File</strong> restores it on any device; local progress is also cached in <code>localStorage</code>.</p>
      <h3>3D controls</h3>
      <p>Drag to orbit, scroll or pinch to zoom, right-drag to pan. Every simulator updates its HUD, formula chips and exercises in real time.</p>
      <h3>Credits</h3>
      <p>Built with <strong>OpenCode</strong> and <strong>DeepSeek V4.1 Flash</strong>. 3D powered by Three.js r128 + OrbitControls. Static, read-only GitHub Pages compatible — no backend, no build step.</p>
      <div class="modal-actions">
        <button class="btn btn-primary" type="button" data-modal="close">Start practicing</button>
        <button class="btn" type="button" data-story-jump="${activeTab}">Open this chapter's story</button>
        <button class="btn" type="button" data-modal="save">💾 Save progress file</button>
      </div>
    `);
  }

  function openReset() {
    openModal(`
      <p class="modal-kicker">Destructive action</p>
      <h2>Reset all progress?</h2>
      <p>This clears every status, timestamp, review count and your score from this browser. Export a progress file first if you want a backup.</p>
      <div class="modal-actions">
        <button class="btn btn--due" type="button" data-modal="reset-confirm">Yes, reset everything</button>
        <button class="btn" type="button" data-modal="close">Cancel</button>
      </div>
    `);
  }

  /* ------------------------------------------------------------------------
     12. Initialisation & event wiring
     ------------------------------------------------------------------------ */
  function bindChrome() {
    $("#dueFilter").addEventListener("click", toggleDueFilter);
    $("#dueJump").addEventListener("click", jumpToNextDue);
    $("#saveBtn").addEventListener("click", saveProgressFile);
    $("#loadBtn").addEventListener("click", () => $("#loadInput").click());
    $("#loadInput").addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      importProgressFile(file);
      e.target.value = "";
    });
    $("#helpBtn").addEventListener("click", openHelp);
    $("#resetBtn").addEventListener("click", openReset);
    $("#railLeft").addEventListener("click", () => $("#tabScroll").scrollBy({ left: -460, behavior: "smooth" }));
    $("#railRight").addEventListener("click", () => $("#tabScroll").scrollBy({ left: 460, behavior: "smooth" }));

    $("#modalClose").addEventListener("click", closeModal);
    $("#modalBackdrop").addEventListener("click", (e) => {
      if (e.target === $("#modalBackdrop")) closeModal();
    });
    $("#modalContent").addEventListener("click", (e) => {
      const legendJump = e.target.closest("[data-legend-jump]");
      if (legendJump) {
        openLegend(MODULES[Number(legendJump.dataset.legendId) - 1], legendJump.dataset.legendJump);
        return;
      }
      const keyAll = e.target.closest("[data-key-all]");
      if (keyAll) {
        openVisualKey(MODULES[Number(keyAll.dataset.keyAll) - 1]);
        return;
      }
      const storyJump = e.target.closest("[data-story-jump]");
      if (storyJump) {
        const id = clamp(Number(storyJump.dataset.storyJump), 1, TAB_COUNT);
        closeModal();
        activateTab(id, { focus: false });
        setTimeout(() => {
          const narrator = $(`[data-narrator="${id}"]`);
          if (narrator) narrator.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 320);
        return;
      }
      const btn = e.target.closest("[data-modal]");
      if (!btn) return;
      const action = btn.dataset.modal;
      if (action === "close") closeModal();
      else if (action === "save") {
        saveProgressFile();
        closeModal();
      } else if (action === "reset-confirm") resetProgress();
      else if (action === "welcome-start") {
        markOnboarded();
        closeModal();
        activateTab(1, { focus: false });
        setTimeout(() => {
          const narrator = $('[data-narrator="1"]');
          if (narrator) narrator.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 320);
      } else if (action === "guide") {
        markOnboarded();
        openHelp();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("#modalBackdrop").hidden) closeModal();
      if (e.altKey && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        e.preventDefault();
        activateTab(activeTab + (e.key === "ArrowRight" ? 1 : -1));
      }
    });

    window.addEventListener("hashchange", () => {
      const m = location.hash.match(/tab-(\d{1,2})/);
      if (m) activateTab(Number(m[1]), { updateHash: false, scroll: false });
    });

    // Refresh due badges predictably even if the page stays open overnight.
    setInterval(() => {
      refreshGlobalUI();
      if (dueMode) document.querySelector(".app-shell").classList.add("due-mode");
    }, 60000);
  }

  function boot() {
    const bootScreen = $("#bootScreen");
    const note = $("#bootNote");
    const bar = $("#bootBarFill");
    try {
      if (bar) bar.style.width = "20%";
      buildTabsAndPanels();
      if (bar) bar.style.width = "55%";
      bindChrome();
      refreshGlobalUI();
      if (bar) bar.style.width = "72%";

      const ok = Viewer.init();
      if (bar) bar.style.width = "92%";
      if (!ok) {
        if (note) note.textContent = "Three.js CDN unavailable — exercises and SRS are still fully active.";
        document.querySelectorAll(".viewport-slot").forEach((slot) => {
          slot.innerHTML = `<div style="position:absolute;inset:0;display:grid;place-items:center;padding:30px;text-align:center;color:#8aa4c0;font-size:.8rem;line-height:1.6"><div><div style="font-size:2.2rem;margin-bottom:10px">🛰️</div><strong style="color:#eaf4ff">3D engine couldn't load</strong><br>Check the Three.js CDN connection and refresh. The drills and SRS work without it.</div></div>`;
        });
      }

      let initial = 1;
      const hash = location.hash.match(/tab-(\d{1,2})/);
      if (hash) initial = clamp(Number(hash[1]), 1, TAB_COUNT);
      activateTab(initial, { updateHash: false, focus: false });

      if (bar) bar.style.width = "100%";
      setTimeout(() => {
        bootScreen.classList.add("is-hidden");
        setTimeout(() => (bootScreen.hidden = true), 560);
      }, 480);

      // Greet returning learners once the boot screen clears.
      const due = dueCount();
      let needsBriefing = false;
      try {
        needsBriefing = state.totalReviews === 0 && !localStorage.getItem(ONBOARD_KEY);
      } catch (err) {
        needsBriefing = state.totalReviews === 0;
      }
      setTimeout(() => {
        if (needsBriefing) {
          showWelcome();
          return;
        }
        if (due > 0) toast(`${due} chapter${due === 1 ? "" : "s"} due today. Use “Due Today” to focus.`, "warn", "🔔");
        else if (state.totalReviews > 0) toast("Welcome back — progress restored from this browser.", "ok", "✓");
      }, 1250);

      if (!window.THREE) {
        console.warn("TrigLab: THREE namespace not found. 3D scenes disabled; exercises still available.");
      }
    } catch (err) {
      console.error("TrigLab boot failed", err);
      if (note) note.textContent = "Boot error — open the browser console for details.";
      if (bootScreen) bootScreen.classList.add("is-hidden");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }


})();
