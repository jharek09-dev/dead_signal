# Dead Signal — Documentation

The single organized home for every design, product, and production document behind
**Dead Signal**, a deterministic text-message survival mystery.

> **Narrative canon lives in [`STORY.md`](narrative/STORY.md).** It is the spoiler-heavy
> source of truth for the story; every document here defers to it on questions of canon.

---

## How this is organized

| Folder | Holds | Audience |
| --- | --- | --- |
| [`design/`](design/) | Game Design Document — the master design reference | Design, whole team |
| [`product/`](product/) | Product Requirements Document — what we're building and why | Product, leads, stakeholders |
| [`technical/`](technical/) | Engineering / systems design — how the build works | Engineering |
| [`narrative/`](narrative/) | The canon story bible (`STORY.md`) + narrative design docs | Narrative, design |
| [`art/`](art/) | Art Bible + wireframes — visual direction and UI blueprints | Art, UX |
| [`audio/`](audio/) | Audio Bible — sound design, music direction, the Signal motif | Audio |
| [`production/`](production/) | Production Plan — milestones, scope, schedule, risk | Production, leads |
| [`localization/`](localization/) | Localization plan — string architecture, target languages | Loc, engineering |
| [`accessibility/`](accessibility/) | Accessibility plan — standards, features, compliance | Design, QA |
| [`qa/`](qa/) | QA & Test/Review Plan — regression bar, test cases, automation harness, sign-off | QA, production, dev |
| [`exports/`](exports/) | Polished Word + PDF exports of the core documents | Stakeholders, sharing |

---

## Document status

The documentation suite is being built in phases so each document stays deep and reviewable.

### Available now

| Document | Location | Status |
| --- | --- | --- |
| Game Design Document (GDD) | [`design/GDD.md`](design/GDD.md) | ✅ v1.1 |
| Product Requirements (PRD) | [`product/PRD.md`](product/PRD.md) | ✅ v2.1 |
| Technical Design | [`technical/DESIGN.md`](technical/DESIGN.md) | ✅ v1.1 |
| Production Plan | [`production/PRODUCTION.md`](production/PRODUCTION.md) | ✅ v1.1 |
| Audio Bible | [`audio/AUDIO.md`](audio/AUDIO.md) | ✅ v1.1 |
| Art Bible + wireframes | [`art/ART.md`](art/ART.md) | ✅ v1.2 (one self-contained HTML wireframe, screens 01–07) |
| Localization Plan | [`localization/LOCALIZATION.md`](localization/LOCALIZATION.md) | ✅ v1.1 |
| Accessibility Plan | [`accessibility/ACCESSIBILITY.md`](accessibility/ACCESSIBILITY.md) | ✅ v1.1 |
| QA & Test/Review Plan | [`qa/QA.md`](qa/QA.md) | ✅ v1.0 |
| Story Bible (canon) | [`narrative/STORY.md`](narrative/STORY.md) | ✅ Living |
| Expansion v2 proposal | [`narrative/EXPANSION-PROPOSAL.md`](narrative/EXPANSION-PROPOSAL.md) | 📋 Accepted → folded into canon |

### Suite status

**All planned documents are complete.** The suite now covers design, product, engineering,
production, audio, art (+ wireframes), narrative canon, localization, accessibility, and QA (test +
review) — Markdown source plus polished Word/PDF exports for the core documents.

**Expansion v2 (narrative depth) — design-locked; build: PLANNED (2026-07-06).** A story-deepening pass
is folded into the canon and propagated across every doc: the **Echoes** (the Signal's minds given
voices), **region sub-stories** (~2× Phase-3 nodes), the **unchosen** moral thread, **truth-by-assembly**,
and a **prologue second act**. It is specified in the docs but **not yet in the code** — every doc flags
it `build: PLANNED`. Canon + rationale: `STORY.md` "Changelog — Expansion v2"; the original menu is
[`narrative/EXPANSION-PROPOSAL.md`](narrative/EXPANSION-PROPOSAL.md).

---

## Reading order

- **New to the project?** Start with the [PRD](product/PRD.md) (the *why* and *what*), then the
  [GDD](design/GDD.md) (the *how it plays*).
- **Engineering?** The [Technical Design](technical/DESIGN.md) plus the code in
  [`../src/DeadSignal.jsx`](../src/DeadSignal.jsx).
- **Testing / releasing?** The [QA & Test/Review Plan](qa/QA.md) — the regression bar, the automation
  harness, and the release sign-off.
- **Narrative?** The canon [Story Bible](narrative/STORY.md), then the GDD's narrative section.

## Conventions

- **Markdown is the source of truth.** Polished Word/PDF versions in [`exports/`](exports/) are
  generated *from* these files and can go stale — always trust the `.md`.
- **Spoiler discipline** (per `STORY.md`): public-facing surfaces sell the mystery; internal design
  docs may discuss the answers, and mark those sections clearly.
- **Canon conflicts** resolve to `STORY.md`. If a doc here disagrees with the bible, the bible wins
  and the doc is wrong — fix the doc.

## Historical

- [`production/PLAN.md`](production/PLAN.md) — the completed M0–M8 AI-removal + battery-economy
  execution plan. Historical; archived under `production/` and superseded by the Production Plan.
