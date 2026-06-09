# Dead Signal — Product Requirements Document

> **A deterministic, hand-authored text-message survival mystery.** You wake with no memory in an
> outbreak-stricken city — **Harwick** — guided only by texts from a stranger who is not what she
> seems, toward a broadcast called **Haven**. The whole game is a single React component; every
> exchange is scripted story beats + location-aware atmosphere. **No AI, no API, no network calls.**

**Status:** Phases 1 & 2 (the prologue) are complete and playable end-to-end.
**Next:** Phase 3 — the open-world investigation. Deferred; canon lives in [`STORY.md`](STORY.md) §5.

> History note: the prologue originally drove exploration with live Claude calls. That was removed
> in favor of deterministic local content (see `PLAN.md`, historical). This PRD describes the
> **current** build.

---

## 1. What's built

Both prologue phases run start-to-finish. Everything below is implemented and working.

### Architecture
- **Single-file React component** ([`src/DeadSignal.jsx`](src/DeadSignal.jsx)), no external state
  library. State lives in `useState` with mirrored `useRef`s so async timers always read current
  values without stale closures.
- **Pausable two-queue timer system.** `dialogueRef` (owned by `scheduleMessages`) and `pendingRef`
  (everything else) stay separate; every gameplay timer goes through a tracked `setT()` so the
  dialogue **freezes when the pause menu opens** and resumes mid-beat on close. `clearPending`
  flushes both.
- **Procedural audio** ([`src/audio.js`](src/audio.js)) — a Tone.js singleton: UI clicks, message
  blip, resource stings, a completion resolve chord, and a story-gated **Signal distortion** artifact.
  Mute + volume are persisted; all nodes are built once on first user gesture.
- **Per-slot persistence** via `window.storage` (shimmed onto `localStorage` standalone) — three save
  slots, each a profile that accumulates playthroughs + recovered fragments/clues toward **100%**.
- **Installable PWA** — manifest + icons, iOS standalone meta.

### Game flow — playable end to end
| Stage | What it does |
|---|---|
| **Title / menus** | Main menu (Start / Load / **Story** / Options), the **Story** lore page, **Options** (volume slider + mute, reset), and the 3-slot save screen. |
| **Intro** | Timed cinematic text (tap to skip), then the "NEW MESSAGE" prompt. |
| **Phase 1 (scripted)** | 12 fixed exchanges: waking, meeting the voice, collecting charger + supplies, the **KIM → ELLIE** header flip, the map, and the three-way path branch. |
| **Phase 2 — path beats** | Path-specific (hospital / metro / route9): a weapon pickup + two foreshadowing beats hinting the voice knows the place too well. |
| **Phase 2 — exploration** | Deterministic local beats paced by a declarative **ROUTE** map (no AI): atmosphere pools + state-reaction lines, battery drain per beat. |
| **Encounters** | 8 per path + 9 crossing, resolved via SNEAK / SEARCH / WAIT / RUN / FORCE / FIGHT — affecting noise, HP, and loot. |
| **Memory fragments / clues** | 9 fragments (3 pools/path, 1 random per run) + 3 clues (1/path), tracked toward 100%. |
| **Endgame** | Crossing → shelter → Day 3 → Haven approach → Haven → the **143** contradiction → branch-aware evidence beat → the closing **"i remember you."** call → win screen. |

### Systems
- **Survival economy.** Battery (the master clock, drains per beat) + a rechargeable charger reserve;
  food, water, HP, and a noise meter. Power-source searches refill the charger; the Haven cache is the
  end-of-gauntlet relief.
- **Fail states.** Dedicated **death** screens for injury / starvation / dehydration, distinct from the
  battery **offline** screen. Balance is tuned (per-leg noise decay, scarcer-vital loot bias, a
  battery grace on the Haven approach so you can't die a step from the cache).
- **Case File (investigation board).** A persistent detective notebook: **Memories** (9), **Clues** (3),
  **People**, **Locations**, **Known Facts**, and **Open Questions** that reveal as beats hit. Questions
  surface as in-chat **NEW QUESTION** cards and **evolve** ("Why is Haven empty?" → "Where are the
  143?") with a **QUESTION UPDATED** card, driven by the Haven 143 record. A once-per-slot nudge points
  new players to the **FILE** button.
- **Branch-aware ending.** Each route surfaces different evidence (patient file / broadcast log /
  deployment order); the finale ties the voice to whichever the player found.

---

## 2. What's next

Phases 1 & 2 are "practically fully complete": a run can fail, the content is internally consistent,
and the ending acknowledges the route. The next arc is **Phase 3 — the open-world investigation**
(hub-and-spoke from Haven, one truth per region). It is **parked**; its canon and structure are locked
in [`STORY.md`](STORY.md) §5, and survival is planned to carry over softened ("battery is exploration").

Anything else is incidental polish — capture it as it comes up; don't pre-invent a backlog here.

*— end of document —*
