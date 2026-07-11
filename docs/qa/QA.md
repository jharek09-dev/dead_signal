# Dead Signal — QA & Test / Review Plan

| | |
| --- | --- |
| **Version** | 1.1 |
| **Status** | Living — the executable QA reference; folds in the former worktree `PLAYTESTING.md` |
| **Last updated** | 2026-07-06 |
| **Owner** | Jharek (QA / production / dev) |
| **Companion docs** | [PRD](../product/PRD.md) · [Production Plan](../production/PRODUCTION.md) · [Technical Design](../technical/DESIGN.md) · canon [`STORY.md`](../narrative/STORY.md) |

> **Purpose.** The single home for how *Dead Signal* is **tested and reviewed** before it ships:
> strategy, the standing regression bar, the test matrices, an enumerated test-case catalog traced
> back to PRD requirements, the automated browser-driven harness (promoted from the worktree
> `PLAYTESTING.md`), the content/canon review, bug triage, and the release sign-off.
>
> **Division of labour.** The [PRD §8](../product/PRD.md#8-release-criteria-definition-of-done)
> defines *what must be true to ship*; this document defines *how we prove it*. The
> [Production Plan §6](../production/PRODUCTION.md#6-qa--playtest-protocol) owns *when* QA runs in the
> milestone sequence; this is the executable detail underneath it. Narrative correctness defers to
> [`STORY.md`](../narrative/STORY.md).
>
> **Working model.** Solo developer wearing distinct hats (dev, QA, content review). "Sign-off" below
> means the author has run the gate and recorded the result — the discipline is the same as a team's,
> the reviewer is one person.

---

## Table of contents

1. [QA philosophy & scope](#1-qa-philosophy--scope)
2. [Test strategy & levels](#2-test-strategy--levels)
3. [Standing regression bar](#3-standing-regression-bar)
4. [Test matrices](#4-test-matrices)
5. [Test-case catalog](#5-test-case-catalog)
6. [Automated QA harness](#6-automated-qa-harness)
7. [Content & canon review](#7-content--canon-review)
8. [Accessibility & platform verification](#8-accessibility--platform-verification)
9. [Bug triage & severity](#9-bug-triage--severity)
10. [Regression triggers](#10-regression-triggers)
11. [Release QA sign-off](#11-release-qa-sign-off)
12. [Expansion v2 — QA delta (build: PLANNED)](#12-expansion-v2--qa-delta-build-planned)
13. [Appendix](#13-appendix)

---

## 1. QA philosophy & scope

**Determinism makes QA tractable.** Dead Signal has no AI, no network, and no unseeded randomness the
player is asked to reason about ([DESIGN §1](../technical/DESIGN.md)). Outcomes are reproducible, so a
failing test is a **real bug, not variance** — the single most important fact about testing this game.
It means a scripted playthrough that passes today passes tomorrow, and a defect always has a
deterministic repro.

**What QA covers.** Seven surfaces, each with cases in §5:

- **Narrative flow** — the arc completes on every route; gating, finale, and both endings behave.
- **Systems** — the survival economy, encounter resolver, and Case File compute correctly.
- **Persistence** — saves round-trip, migrate, and never soft-lock a resume.
- **Presentation & shell** — voice separation, choice caps, pause, HUD, risk tags.
- **Audio** — muted-playable, iOS unlock, story-gated cues.
- **Platform & offline** — PWA install, offline run, zero network, the device matrix.
- **Content & canon** — consistency against `STORY.md` and spoiler discipline on public surfaces.

**The one inviolable rule** (inherited from `PLAN.md` and the
[Production Plan](../production/PRODUCTION.md)): **the game must boot and play at every checkpoint —
never leave a broken build between changes.** QA is not a phase at the end; the standing bar (§3) is a
merge gate.

**Out of QA's scope (by design).** Load/soak testing (single-player, offline, finite content), fuzz
of a server (there is none), and cross-account/cloud-save behavior (local-only, [PRD §6](../product/PRD.md#6-platforms--technical-constraints)).

---

## 2. Test strategy & levels

Five levels, cheapest and most frequent first. Each maps to a section below.

| Level | What | Cadence | Automation | Section |
| --- | --- | --- | --- | --- |
| **L1 — Automated smoke** | Scripted per-route playthrough, console + network clean | Every build / pre-merge | Browser-driven harness | §3, §6 |
| **L2 — Manual exploratory** | Play by hand across the matrices; feel, pacing, edge inputs | Per milestone + pre-release | Manual | §4, §5 |
| **L3 — Content review** | Canon consistency + spoiler audit | Any story/doc/copy change | Manual review | §7 |
| **L4 — Platform verification** | Device matrix, PWA install/offline, audio unlock | Pre-release + any audio/PWA change | Manual on device | §8 |
| **L5 — Release sign-off** | The full P0 gate assembled and recorded | Release candidate | Checklist | §11 |

**Traceability is the spine.** Every test case (§5) carries a **trace** to the PRD requirement
(`F-*` / `NFR-*`) or release criterion it defends, so coverage is auditable and a requirement change
points straight at the cases to re-run (§10, appendix §13.1).

**Test data over fabrication.** Prefer real playthroughs and *edited* real saves to hand-built
fixtures — see the "edit, don't fabricate" rule for doctored saves (§6.6). Fabricated state drifts
from the schema and produces false failures.

---

## 3. Standing regression bar

The must-pass gate on **every** release build. This is the executable form of
[Production §6.1](../production/PRODUCTION.md#6-qa--playtest-protocol) and maps directly to
[PRD §8](../product/PRD.md#8-release-criteria-definition-of-done) criteria 1–2.

1. **Full start→ending playthrough per route** — hospital, metro, route 9 — with **zero console
   errors** and **zero network calls** (verify a clean DevTools Network panel across the whole arc).
2. **Both endings** reachable and correctly recorded to `profile.ending` (Accept and Refuse).
3. **Save round-trip** — save → reload → resume restores a safe decision point; legacy saves migrate;
   no mid-beat soft-lock.
4. **Production build compiles clean** — `npm run build` then `npm run preview`, zero errors.

A red bar blocks the merge/release. Nothing below waives it. The bar is designed to be **run by the
automated harness (§6)** for L1 and confirmed by hand for the endings and the save round-trip.

---

## 4. Test matrices

Manual coverage axes (from [Production §6.3](../production/PRODUCTION.md#6-qa--playtest-protocol)).
Each cell is a run to exercise, not a single click.

| Axis | Coverage |
| --- | --- |
| **Routes** | Hospital · Metro · Route 9 — **each** an ignore-power run **and** an engaged run |
| **Economy** | Ignore-power scrapes to the intended low but survives to Haven; engaged play stays comfortable |
| **Platforms** | iOS Safari · Android Chrome — installed PWA **and** in-browser |
| **Save / load** | All 3 slots; interrupt mid-leg; resume; delete-confirm flow; last-slot-deleted return |
| **Endings** | Accept and Refuse; replay for the other; 100% accrual across runs |

**Why these axes.** Routes differ by `ROUTE_PROFILE` (power bias, noise penalty, noise decay) and
have unique clue/fragment pools ([DESIGN §5](../technical/DESIGN.md)), so a route is a distinct code
path, not a reskin. The economy axis is the load-bearing balance check — battery is the knob that can
make a run unwinnable. Platform and save axes are where the externally-uncontrolled risks live
(iOS PWA/audio; save-schema regression — [Production §5 R3/R6](../production/PRODUCTION.md#5-risk-register)).

---

## 5. Test-case catalog

Enumerated cases, grouped by surface. **Sev** = default severity if the case fails (§9). **Trace** =
the requirement/criterion it defends. Steps are the minimum to reach the check; the expected result is
the assertion.

### 5.1 Narrative & flow

| ID | Case → Expected | Trace | Sev |
| --- | --- | --- | --- |
| QA-NAR-1 | Play each route to the empty Haven → the **143** record and the call fire; route-specific clues/fragments seen | F-1, F-9 | S1 |
| QA-NAR-2 | Reach `haven_final` → **auto-flows** into `phase3`; no dead-end "to be continued" screen | F-2 | S1 |
| QA-NAR-3 | Phase-3 gating: truth-gate (`you` → City Hall), count-gate (Research Annex at ≥2 truths), finale-gate (Haven `gate_yard` at ≥4 truths) all open exactly on threshold | F-3 | S1 |
| QA-NAR-4 | Reach the finale, choose **Accept** → the Accept ending plays and `profile.ending` records it | F-4 | S1 |
| QA-NAR-5 | Reach the finale, choose **Refuse** → the Refuse ending plays and records; a replay can reach the other ending | F-4, F-12 | S1 |
| QA-NAR-6 | Drive battery to 0 (offline) and, separately, food/water to 0 (starvation) → correct death-line pool + fail handling, no stuck state | F-6, F-7 | S2 |
| QA-NAR-7 | Trigger a road/hazard encounter mid-leg → it resolves and **returns to the spawning leg** via its return-phase (re-entrancy) | F-8 | S2 |

### 5.2 Systems — economy, encounters

| ID | Case → Expected | Trace | Sev |
| --- | --- | --- | --- |
| QA-SYS-1 | Battery drain: 0 in `phase1`, memory/discovery beats, and continues (`·`); **1%/beat** on advancing P2/P3 beats (`beatBatteryCost`) | F-6, F-7 | S2 |
| QA-SYS-2 | Charger: `CHARGER_FIND` (20) tops phone in P1; a power-source search adds `CHARGER_RECHARGE` (25) to the reservoir; **Use charger** transfers `CHARGER_TRANSFER` (25) reservoir→phone; action gated (reservoir > 0, phone < 90%, not mid-encounter) | F-6 | S2 |
| QA-SYS-3 | **Ignore-power run** scrapes to the intended low but survives to the Haven cache; **engaged run** stays comfortable (balance measurement) | G2, GDD §15 | S2 |
| QA-SYS-4 | Encounter resolver: the displayed `[LOW]/[MED]/[HIGH]` tier is derived from the **same** `pSneak`/`pRun`/`pFight` used for the roll; `FORCE` is a no-roll `[COSTLY]`; route `noiseCombatPenalty`/`noiseDecayPerLeg` applied | F-8 | S2 |
| QA-SYS-5 | Weapon ladder (knife 2 → machete 6) feeds `pFight`; a `WEAPON_PICKUPS` upgrade raises fight odds | F-8 | S3 |
| QA-SYS-6 | Haven relief: `HAVEN_BATTERY_CACHE` (45) applied on entry; `HAVEN_SUPPLY_FLOOR` tops food/water to ≥ 5 | F-6 | S3 |

### 5.3 Case File

| ID | Case → Expected | Trace | Sev |
| --- | --- | --- | --- |
| QA-CF-1 | Board categories (memories / clues / people / locations) populate as content is found; a memory dropdown **replays** its flashback | F-10 | S2 |
| QA-CF-2 | Facts and contradictions reveal only when their `(clues, reached, raised)` predicate passes; a contradiction pairs two known facts into the question it forces | F-10, F-11 | S2 |
| QA-CF-3 | Questions **evolve** (`kim → kim143`, `haven → haven143`) and announce via NEW / UPDATED QUESTION cards with **no double-announce** | F-11 | S3 |
| QA-CF-4 | Fragments + clues accrue into the per-slot profile toward 100% across multiple runs | F-12 | S3 |

### 5.4 Persistence & saves

| ID | Case → Expected | Trace | Sev |
| --- | --- | --- | --- |
| QA-SAVE-1 | Save → reload → resume restores a **safe decision point** on all 3 slots | PRD §8 | S1 |
| QA-SAVE-2 | A manual save taken mid-beat does **not** soft-lock on resume — it is refused or restored to a safe point | NFR-3 | S1 |
| QA-SAVE-3 | A legacy `v === 1` bare snapshot migrates to run + empty profile; the old global `ds_memories`/`ds_save` one-time migration runs | NFR-3 | S2 |
| QA-SAVE-4 | Forward-compat: an older save loads into a newer build (missing fields default); `validRun()` silently drops a run missing `gamePhase`/`resources`/numeric `resources.battery` rather than crashing | NFR-3 | S2 |
| QA-SAVE-5 | Delete-confirm: `DELETE` → `DELETE?` two-step; deleting the last load slot returns to the title menu | F-15 | S3 |

### 5.5 Presentation & shell

| ID | Case → Expected | Trace | Sev |
| --- | --- | --- | --- |
| QA-UI-1 | Voice separation: Ellie = lowercase message bubbles; narrator = italic centered; the phone frame is never broken | F-14 | S3 |
| QA-UI-2 | Choice UI respects `MAX_VISIBLE_CHOICES` (4) / `HARD_CHOICE_CAP` (5); `?debug` logs a console warning when a list exceeds the cap | F-13 | S3 |
| QA-UI-3 | **Pause** freezes dialogue mid-beat and resumes it; opening/closing the Case File preserves chat scroll position | F-14 | S2 |
| QA-UI-4 | Risk tags render color-coded by tier — assert by span **color** (`#4a9e6b` low / `#c8a020` med / `#8b4a4a` high) and `title`, not label text; `[COSTLY]` keeps its own label | F-8, F-13 | S3 |
| QA-UI-5 | HUD: signal + battery corner-anchored; `pulseBattery` feedback on a charger transfer; `locationLabel()` correct end-to-end | F-13 | S3 |

### 5.6 Audio

| ID | Case → Expected | Trace | Sev |
| --- | --- | --- | --- |
| QA-AUD-1 | The game is **fully playable muted**; every audio method no-ops until unlocked and while muted (no missing-audio guards needed) | F-16, NFR-5 | S2 |
| QA-AUD-2 | iOS unlock: first gesture `await`s `Tone.start()`, confirms the context resumed (retries), and **bails without marking unlocked** if it can't; `resume()` fires on return-to-foreground | F-16 | S2 |
| QA-AUD-3 | The **Signal-distortion** cue (`signal()`) fires **only** on its story beats — never on generic UI taps | F-16 | S3 |

### 5.7 Platform, PWA & offline

| ID | Case → Expected | Trace | Sev |
| --- | --- | --- | --- |
| QA-PWA-1 | **Zero network calls** across the full arc in the production build (DevTools Network panel stays empty) | NFR-1, PRD §8 | S1 |
| QA-PWA-2 | The PWA installs (manifest, icons, iOS meta) and runs **offline** on iOS Safari **and** Android Chrome, installed **and** in-browser | F-17, PRD §8 | S1 |
| QA-PWA-3 | `demo.html#play` boots the embedded game from the marketing/browser shell | F-17 | S3 |

### 5.8 Performance

| ID | Case → Expected | Trace | Sev |
| --- | --- | --- | --- |
| QA-PERF-1 | Fast boot on mid-range mobile; Tone.js (~380 kB) is **not** in the initial bundle (lazy-loaded on first gesture) | NFR-2 | S3 |
| QA-PERF-2 | Smooth message/scroll on a small screen; timers are cleared on pause/unmount/reset (no leaks, no double-fires after a reset) | NFR-2 | S3 |

### 5.9 Accessibility & content (release smoke — full plans elsewhere)

| ID | Case → Expected | Trace | Sev |
| --- | --- | --- | --- |
| QA-A11Y-1 | Core-screen smoke: **readable, pausable, muted-playable, no-twitch** (no reflex-gated beat) | NFR-5, PRD §8 | S2 |
| QA-CONTENT-1 | Canon consistency pass vs `STORY.md` — no contradictions across build **and** docs | PRD §8 | S1 |
| QA-CONTENT-2 | Spoiler audit of every public surface (README, browser/demo shell, in-game Story page) vs `STORY.md` §2/§4 — no leaks | F-5, PRD §8 | S1 |

> The **full** accessibility audit (WCAG 2.2 AA, photosensitivity, keyboard-nav) is the M-A11Y track in
> [`../accessibility/ACCESSIBILITY.md`](../accessibility/ACCESSIBILITY.md); QA-A11Y-1 is only the
> release smoke.

---

## 6. Automated QA harness

The proven browser-automation methodology — **promoted here from the worktree `PLAYTESTING.md` so it
is a first-class asset** (the action item flagged in
[Production §6.2](../production/PRODUCTION.md#6-qa--playtest-protocol)). Drive `src/DeadSignal.jsx`
from `preview_eval`, the DevTools console, or Playwright `page.evaluate`. Selectors and save fields
below are **verified against source**.

### 6.1 URL flags & dev skips

| Flag | Effect |
| --- | --- |
| `?gates` | Enables the real-time day gates (`DAY_GATES_ENABLED`, ~line 1376). Gates are **dormant by default** — without this flag every night resolves instantly via `wakeFromGate`. Gate length is `DAY_GATE_MS` (17 min real time). |
| `?debug` | Sets `GATE_BYPASS` (also true in any Vite dev build via `import.meta.env.DEV`). Adds a **`skip (dev)`** button to the resting screen, an audio diagnostic overlay, and a console warning when a choice list exceeds `HARD_CHOICE_CAP`. |

In a local dev server `GATE_BYPASS` is always on; add `?gates` only when specifically testing the
resting screen / countdown / early-wake flow.

### 6.2 Time compression (8× setTimeout shim)

Typewriter and beat pacing run on `setTimeout`. Patch it **before** starting a run. Idempotent guard
so re-running doesn't double-patch; the patch dies on reload (fresh realm) — re-apply after every
reload. It does **not** touch `Date.now`, so `?gates` countdowns stay real (§6.5).

```js
if (!window.__origST) {
  window.__origST = window.setTimeout.bind(window);
  window.setTimeout = (fn, d, ...a) => window.__origST(fn, d > 60 ? d / 8 : d, ...a);
}
```

### 6.3 Message logger (MutationObserver)

Capture story lines as they stream in, without polling:

```js
window.__log = [];
window.__obs?.disconnect();
window.__obs = new MutationObserver(() => {
  const rows = [...document.querySelectorAll('.ds-chat > div')];
  const last = rows.at(-2); // skip the bottom sentinel
  const t = last?.innerText?.trim();
  if (t && window.__log.at(-1) !== t) window.__log.push(t);
});
window.__obs.observe(document.body, { childList: true, subtree: true });
// later: read window.__log
```

For line-presence/count assertions on choiceless beats (which never hit a choice log), a ~100 ms
`document.body.innerText` sampler at real speed is more reliable.

### 6.4 Auto-driver skeleton

Real story choices are `button.cb.choice-btn` **inside `.ds-choices-pane`**. Other chrome also uses
`.cb` (charger button, case-file board, `·` placeholder) and `.rb` (title menu, resting screen, slot
screen) — scope to the pane and filter.

```js
window.__driver && clearInterval(window.__driver);
window.__seen = window.__seen || new Map();      // novelty policy: label -> click count
window.__stall = Date.now();

window.__driver = setInterval(() => {
  // Stop condition: read .ds-vitals ONLY — see pitfalls (§6.7) re "DAY n" false matches.
  const vitals = document.querySelector('.ds-vitals')?.innerText || '';
  if (/DAY 7/.test(vitals)) { clearInterval(window.__driver); console.log('STOP: reached day 7'); return; }

  // Resting screen (?gates): its buttons are .rb, not .cb.
  const rb = [...document.querySelectorAll('.rb')]
    .find(b => /skip \(dev\)|wake - continue|force yourself up/.test(b.innerText));
  if (rb) { rb.click(); window.__stall = Date.now(); return; }

  const btns = [...document.querySelectorAll('.ds-choices-pane button')]
    .filter(b => {
      const t = b.innerText.trim();
      return t && !/^[▤☰◂▸▾]/.test(t) && t !== 'CASE FILE';
    });
  if (!btns.length) {
    if (Date.now() - window.__stall > 15000) { clearInterval(window.__driver); console.log('STALLED'); }
    return;
  }
  window.__stall = Date.now();

  // Per-pass keyword policy first (e.g. de-escalate encounters), else least-visited.
  const policy = /Climb over|Ease past|Slip past|Keep walking|Wait for|Don't open|Leave them|quiet/;
  let pick = btns.find(b => policy.test(b.innerText));
  if (!pick) pick = btns.reduce((a, b) =>
    (window.__seen.get(b.innerText) || 0) <= (window.__seen.get(a.innerText) || 0) ? b : a);
  window.__seen.set(pick.innerText, (window.__seen.get(pick.innerText) || 0) + 1);
  pick.click();
}, 500); // keep ≥500ms between clicks
```

**Variants & footguns:**

- **Steered walker** — replace the policy with an ordered array of regexes + an index; allow
  *skip-ahead* matching (scan forward from the current index) so encounter reroutes don't derail the
  walk. Keep the encounter-resolver regex as a fallback. Avoid `Back off` on road encounters — it
  reroutes to Haven.
- **Regex-first is a footgun**: `find()` returns the FIRST match — e.g. "Back to records." steals
  `/record/` from "records office — room 312". Prefer exact step sequences or anchor the regex.
- Title/intro/day screens use classless `▸` advance buttons (NEW MESSAGE / CONTINUE / WAKE) — click by
  text when no pane button is present. Case-file overlay recovery: click `◂ BACK`. On the slot screen,
  DELETE needs a **second** click on `DELETE?` to confirm.

### 6.5 Fast-forwarding real-time gates (`?gates`)

The resting-screen countdown reruns off a 500 ms `setInterval` reading `Date.now()`. Stub it forward
instead of waiting 17 minutes:

```js
window.__origNow = window.__origNow || Date.now.bind(Date);
Date.now = () => window.__origNow() + 18 * 60 * 1000;   // jump 18 min
// … wait ~1s for the tick, click "wake - continue" (.rb) …
Date.now = window.__origNow;                              // RESTORE immediately after waking
```

Restore promptly — a doctored `Date.now` poisons autosave timestamps and any subsequent gate. (With
`GATE_BYPASS` just click `skip (dev)`; the stub is for testing the real countdown. Early wake — "force
yourself up" — is offered after `EARLY_WAKE_MIN_MS` = 2 min and forfeits the deferred dawn heal on
Phase-3 nights.)

### 6.6 Doctored saves (jumping to late-game states)

Saves live in `localStorage` under `ds_save_0` / `ds_save_1` / `ds_save_2` (`window.storage` in
`src/main.jsx` is a thin `localStorage` wrapper; the browser demo uses a prefixed variant). Schema v2,
normalized on read by `normalizeSlot`:

```js
{ v: 2, profile: { playthroughs, fragments: [], clues: [], complete }, run: { …snapshot } }
```

The reliable recipe is **edit, don't fabricate**: play (or auto-drive) to any real autosave past the
state you can reach, then rewrite the fields you need and reload:

```js
const k = 'ds_save_0';
const s = JSON.parse(localStorage.getItem(k));
Object.assign(s.run, {
  gamePhase: 'phase3',
  phase3Region: 'cityhall',       // region KEY from PHASE3_REGIONS (haven|mercy|comms|cityhall|annex)
  phase3Node: 'charter_vault',    // a node id within that region
  discoveredTruths: ['you', 'signal', 'project_haven'], // TRUTH ids (you|ellie|signal|project_haven|outbreak), NOT region keys
  phase3Unlocked: ['mercy', 'comms', 'cityhall', 'annex'], // region KEYS
  choices: ['·'],                 // see below
});
localStorage.setItem(k, JSON.stringify(s));
location.reload();               // then load the slot from the title menu
```

- `choices: ["·"]` is the safe restore state: clicking the stale `·` falls through
  `handlePhase3Choice` → `showPhase3Exits()`, re-presenting the true node menu. **But in
  `gamePhase: "phase3_finale"` a `·` parses as REFUSE** — keep `gamePhase: "phase3"` unless you want
  the ending.
- `validRun()` requires `gamePhase`, `resources`, and a numeric `resources.battery`, or the run is
  silently dropped on load.
- To restore *through* a night gate, keep a **past** `gateWakeAt` (absolute ms) plus `gateReason`
  (`day1` | `phase3` | `phase3_night`) and `gateHeal` — load resumes via `wakeFromGate` into a live
  node instead of a dead `choices: []` state.
- Unlock reconciliation runs on node entry, so minor `phase3Unlocked` gaps self-heal;
  `discoveredTruths` doctoring is honored as-is.
- Keep fixture JSON in a scratch file **outside the repo** (see the port pitfall, §6.7).

### 6.7 Known pitfalls

- **Stop conditions must read `.ds-vitals`, not `document.body`.** Slot summaries on the title/slot
  screens also contain "DAY n" text and have false-matched stop conditions before.
- **Clear zombie intervals before reload.** A timed-out eval **keeps running** and can keep clicking.
  Always `clearInterval(window.__driver)` (and disconnect observers) before reloading or starting a
  new pass; keep in-eval waits ≤ ~20 s if the eval tool times out at 30 s.
- **Preview-server port change = new origin = `localStorage` wiped.** All slots and doctored saves
  vanish. Keep fixtures on disk and re-inject.
- **Patches die on reload.** Both the `setTimeout` shim and any `Date.now` stub live in the page realm
  — re-apply after every `location.reload()`.
- **CSS-uppercased text.** Accessibility snapshots show "PLAY DEMO" where the DOM has "Play Demo" —
  match case-insensitively or against the DOM.
- **Risk tags read by color, not label** (since PR #15): `#4a9e6b` low / `#c8a020` med / `#8b4a4a`
  high, plus the `title` attribute. `[COSTLY]` keeps its own label.
- **Bottom-bar chrome is text-filtered, not glyph-filtered.** The CASE FILE button has no leading
  glyph; the menu button is a bare `☰`. Filter by `!/^[▤☰◂▸▾]/.test(t) && t !== 'CASE FILE'`.

### 6.8 Browserless integrity checks (no browser required)

When no browser is available (CI, sandbox), three checks cover the **structural** half of the standing
bar (§3) without clicking through the game. All three ran green on the 2026-07-06 M-P pass.

- **Build compiles clean** — `npm ci && npm run build`; the fastest catch-all for syntax / import /
  module errors across every module (expect `✓ built`, zero errors).
- **Phase-3 map integrity** — run the dev-only `validatePhase3Map` logic (DeadSignal.jsx ~line 792)
  over the real `PHASE3_REGIONS` in Node: extract the object literal, then assert the entry-node
  exists, no dead ends, every `to`/`region` exit resolves, full reachability from each entry, and the
  `HARD_CHOICE_CAP` never-cut set fits. A clean run means no soft-lock is reachable by the auto-driver.
  Expected: **5 regions / 59 nodes, 0 warnings** (34 shipped + 5 per region across all five Expansion-v2 sub-stories = ≈2× depth).
- **Save-schema round-trip** — run `validRun` / `normalizeSlot` (DeadSignal.jsx ~line 2079) over
  fixtures: a valid v2 run resumes; a legacy v1 body migrates to `{profile, run}`; a v2 slot whose run
  fails `validRun` **and** has no profile progress → `null` (cleaned); profile progress with no run is
  kept but not resumable; a `phase1` body with no `day1`/gate is unresumable → `null`; unknown schema
  → `null`. Expected: **7/7 pass**.

These are pure-data checks — they don't exercise render, audio, or the live prologue click-through
(§§6.2–6.6), which still need a real browser. Treat build + map + save as the **browserless gate** and
the per-route playthrough as the **on-device gate**.

---

## 7. Content & canon review

The **review** half of this plan. Content defects don't throw console errors — they need a human read
against the canon. All three are **release gates**
([Production §6.4](../production/PRODUCTION.md#6-qa--playtest-protocol)).

**7.1 Canon consistency pass (QA-CONTENT-1).** A full read of the shipped build **and** the doc suite
against [`STORY.md`](../narrative/STORY.md) — the single source of truth. No plot, name, timeline, or
truth contradiction. `STORY.md` wins every conflict; if the build and canon disagree, the build is the
bug (or canon is amended deliberately, with a changelog entry). Triggered by **any** edit that touches
story or a doc (risk R2).

**7.2 Spoiler audit (QA-CONTENT-2).** Every **public** surface is checked against `STORY.md` §2/§4 for
leaks of the twist: the README, the marketing/browser demo shell, and the in-game **Story** page. The
rule is prologue **cracks**, Phase 3 **answers** — nothing public may pre-empt the reveal. Triggered by
**any** new store/marketing/Story-screen copy (risk R1). This is the highest-value review the game has:
a single spoiled line breaks the product's core promise.

**7.3 Content review checklist** (run per content change):

- New lines respect the **voice separation** (Ellie lowercase / narrator italic) and the crack ladder
  for Ellie's tone ([DESIGN §8](../technical/DESIGN.md)).
- Any new fact/question carries a correct `reveal` predicate and its flag is raised by the earning
  beat/node (no orphan facts, no facts that never show).
- New content is **deduped per run** where it should be (atmosphere pools) and canonical where it
  must be (truths, names, the `143` / `KIM → ELLIE` motifs).
- Fragment count stays coherent (9 shipped) unless a data change intends otherwise.

---

## 8. Accessibility & platform verification

**8.1 Release accessibility smoke (QA-A11Y-1).** On the core screens: text is **readable** at default
scale on a phone; play is **pausable** (pause freezes dialogue); the game is **muted-playable** end to
end; and no beat is **reflex-gated** (no timing/twitch requirement). This is the release gate from
[PRD §8.6](../product/PRD.md#8-release-criteria-definition-of-done) — **not** the full audit, which is
the M-A11Y track in [`../accessibility/ACCESSIBILITY.md`](../accessibility/ACCESSIBILITY.md) (WCAG 2.2
AA, contrast against the `#070707` canvas, photosensitivity of the distortion effect, keyboard nav,
content/trauma notes).

**8.2 Device matrix.** The externally-uncontrolled surface (risk R3) — must be tested per release, not
assumed:

| Device / browser | Installed PWA | In-browser | Checks |
| --- | --- | --- | --- |
| iOS Safari | ✔ | ✔ | Audio unlock or safe no-op; standalone scroll lock; offline run; save persists |
| Android Chrome | ✔ | ✔ | Install prompt; offline run; audio; save persists |
| Desktop (reference) | — | ✔ | Full arc, DevTools console + network clean |

**8.3 PWA & offline.** Confirm the app **installs** (manifest, generated icons, iOS home-screen meta)
and **runs with the network disabled** after first load — no fetch, no API key, no CDN dependency at
runtime (Tone.js is bundled/lazy-loaded, not fetched from a CDN at play time). This is
[PRD §8.5](../product/PRD.md#8-release-criteria-definition-of-done) and release criterion QA-PWA-2.

---

## 9. Bug triage & severity

**Severity** (drives whether a defect blocks release):

| Sev | Meaning | Blocks release? |
| --- | --- | --- |
| **S1 — Blocker** | Breaks the arc, corrupts/soft-locks a save, leaks the twist, or fails a P0 release criterion | **Yes** — always |
| **S2 — Major** | A system misbehaves or a matrix cell fails, but the arc still completes | **Yes**, unless explicitly waived with a written reason |
| **S3 — Minor** | Cosmetic / polish / non-blocking edge case | No — log and schedule |
| **S4 — Trivial** | Nit; fix opportunistically | No |

**Tracking.** Bugs live as GitHub issues, labeled by severity and area; fixes land on `qa/*` branches
(the existing convention — e.g. `qa/codex-passthrough-fixes`) and must pass the standing bar (§3)
before merge to `main`. A resolved S1/S2 adds or updates the §5 case that would have caught it.

**Repro template** (a bug without this is not actionable, given determinism):

```
Title:        <one line>
Severity:     S1 | S2 | S3 | S4    Area: NAR|SYS|CF|SAVE|UI|AUD|PWA|PERF|A11Y|CONTENT
Route:        hospital | metro | route 9      Play-style: ignore-power | engaged
Platform:     iOS Safari | Android Chrome | desktop   Install: PWA | in-browser
URL flags:    none | ?debug | ?gates
Save state:   fresh run | slot N | doctored (attach the run JSON)
Steps:        1. … 2. … 3. …
Expected:     …
Actual:       …
Console:      <paste, or "clean">
Network:      clean | <request that fired>
```

Because outcomes are deterministic, a complete repro reproduces the bug **every time** — a repro that
doesn't is itself a finding (hidden nondeterminism, risk to NFR-1).

---

## 10. Regression triggers

What a given change forces you to re-run. Ties QA to the
[risk register](../production/PRODUCTION.md#5-risk-register).

| If you change… | Re-run | Guards risk |
| --- | --- | --- |
| Snapshot / profile / save shape | QA-SAVE-1…5 + full save round-trip | R6 |
| Audio or PWA code; or a new iOS version ships | QA-AUD-1…3, QA-PWA-1…3 on the device matrix (§8.2) | R3 |
| Anything touching story, or any doc | QA-CONTENT-1 canon pass | R2 |
| Any public copy (README, store, Story page) | QA-CONTENT-2 spoiler audit | R1 |
| A tuning constant ([DESIGN §5](../technical/DESIGN.md)) | QA-SYS-3 ignore-power measurement, per affected route | — |
| An encounter, region, node, or Case File fact | The relevant QA-SYS/QA-CF/QA-NAR cases + the standing bar | R7, R10 |
| Any merge to `main` | The full standing bar (§3) | — |

---

## 11. Release QA sign-off

The candidate is release-ready when this is fully green. It assembles the standing bar (§3), the
matrices (§4), and the content/platform gates (§7–§8) into the
[PRD §8 definition of done](../product/PRD.md#8-release-criteria-definition-of-done) and the
[Production §7.2 checklist](../production/PRODUCTION.md#7-release-process--runbook). One row = one
recorded sign-off.

| # | Gate | Cases | PRD §8 | Signed |
| --- | --- | --- | --- | --- |
| 1 | Full arc completes on mobile + desktop, **zero console errors + zero network** | QA-NAR-1, QA-PWA-1 | 1 | ☐ |
| 2 | Both endings reachable and recorded | QA-NAR-4, QA-NAR-5 | 2 | ☐ |
| 3 | Saves round-trip; no mid-beat soft-lock; legacy migrates | QA-SAVE-1…4 | 2 | ☐ |
| 4 | **No spoiler leaks** on any public surface | QA-CONTENT-2 | 3 | ☐ |
| 5 | **Canon consistency** pass clean vs `STORY.md` | QA-CONTENT-1 | 4 | ☐ |
| 6 | PWA installs + runs offline on iOS Safari + Android Chrome; audio unlocks or safe-no-ops | QA-PWA-2, QA-AUD-1/2 | 5 | ☐ |
| 7 | Accessibility smoke passes (readable, pausable, muted, no-twitch) | QA-A11Y-1 | 6 | ☐ |
| 8 | Production build compiles clean; version bumped + tagged | §3.4 | — | ☐ |

> **P0 only.** Localization (F-19) and the full accessibility option set (F-18) are P1/P2 — desired for
> a polished launch, **not** blocking a first release. They have their own tracks (M-LOC, M-A11Y).

---

## 12. Expansion v2 — QA delta (build: PLANNED)

Additional coverage that activates **only when the M-EXP content lands** (Echoes, region sub-stories,
the unchosen thread, truth-by-assembly, the prologue second act). **None of this is in the code yet**
— it is recorded here so the plan is ready, matching how the rest of the suite flags Expansion v2.
Canon is `STORY.md` "Changelog — Expansion v2". When M-EXP ships, these fold into §5 and the sign-off.

- **`ECHOES` board category (F-20).** The new Case File category populates as Echo fragments (~14,
  7-face cast) are found at Signal-dense/powered Phase-3 nodes; Echoes accrue toward 100% like
  fragments/clues; **none appear in the prologue**.
- **Node count ~2× (F-21).** ~65 Phase-3 nodes are all reachable; no orphan node; existing gating/labels
  still correct at the larger node count.
- **Truth-by-assembly (F-22).** Each region truth resolves **only after** its 2–3 supporting pieces are
  found; the Journal shows the deduction assembling (evidence → deduction → **TRUTH**), not a single
  truth-room dump. **Every shipped truth, gate, and both endings unchanged** — a hard regression check
  (re-run QA-NAR-3/4/5).
- **Prologue second act spoiler-safe (F-23).** The added midpoints, shelter scene, and deeper Ellie
  carry **no Echoes and no answers** — re-run QA-CONTENT-2 against the new prologue text.
- **Loc / a11y delta.** ~2× Phase-3 text enlarges the string set and the readable surface; log the
  delta for M-LOC/M-A11Y (risks R11) — QA does not sign off M-EXP without that log.

Restraint is the ceiling: the carve-out sanctions **narrative density, not mechanics**
([Production §5 R10](../production/PRODUCTION.md#5-risk-register)). Any M-EXP item that introduces a new
mechanic, a new truth, or nodes beyond ~2× is itself a finding.

---

## 13. Appendix

### 13.1 Traceability — requirement → cases

| Requirement | Cases |
| --- | --- |
| F-1 / F-9 (prologue, routes) | QA-NAR-1 |
| F-2 (auto-flow) | QA-NAR-2 |
| F-3 (Phase-3 gating) | QA-NAR-3 |
| F-4 / F-12 (finale, endings, meta-loop) | QA-NAR-4, QA-NAR-5, QA-CF-4 |
| F-5 (spoiler discipline) | QA-CONTENT-2 |
| F-6 / F-7 (economy, battery) | QA-SYS-1, QA-SYS-2, QA-SYS-6, QA-NAR-6 |
| F-8 (encounters, risk tiers) | QA-SYS-4, QA-SYS-5, QA-NAR-7, QA-UI-4 |
| F-10 / F-11 (Case File) | QA-CF-1, QA-CF-2, QA-CF-3 |
| F-13 / F-14 / F-15 (shell) | QA-UI-1…5, QA-SAVE-5 |
| F-16 (audio) | QA-AUD-1, QA-AUD-2, QA-AUD-3 |
| F-17 (PWA) | QA-PWA-1, QA-PWA-2, QA-PWA-3 |
| NFR-1 (offline/deterministic) | QA-PWA-1 |
| NFR-2 (performance) | QA-PERF-1, QA-PERF-2 |
| NFR-3 (reliability/saves) | QA-SAVE-1…4 |
| NFR-5 (accessibility) | QA-A11Y-1, QA-AUD-1 |
| Release §8.3 / §8.4 (spoiler / canon) | QA-CONTENT-2, QA-CONTENT-1 |
| F-20…F-23 (Expansion v2) | §12 (PLANNED) |

### 13.2 Verified selectors & fields (quick reference)

| Thing | Value |
| --- | --- |
| Story choice buttons | `button.cb.choice-btn` inside `.ds-choices-pane` |
| Bottom-chrome filter | `!/^[▤☰◂▸▾]/.test(t) && t !== 'CASE FILE'` |
| Resting-screen buttons | `.rb` |
| Vitals (stop conditions) | `.ds-vitals` |
| Chat rows | `.ds-chat > div` (skip the bottom sentinel, `rows.at(-2)`) |
| Save keys | `ds_save_0` / `_1` / `_2`; schema `v: 2` |
| Save shape | `{ v, profile:{playthroughs,fragments,clues,complete}, run:{…} }` |
| `validRun()` needs | `gamePhase`, `resources`, numeric `resources.battery` |
| Risk-tier colors | low `#4a9e6b` · med `#c8a020` · high `#8b4a4a` |

### 13.3 Glossary

- **Standing bar** — the regression suite run every release (§3).
- **Content gate** — the canon + spoiler + a11y checks that block release (§7, §8).
- **Trace** — the requirement/criterion a test case defends (§5, §13.1).
- **Ignore-power run** — a playthrough that never recharges, used to measure the economy floor.
- **Doctored save** — a real autosave edited to jump to a late state (§6.6).

### 13.4 Related documents

- [PRD](../product/PRD.md) — release criteria (§8), requirements. ·
  [Production Plan](../production/PRODUCTION.md) — QA protocol (§6), milestones, risk register. ·
  [Technical Design](../technical/DESIGN.md) — §11 Testing & QA, systems, tuning constants (§5). ·
  [`STORY.md`](../narrative/STORY.md) — canon. ·
  [Accessibility Plan](../accessibility/ACCESSIBILITY.md) — the full a11y audit track.

### 13.5 Change log

| Version | Date | Notes |
| --- | --- | --- |
| 1.0 | 2026-07-06 | First QA & Test/Review Plan. Consolidates Production §6 and DESIGN §11, and **promotes the worktree `PLAYTESTING.md`** into the doc suite as the automated-harness section (§6). Adds the enumerated test-case catalog (§5), traceability to PRD requirements (§13.1), severity/triage (§9), regression triggers (§10), the release sign-off (§11), and the Expansion v2 QA delta (§12, build: PLANNED). |
| 1.1 | 2026-07-06 | **M-P QA pass corrections.** Fixed the §6.6 doctored-save recipe against source — region key `city_hall` → `cityhall`, node → `charter_vault`, and `discoveredTruths` now uses **truth ids** (`you`/`signal`/`project_haven`), not region keys. Corrected the spoiler-audit canon ref `STORY.md §4/§7` → `§2/§4` (QA-CONTENT-2, §7.2). Added **§6.8 browserless integrity checks** (build + Phase-3 map + save-schema), all green on 2026-07-06. |

*End of document.*
