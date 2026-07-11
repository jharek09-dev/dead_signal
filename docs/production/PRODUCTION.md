# Dead Signal — Production Plan

| | |
| --- | --- |
| **Version** | 1.8 |
| **Status** | Living — active plan from current build to release |
| **Last updated** | 2026-07-10 |
| **Owner** | Jharek (production/design/dev) |
| **Supersedes** | [`PLAN.md`](PLAN.md) (the completed M0–M8 AI-removal + battery roadmap — now historical) |
| **Companion docs** | [PRD](../product/PRD.md) · [GDD](../design/GDD.md) · [Technical Design](../technical/DESIGN.md) · canon [`STORY.md`](../narrative/STORY.md) |

> **Purpose.** The single plan for getting *Dead Signal* from its current shipped-spine state to a
> polished release: what's done, what's left, in what order, how we gate each step, how we test, and
> how we ship. The [PRD](../product/PRD.md) defines *what must be true to ship* (release criteria);
> this document defines *how we get there*.
>
> **Working model.** Solo developer. The plan is therefore **dependency- and criteria-driven, not
> calendar-driven** — milestones are sequenced by what unblocks what, and each has explicit exit
> criteria. Target dates are the author's to set against these gates. The one inviolable rule
> (inherited from `PLAN.md`): **the game must boot and play at every checkpoint — never leave a
> broken build between milestones.**

---

## Table of contents

1. [Current state](#1-current-state)
2. [Development status by area](#2-development-status-by-area)
3. [Roadmap & milestones](#3-roadmap--milestones)
4. [Scope ledger](#4-scope-ledger)
5. [Risk register](#5-risk-register)
6. [QA & playtest protocol](#6-qa--playtest-protocol)
7. [Release process & runbook](#7-release-process--runbook)
8. [Post-launch](#8-post-launch)
9. [Dependencies & assumptions](#9-dependencies--assumptions)
10. [Appendix](#10-appendix)
11. [Expansion v2 (Narrative Depth) — work track](#11-expansion-v2-narrative-depth--work-track)

---

## 1. Current state

**The playable spine is complete.** A player can start, cross Harwick by any of three routes, reach
the empty Haven, auto-flow into the Phase 3 investigation, uncover all four truths, and reach either
ending — offline, deterministic, with zero API calls. What remains is **polish, the documentation
suite, accessibility, localization, and release hardening** — not core construction.

| Dimension | Reality |
| --- | --- |
| **Core game** | ✅ Shipped: prologue + Phase 3 (4 truth spokes) + finale + 2 endings |
| **Determinism** | ✅ No AI, no network, no API keys (verified — `PLAN.md` M4) |
| **Persistence** | ✅ 3 slots, per-slot profiles, forward-compatible save schema |
| **Delivery** | ✅ Installable PWA + GitHub Pages CI deploy |
| **Docs** | 🔧 In progress: GDD/PRD/DESIGN + this plan done; Audio/Art/Loc/Access queued |
| **Accessibility** | 🔜 Structural advantages in place; option set + audit not yet built |
| **Localization** | 🔜 Not started — blocked on string externalization |
| **Release hardening** | 🔜 Platform matrix pass, spoiler audit, store/distribution decision pending |

---

## 2. Development status by area

Priority: **P0** ship-blocking · **P1** wanted for a polished launch · **P2** post-launch-ok.

| Area | Status | Priority | Notes |
| --- | --- | --- | --- |
| Prologue (P1–P2, 3 routes) | ✅ Done | P0 | Ongoing pacing/HUD polish only |
| Phase 3 investigation | ✅ Done | P0 | 4 regions, gating, Case File evolution |
| Finale + endings | ✅ Done | P0 | Accept/Refuse, recorded per slot |
| Survival economy + tuning | ✅ Done | P0 | Centralized knobs; Phase-3 economy an open lever |
| Encounter resolver + risk tiers | ✅ Done | P0 | Single source of truth for odds + tags |
| Case File (board + journal) | ✅ Done | P0 | Contradictions + evolving questions |
| Audio engine | ✅ Done | P1 | Procedural; Signal-distortion cue gated |
| PWA + deploy | ✅ Done | P1 | Manifest, icons, iOS meta, Pages CI |
| **Spoiler/canon consistency pass** | 🔧 Ongoing | **P0** | Standing gate before any release |
| **Documentation suite** | 🔧 In progress | P1 | GDD/PRD/DESIGN/Production done; 4 docs left |
| **Expansion v2 (Narrative Depth)** | 🚧 M-EXP stage 3 started | P1 | Canon ✅; doc propagation ✅; content/code **in progress** (M-EXP, §11) — Echoes + all five region sub-story node sets + U1 built (Phase 3 59 nodes, ≈2×); S1 + prologue second act next |
| **Accessibility option set** | 🔜 Planned | P1 | Text-speed, contrast/scaling, audio-cue visual equiv. |
| **Localization** | 🔜 Planned | P2 | Externalize strings first |
| **Mobile platform matrix** | 🔜 Planned | P0 | iOS Safari + Android Chrome, installed + in-browser |
| **Distribution/monetization decision** | 🔜 Open | P1 | Web-only vs. store wrappers; pricing |

---

## 3. Roadmap & milestones

The path to release, in dependency order. Each milestone lists its **goal** and **exit criteria**
(the gate that says it's done). Milestones can overlap where they don't block each other.

### M-P — Polish & Consistency `P0` ✅ *COMPLETE (2026-07-06)*
- **Goal:** the shipped spine reads as finished — pacing, HUD readability, save/load robustness,
  mobile presentation, and full spoiler/canon alignment across every public surface.
- **Exit criteria & status** *(QA pass 2026-07-06 — headless where a browser wasn't available)*:
  - **Production build clean** — `npm run build` transforms all 995 modules, zero errors. ✅
  - **Zero network calls** — no external calls in the app; Tone.js loads as a bundled local chunk
    (`import("tone")`), not a request. Determinism pillar intact. ✅
  - **Console-clean by construction** — the only `console.warn`s are the dev-only map/label/day1
    validators (`import.meta.env.DEV` / `GATE_BYPASS`), no-op in a production build. The Phase-3 map
    integrity validator runs **clean** — 5 regions / 59 nodes (34 shipped + 5 per region across all five, from the
    Expansion-v2 deepening; → ~65 target), no dead ends, dangling exits,
    unreachable nodes, or choice-cap soft-locks. ✅ *(headless)*
  - **Live per-route playthrough** (hospital / metro / route 9) — **verified 2026-07-06** in a live
    browser via the QA auto-driver ([`docs/qa/QA.md` §6](../qa/QA.md#6-automated-qa-harness)): all three
    prologues + crossings driven to Haven, and the hospital run through Phase 3 to **both** endings
    (Accept + Refuse), ~440 choices total — **zero console errors, zero network calls**. The only
    console output was the dev-only choice-cap `warn` (`GATE_BYPASS`, compiled out of production). ✅
  - **No spoiler leaks** — README, demo shell (`BrowserDemo.jsx`, `demo.html`), in-game Story screen,
    and PWA meta (`index.html`, manifest) audited vs. `STORY.md` §2 (locked truths / Phase-3 reveals)
    and §4 (tone & writing rules). All public copy spoiler-safe; the infected stay "not what it used
    to be," Ellie is "a stranger," endings withheld. ✅
  - **Case File + location labels correct end-to-end** — region/node labels, the location HUD
    (`locationLabel`/`areaLabel`), board categories (MEMORIES 9 · CLUES 3 · TRUTHS 4 · PEOPLE 3 ·
    LOCATIONS 5), and the truthId↔region mapping all consistent; no id mismatches. ✅
  - **Save→reload→resume** restores a safe state on all three slots — schema logic (`validRun` /
    `normalizeSlot` / v1→v2 migration / junk cleanup / mid-beat save refusal) verified **7/7**
    headlessly; slots are per-slot-uniform. ✅ *(device 3-slot pass folded into §6.3)*

### M-DOC — Documentation Suite `P1` 🔧 *in progress*
- **Goal:** complete the professional doc set.
- **Exit criteria:** GDD ✅, PRD ✅, DESIGN ✅, Production ✅ (this doc), then **Audio Bible**,
  **Art Bible + SVG wireframes**, **Localization Plan**, **Accessibility Plan** — each written to MD
  source + polished Word/PDF export, indexed in [`docs/README.md`](../README.md).
- **Sequence (agreed):** Production → Audio → Art+wireframes → Localization → Accessibility.

### M-EXP — Expansion v2 (Narrative Depth) `P1` 🚧 *stage 3 started — Echoes system live; nodes / S1 / prologue next*
- **Goal:** implement the sanctioned narrative-density pass — Echoes, region sub-stories, the
  unchosen thread, truth-by-assembly, and the prologue second act — **as authored text + nodes only,
  no new mechanics** (`STORY.md` §9 carve-out). Full deliverable list and staging in [§11](#11-expansion-v2-narrative-depth--work-track).
- **Staging (hard gate order):** (1) `STORY.md` canon ✅ **done** → (2) design-doc propagation 🔧 **in
  progress** (this edit + GDD/PRD/DESIGN) → (3) content authoring + code integration 🔜 **future**.
  This milestone's *code* work does not start until the doc propagation lands; **this pass is DOCS
  ONLY.**
- **Depends on:** M-P clean (the shipped spine and its truths/gates/endings are the fixed base this
  layers onto and must not disturb) + doc propagation complete.
- **Exit criteria:** ~14 Echo fragments + 7-face cast authored and wired to the new `ECHOES` Case
  File category; ~30 new Phase-3 nodes integrated (region sub-stories, U1 unchosen thread) taking
  Phase 3 from ~35 → ~65 nodes; S1 truth-by-assembly live (each region truth resolves only after its
  2–3 supporting pieces are found); prologue second act (P1–P3) integrated spoiler-safe; every shipped
  truth, gate, and both endings **unchanged**; loc/a11y deltas from the added text logged (§5, §11);
  full regression bar (§6.1) green.

### M-A11Y — Accessibility `P1` 🔜
- **Goal:** deliver the accessibility option set and pass an audit to WCAG 2.2 AA baseline.
- **Depends on:** Accessibility Plan (M-DOC).
- **Exit criteria:** text-speed/instant-reveal option; contrast + scaling verified against the
  `#070707` canvas; a visual equivalent for the Signal audio cue; photosensitivity audit of the
  distortion effect passed; keyboard-navigable; content/trauma notes surfaced; muted-playable
  confirmed end-to-end.

### M-LOC — Localization `P2` 🔜
- **Goal:** the game is translatable and ships at least one non-English language.
- **Critical path:** **string externalization** — strings are hardcoded inline in `DeadSignal.jsx`
  today; nothing else in loc can start until they're extracted.
- **Depends on:** Localization Plan (M-DOC).
- **Exit criteria:** externalized string catalog; pseudo-loc pass with no truncation/overflow on a
  phone screen; ≥1 language integrated and LQA'd; culturalization decisions logged for the
  `143`/`KIM → ELLIE` motifs.

### M-RC — Release Candidate `P0` 🔜
- **Goal:** all PRD **P0** release criteria met; the build is a candidate.
- **Depends on:** M-P, plus the platform matrix pass.
- **Exit criteria (from [PRD §8](../product/PRD.md#8-release-criteria-definition-of-done)):** full
  arc completable on mobile + desktop, zero console errors, zero network calls; both endings
  reachable and recorded; save schema round-trips; PWA installs and runs offline on iOS Safari +
  Android Chrome; core-screen accessibility smoke test passes; **no spoiler leaks**; **canon
  consistency pass clean**.

### M-LAUNCH — Release `P0` 🔜
- **Goal:** ship.
- **Depends on:** M-RC + the distribution decision (§7, §9).
- **Exit criteria:** tagged release; production deploy green; store/listing (if any) live; launch
  runbook (§7) executed.

### M-POST — Post-launch `P2` 🔜
- **Goal:** support and complete the P1/P2 tracks that didn't gate launch (loc, extra a11y).
- **Exit criteria:** rolling — see §8.

```
M-P (polish) ──────────────┐
                           ├──► M-RC ──► M-LAUNCH ──► M-POST
M-DOC ─► M-A11Y ───────────┘            (loc + Expansion v2 can land pre- or post-launch)
        ├─► M-LOC ....................................▲
        └─► M-EXP (docs → content/code) ..........................▲
             (§11; DOCS-ONLY now, content/code a later milestone)
```

---

## 4. Scope ledger

The discipline that keeps a solo project shippable. Canonical stop-doing list is `STORY.md` §9;
this formalizes it for production.

### In scope (to release)
Polish of the shipped spine; the documentation suite; accessibility option set; the mobile platform
matrix; spoiler/canon hardening; release + deploy. Localization is in scope but may land as a
fast-follow (P2).

**Expansion v2 (Narrative Depth) — in scope as authored content, staged after the docs (M-EXP, §11).**
The sanctioned narrative-density pass: Echoes, region sub-stories, the unchosen thread (U1),
truth-by-assembly (S1), the prologue second act (P1–P3). This is **authored text + node work only** —
no new mechanics — under the `STORY.md` §9 carve-out. The current pass is **docs-only**; content
authoring + code integration is a separate later milestone that can land pre- or post-launch.

### Out of scope (explicitly not doing)
- More encounter types, more random exploration beats, more Haven flavor text, more survival
  mechanics — the investigation layer and regions are the game.
- **More combat depth** — combat's meaning is delivered in Phase 3, not through mechanics.
- Any return to live-LLM / networked narration — determinism is a product pillar.
- Multiplayer, social, accounts, cloud saves.
- **The Expansion v2 §9 carve-out is narrowly scoped:** it sanctions *narrative density* (authored
  text + nodes), **not** new systems. New combat/survival/encounter mechanics remain out of scope even
  during M-EXP. Restraint (`STORY.md` §4) is the ceiling on the pass.

### Held open (documented, not in this pass)
- **U2 — a dedicated citizen-shelter region for the unchosen** (a thematic region holding no new
  truth). Specified in `STORY.md` §5 so it can be picked up later without re-planning; **not scheduled
  for M-EXP.**
- **X1 — ending-texture shading** (the same two ending screens shaded by what the player recovered).
  Documented (`STORY.md` §5); **not in this pass.**

### Cut (built then removed — do not resurrect without cause)
- **Real-time wall-clock day gates** (Lifeline-style) — designed, built, dropped for smooth
  prologue→Phase 3 flow; scaffolding left dormant behind `?gates` (`STORY.md` changelog #8).
- **Live Claude/API narration** — removed in favor of authored content (`PLAN.md` M4).
- The standalone `phase2_complete` "to be continued" screen — culled; the prologue auto-flows.

---

## 5. Risk register

Likelihood (L) / Impact (I): H/M/L. Ordered by severity.

| # | Risk | L | I | Mitigation | Trigger to act |
| --- | --- | --- | --- | --- | --- |
| R1 | **Spoiler leak** into public copy breaks the mystery | M | H | Spoiler discipline codified (GDD §4.5); public-copy audit vs. `STORY.md` is an M-RC gate | Any new store/marketing/Story-screen copy |
| R2 | **Narrative/canon drift** across docs + build | M | H | `STORY.md` single source of truth; standing consistency pass; docs defer to canon | Any edit touching story or a doc |
| R3 | **iOS Safari PWA/audio quirks** (unlock fails, standalone bugs) | M | M | Existing unlock/resume handling in `audio.js`; explicit device matrix in M-RC | Any audio/PWA change; new iOS version |
| R4 | **Localization debt** (hardcoded strings) grows | H | M | Externalize early (M-LOC critical path); treat as a refactor, not a feature | Before committing to any launch language set |
| R5 | **Solo-dev bandwidth** stalls burndown | H | M | Phased docs; hard non-goals (§4); polish over expansion; criteria-gated milestones | Any milestone slipping without a blocker |
| R6 | **Save-schema regression** corrupts progress | L | H | Forward-compatible defaults; save round-trip in the QA bar; migrations tested | Any change to snapshot/profile shape |
| R7 | **Scope creep** re-opens "done" systems | M | M | Scope ledger (§4); changes to cut/out items need a written reason | Any request to add mechanics/combat |
| R8 | **Distribution/monetization undecided** blocks launch | M | M | Decide before M-LAUNCH (§9); web-only is a valid default | Entering M-RC |
| R9 | **`DeadSignal.jsx` size** slows iteration/onboarding | M | L | Optional data-block extraction (DESIGN §13); no architecture change | When navigation cost bites |
| R10 | **Expansion v2 scope growth** erodes the restraint pillar (Phase 3 ~35 → ~65 nodes) | M | M | Sanctioned carve-out is **narrative density only**, not mechanics (`STORY.md` §9); node budget capped at ~2×; U2/X1 held open (§4); truths/gates/endings frozen; restraint (§4) is the ceiling and an M-EXP exit gate | Any M-EXP item proposing a new mechanic, a new truth, or nodes beyond ~2× |
| R11 | **Loc + a11y load grows** with ~2× Phase-3 text (Echoes + sub-stories) | M | M | Size M-LOC/M-A11Y against the larger post-Expansion string set, not today's; author Expansion strings *before* string externalization commits, or plan a second extraction pass; a11y (text-speed/contrast) already covers new text | Committing to a launch language set or the externalization refactor while M-EXP content is unwritten |

---

## 6. QA & playtest protocol

Determinism makes QA tractable: outcomes are reproducible, so a failure is a real bug, not variance.

### 6.1 Standing regression bar (every release)
- **Full start→ending playthrough per route** (hospital / metro / route 9) with **zero console
  errors** and **zero network calls**.
- **Both endings** reachable and correctly recorded (`profile.ending`).
- **Save round-trip:** save → reload → resume restores a safe decision point; legacy saves migrate.
- **Production build** compiles clean.

### 6.2 Automated QA (the established methodology)
The project has a proven browser-automation QA harness — now a first-class asset in the QA plan,
[`docs/qa/QA.md` §6](../qa/QA.md#6-automated-qa-harness) (promoted from the QA worktree; its
doctored-save region-id / truth-id recipe was corrected against source on 2026-07-06). Recipes below,
verified against source:
- **Dev flags:** `?debug` enables `GATE_BYPASS` + a `skip (dev)` button + an audio diagnostic
  overlay + choice-cap warnings (also on in any Vite dev build); `?gates` activates the dormant
  real-time day gates for resting-screen/countdown testing.
- **8× time compression** — a `setTimeout` shim to run beat pacing fast without touching `Date.now`.
- **Message logger** — a `MutationObserver` over `.ds-chat` to capture streamed lines.
- **Auto-driver** — clicks real story choices (`button.cb.choice-btn` inside `.ds-choices-pane`),
  with novelty/steered-walker policies; stall detection; case-file/menu recovery.
- **Gate fast-forward** — stub `Date.now` forward to skip the 17-min `DAY_GATE_MS` countdown, then
  restore immediately (a doctored clock poisons autosave timestamps).

### 6.3 Manual playtest matrix
| Axis | Coverage |
| --- | --- |
| Routes | Hospital · Metro · Route 9 (each: ignore-power run + engaged run) |
| Economy | Verify ignore-power scrapes to the intended low; engaged play stays survivable |
| Platforms | iOS Safari, Android Chrome — installed PWA **and** in-browser |
| Save/load | All 3 slots; interrupt mid-leg; resume; delete-confirm flow |
| Endings | Accept and Refuse; replay for the other ending; 100% accrual across runs |

### 6.4 Content gates (pre-release)
- **Canon consistency pass** against `STORY.md` (no contradictions). *(When M-EXP content lands, this
  gate also verifies the Echoes/sub-stories/S1 assembly against the §2/§3/§5/§6 canon, and that no
  shipped truth, gate, or ending changed.)*
- **Spoiler audit** of every public surface (README, browser/demo shell, in-game Story page). *(The
  prologue second act and Echoes must stay spoiler-safe: no Echoes and no answers in the prologue.)*
- **Accessibility smoke test** (readable, pausable, muted-playable, no-twitch).

---

## 7. Release process & runbook

### 7.1 Build & deploy (today)
- **CI:** GitHub Actions (`.github/workflows/deploy.yml`) — on push to `main` (or manual
  `workflow_dispatch`): `npm ci` → `npm run build` → upload `dist/` → deploy to GitHub Pages.
  Single-concurrency (`group: pages`, no cancel-in-progress). Node 20.
- **Manual verify:** `npm run build` + `npm run preview` locally before tagging.

### 7.2 Release checklist
1. Version bump (`package.json`) + a tagged release; note changes.
2. Standing QA bar (§6.1) green on the release build.
3. Content gates (§6.4) passed — **canon + spoiler audits signed off**.
4. Platform matrix (§6.3) passed on device.
5. PWA installs and runs **offline** on iOS Safari + Android Chrome.
6. Public copy reviewed once more for spoilers.
7. Merge to `main` → confirm Pages deploy green → smoke-test the live URL (game + `demo.html#play`).
8. If distributing beyond web (store/itch/wrapper): platform listing + build submitted (see §9).

### 7.3 Rollback
Pages deploys are versioned by commit; roll back by reverting the offending commit and re-running
the workflow (single-concurrency queues, never cancels mid-deploy). Saves are forward-compatible, so
a rollback does not strand player progress.

### 7.4 Versioning
Semver-ish on `package.json` (currently `0.1.0`). Pre-release polish stays `0.x`; the release
candidate that meets all PRD P0 criteria becomes `1.0.0`.

---

## 8. Post-launch

- **Support & hotfixes.** Watch for iOS/Android PWA regressions and save issues; hotfix via the same
  CI. Keep the QA bar as the merge gate.
- **Localization rollout** (if not shipped at launch) — the M-LOC track, language by language.
- **Accessibility follow-ups** — any P1 items deferred from M-A11Y.
- **Telemetry decision.** The PRD success metrics (completion/replay rates) require *some* signal;
  decide between staying fully local (privacy-default) or adding **opt-in, documented** metrics.
  No telemetry ships without an explicit opt-in.
- **Content:** the game is finite by design. Post-launch is support + polish + the loc/access
  tracks — **not** a content treadmill (§4).

---

## 9. Dependencies & assumptions

- **Canon:** `STORY.md` remains the narrative authority for every gate.
- **Toolchain:** React 18 / Vite 5 / Tone.js 15; GitHub Pages for delivery; Node 20 in CI.
- **External, uncontrolled:** iOS Safari PWA/audio behavior — must be tested per release, not assumed.
- **Open decisions that gate launch:**
  - **Distribution & monetization** — web-only free vs. store/itch/Steam wrappers; pricing. Web-only
    is the valid default if undecided by M-RC.
  - **Localization scope** — which languages, and launch-blocking vs. fast-follow.
  - **Telemetry** — any opt-in metrics, or fully local.
  - **Phase-3 battery economy** — inherit P2 tuning or set its own low floor (design lever, GDD §15).

---

## 10. Appendix

### 10.1 Milestone history (complete — for the record)
`PLAN.md` M0–M8, the AI-removal + battery-economy program, is **done and merged**:
M0 safety net · M1 data pools · M2 `localBeat` · M3 swap call sites · M4 delete the AI layer ·
M5 centralize battery drain · M6 charger reservoir · M7 balance pass · M8 invisible route map.
That plan is historical; this document is the living production plan going forward.

### 10.2 Glossary
- **Standing bar** — the regression suite run every release (§6.1).
- **Content gate** — canon + spoiler + a11y checks that block release (§6.4).
- **Critical path** — the dependency that blocks everything after it (e.g. string externalization for loc).
- **Exit criteria** — the objective test that says a milestone is done.

### 10.3 Related documents
- [PRD](../product/PRD.md) (release criteria, requirements) · [GDD](../design/GDD.md) (design) ·
  [Technical Design](../technical/DESIGN.md) (engineering) · [`STORY.md`](../narrative/STORY.md) (canon) ·
  [`PLAN.md`](PLAN.md) (historical).

### 10.4 Change log
| Version | Date | Notes |
| --- | --- | --- |
| 1.0 | 2026-07-06 | First production plan. Supersedes `PLAN.md`. Grounded in the shipped build, the `PLAYTESTING.md` QA methodology, and the Pages CI. |
| 1.1 | 2026-07-06 | Added the **Expansion v2 (Narrative Depth)** work track (§11) + milestone **M-EXP**; scope-ledger in-scope/held-open entries; risk rows R10/R11; §2 status row. Docs-only pass; content/code is a later milestone. |
| 1.2 | 2026-07-06 | **M-P QA pass.** Clean production build + headless Phase-3 map / label / save-schema verification; spoiler audit of all public copy vs `STORY.md` §2/§4; corrected the exit-criteria section ref (`§4/§7` → `§2/§4`); fixed the QA harness doctored-save recipe (region-id / truth-id) in [`docs/qa/QA.md`](../qa/QA.md) §6 and re-pointed §6.2 to it; the same section-ref fix also lands in [PRD §8](../product/PRD.md#8-release-criteria-definition-of-done) and QA.md. Consistency pass complete; one on-device gate (live per-route playthrough) remains. |
| 1.3 | 2026-07-10 | **M-EXP stage 3 started — first exit criterion built.** The `ECHOES` Case File category, recover-Echo mechanic, a dedicated Echo audio cue, and all **14 Echo fragments** across the 7-face cast (+ the half-degraded first-subject echo) are wired into `DeadSignal.jsx` and build-clean (995 modules); homed on existing Phase-3 nodes in their canon regions, spoiler-safe (Phase-3 only), save round-trip extended. Canon flags flipped in `STORY.md` §3/§6. Remaining M-EXP criteria (~30 nodes, S1 truth-by-assembly, prologue second act, E3 Kim-absence beat, loc/a11y logging, regression bar) still open. |
| 1.4 | 2026-07-10 | **M-EXP — ~30-node criterion started, region-by-region: Haven "the last day" built.** 5 new Phase-3 nodes (children's room, infirmary, quiet room/chapel, gate log, bunk 143 = the made-but-empty refused bunk); Phase 3 **34 → 39 nodes**; map integrity re-validated (all reachable, ≤5-choice cap, no dead ends). Theo/Walt echoes re-homed to their canonical rooms. Spoiler-safe (no bodies; the gate log seeds the "left on their own feet" mystery without doing the finale's payoff — an audit nit that conflated the 143rd/Kim was tightened). Haven's truth (Ellie) / gates / endings unchanged. Mercy/Comms/City Hall/Annex sub-stories still to build. |
| 1.5 | 2026-07-10 | **M-EXP — ~30-node criterion, region 2: Mercy "the sealed ward means something" built.** 5 new Phase-3 nodes (ward antechamber, nurses’ station, room 307, day room, charge office); Phase 3 **39 → 44 nodes**; map re-validated (reachable, ≤5-choice cap, no dead ends). Rosa’s `rosa_last` echo re-homed to the nurses’ station. The sealed ward reframed as the dying Haven had no bed for; Rosa’s two-tier care; a patient you’d admitted, not selected, a floor from room 312 — threads the unchosen (U1) **spoiler-safe** (a closed list existed + the care cost; never who authored the roster — held for City Hall — never the upload). Mercy truth (YOU) / gates / endings unchanged. Canon audit PASS. Comms/City Hall/Annex still to build. |
| 1.6 | 2026-07-10 | **M-EXP — ~30-node criterion, region 3: Comms "Kim, dramatized" built + E3.** 5 new Phase-3 nodes (operator's workspace, saved transmissions, recording booth, transmitter control, side door); Phase 3 **44 → 49 nodes**; map re-validated (reachable, ≤5-choice cap, no dead ends). June's `june_lost` echo re-homed to the saved transmissions. The refusal + the warning nobody heard — Kim's counter-broadcast the Haven loop wouldn't let out, June listening, the moment she walked to find the architect. **E3 — the Kim-absence beat — now built at the Signal Core** (you search the running minds for Kim; she isn't there; Haven's board counted 143, the racks come up one short; 'she meant it'). Spoiler-safe per canon audit (PASS): Kim's warning stays moral (never names the upload); the 'architect' stays a lead, not pinned to the player; no Ellie/Annex leak. Comms truth (THE SIGNAL) / gates / endings unchanged. City Hall / Annex still to build. |
| 1.7 | 2026-07-10 | **M-EXP — ~30-node criterion, region 4: City Hall "the selection" built + U1.** 5 new Phase-3 nodes (sub-level, selection office, mail room, applicant files, dissent record); Phase 3 **49 → 54 nodes**; map re-validated. Marcus's `marcus_transfer`/`marcus_form` and June's `june_struck` echoes re-homed to the mail room / applicant files / dissent record. Deepens the truth to **you chose the 143 names** (truth id unchanged) — the scoring criteria, the citizen petitions in their own hand, June's struck dissent ("a lifeboat this small only decides which part of the city drowns"). **U1 question upgrade** shipped: `why only 143?` now sharpens to `who did you leave out — and why?`. Spoiler-safe per canon audit (PASS): **WHY** the cap was 143 (the containment limit) stays HELD for the Annex; no outbreak / "what the end was"; the narrator stays documentary — the moral rides only on June's testimony. City Hall truth (PROJECT HAVEN) / gates / endings unchanged. Annex still to build. |
| 1.8 | 2026-07-10 | **M-EXP — ~30-node criterion, region 5 (LAST): Research Annex "patient zero was a person" built.** 5 new Phase-3 nodes (subject records, first cell, containment office, warning file, decision log); Phase 3 **54 → 59 nodes** — **all five region sub-stories + U1 now complete** (Phase 3 34→59, ≈2× the shipped depth); all 14 echoes re-homed. Sorkin's `sorkin_numbers`/`sorkin_room` and `pz_first` re-homed to the containment office / warning file / first cell. The price of being first (terminal 'volunteers,' the oldest degrading mind) and being right (Sorkin warned you by name, you signed anyway). **Answers why-143** — 143 was the most Sorkin's containment could hold before the breach-risk spiked; you chose 143 clean over waiting, spending the safety margin (the margin was the city). Audit **PASS**: sets up but does not pre-land containment_core's blunt outbreak reveal (infected = half-connected); no finale leak (where the 143 went / what Ellie is / Accept-Refuse held). Annex truth (THE OUTBREAK) / gates / endings unchanged. **Remaining M-EXP criteria: S1 truth-by-assembly, the prologue second act, loc/a11y logging, the regression bar.** |

---

## 11. Expansion v2 (Narrative Depth) — work track

> **Status: DOCS-ONLY pass.** No code exists yet for any item below. Every deliverable is
> **Expansion v2 · build: PLANNED**. Canon is `STORY.md` (§2/§3/§5/§6/§8 + the *Changelog — Expansion
> v2*); it wins every conflict. This section frames the **work** — sequence, deliverables, effort,
> and impact on counts/scope — not the narrative prose.

**Why.** The shipped story read shallow and short for a premium game: each region was a corridor to a
one-paragraph truth-dump, the Signal's 142 minds had no faces, and the deepest question (*why only
143?*) never reached the page. The fix is **narrative density, not mechanics** — authored text and
nodes, under strict restraint (`STORY.md` §4). This is the sanctioned answer to "too shallow / too
short"; it does **not** re-open the §9 stop-doing list on systems.

### 11.1 Sequence — authoring pipeline (hard gate order)

The work runs in three staged phases; **each gate must land before the next starts.**

| Stage | Work | Status | Gate to advance |
| --- | --- | --- | --- |
| **1 — Canon** | Lock all Expansion v2 design in `STORY.md` (Echoes, unchosen, Sorkin, region deepening, S1, prologue second act). | ✅ **Done** | Canon locked, `build: PLANNED` flags set. |
| **2 — Doc propagation** | Fan the locked canon into the design-doc suite (this Production track; GDD/PRD/DESIGN as applicable). No code. | 🔧 **In progress** | Every companion doc reflects the canon; counts/scope tables updated; no contradictions. |
| **3 — Content + code** | Author the ~14 Echoes + 7-face cast, build the ~30 new Phase-3 nodes, wire the `ECHOES` category + S1 assembly, integrate the prologue second act. | 🚧 **In progress (M-EXP)** — Echoes system + **14 fragments** + `ECHOES` category + audio cue done (2026-07-10). **Region nodes (region-by-region):** Haven *"last day"* ✅ **5 nodes** (34→39) + Mercy *sealed ward* ✅ **5 nodes** (39→44) + Comms *Kim dramatized* ✅ **5 nodes + E3** (44→49) + City Hall *the selection* ✅ **5 nodes + U1** (49→54) + Annex *patient zero* ✅ **5 nodes** (54→59); **all five region sub-stories + U1 done, all 14 echoes re-homed**; **next: S1 truth-by-assembly + the prologue second act**. | M-EXP exit criteria (§3) green. |

**Explicit:** stages 1–2 are **documentation only.** Code implementation is **stage 3 (M-EXP)** — a
separate, later milestone. Nothing in this pass ships player-facing content.

### 11.2 Content deliverables (to build in stage 3)

Echoes are **BUILT** (2026-07-10); the rest are **build: PLANNED**. Restraint is the ceiling; the
shipped truths, gates, and both endings are the fixed base and stay **unchanged**.

- **Echoes — ~14 fragments + the 7-face recurring cast. ✅ BUILT (2026-07-10).** All 14 fragments
  authored, the `ECHOES` Case File category + recover-Echo mechanic + a dedicated Echo audio cue are
  live in `DeadSignal.jsx` and build-clean; homed on existing Phase-3 nodes in their canon regions
  (re-home to the new canonical rooms with the ~30-node work). Terse found fragments (2–4 lines) of the
  142 running minds, Phase 3 only, at Signal-dense/powered nodes. Cast: **Theo** (child), **Rosa**
  (Mercy nurse), **Walt** (chose upload — the moral counterweight), **Priya** (recanted too late),
  **Marcus** (his loved one was cut from the list), **Dr. Lena Sorkin** (containment lead who warned
  the architect 3× and went in anyway), **June** (sided with Kim). **Kim is deliberately NOT an
  Echo** — her absence at the Signal Core (E3) is an authored beat, not a fragment.
- **~30 new Phase-3 nodes — region sub-stories** (the human thread under each unchanged plot-truth),
  built region-by-region: **Haven *"last day"* ✅ built** (2026-07-10 — children's room, infirmary,
  quiet room/chapel, gate log, and bunk 143 = the made-but-empty refused bunk; 34→39 nodes; Theo/Walt
  echoes re-homed here; spoiler-safe, no bodies, the gate log seeds "they left on their own feet"
  without doing the finale's payoff) · **Mercy *sealed ward* ✅ built** (2026-07-10 — ward antechamber, nurses’ station, room 307, day room, charge office; 39→44; the un-selected dying / Rosa’s two-tier care; Rosa echo re-homed; sets up U1, spoiler-safe) · **Comms *Kim dramatized* ✅ built** (2026-07-10 — operator's workspace, saved transmissions, recording booth, transmitter control, side door; 44→49; Kim's refusal + the warning nobody heard; June echo re-homed; **E3** Kim-absence beat at the Signal Core; spoiler-safe) · **City Hall *the selection* ✅ built** (2026-07-10 — sub-level, selection office, mail room, applicant files, dissent record; 49→54; you chose 143 names, the unchosen in their own hand, June's struck dissent; Marcus/June echoes re-homed; U1 question upgrade `why only 143?`→`who did you leave out?`; WHY-143 held for the Annex) · **Research Annex *patient zero was a person* ✅ built** (2026-07-10 — subject records, first cell, containment office, warning file, decision log; 54→59; the terminal 'volunteers,' the oldest degrading mind, Sorkin's breach warnings by name, you chose 143 over safety; Sorkin/pz echoes re-homed; **answers why-143** = the containment limit). **All five region sub-stories + U1 complete — Phase 3 34→59 (≈2×).**
- **The unchosen thread (U1)** — *why only 143* threaded (not a new region): City Hall selection +
  Marcus's Echo + Rosa's ward + the evolving Case File question (`why only 143?` → `who did you leave
  out — and why?`).
- **Truth-by-assembly (S1) — Case File work.** A region's truth resolves only after its 2–3 supporting
  pieces are found; the Journal shows the deduction assembling (evidence → deduction → **TRUTH**)
  instead of a single truth-room dump. Applies to all shipped regions; gates/truths/endings unchanged.
- **Prologue second act (P1–P3)** — spoiler-safe depth, **no Echoes, no answers**: a real midpoint per
  route, the shelter as a scene, deeper Ellie (strictly within the crack ladder, §3/§4).

### 11.3 Scope & count deltas (planned)

Updates to the shipped content counts. All figures are **planned targets**, not shipped.

| Metric | Shipped now | Expansion v2 (planned) |
| --- | --- | --- |
| Phase-3 nodes | ~35 | **~65** (region sub-stories + U1; ~2× per region) |
| Case File board categories | `MEMORIES`, `CLUES`, `PEOPLE`, `LOCATIONS`, **`ECHOES`** ✅ | (ECHOES built 2026-07-10) |
| Echo fragments | **14** ✅ | 14 authored + wired (built 2026-07-10) |
| Recurring named cast (Echoes) | **7** ✅ (Theo · Rosa · Walt · Priya · Marcus · Sorkin · June) | + the oldest, half-degraded first-subject echo |
| Truth delivery | single-room truth-dump | **S1 truth-by-assembly** (2–3 pieces → deduction → TRUTH) |
| Region truths / gates / endings | 4 truths, gating, Accept/Refuse | **unchanged** (depth layered on, spine frozen) |
| Prologue | P1–P2, 3 routes | **+ second act** (P1–P3: midpoint/shelter-scene/deeper Ellie) |

### 11.4 Held open (documented, out of this pass)

Specified in `STORY.md` §5 so they can be picked up later without re-planning — **not scheduled for
M-EXP:**
- **U2** — a dedicated citizen-shelter region for the unchosen (thematic region, no new truth; pushes
  toward the top of ~2×).
- **X1** — ending-texture shading (same two ending screens, shaded by what the player recovered).

### 11.5 Production risks (see §5)

- **R10 — scope growth vs. restraint.** ~2× Phase-3 nodes is a real content jump; the carve-out
  sanctions *density only*, node budget is capped at ~2×, U2/X1 stay held, and truths/gates/endings
  are frozen. Restraint (§4) is an M-EXP exit gate.
- **R11 — loc + a11y load.** ~2× Phase-3 text enlarges the loc string set and the a11y surface; size
  M-LOC/M-A11Y against the post-Expansion text and coordinate Expansion authoring with the string
  externalization refactor (author first, or plan a second extraction pass).

*End of document.*
