# Dead Signal — Product Requirements Document

| | |
| --- | --- |
| **Version** | 2.1 (supersedes the original root `prd.md`, now removed) |
| **Status** | Living — reflects the shipped build |
| **Last updated** | 2026-07-06 |
| **Owner** | Jharek (product/design/dev) |
| **Canon source** | [`STORY.md`](../narrative/STORY.md) |
| **Companion docs** | [GDD](../design/GDD.md) · [Technical Design](../technical/DESIGN.md) |

> **Purpose.** This PRD defines *what* Dead Signal is, *who* it's for, and *what must be true* for it
> to ship. It is the product-and-requirements lens; the [GDD](../design/GDD.md) covers *how it plays*
> and [`DESIGN.md`](../technical/DESIGN.md) covers *how it's built*. Narrative canon defers to
> [`STORY.md`](../narrative/STORY.md).

---

## 1. Overview

**Dead Signal is a deterministic, hand-authored text-message survival mystery.** You wake in the city
of Harwick with no memory and a dying phone, guided by a stranger's texts toward a broadcast called
Haven — and discover the evidence you find along the way is about you. The game is played entirely
through a phone interface: reading messages, tapping choices, managing survival resources, and
assembling a case file. It runs **100% offline** — no AI, no API keys, no network calls.

**One-line positioning:** *Lifeline*'s intimacy meets *SOMA*'s dread, in a survival game that turns
the genre on the player.

---

## 2. Problem & opportunity

**The opportunity.** Text-message / interactive-fiction games have a passionate audience (*Lifeline*,
*A Dark Room*, *Device 6*) but the format is underexplored for a *mystery with a real twist* and a
*survival economy that carries dramatic weight*. Most texting games are either pure choose-your-own
prose or real-time gimmicks. Few use the medium to make the player **complicit** in the story's
horror.

**The product bet.** A short, dense, offline narrative game that:

1. Uses the phone frame as the entire aesthetic (low art cost, high immersion, mobile-native).
2. Hides a genuine philosophical horror twist (SOMA-style) under a survival crossing.
3. Is fully deterministic — canon-safe, replayable, and shippable anywhere with no backend.

**Why now / why us.** The core is already built and playable (see §9). The work is finishing to a
professional standard: documentation, polish, accessibility, localization, and release.

---

## 3. Goals & success metrics

### Product goals

- **G1 — Deliver a complete, coherent mystery.** The prologue cracks it; Phase 3 answers it; the
  finale lands. No plot holes (canon governed by `STORY.md`).
- **G2 — Make survival feel dramatic, not clerical.** Battery scarcity should read as tension, not
  bookkeeping.
- **G3 — Ship offline and deterministic.** Identical experience for every player, no backend.
- **G4 — Be broadly playable.** Mobile-first, installable, no-reflex input, accessible by design.
- **G5 — Reward replay.** Route variety + a completion meta-loop + two endings.

### Success metrics (targets to instrument at release)

| Metric | Target | Rationale |
| --- | --- | --- |
| Prologue completion rate | ≥ 60% of starters reach Haven | The crossing shouldn't lose most players |
| Phase 3 entry rate | ≥ 50% of prologue-finishers continue | The handoff should pull players in |
| Full-arc completion (an ending) | ≥ 30% of starters | Short game; completion should be strong |
| Both-endings / replay rate | ≥ 15% | Validates the meta-loop |
| Crash / error rate | < 0.5% of sessions | Determinism should make this near-zero |
| Median prologue session | 30–60 min | Design-intended length |

> Metrics are **local/opt-in only** (privacy pillar, §7.2). No telemetry ships without an explicit,
> documented opt-in.

---

## 4. Non-goals

- **Not** a live-service or content-treadmill game. It is a finite, authored experience.
- **Not** AI/LLM-driven. Live narration was prototyped and deliberately removed (see [`PLAN.md`](../production/PLAN.md)).
- **Not** a combat game. Combat is a narrative device, intentionally shallow (GDD §7.3).
- **Not** multiplayer, not social, not networked.
- **Not** monetized in this build. Pricing/packaging is a separate future decision.
- **Not** expanding *mechanics* pre-release (the `STORY.md` §9 stop-doing list; GDD §14). **Note:**
  the sanctioned **Expansion v2** work (Echoes, region sub-stories, the unchosen, truth-by-assembly, the
  prologue second act; F-20–F-23) is *narrative depth, not new systems* — it is explicitly **in scope**
  as the answer to the story reading shallow/short, and adds no combat/survival mechanics.

---

## 5. Target audience & personas

**Primary audience.** Narrative-game and interactive-fiction players; fans of *Lifeline*, *A Dark
Room*, *SOMA*, *Her Story*, *80 Days*. Comfortable reading; want a story with teeth. Mobile-first.

| Persona | Who | What they want | How we serve them |
| --- | --- | --- | --- |
| **The IF reader** ("Maya") | Plays *80 Days*, *Lifeline* on a phone in bursts | A tight, well-written mystery; meaningful choices | Phone-native, short sessions, a real twist |
| **The dread-seeker** ("Sam")| *SOMA*, *Silent Hill*, existential horror | Atmosphere and an idea that lingers | Restraint aesthetic; the upload horror; ambiguous endings |
| **The completionist** ("Devs")| Wants 100% and every ending | Systems to master, content to uncover | Case File meta-loop, 3 routes, 2 endings |
| **The accessibility-first player** | Needs no-reflex, readable, pausable play | To actually be able to play it | No-twitch design, pause-freezes-dialogue, muted-playable |

**Anti-persona.** Players seeking action, fast reflexes, or systemic sandbox freedom — Dead Signal is
deliberately not for them.

---

## 6. Platforms & technical constraints

- **Primary platform:** Web, delivered as an installable **PWA** (mobile-first, desktop-supported).
- **Tech stack:** React 18, Vite 5, Tone.js 15 (procedural audio). Single-file game component
  (`src/DeadSignal.jsx`). Full detail in [`DESIGN.md`](../technical/DESIGN.md).
- **Offline:** must run with **no network** after load — no API keys, no fetches.
- **Persistence:** local only. Three save slots; a `localStorage` shim for standalone builds.
- **Distribution:** GitHub Pages workflow today; store/wrapper options (mobile app shells) are a
  future production decision.
- **Constraints to respect:** iOS Safari audio-unlock and standalone-PWA quirks (handled in
  `audio.js` / `main.jsx`); small-screen string budgets (a localization concern).

---

## 7. Product requirements

Priority: **P0** = required to ship · **P1** = strongly wanted · **P2** = nice-to-have.
Status: ✅ shipped · 🔧 polish · 🔜 planned.

### 7.1 Functional requirements

**Narrative & flow**

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| F-1 | Linear survival prologue: wake → contact → cross by one of 3 routes → shelter → Haven | P0 | ✅ |
| F-2 | Prologue ends on the call and **auto-flows** into Phase 3 (no dead-end completion screen) | P0 | ✅ |
| F-3 | Phase 3 hub-and-spoke investigation; 4 truth regions with progressive gating | P0 | ✅ |
| F-4 | Finale: final call + **Accept/Refuse**, two definitive endings, recorded per slot | P0 | ✅ |
| F-5 | Strict spoiler discipline: prologue cracks, Phase 3 answers (per `STORY.md`) | P0 | 🔧 |
| F-20 | **Echoes** — recoverable fragments of the 142 minds (7-face cast); new `ECHOES` Case File category (Expansion v2) | P1 | 🔜 |
| F-21 | **Region sub-stories** + the *unchosen* thread; Phase-3 nodes ~2× (~35 → ~65) (Expansion v2) | P1 | 🔜 |
| F-22 | **Truth-by-assembly** — a region's truth resolves from its 2–3 supporting facts (Expansion v2) | P1 | 🔜 |
| F-23 | **Prologue second act** — route midpoints, the shelter as a scene, deeper Ellie; spoiler-safe (Expansion v2) | P2 | 🔜 |

**Systems**

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| F-6 | Survival economy: battery, charger reserve, food, water, HP, noise | P0 | ✅ |
| F-7 | Battery = life in P1–2; softens to exploration pressure in P3 | P0 | ✅ |
| F-8 | Encounters via shared resolver with readable, computed risk tiers | P0 | ✅ |
| F-9 | Three routes with distinct resource identities + unique clue/fragment pools | P0 | ✅ |
| F-10 | Case File: board (memories/clues/people/locations) + journal (facts/questions) | P0 | ✅ |
| F-11 | Evolving Open Questions + contradictions (NEW/UPDATED QUESTION cards) | P1 | ✅ |
| F-12 | Per-slot progression accumulating toward 100% across runs | P1 | ✅ |

**Presentation & shell**

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| F-13 | Phone-native UI: message bubbles, HUD (signal/battery anchored), intent-coded choices | P0 | ✅ |
| F-14 | Human-paced Ellie texts; italic centered narrator; pause freezes dialogue | P0 | ✅ |
| F-15 | Title/menus, 3-slot save/load, Options (volume+mute), spoiler-safe Story page | P0 | ✅ |
| F-16 | Procedural audio incl. the story-gated Signal-distortion cue; fully playable muted | P1 | ✅ |
| F-17 | Installable PWA (manifest, icons, iOS meta) + marketing/demo shell | P1 | ✅ |
| F-18 | Accessibility options: text-speed/instant reveal, contrast/scaling, audio-cue visual equiv. | P1 | 🔜 |
| F-19 | Localization: externalized strings + ≥1 non-English language | P2 | 🔜 |

### 7.2 Non-functional requirements

- **NFR-1 — Offline & deterministic (P0).** No network dependency post-load; identical outcomes given
  identical input. Zero API calls in production (verified; see `PLAN.md` M4).
- **NFR-2 — Performance (P0).** Boots fast on mid-range mobile; smooth message/scroll on small
  screens; Tone.js lazy-loaded off the initial bundle.
- **NFR-3 — Reliability (P0).** No broken build between milestones; saves load forward across schema
  changes (missing fields default). Crash rate < 0.5% (§3).
- **NFR-4 — Privacy (P0).** No data leaves the device by default. Any future telemetry is opt-in and
  documented.
- **NFR-5 — Accessibility (P1).** WCAG 2.2 AA baseline; no reflex-gated beats; muted-playable. Full
  plan in [`../accessibility/`](../accessibility/).
- **NFR-6 — Localization-readiness (P2).** String architecture that supports externalization without
  refactoring the game logic. Plan in [`../localization/`](../localization/).
- **NFR-7 — Maintainability (P1).** Canon and systems documented; tuning knobs centralized and named.

---

## 8. Release criteria (definition of done)

A build is release-ready when **all P0** functional and non-functional requirements are ✅ **and**:

1. A player can complete the **full arc** (start → an ending) on mobile and desktop with **zero
   console errors** and **zero network calls**.
2. Both endings are reachable and correctly recorded; saves survive a schema round-trip.
3. **No spoiler leaks** in any public surface (store copy, README, in-game Story page), verified
   against `STORY.md` §2/§4.
4. Narrative is **canon-consistent** — a full consistency pass against `STORY.md` finds no
   contradictions.
5. The PWA installs and runs offline on iOS Safari and Android Chrome; audio unlocks or safely
   no-ops.
6. Core-screen accessibility smoke test passes (readable, pausable, muted-playable, no-twitch).

> Localization (F-19) and the full accessibility option set (F-18) are **P1/P2** — desired for a
> polished launch but not blocking a first release. They have their own delivery tracks.

---

## 9. Current state (what's built)

The playable spine is **complete**; current work is polish and consistency.

- **Prologue:** apartment wake, Ellie contact and identity setup, prep beats, route selection; full
  Phase-2 crossing on all three routes with atmosphere, encounters, memory fragments, and route
  clues; shelter; Haven approach; the empty-Haven finale with the impossible **143** record and the
  call.
- **Phase 3:** Haven hub + four truth spokes (Mercy General, Communications Array, City Hall,
  Research Annex) with progressive gating; the finale call; **Accept/Refuse** endings.
- **Systems:** survival economy with centralized tuning; shared encounter resolver with computed
  risk tiers; the declarative lead-queue exploration; the Case File (board + journal + evolving
  questions + contradictions), persisted per slot.
- **Shell:** title/menus, three save slots, Options, pause-freezes-dialogue, procedural audio,
  installable PWA, browser demo, GitHub Pages deploy.

See the [GDD](../design/GDD.md) §13 for the full content inventory and [`DESIGN.md`](../technical/DESIGN.md)
for the technical state.

**Planned next — Expansion v2 (design-locked; build: PLANNED).** A narrative-depth pass, specified in
the docs but **not yet in the game**: the **Echoes** (the 142 minds given voices, 7-face cast) as a new
`ECHOES` Case File category; **region sub-stories** roughly doubling Phase-3 nodes; the **unchosen**
moral thread (*why only 143*); **truth-by-assembly**; and a **prologue second act**. Requirements
F-20–F-23; full canon in `STORY.md` "Changelog — Expansion v2". This PRD tracks it as planned scope so
current-state claims stay accurate (nothing here is shipped).

---

## 10. Milestones & roadmap (high-level)

Full schedule, exit criteria, and risk burndown belong to the **Production Plan**
([`../production/`](../production/), planned). At a glance:

| Phase | Focus | State |
| --- | --- | --- |
| **Core build** | Prologue + Phase 3 + finale + endings | ✅ Done |
| **Polish** | Pacing, HUD readability, save/load, mobile, spoiler alignment | 🔧 In progress |
| **Docs & pipeline** | GDD, PRD, DESIGN, then Production/Audio/Art/Loc/Access | 🔧 In progress |
| **Accessibility & localization** | F-18 / F-19 tracks | 🔜 Planned |
| **Expansion v2 (narrative depth)** | Echoes, region sub-stories, the unchosen, truth-by-assembly, prologue second act (F-20–F-23) — docs done; code planned | 🔜 Planned |
| **Release** | Meet §8 criteria; store/distribution decision | 🔜 Planned |

---

## 11. Dependencies & risks

**Dependencies**

- `STORY.md` as the canon authority for every narrative requirement.
- Tone.js for audio; React/Vite for the app; GitHub Pages for delivery.
- iOS Safari behavior for PWA/audio (external, must be tested, not controlled).

**Top risks** (full register in the Production Plan)

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Spoiler leak breaks the mystery | High | Spoiler discipline codified; public-copy review vs. vault |
| Narrative drift across docs/build | High | Single source of truth (`STORY.md`); standing consistency pass |
| Localization debt (hardcoded strings) | Med | Externalize early; loc is on the critical path (§7.2 NFR-6) |
| iOS PWA/audio quirks | Med | Existing unlock/resume handling; keep under device test |
| Solo-dev bandwidth | Med | Phased docs; hard non-goals; polish over expansion |

---

## 12. Open questions

- **Distribution & monetization.** Web-only free release, or wrap for mobile stores / itch / Steam?
  Pricing? (Out of scope for this build; must be decided before launch.)
- **Localization scope.** Which languages ship first, and is loc a launch blocker or a fast-follow?
- **Telemetry.** Do we want *any* opt-in metrics to validate §3, or stay fully local?
- **Phase 3 economy.** Should Phase 3 set its own low starting battery rather than inherit? (Design
  lever; see GDD §15.)
- **Expansion v2 held options.** Ship **U2** (a dedicated *citizen-shelter* region for the unchosen)
  and/or **X1** (endings shaded by what the player recovered)? Both are documented and out of the
  current pass; picking them up is an author's-call scope decision.

---

## 13. Appendix

### 13.1 Related documents

- **Design:** [GDD](../design/GDD.md) — how it plays.
- **Engineering:** [Technical Design](../technical/DESIGN.md) — how it's built.
- **Narrative canon:** [`STORY.md`](../narrative/STORY.md).
- **Docs hub:** [`../README.md`](../README.md).
- **Historical:** [`PLAN.md`](../production/PLAN.md) — AI-removal + battery-economy roadmap (complete).

### 13.2 Change log

| Version | Date | Notes |
| --- | --- | --- |
| 2.1 | 2026-07-06 | Added Expansion v2 as planned scope: requirements F-20–F-23 (Echoes, region sub-stories + the unchosen, truth-by-assembly, prologue second act), §9 planned-next note, roadmap row, non-goals reconciliation, held options (U2/X1). All flagged build: PLANNED — nothing shipped. |
| 2.0 | 2026-07-06 | Full rewrite into a proper PRD: goals/metrics, personas, prioritized functional + non-functional requirements, release criteria, roadmap, risks. Supersedes the root `prd.md` build-status note. |
| 1.0 | 2026-07 | Original root `prd.md` — a build-status summary. |

*End of document.*
