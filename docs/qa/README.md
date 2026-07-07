# QA & Test / Review Plan

Status: ✅ **v1.0 available** → **[`QA.md`](QA.md)**

How *Dead Signal* is tested and reviewed before it ships. The standing regression bar (full
per-route playthrough, both endings, save round-trip, clean build), the route/economy/platform/save
matrices, an enumerated **test-case catalog** traced back to PRD requirements, the automated
browser-driven **harness** (promoted here from the worktree `PLAYTESTING.md`), the canon + spoiler
**content review**, bug severity/triage, regression triggers, and the release **sign-off** checklist.

Determinism makes it tractable: a failing test is a real bug, not variance. The
[PRD §8](../product/PRD.md#8-release-criteria-definition-of-done) defines what must be true to ship;
this defines how we prove it. Expansion v2 coverage is staged as a **build: PLANNED** delta.
