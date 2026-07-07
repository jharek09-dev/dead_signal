# Dead Signal — Game Design Document

| | |
| --- | --- |
| **Version** | 1.1 |
| **Status** | Living — reflects the shipped build (prologue + Phase 3 + finale complete) |
| **Last updated** | 2026-07-06 |
| **Owner** | Jharek (design/dev) |
| **Canon source** | [`STORY.md`](../narrative/STORY.md) — narrative bible; wins all canon conflicts |
| **Companion docs** | [PRD](../product/PRD.md) · [Technical Design](../technical/DESIGN.md) |

> **What this document is.** The master design reference for *Dead Signal*: what the game is, how
> it plays, and why each system exists. It is written for the whole team and is the first stop
> after the [PRD](../product/PRD.md).
>
> **What it is not.** It is not the narrative canon — that is [`STORY.md`](../narrative/STORY.md) — and it
> is not the engineering spec — that is [`DESIGN.md`](../technical/DESIGN.md). Where this doc
> summarizes either, the linked source is authoritative.
>
> **Spoiler policy.** This is an internal design doc, so it discusses the ending and the twists.
> Every spoiler-bearing section is fenced under **§4.4 Spoiler Vault** and flagged inline with
> 🔒. Public-facing copy (store page, README, in-game Story screen) never states these.

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Design pillars](#2-design-pillars)
3. [Player experience](#3-player-experience)
4. [Narrative overview](#4-narrative-overview)
5. [Game structure & flow](#5-game-structure--flow)
6. [Core loops](#6-core-loops)
7. [Systems design](#7-systems-design)
8. [Phase 3 — the investigation](#8-phase-3--the-investigation)
9. [Endings](#9-endings)
10. [UX, UI & presentation](#10-ux-ui--presentation)
11. [Audio direction](#11-audio-direction)
12. [Accessibility & localization](#12-accessibility--localization)
13. [Content inventory](#13-content-inventory)
14. [Scope & non-goals](#14-scope--non-goals)
15. [Risks & open questions](#15-risks--open-questions)
16. [Appendix](#16-appendix)

---

## 1. Executive summary

### High concept

**You wake in an outbreak with no memory and a dying phone. The only voice that will answer texts
you toward a broadcast called Haven. You survive the crossing. Then you find out the evidence has
your name on it.**

*Dead Signal* is a **deterministic, hand-authored text-message survival mystery**. The entire game
is played through a phone: you read messages, you tap replies, you manage a fistful of survival
resources, and you assemble a mystery about who you are. There are **no AI calls, no API keys, and
no network-dependent generation** — every exchange is authored, so the experience is identical,
repeatable, and shippable offline.

### The shape of it

| | |
| --- | --- |
| **Genre** | Narrative survival mystery / interactive fiction |
| **Perspective** | Second person, phone-native text UI |
| **Session length** | Prologue ~30–60 min; full arc across multiple sessions |
| **Structure** | Linear survival **prologue** → open **investigation** (Phase 3) → **finale** |
| **Platforms** | Web (PWA, installable); mobile-first, desktop-supported |
| **Tech** | React 18 + Vite; Tone.js procedural audio; single-file game component |
| **Content model** | 100% authored, deterministic; local persistence, three save slots |
| **Monetization** | Out of scope for this build (see [PRD](../product/PRD.md)) |

### Unique selling points

- **The phone is the whole game.** No avatar, no map to walk — the fiction is that you are a person
  texting a stranger while a city dies around you. The medium *is* the tension.
- **A survival economy that means something narratively.** Your battery is your life *and* your
  lifeline to the only voice you trust. Spending it is dramatic, not bookkeeping.
- **A mystery that turns the survival genre on the player.** 🔒 Every fight you won in the prologue
  is recontextualized in Phase 3 as something you should mourn, not celebrate.
- **Deterministic and offline.** The game earlier prototyped live-LLM narration and deliberately
  removed it (see [`PLAN.md`](../production/PLAN.md)); authored content is tighter, canon-safe, and ships
  anywhere.

### Comparables (touchstones, not clones)

*Lifeline* (the texting-a-survivor frame, minus the real-time waiting) · *A Dark Room* (minimalist
survival that hides a story) · *SOMA* (the horror is a philosophical idea about minds, and no ending
"wins") · *Silent Hill* (dread from restraint and wrongness, not gore).

---

## 2. Design pillars

Every feature decision is measured against these. When two pillars conflict, the higher one wins.

### Pillar 1 — Reveal less, imply more

The mystery is the product. The prologue **cracks** the mystery; Phase 3 **answers** it. No beat
over-explains; if a line explains the mystery, we cut it to a *crack*. Ellie is never allowed to say
"I am the Signal." Unease, not exposition. *(This is the prime directive; it is also `STORY.md` §4.)*

### Pillar 2 — The phone is the world

All information arrives as it would on a phone: messages, a HUD, a contact name, a case file. We
never break frame with a camera, an avatar, or an omniscient narrator that the phone couldn't
plausibly carry. The narrator's world-voice is styled as distinct from the UI so the frame holds.

### Pillar 3 — Survival with stakes, then survival as texture

In the prologue, **battery is life**: scarcity is a death clock and every drain is felt. In Phase 3,
survival **softens into exploration pressure** — power becomes route-planning, not a countdown. The
player must always feel vulnerable; survival must never dominate the investigation.

### Pillar 4 — Determinism is a feature

No AI, no network, no RNG the player can't reason about. Encounters expose their odds; the world is
knowable. This makes the game canon-safe, replayable, and honest — a promise the mystery depends on.

### Pillar 5 — Restraint as aesthetic

Near-black screen, terse lowercase voice, sparse audio, no music bed, no bodies staged for shock.
Silence and absence are the tools. The game trusts the player to feel the weight without being told.

---

## 3. Player experience

### The fantasy

You are not a hero. You are a **confused, frightened person with a dying, barely-charged phone** and one
contact who seems to know what they're doing. The fantasy is *being kept alive by a voice* — and
slowly realizing you don't know whose voice it is, or who you were to deserve this.

### The intended emotional arc

| Stage | What the player feels | How we produce it |
| --- | --- | --- |
| **Wake** | Disorientation, dependence | Amnesia; a stranger who's already helping; a dying battery |
| **The crossing** | Tension, competence growing | Real survival stakes; readable encounters; small wins |
| **First crack (Haven)** | Unease, "wait, that's about *me*" | Route evidence bears the player's name; an empty, lived-in Haven |
| **Investigation** | Compulsion, dread | Open regions; a Case File that turns clues into contradictions |
| **The answers** | Grief, complicity | 🔒 The truths land one region at a time; combat is retroactively recontextualized |
| **The choice** | Quiet devastation | 🔒 Two ambiguous endings; neither "wins" |

### Accessibility of experience

The game asks for **reading and decision-making**, never reflexes. There is no fail-by-twitch beat.
Difficulty is resource management and attention, both of which can be paused. This makes the game
broadly playable and is a deliberate design stance, not an afterthought (see §12).

---

## 4. Narrative overview

> Full canon — locked/open flags, every reveal, tone rules — is in [`STORY.md`](../narrative/STORY.md).
> This section is the working summary. **§4.4 is spoiler-fenced.**

### 4.1 Premise (spoiler-safe)

You wake in an apartment in **Harwick** with no memory, during an outbreak. A stranger, **Ellie**,
texts you and guides you toward a broadcast signal called **Haven**. You cross the city, you reach
Haven — and it is empty. The prologue ends on the line `i remember you.`, and the call goes dead.

### 4.2 Structure

- **Prologue (Phases 1 + 2).** Wake → contact → cross the city by one of three routes → shelter →
  reach Haven. Linear, survival-driven, texting-only. **Its job is to raise questions, not answer
  them.**
- **Phase 3 — the actual game.** An open-world **investigation**. The player pursues the truth
  across regions, in any order the gating allows. This is where the mystery is answered.

### 4.3 Cast (spoiler-safe framing)

- **The Player** — an amnesiac who keeps turning up in the evidence. Name and role surface gradually.
- **Ellie Marsh** — the voice guiding you. Reads as a scared survivor throughout the prologue. Speaks
  in a lowercase, terse texting register. Knows more than a stranger should.
- **Kim** — a contact saved in your phone; the dead woman in Ellie's opening story. The contact name
  flips **`KIM → ELLIE`** mid-prologue — a real moment in the build, kept quiet.
- **The 143** — a number seeded everywhere in Haven without explanation.

### 4.4 🔒 Spoiler Vault — the answers (internal only)

> **Do not surface any of this in public copy or in the prologue.** These are Phase 3 payoffs,
> delivered one region at a time. This is a compressed pointer to `STORY.md` §2–§3; the bible is
> authoritative and holds the full reasoning, the locked/open flags, and the consistency changelog.

- **The Signal is an upload network (SOMA-like).** "Connection" copies a mind into the Signal; the
  connected are *inside* it, not dead.
- **Two modes of connection — the keystone.** *Controlled upload* (Haven): voluntary, clean,
  complete — and the finished Signal **walks the body out** (why Haven is empty and has no bodies;
  the 143 left through the open gate). *Wild Signal* (the city): the outbreak is the Signal
  **escaping Haven's containment** — involuntary, incomplete. **The "infected" are the
  half-connected** — minds partly pulled in, bodies still moving.
- **Combat is the delivery mechanism for the worst reveal.** Every prologue FIGHT was the player
  putting down a half-connected *person*. The Research Annex states it; it recontextualizes
  retroactively. Never softened, never foreshadowed.
- **The Player is the architect.** You built or ran Project Haven, then erased your own memory rather
  than carry it (the self-wipe). Every clue points back at you because it *is* about you.
- **Ellie is the connected, wearing a voice.** She accepted upload and reaches you through Kim's
  spoofed number. **No one ever holds a phone.** Her humanity thins across Phase 3 (the crack
  ladder: `i remember you.` → `i remember all of you.` → `i remember everyone.` → `i can still hear
  them.`).
- **Kim is the counterweight.** She *refused* connection, fled Haven to find the architect (you),
  and the city killed her as herself. The board reads `PRESENT 143` because the Signal already
  **counts the player** in Kim's refused slot.
- **The finale** bookends the prologue's first call with a last call, and resolves into the
  **Accept / Refuse** choice — two ambiguous, definitive endings, neither a "win."

> **🔒 Expansion v2 additions (design-locked; build: PLANNED).** These deepen the vault above; they
> are canon decisions **not yet in the build** (`STORY.md` "Changelog — Expansion v2"):
> - **The Echoes.** The Signal's 142 minds get *voices* — the player recovers short found fragments
>   (a frozen text thread, a looped voice note, a diary still writing) of individual residents across
>   Phase 3. A 7-face cast: a child (Theo), a nurse (Rosa), a man at peace (Walt), a regretter (Priya),
>   a man who left his love off the list (Marcus), your containment lead (Sorkin), a dissenter (June).
>   **Kim is not among them** — she refused; her *absence* at the Signal Core is the beat.
> - **Why only 143 (the unchosen).** 143 was a containment ceiling; you chose to fill it *now*, and the
>   breach you were warned about spilled the wild Signal into everyone else. The same act saved the 143
>   and doomed the city. **You signed who wasn't saved.**
> - **Dr. Lena Sorkin.** Your containment lead, who warned you three times and went in anyway —
>   sharpens the architect's guilt without diluting it; pays off at the Annex (the breach was foreseen).

### 4.5 Spoiler discipline (the rule that governs writing)

The prologue stays subtle: infected are "it" / "something"; Ellie is a scared survivor; Kim is only
"KIM." Each Phase 3 region states **exactly one** truth, only when the player earns it there. Any
line implying Ellie has a body or a location is a **lie that contains a true, Signal-known
observation** — never a straightforward truth. See `STORY.md` §3–§4 for the full ruleset.

---

## 5. Game structure & flow

### 5.1 Macro flow

```
TITLE / MENUS
   │  (Start · Load[3 slots] · Story · Options)
   ▼
PROLOGUE ─────────────────────────────────────────────────────────────
   Phase 1 — Apartment            wake · Ellie contact · prep · route choice
   Phase 2 — The Crossing         one of {Mercy General · Metro · Route 9}
       └ lead queue: atmosphere · encounters · memory fragment · route clue
   Shelter                        day transition · setup · resource beat
   Haven Approach                 approach beats · first Signal-distortion · the crack
   Haven (finale of prologue)     empty compound · the 143 record · the call
       └ ends on `i remember you.` → click. → auto-flow into Phase 3
─────────────────────────────────────────────────────────────────────
PHASE 3 — THE INVESTIGATION (hub & spoke)
   Haven hub  ──►  Mercy General   (truth: YOU)
              ──►  Comms Array     (truth: THE SIGNAL)
              ──►  City Hall       (truth: PROJECT HAVEN)   [truth-gated]
              ──►  Research Annex   (truth: THE OUTBREAK)    [count-gated: 2 truths]
   All 4 truths uncovered ──► FINALE at Haven's gate yard
─────────────────────────────────────────────────────────────────────
FINALE
   Final call · convergence of held threads · Accept / Refuse
       └ ENDING (accept = signal-green · refuse = cold-grey) · recorded to profile
```

### 5.2 The phase state machine (implementation-true)

The build advances through named phases (from `DeadSignal.jsx`). Designers should know these names
because they are how beats are addressed:

`phase1` → `p2_ai` / `p2_memory_frag` / `p2_discovery` / `p2_scripted` / `p2_ai_cross` (the crossing
legs) → `encounter` (interrupt, returns to caller) → `shelter` → `haven_approach` → `haven_ai` →
`haven_final` → **`phase3`** (hub + region nodes: `mercy`, `comms`, `cityhall`, `annex`) →
`phase3_finale`. Full map in [`DESIGN.md`](../technical/DESIGN.md).

### 5.3 Pacing spine (prologue leg)

Each route leg is an ordered **lead queue** the player works at their own pace:

```
atmosphere → encounter(power) → calm beat → encounter(hazard) → drain →
encounter(search) → ROUTE CLUE (required — gate to leave) → memory fragment (optional) → atmosphere
```

The **route clue is required** to move on; the memory fragment is an optional post-clue find; the
**calm beat** is one guaranteed no-drain breather per run. This is the engine that keeps the squeeze
from becoming monotone. (See §7.4 and `DESIGN.md`.)

---

## 6. Core loops

### 6.1 Prologue loop — *stay alive, keep the line open*

```
READ a beat (Ellie text / narrator atmosphere)
   → DECIDE (tap a choice; choices are intent-coded and may show a risk tier)
   → RESOLVE (resources shift; maybe an encounter; maybe loot)
   → ADVANCE the lead queue (battery drains ~1%/beat on advancing beats)
   → [checkpoint: collect a memory fragment / the route clue]
   → repeat until the leg's gate opens → MOVE ON
```

The tension in this loop is **the battery**. Every advance costs power; power is also how Ellie
reaches you. The player is always trading survival margin against progress.

### 6.2 Phase 3 loop — *turn clues into truth*

```
At the HAVEN HUB, review the Case File (what's known / what's open / contradictions)
   → CHOOSE a region to travel to (gated by leads/truths)
   → INVESTIGATE nodes in the region (each raises facts/questions into the Case File)
   → SURFACE the region's single TRUTH (TRUTH UNCOVERED card + Case File entry)
   → the Case File EVOLVES (questions sharpen; new regions unlock)
   → return to the hub → repeat until all 4 truths → FINALE
```

The tension here is **comprehension and dread**: the loop rewards understanding, and understanding
is the thing that hurts. Survival persists but softened (battery = exploration, dusk pressures you
toward shelter, being caught out costs HP without ending the run).

### 6.3 Meta loop — *the Case File across runs*

Memory fragments and route clues **accumulate across playthroughs** toward 100% completion (per save
slot). Different routes surface different fragments/clues, giving replay a purpose beyond the two
endings: complete the board, hear the other ending.

---

## 7. Systems design

### 7.1 Survival economy

Five tracked resources create the prologue's pressure. Values below are the **shipped tuning
constants** from `DeadSignal.jsx` (the single source of truth; `DESIGN.md` tabulates every knob).

| Resource | Role | Prologue behavior | Phase 3 behavior |
| --- | --- | --- | --- |
| **Battery** | Life *and* lifeline | Drains **~1%/beat** on advancing beats; hits 0 → `offline` death | Drains on movement; refilled at powered nodes; not a death clock |
| **Charger (reserve)** | Rechargeable power bank | Found in P1 (dumps `CHARGER_FIND = 20%` into phone); refilled `+25%` per power source; transfers `+25%` to phone per tap | Same model; part of route-planning |
| **Food / Water** | Slow-burn attrition | Start at `START_SUPPLY = 4` each; neglect → 0 → starvation/dehydration death | Topped to `HAVEN_SUPPLY_FLOOR = 5` at the Haven cache |
| **HP** | Damage buffer | Lost to encounters/hazards; 0 → death | Lost to being caught out at dusk; does **not** end the run |
| **Noise** | Encounter pressure | Accumulates from loud actions; raises encounter odds; decays per leg by route | Softened |

**The battery is the whole economy.** It is tuned tight: `CHARGER_FIND = 20` starts Phase 2 at
~29%, so a player who ignores power sources goes `offline` before Haven, while an engaged player who
works the generators keeps a survivable margin. The **Haven cache** (`HAVEN_BATTERY_CACHE = 45`,
placed diegetically in the ops building) is the relief at the end of the scarcity gauntlet — it
replaced an older invisible "battery floor" so the relief is *found*, not gifted.

**The P1→P3 softening (Pillar 3) is real, not cosmetic.** In the prologue, `beatBatteryCost` charges
1%/beat and there is no reliable refill until Haven. In Phase 3, power sources are placeable and dusk
is the pressure, so battery becomes a **strategic exploration resource**, not a countdown.

**Free actions.** "Use the charger `[+N% Battery]`" is a **free action** (does not advance the beat
or drain) offered when the reserve is non-empty, the phone is <90%, and the player isn't mid-encounter
— this prevents mid-fight chugging while keeping relief available.

### 7.2 Routes & identity

Phase 2 offers three routes across Harwick. Each has a **distinct resource identity** so route
choice matters and replay feels different (from `ROUTE_PROFILE`):

| Route | Battery | Noise | Starter weapon | Feel |
| --- | --- | --- | --- | --- |
| **Mercy General (hospital)** | Common (`powerBias +0.20`) | **Deadly** — tight halls carry sound, never clears (`decay 0`) | Worn pocket knife (dmg 2) | Claustrophobic, clinical |
| **Metro** | Middling (`-0.05`) | Middling (`decay 1`) | Baseball bat (dmg 3) | The baseline; balanced |
| **Route 9** | **Scarce** (`powerBias -0.25`) | Forgiving — sound disperses outdoors (`decay 2`) | Crowbar (dmg 4) | Exposed, power-starved |

Each route also carries a **unique memory-fragment pool** and a **unique route clue** (§13), so the
three routes are three different slices of the mystery, not reskins.

### 7.3 Encounters & combat

Encounters are hazard interrupts that use a **shared resolver** with readable odds. The player is
offered intent options; the resolver computes live probabilities from **noise + weapon**.

- **Options:** SNEAK, RUN, FIGHT (rolled against `pSneak`/`pRun`/`pFight`), and FORCE (a no-roll
  `[COSTLY]` guaranteed outcome).
- **Risk tiers (display).** Each rollable choice shows a computed tag — `[LOW]` / `[MED]` / `[HIGH]`
  — derived from the *same* odds functions the roll uses (single source of truth). A quiet option
  stays untagged while genuinely favorable and only gains a tag if its odds degrade to MED/HIGH.
  The tag is HUD register, like `[+1 Noise]`; **Ellie never speaks it**.
- **Weapons** escalate: knife (2) → bat (3) → crowbar (4) → fire axe (5) → machete (6). Better
  weapons raise `pFight` and lower the cost of choosing to fight.
- **Outcomes** shift HP / noise / resources and return control to the exploration leg that spawned
  the encounter.

> 🔒 **Design intent (Spoiler Vault).** Combat is deliberately kept *mechanically simple and
> unglamorous*. Its job is not to be a fun combat system — it is to make the player complicit. In
> Phase 3 the Research Annex reveals every FIGHT was a half-connected **person**. We do **not** add
> more combat depth; that would celebrate the thing the game wants the player to mourn. (`STORY.md`
> §9 stop-doing list: "Combat stays as-is.")

### 7.4 Exploration — the lead queue

Each leg is an ordered list of **leads** the player reveals at their own pace. Every exploration
screen offers **"explore"** (reveal the next lead) and, once permitted, **"move on"** (leave). Lead
kinds: `atmo` (free atmosphere, may drain), `encounter` (`plan: power | search | hazard`), `memory`,
`discovery` (the route clue), and `calm` (the one-per-run breather). The **route clue gates the
exit** — "move on" stays locked until it's found — so the story spine is guaranteed while everything
after it is optional. This system replaced scattered hard-coded beat counters with one declarative,
save-resumable queue.

### 7.5 The Case File

The investigation layer — memories and clues are **not passive rewards**, they feed a persistent
detective board opened from the in-game **FILE** button.

- **Board categories:** `MEMORIES` (9), `CLUES` (3), `PEOPLE`, `LOCATIONS`. Entries start locked
  (`???`) and unlock as the matching fragment/clue is collected; people/locations reveal names and
  notes over time (kept spoiler-safe in the prologue).
- **Journal:** `KNOWN FACTS` (what you've proven) + `OPEN QUESTIONS` (what you haven't).
- **Contradictions.** Two known facts that can't both be true pair into the question they force —
  e.g. *"Haven is empty"* + *"the board reads PRESENT 143"* → **"Where are the 143?"** This is what
  makes the Case File read like a board, not a checklist.
- **Evolving questions.** Open Questions surface as in-chat **NEW QUESTION** cards and **sharpen** as
  the mystery deepens ("Who was Kim?" → "Was Kim one of the 143?"; "Why is Haven empty?" → "Where are
  the 143?") via a **QUESTION UPDATED** card, driven by the Haven `143` contradiction record.
- **Persistence.** Per save slot; accumulates across runs toward 100%.
- **Expansion v2 (design-locked; build: PLANNED).** A new **`ECHOES`** category holds recovered
  fragments of the Signal's 142 minds (`STORY.md` §3), and **truth-by-assembly (S1)** makes each
  region's truth resolve from its 2–3 supporting facts — shown assembling on the board (evidence →
  deduction → **TRUTH**) rather than dumped in one room.

### 7.6 Dialogue & choice presentation

- **Ellie** speaks in **human-paced typed messages** (a texting delay is deliberately kept — instant
  replies feel cheap). Lowercase, terse register.
- **Narrator / world** is **italic, centered** — a visibly different voice from the UI, protecting
  the phone frame (Pillar 2).
- **Choices** are **intent-coded** (styled by what kind of action they are) and may carry HUD-register
  tags (`[risk]` tiers, resource deltas). Reveal ordering keeps questions, narration, and choices
  readable rather than dumping them at once.
- **Pause freezes the dialogue** mid-beat — an accessibility and pacing feature, not just a menu.

---

## 8. Phase 3 — the investigation

**Structure: hub & spoke.** Phase 3 opens at **Haven** (the base — the dead phone, Ellie still
reachable, the 143 everywhere). From Haven the player chooses a region; regions unlock progressively
with light gating. **Each region holds exactly one truth**, delivered as its payoff.

| Region | Truth | Central question | Gate | Tone |
| --- | --- | --- | --- | --- |
| **The Haven** (hub) | Ellie | *What is Ellie?* | Start | Unnerving, lived-in, abandoned |
| **Mercy General** | You | *Who were you / why the wipe?* | Early (Haven records lead, or hospital route) | Clinical, personal, dread |
| **Communications Array** | The Signal | *What is the Signal? what does connection do?* | Mid (needs a Haven/Broadcast-Log clue) | Electromagnetic, wrong, humming |
| **City Hall** | Project Haven | *What was Project Haven for?* | Mid — **truth-gated on "you"** (`TRUTH_UNLOCKS`) | Bureaucratic rot, cover-up |
| **Research Annex** | The outbreak | *What is the outbreak? what are the infected?* | Late — **count-gated: 2 truths** | The worst place; the answer |

### 8.1 Reveal cadence & gating (implementation-true)

- **Mercy / Comms** unlock from Haven leads (any order).
- **City Hall** is **truth-gated**: `TRUTH_UNLOCKS = { you: "cityhall" }` — uncovering the *you*
  truth at Mercy opens it.
- **Research Annex** is **count-gated**: it needs **2 truths** uncovered.
- **The finale** appears at Haven's gate yard once **all 4 truths** are uncovered.

Each region states its truth only when earned there. 🔒 The Research Annex is the blunt one: it names
the outbreak as the Signal breaching containment, the infected as the half-connected, and every
prologue FIGHT as a person. Ellie's cracks step one rung per region, never exposition.

### 8.2 What each region def­initively reveals vs. holds (🔒 Spoiler Vault)

- **Mercy → YOU (full):** you were the architect; you erased yourself here, out of guilt. Holds
  *what* the guilt is about (→ City Hall / Annex).
- **Comms → THE SIGNAL (mechanism):** upload network; the connected are inside it; the texts are a
  transmission — no hand holds the phone. Holds *what Ellie is* (→ finale).
- **City Hall → PROJECT HAVEN (restrained, documents only):** a sanctioned program to upload the 143;
  the charter signed by you. Holds the moral framing and the outbreak cause (→ Annex).
- **Research Annex → THE OUTBREAK (blunt):** the breach, the half-connected, the combat reveal, you
  built both the clean and the wild Signal. Holds *where the 143 went* and *the choice* (→ finale).

---

### 8.3 Phase 3 deepening — Expansion v2 (design-locked; build: PLANNED)

The shipped regions **stand**; Expansion v2 layers **depth, not mechanics** onto them (`STORY.md` §5).
Each region keeps its single truth, its gate, and the Accept/Refuse endings **unchanged**, and gains:

- **A human sub-story** under the plot-truth — Haven (*"the last day"*), Mercy (the sealed ward = the
  patients who were dying and *not* selected, kept comfortable by the nurse Rosa), Comms (Kim's refusal
  dramatized), City Hall (*the selection* — who you chose and who you cut), the Annex (patient zero as a
  person; Sorkin's filed breach warnings).
- **~2× nodes** (Phase 3 ~35 → ~65), populated with the new sub-story rooms and **Echoes**.
- **Truth-by-assembly (S1)** — a truth resolves only once its 2–3 supporting pieces are found; the Case
  File assembles evidence → deduction → **TRUTH**, so a region *investigates* rather than handing over a
  paragraph.
- **The unchosen (U1)** threaded through City Hall + Marcus's Echo + Rosa's ward + an evolving Case File
  question (`why only 143?` → **`who did you leave out — and why?`**).

Held OPEN (documented, not in this pass): **U2** — a dedicated citizen-shelter region; **X1** — endings
shaded by what the player recovered.

## 9. Endings

The finale is a **final call at Haven** that bookends the prologue's first call. It converges the
held threads (🔒 what Ellie is; the 143 walked out; your held slot; Kim the counterweight) and
resolves into a single binary choice. **Neither ending "wins" — SOMA-tone.**

| | **Accept** — "Let her take you in." | **Refuse** — "Put the phone down." |
| --- | --- | --- |
| **You go** | In — warm, together | Stay — yourself, alone in a dead city |
| **Final image** | A body slumps against a wall, eyes open; *"you are not sure you are anyone at all."* | *"you are still yourself. for as long as that lasts."* |
| **Screen** | Signal-green | Cold-grey |
| **Recorded** | `profile.ending = "accept"` | `profile.ending = "refuse"` |

Endings persist per slot and support replay for the other ending. Public copy stays spoiler-safe:
"a final choice with two definitive endings."

---

## 10. UX, UI & presentation

- **Phone-native frame.** Message bubbles, a contact header, a HUD with signal/battery corner-anchored,
  intent-coded choice buttons. Larger mobile header; state-derived location labels.
- **The Case File** opens from the **FILE** button — a board + journal view, styled like a detective
  corkboard, spoiler-safe in the prologue.
- **Menus.** Title (Start · conditional Load · Story · Options), three-slot save/load with per-slot
  profiles, an in-game pause that freezes dialogue, save/exit and reset flows.
- **The Story screen** is a spoiler-safe lore page (the guide is never named).
- **Options** cover volume + mute today; the accessibility roadmap (§12) extends this.
- **Delivery.** Installable **PWA** (manifest, generated icons, iOS home-screen meta), a marketing/
  browser demo shell, and GitHub Pages deployment. Full detail in [`DESIGN.md`](../technical/DESIGN.md).

Wireframes for every core screen are the **Art Bible** deliverable (static SVG set) — see
[`../art/`](../art/).

---

## 11. Audio direction

Summary here; the full treatment is the **Audio Bible** ([`../audio/`](../audio/)).

- **No looping ambient bed — by design.** Audio is sparse UI/feedback one-shots plus a single quiet
  resolve chord on completion. Silence carries the dread.
- **Procedural, via Tone.js** (`src/audio.js`), built lazily on the first user gesture; every method
  no-ops until unlocked and while muted.
- **Palette:** UI taps (`tapResponse` / `tapMenu`), message `blip`, resource `gain` / `loss` stings,
  the completion `resolve` chord.
- **The Signal distortion artifact** (`signal()`) — pink-noise crackle + a detuned two-note chirp,
  **story-gated only** (approaching Haven, recovering a memory, the impossible 143 record, the call).
  Players learn to read it as *the Signal is here*. It never fires on routine actions.

---

## 12. Accessibility & localization

Summaries; full plans are their own docs ([accessibility](../accessibility/) ·
[localization](../localization/)), scheduled for a later session.

- **Accessibility.** The game is reading + tapping, never reflexes — a structural advantage. Pause
  freezes dialogue; all critical info is textual (fully playable muted). Roadmap: text-speed/instant
  reveal, contrast and scaling against the `#070707` canvas, a visual equivalent for the Signal audio
  cue, photosensitivity audit of the distortion effect, and content/trauma notes (grief, bodies,
  self-erasure). Target: WCAG 2.2 AA baseline.
- **Localization.** The build currently hardcodes English strings inline; loc begins with **string
  externalization** (the critical path). Culturalization watch-items: the `143 = "I love you"` motif
  and the `KIM → ELLIE` flip do not carry across languages and need per-locale strategies. Phone-UI
  string-length/overflow and CJK glyph coverage against the terminal aesthetic are QA priorities.

---

## 13. Content inventory

The authored content surface (from `DeadSignal.jsx`), for scope tracking:

- **Routes:** 3 (Mercy General / Metro / Route 9), each with a resource identity, fragment pool, and
  clue.
- **Memory Fragments:** **9** total (3 per route pool; ~1 surfaced per run) — the personal thread.
- **Route Clues:** **3** (one per route, required to advance):
  - Hospital → **Patient File** — *the name is yours.*
  - Metro → **Broadcast Log** — *Haven named ~2 weeks pre-broadcast.*
  - Route 9 → **Deployment Order** — *personnel reassigned to Project Haven.*
- **Phase 3 regions:** 5 (Haven hub + 4 truth spokes), each with investigable nodes that raise Case
  File facts/questions.
- **Case File:** 9 memories · 3 clues · people · locations · a growing set of known facts, open
  questions (with evolutions), and contradictions.
- **Encounters:** shared-resolver hazards across routes/crossing/Phase 3; a `cornered` variant;
  reaction lines; weapon pickups (5 tiers).
- **Set-piece sequences:** Haven approach beats, the Haven final sequence, the finale convergence,
  and two ending sequences.
- **Endings:** 2 (Accept / Refuse).
- **Expansion v2 (design-locked; build: PLANNED, not yet in the game):** +**~14 Echoes** (a 7-face
  recurring cast) as a new `ECHOES` Case File category; Phase-3 nodes **~35 → ~65** (region sub-stories);
  the *unchosen* thread (U1); **truth-by-assembly** (S1); a **prologue second act** (route midpoints, the
  shelter as a scene, deeper Ellie). Full spec in `STORY.md` "Changelog — Expansion v2".

---

## 14. Scope & non-goals

**In scope (this build).** Polish and consistency on the shipped spine: dialogue pacing, HUD
readability, save/load robustness, mobile presentation, deployment reliability, and keeping all
public surfaces aligned and spoiler-safe.

**Explicit non-goals** (the `STORY.md` §9 stop-doing list, formalized):

- ❌ More encounter types, more random exploration beats, more Haven flavor text, more survival
  mechanics. The investigation layer and the regions are the game; mechanics are done.
- ❌ **More combat depth.** Combat's meaning arrives in Phase 3, not through mechanics (§7.3).
- ❌ Any return to live-LLM / networked narration. Determinism is a pillar (see [`PLAN.md`](../production/PLAN.md)).
- ❌ Real-time / wall-clock day gates — designed, built, then **dropped** for a smooth prologue→Phase 3
  flow (`STORY.md` changelog #8).

> **Expansion v2 reconciliation.** The "no more exploration beats / Haven flavor" non-goal targeted
> *pre-Phase-3 busywork* and still holds for **mechanics**. The sanctioned **Expansion v2** narrative
> work (Echoes, region sub-stories, the unchosen, the prologue second act, truth-by-assembly) is the
> deliberate exception — it is the answer to "the story is too shallow / too short," and it adds
> *authored depth, not new systems*. New **combat / survival / encounter** mechanics remain firmly
> non-goals (`STORY.md` §9 carve-out).

**Deferred (own docs / later sessions).** Production Plan, Audio Bible, Art Bible + wireframes,
Localization, Accessibility.

---

## 15. Risks & open questions

| Risk | Impact | Mitigation |
| --- | --- | --- |
| **Narrative consistency drift** across many docs | Canon rot; the mystery breaks | `STORY.md` is the single source of truth; docs defer to it; a consistency pass is standing practice |
| **Spoiler leak** into public surfaces | Kills the reveal | Spoiler discipline codified (§4.5); public copy reviewed against the vault |
| **Mobile Safari audio/PWA quirks** | Audio fails to unlock; standalone bugs | `audio.js` already handles the iOS unlock/resume dance; keep it under test |
| **Solo-dev bandwidth** | Slow burndown | Phased documentation; ruthless non-goals (§14) |
| **Localization debt** (hardcoded strings) | Expensive to add later | Externalize strings early (§12); flagged as loc critical path |

**Open design questions (author's call — see `STORY.md` OPEN flags):**

- Where the 143 physically *went* after walking out (locked only that they walked).
- Whether ignore-power should be made outright lethal before Haven (a tuning lever, `CHARGER_FIND`).
- Phase 3's own starting-battery economy (Phase 3 currently inherits; may set its own low floor).

---

## 16. Appendix

### 16.1 Glossary

- **Haven** — the broadcast/compound the prologue crosses the city to reach; Phase 3's hub.
- **The Signal** — reserved term for the deeper Phase-3 mystery; the prologue says "broadcast."
- **The 143** — Haven's resident count; a seeded motif before it's explained.
- **Connection / upload** — 🔒 the Signal copying a mind into itself.
- **The half-connected** — 🔒 the "infected"; incompletely uploaded people.
- **Lead queue** — the per-leg ordered exploration list (§7.4).
- **Crack** — a hint that raises a question without answering it (Pillar 1).
- **The Echoes** — 🔒 recovered fragments of the Signal's 142 minds; the 143 given voices (Expansion v2).
- **The unchosen** — 🔒 the city that wasn't saved; the moral spine of *why only 143* (Expansion v2).
- **Truth-by-assembly** — a region's truth resolving from its supporting evidence, not a single dump (S1).

### 16.2 Key tuning constants (reference)

| Constant | Value | Meaning |
| --- | --- | --- |
| `beatBatteryCost` | 1%/beat | Battery drain on advancing beats |
| `CHARGER_FIND` | 20 | P1 charger find dumped into phone (→ ~29% into Phase 2) |
| `CHARGER_RECHARGE` | 25 | Reserve gained per power-source search |
| `CHARGER_TRANSFER` | 25 | Reserve → phone per "Use charger" tap |
| `START_SUPPLY` | 4 | Starting food & water |
| `HAVEN_BATTERY_CACHE` | 45 | Battery from the Haven ops-building cache |
| `HAVEN_SUPPLY_FLOOR` | 5 | Haven pantry tops food/water to at least this |
| `MAX_VISIBLE_CHOICES` / `HARD_CHOICE_CAP` | 4 / 5 | Choice UI limits |

Full table with line references in [`DESIGN.md`](../technical/DESIGN.md).

### 16.3 Related documents

- **Narrative canon:** [`STORY.md`](../narrative/STORY.md)
- **Product:** [PRD](../product/PRD.md)
- **Engineering:** [Technical Design](../technical/DESIGN.md)
- **Historical:** [`PLAN.md`](../production/PLAN.md) (AI-removal + battery-economy roadmap, complete)

### 16.4 Change log

| Version | Date | Notes |
| --- | --- | --- |
| 1.0 | 2026-07-06 | First full GDD. Grounded in the shipped build (prologue + Phase 3 + finale) and `STORY.md` canon. |
| 1.1 | 2026-07-06 | Expansion v2 (design-locked; build: PLANNED): Echoes + 7-face cast, the unchosen / why-only-143, Dr. Sorkin, region sub-stories (~2× nodes), truth-by-assembly, prologue second act. §4.4, §7.5, §8.3, §13, §14, §16 updated. |

*End of document.*
