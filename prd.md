# Dead Signal — Product Requirements Document

> **An interactive survival-horror text game.** A stranger wakes with no memory in an outbreak-stricken city — **Harwick** — guided only by text messages from "Ellie," a survivor who is not what she seems. Built as a single React component combining scripted story beats with live AI-driven dialogue.

**Status:** Phases 1 & 2 playable end-to-end · Phase 3 planned
**Current objective:** Bring Phases 1 & 2 to *"practically fully complete"* before opening Phase 3 development.

---

## 1. What's Complete

Both built phases run start-to-finish. The following systems are implemented and functioning.

### Core architecture

- **Single-file React component** with no external state library. State lives in `useState` with mirrored `useRef`s so async timers and API callbacks always read current values without stale closures.
- **Two-queue timer management.** `dialogueRef` (owned by `scheduleMessages`) and `pendingRef` (everything else) are kept separate, so a new dialogue burst doesn't wipe pending bridge or system timers. `clearPending` flushes both.
- **Monotonic `idRef`** for React keys, avoiding `Date.now()` collisions.
- **Persisted memory** via `window.storage` — recovered fragments and clues survive restarts; "full reset" clears them.

### Game flow — playable end to end

| Stage | What it does |
|---|---|
| **Intro** | Timed cinematic text lines, then the "NEW MESSAGE" prompt. |
| **Phase 1 (scripted)** | 12 fixed exchanges: waking, meeting Ellie, collecting charger and supplies, the name reveal (KIM → ELLIE header flip), finding the map, and the three-way path branch. |
| **Phase 2 — scripted beats** | Path-specific (hospital / metro / route9), each with a weapon pickup plus two foreshadowing beats hinting Ellie knows the location too well. |
| **Phase 2 — AI dialogue** | Live Claude calls drive free-form exploration, with battery drain per choice and dynamic system prompts reflecting HP, noise, and supplies. |
| **Encounters** | 8 per path + 9 crossing, resolved via SNEAK / SEARCH / WAIT / RUN / FORCE etc., affecting noise, HP, and loot. |
| **Memory fragments** | 3 pools per path, randomly selected, tracked toward 9 total. |
| **Discoveries (clues)** | One per path, revealing Haven was pre-planned; tracked toward 3. |
| **Endgame chain** | Crossing → shelter → Day 3 → Haven approach → Haven AI → final sequence: the empty-compound reveal and the closing "i remember you." call. |

### UI / UX

- iPhone-style messages interface with a signal-bar HUD that reacts to game phase and noise, a battery SVG, and resource bars (HP / water / food, plus a conditional weapon / noise / charger row) and fragment/clue counters.
- **Failure-state handling.** API timeout/abort surfaces a *"Try again."* retry that re-fires the last call without polluting conversation history.

---

## 2. What Needs Work

These are the items standing between the current build and "Phases 1 & 2 practically fully complete." Priority ordering is in [§5](#5-roadmap-phases-1--2-to-fully-complete).

> ✅ **RESOLVED — Resource desync (the "food up to 8" screenshot bug).**
> Fixed. The AI no longer narrates resource numbers it has no authority over; loot is now code-authoritative and the HUD updates in step with the dialogue. Kept here for the record and as the reference pattern for the remaining robustness items below.

### Robustness gaps

- **⚠ Win/lose conditions are thin.** HP can hit 0 (encounters subtract it) but nothing checks for death — the player just continues. There's no starvation/dehydration consequence when food or water reach 0. Battery death is the only real fail state.
- **AI hallucination beyond resources.** The model occasionally invents new destinations or contradicts established geography despite "do not invent" guards. Worth a post-parse sanity layer or tighter prompts.
- **`SEARCH_LOOT` battery items** add +10% but the AI never knows — the same class of desync as food/water if it ever narrates it. Fold into the now-fixed code-authoritative loot path.
- **No mid-game save.** Only memories persist; an interrupted run restarts from the intro.

### Polish

- **Encounter repetition.** Variety can repeat within a run; only `lastEncounterIdRef` blocks an immediate repeat.
- **Opaque retry.** The *"Try again."* path is solid but gives no user-visible reason for the failure (timeout vs. parse vs. network).
- **Quiet battery-pack loot.** The +10% pickup has no on-HUD celebration beyond a system line.
- **Fragile reveal timing.** The KIM → ELLIE header flip is hardcoded to fire at 3040ms to match the "name's ellie" message (`next === 5`). If message timing changes, the flip drifts. Low priority, latent bug.

---

## 3. What You Can Add

Enhancements that strengthen Phases 1 & 2. **Phase 3 is parked** — captured below as future scope, not current work.

### In scope for Phases 1 & 2

- **Death / respawn screen** for HP 0 and starvation, distinct from the battery "offline" screen — closes the survival loop. (Pairs directly with the win/lose gap in §2.)
- **Difficulty modifiers** — battery drain rate, encounter frequency, loot odds.
- **Achievement / collection screen** — view all 9 fragments + 3 clues recovered across runs. The data already persists, so this is mostly presentation.
- **Sound design** — the IBM Plex Mono terminal aesthetic invites subtle SFX: message blip, signal static, battery warning.
- **Branch-aware endings** — the final reveal could differ by path, since hospital, metro, and route9 each surface different evidence.

### Future scope — Phase 3

> The "to be continued" ending sets up a sequel arc: who and what Ellie is, what Haven is, and why the player's name appears in every record. *Deferred until Phases 1 & 2 are locked.*

---

## 4. Does Everything Make Sense?

Mostly yes — the structure is coherent and the scripted/AI handoff is well-engineered. Three points stand out.

**The pending-beat bridge is the cleverest part.** Queuing a story beat in `pendingStoryBeatRef` and only firing it *after* the AI resolves the current action prevents the jarring "AI talks, then suddenly a memory" jump. This is correct and worth preserving in any refactor.

**Resource authority was the conceptual flaw.** The game treated the AI as narrator *and* handed it resource numbers in the system prompt, inviting math it shouldn't do. The fix establishes the right rule: **code owns resources; the AI describes, never computes.** This principle should govern every future system that touches state (battery loot, HP, future currencies).

**The KIM → ELLIE reveal timing is fragile.** The header flip is hardcoded to 3040ms to align with a specific message. If the dialogue timing changes, the flip drifts. Low priority, but worth tying to the message event rather than a magic number when convenient.

---

## 5. Roadmap: Phases 1 & 2 to "Fully Complete"

The bar for "practically fully complete" is: a player can fail, the AI never contradicts game state, and a run feels finished rather than truncated. Suggested order of attack.

### Definition of done

- A run can end in defeat (HP 0 or starvation), with a dedicated screen — not a soft-lock or silent continue.
- No AI-narrated value (resource, location, or object) ever contradicts the HUD or established geography.
- An interrupted run can resume, or at minimum loses nothing the player earned.
- Each path through Phase 2 feels distinct enough to replay, and the ending acknowledges the route taken.

### Prioritized work

1. **Close the survival loop.** Add death checks for HP 0 and food/water exhaustion, plus a death/respawn screen distinct from battery-offline. (§2 robustness + §3 in-scope.)
2. **Extend code-authority to all loot.** Fold `SEARCH_LOOT` battery pickups into the same code-authoritative path used for the resource fix, so the AI never narrates an unsynced number again.
3. **Add an AI sanity layer.** Post-parse guard against invented destinations/geography; tighten prompts where the guard trips most.
4. **Mid-run save.** Persist enough state to resume an interrupted run, reusing the existing `window.storage` plumbing.
5. **Branch-aware ending.** Differentiate the final reveal by path; the evidence already differs, so wire it into the closing sequence.
6. **Polish pass.** Encounter de-duplication beyond immediate repeats, retry-reason messaging, battery-pickup HUD moment, and decouple the KIM→ELLIE flip from its magic number.

### Then, and only then

Begin Phase 3 — the sequel arc — against a locked, fail-capable, internally consistent Phases 1 & 2 foundation.

*— end of document —*
