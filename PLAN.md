# Dead Signal — Execution Plan (Removing AI + Battery Economy)

**Branch:** `remove-ai-battery-economy` · **Single file:** `src/DeadSignal.jsx` (~2,101 lines)

> Game must boot and play at every checkpoint. Never leave a broken build between milestones.

---

## Decisions locked in (from Part 5)

| Question | Decision | Why |
|---|---|---|
| Per-beat drain | **1%/beat**, integer | Readable, matches existing `[-1%]` marker. Re-measure in M7. |
| Charger usability | **Any non-encounter choice screen** | Prevents mid-fight chugging; simple gate. |
| Guaranteed Haven top-up | **Yes** | Avoids `offline` two beats before the payoff. |
| Texting delay on local beats | **Keep it** | Reuse `scheduleMessages` timing; instant replies feel cheap. |

---

## Milestone 0 — Safety net  `P0`  ✅ (saves pending)
- [x] Create branch: `git switch -c remove-ai-battery-economy`
- [x] Confirm backup exists (+ fresh `DeadSignal_pre-ai-removal-20260607-005040.jsx`)
- [ ] Capture baseline saves in hospital / metro / route9 (MANUAL — play a few Phase-2 beats into slots 0/1/2). Only needed for M3 testing; M4 changes save schema.
- **Checkpoint:** clean branch ✓, baseline saves captured.

---

## Milestone 1 — Write the data pools  `P1`  🔶 FIRST PASS DONE — voice review
- [x] Author `EXPLORE_BEATS` — 5 pools (hospital/metro/route9/crossing/haven). **~10 each so far; expand to 15–25 after voice approved**
- [x] Author `STATE_LINES` — 5 buckets: battery_critical / battery_low / injured_bad / low_food / low_water
- [x] Placed after `DISCOVERY_BEATS` (line ~129) as sibling data
- [x] **Checkpoint:** data compiles, app boots clean (verified via preview, no errors)
- [ ] **REVIEW GATE:** approve voice → then expand each pool to 15–25 entries

---

## Milestone 2 — Build picker + `localBeat`  `P1`  ✅ DONE (runtime proof in M3)
- [x] `pickRandom` already existed (:504); added `seenBeatsRef` + `lastStateLineRef` (mirror `seenEncountersRef`); reset in `resetRunState` + `loadSnapshot`
- [x] Added `pickExploreBeat(path, section, res)` — state lines gated (crit always, soft 40% + no back-to-back) so pools breathe; **0.4 rate = M7 tuning knob**
- [x] Added `localBeat(batteryOverride)` — `if (pending)` bridging block copied verbatim from `callEllie`; only msg source changed (`beat.msgs`/`beat.from`)
- [x] `callEllie` untouched; nothing calls `localBeat` yet
- [x] **Checkpoint:** compiles + boots clean (preview verified)
- **Note (deviation-for-cause):** plan's literal picker would spam one state line once battery economy lands (M5/M6). Added an anti-spam gate. Documented for M7.

---

## Milestone 3 — Swap call sites  `P1`  ✅ DONE — full playthrough verified
> Added `phaseOverride` to localBeat (sync gotcha: sites that setGamePhase→call same-tick read stale ref).
- [x] **3a.** p2_ai entry (1745) + memory-reground (1685) + main exploration (1926) → localBeat. Verified: hospital pool fires, [-1% Battery] markers, memory@2 bridge, discovery@6 bridge, encounters bridge on schedule
- [x] **3b.** encounter-return (1625) → `localBeat(null, returnPhase)`. Verified: post-encounter exploration resumes
- [x] **3c.** crossing entry (1965) → `localBeat(null,"p2_ai_cross")`. Verified: crossing pool fires, shelter@6 bridge
- [x] **3d.** haven entry (1818) + haven exploration (1831) → localBeat. Verified: haven pool fires, haven_final bridge + branch-aware path beat
- [x] State lines verified live (low_water fired). Branch-aware ending reached. **0 API calls, 0 console errors** across full run.
- **Deviation-for-cause:** swapped ALL sites in one pass (partial swap leaves callEllie → fails in no-API preview). Verified via scripted in-page driver, full start→ending.
- Remaining `callEllie` refs: 1407 (geo-retry) + 1638 ("Try again.") — both dead, deleted in M4.

---

## Milestone 4 — Delete the AI constraint layer  `P2`  ✅ DONE
- [x] Deleted entire `callEllie` (193 lines, fetch/headers/JSON/timeout/abort/retry/geo/loot)
- [x] Deleted geo-guard block: `detectGeoContradiction`, `sanitizeGeo`, `geoTerms`, `GEO_FORBIDDEN`, `CROSSING_EXTRA_FORBIDDEN`, `PREMATURE_TERMS`, `GEO_SAFE_LINE`
- [x] AI-narration loot path gone (was inside callEllie). Kept `parseResourceMarkers`/`applyChoiceLoot` (choice markers)
- [x] Deleted `apiHistoryRef` + all history threading at every call site; deleted `PHASE1_SYSTEM`, `buildP2System`, `buildHavenSystem`
- [x] Deleted "Try again." retry + `lastCallRef`
- [x] Stripped `apiHistory` save-snapshot field + load line (kept `pendingStoryBeat`); old saves load fine (missing field → default)
- [x] Grep clean: 0 hits for callEllie/apiHistoryRef/buildP2System/fetch(/geo symbols
- [x] **Checkpoint:** full playthrough (hospital), 0 console errors, **0 API calls**, production build ✓ (994 modules)
- **Net code:** 2101 → 1953 lines (−148) even after adding pools+localBeat. AI removal cut ~340 lines.
- **Optional follow-ups (out of scope):** `applyChoiceLoot` still returns now-unused `truth`; `vite.config.js` API proxy + `.env*` `VITE_ANTHROPIC_KEY` are now dead infra.

---

## Milestone 5 — Centralize battery drain  `P2`  ✅ DONE
- [x] Added `beatBatteryCost(phase)` at module scope: `phase1`→0, `p2_memory_frag`/`p2_discovery`→0, else→1
- [x] Replaced `aiPhases`-gated drain with `beatBatteryCost(gamePhaseRef.current)` for ALL advancing phases; continues ("·")→0
- [x] Encounter entry: charged 1% via the encounter action choice (beatBatteryCost("encounter")=1) — one drain per encounter
- [x] Added offline-coherence guard for scripted phases (`p2_scripted`/`shelter`/`haven_approach`/`haven_final`) that don't pass through localBeat's battery check
- [x] Kept `[-1% Battery]` display marker
- [x] **Verified live:** phase1 held at 44 (0 drain); path beats 44→43→42→41→40→39 (1%/beat, NEW); seamless into p2_ai (38). 0 console errors.
- **Note:** scripted-phase offline guard verified by inspection (hitting exactly 0 in a scripted phase needs a long no-refill run — natural M7 balance test).

---

## Milestone 6 — Charger as rechargeable reservoir  `P2`  ✅ DONE
- [x] **Model decision:** kept the CHARGER beat as-is (phone→44, reservoir→0/empty) to preserve the "near-death→relief" opening per plan's "sits at 40-44% after charger." The 35% reserve is spent into the phone for the relief; reservoir then refills at power sources. (Deviates from literal "find sets charger to 35%" because that contradicts the stated phone trajectory.)
- [x] Added **"Use the charger [+N% Battery]"** as a FREE action button (doesn't advance beat / doesn't drain) when `charger>0 && battery<90`, not in encounter, not continue-only. `useCharger()` transfers `CHARGER_TRANSFER`(25) reserve→phone
- [x] Power-source SEARCH refill: `POWER_SOURCES` set (generator_room, maintenance_office, fuel_truck, abandoned_convoy, house_generator, emergency_shelter) → +`CHARGER_RECHARGE`(25) to reservoir on success, distinct from instant battery-pack loot
- [x] Guaranteed **Haven top-up**: on `haven_ai` entry, charger topped to ≥50% (canon: floodlights running)
- [x] HUD already showed `charger {n}%`/`empty` — no change needed; `pulseBattery()` on transfers
- [x] **Verified live:** phase1→charger empty@44; power source: "you found water" + charger empty→25; Use charger: batt 30→55 (p2_ai) and 35→60 (haven, choices unchanged=free action); Haven top-up empty→50. 0 console errors.
- **M7 tuning knobs:** `CHARGER_RECHARGE`, `CHARGER_TRANSFER` (both 25), Haven top-up floor (50), `beatBatteryCost` rate (1).

---

## Milestone 7 — Balance pass  `P3`  🔶 DATA-DRIVEN TUNING DONE (feel = user call)
- [x] Measured a full **ignore-power run** (hospital, no charger use, avoid all searches): 58 picks, ~36% net drain, post-charger 44% → **ended Phase 2 at ~8%**. Survived.
- [x] **Key finding:** old Haven top-up (charger reserve→50) was mis-targeted — gifted everyone a fat reserve (power-users coast + carry it into Phase 3, killing the scarcity hook) yet topped *reserve* not *phone*, so wouldn't reliably save a critically-low non-charger-user.
- [x] **Tuning applied:** retargeted Haven top-up to a minimal **phone floor** (`HAVEN_BATTERY_FLOOR=10`) — just enough to survive the free finale, no comfort buffer. Phase 2 now ends low (~5–10%) for everyone → sets up the Phase 3 "find power" hook (see memory `phase3-battery-punishing`).
- [x] Build green; pre-Haven economy empirically verified (1%/beat, identical pre/post since edit only touches Haven entry).
- **Verdict:** matches "tense, survivable" — ignore-power scrapes to ~8%, power-use stays comfortable mid-run but no longer coasts the ending.
- **Open lever (user's call — exact feel):** to make ignore-power outright **lethal** (offline before Haven), lower the post-charger budget (CHARGER beat `+35`→`+30`/`+25`, currently line ~1364). Knobs: `beatBatteryCost`(1), `CHARGER_RECHARGE`(25), `CHARGER_TRANSFER`(25), `HAVEN_BATTERY_FLOOR`(10).
- ⚠ Per user: Phase 3 untouched. Phase 3 will set its own low starting battery when built.

---

## Milestone 8 — Invisible route map  `LATER`  ✅ DONE
- [x] Added declarative `ROUTE = { path:[...6 nodes], crossing:[...6 nodes] }` — node kinds `explore`/`encounter`(plan search|hazard)/`memory`/`discovery`/`shelter`, optional `drain`
- [x] Refactored the p2_ai/p2_ai_cross handler to walk `ROUTE[section][newCnt-1]` (cursor = aiExchangeCount) instead of scattered `newCnt===4`/`fragTarget`/`aiTarget`/`sectionPlan` counters
- [x] Simplified both entry points (path-complete, crossing-start) — schedule now lives in ROUTE; entries just reset the cursor. Also removed dead `battNote` (M4 leftover)
- [x] Haven leg left on its own variable-length 3-5 threshold (no encounters/branches there — not route-driven)
- [x] **Verified 1:1 via playthrough:** path leg = enc@1, memory@2, enc@3, drain@4, enc@5, discovery@6; crossing = enc@1, free@2, enc@3, drain@4, enc@5, shelter@6 — exact match to pre-M8. Full run COMPLETE, 0 console errors, build green.
- **Minor follow-up:** `fragTarget` state + `sectionPlanRef` are now vestigial (still in snapshot/reset, no longer read) — safe to remove in a cleanup pass.

---
## STATUS: M1–M8 all complete. Core plan done. Branch `remove-ai-battery-economy`, uncommitted.

---

## Critical path

```
M0 backup → M1 pools → M2 localBeat → M3 swap → M4 delete AI
                                                    │
                              M5 drain → M6 charger → M7 balance → SHIP
                                                                     │
                                                  M8 (later) route map
```

**Riskiest:** M2 bridging-block copy. **Start here, lowest risk:** M1 pools.
