# Dead Signal — Story Bible

| | |
| --- | --- |
| **Version** | Living |
| **Status** | Narrative canon — the single source of truth; wins every conflict |
| **Last updated** | 2026-07-06 |
| **Owner** | Jharek (narrative) |
| **Companion docs** | [GDD](../design/GDD.md) · [PRD](../product/PRD.md) · [Technical Design](../technical/DESIGN.md) · [Production Plan](../production/PRODUCTION.md) · [Art Bible](../art/ART.md) · [Audio Bible](../audio/AUDIO.md) |

> **This is the canon.** Every other document in `docs/` defers to this file. It is spoiler-heavy by
> design — it holds the answers the public-facing surfaces never state.


> Single source of truth for narrative canon. **LOCKED** = decided, build against it.
> **OPEN** = a deliberate gap for the author to fill — do not invent a definitive answer in code.
> Spoiler discipline is the prime directive: the prologue *cracks* the mystery; Phase 3 *answers* it.

---

## 1. Premise & structure — LOCKED

You wake in an apartment in **Harwick** with no memory, during an outbreak. A stranger, **Ellie**,
texts you and guides you toward a broadcast signal called **Haven**. You reach Haven. It is empty.
The call ends on `i remember you.`

- **Phase 1 + 2 = the prologue.** Wake → contact → cross the city (one of three routes) → shelter →
  reach Haven. Linear, survival-driven, texting-only.
- **Phase 3 = the actual game.** An open-world **investigation**. Touchstones: *A Dark Room +
  Lifeline + SOMA + Silent Hill*. The player pursues truth across regions, in any order.
- The prologue's job is to raise questions, not answer them.

## 2. The mystery — what's true vs. what's hidden

### Locked truths (the spine)
- **You are connected to Project Haven and to Mercy General** — the evidence you surface on each
  route is *about you*: a patient file with your name, a broadcast log, a deployment/personnel order.
  You were not a random survivor.
- **Haven was real and populated** — **143 residents**, photographed ~3 weeks before Day 1.
- **Ellie existed at Haven before the outbreak** and is tied to your evidence.
- **Ellie has been texting you the whole time using KIM's number and identity** (see §3 — no one is
  physically holding Kim's phone; the "found a phone" story is Ellie's fabricated survivor persona).
- **Ellie is no longer simply human** — she is *the connected, wearing a voice* (locked below).

### PHASE 3 REVEALS — LOCKED (SPOILERS, internal only)
> These are the answers. The **prologue must never state them** — it only cracks toward them. Each is
> the payoff of one region (§5); surface them only there, in Phase 3.
- **The Signal = an upload network (SOMA-like).** "Connection" copies a person's mind into the Signal;
  the connected aren't dead — they're *inside* it. ("i can still hear them.")
- **Connection has two modes — this is the keystone that makes the whole world cohere:**
  - **Controlled upload (Haven).** Voluntary, clean, *complete*. The mind goes over whole — and a
    completed connection does not drop the body. **The Signal walks them out.** The 143 left Haven on
    their own feet, through the gate ("open. not broken. not forced."), *after*. Where the bodies
    went is the late-game horror payoff (Research Annex / OPEN destination — lock only that they
    walked).
  - **Wild Signal (the city).** The outbreak is the Signal **escaping Haven's containment** into
    Harwick — involuntary, uncontrolled, *incomplete*. It grabs people and only partially pulls them
    through. **The "infected" are the half-connected:** mind partly inside the Signal, body still
    moving, hostile. The streets are full because the city got the botched version; Haven is empty
    because it got the clean one.
- **Combat is the delivery mechanism for the worst reveal.** Every FIGHT in the prologue was the
  player putting down a half-connected *person* — a mind still partially alive inside the Signal.
  The Research Annex truth states this; FIGHT recontextualizes retroactively. Do not soften it and
  do not foreshadow it.
- **Project Haven = mind preservation.** A program to upload **the 143** into the Signal before the
  end. Haven is the compound that ran it.
- **Ellie = the connected, wearing a voice.** She *accepted* upload; she is part of the Signal now,
  reaching the player through Kim's number. Her slow de-humanizing (§3 ladder) is the human shell
  thinning. She remembers the player because she was *there*.
- **The board counts minds, and it counts YOU.** Kim refused her slot, so connected minds number 142.
  The status board reads `PRESENT 143` because **the Signal already counts the player** — Ellie is
  holding Kim's refused slot open for you. The prologue's "impossible record" is not a glitch; it is
  the Signal's quiet claim on the player. Pays off into the Phase 3 Accept/Refuse choice.
- **The wipe = the architect's guilt.** The player **built or ran** Project Haven and could not carry
  what they'd done, so they erased themselves. That's why every clue points back at the player — and
  why **Ellie remembers you.** *(Supersedes any earlier "investigator who couldn't accept the Signal
  was safe" framing in older docs — the architect/guilt version is the only canon.)*
- **Kim is the counterweight (see §3):** she *rejected* connection and died as herself. Ellie changed;
  Kim stayed human and it killed her. The player has been trusting the wrong one.

### The unchosen — why only 143 — LOCKED (design) · build: PLANNED (the moral spine)
> The deepest question the shipped build never asks: a city of thousands died so **143** floated.
> This locks the answer. Delivered in Phase 3 (City Hall + Echoes), never the prologue.
- **143 was a containment ceiling, not a measure of mercy.** The first stable Signal build could hold
  only ~143 minds before the breach-risk curve spiked (**Sorkin's** containment math, below). You chose
  to fill the 143 named slots **now** rather than wait to scale — knowing the rest of Harwick would get
  nothing.
- **The same act saved the 143 and doomed the city.** The breach you were warned about spilled the
  **wild Signal** into everyone else (the two-mode keystone, above). The lifeboat and the flood are one
  decision. This is the horror under the whole game.
- **Someone chose the names. It was you.** The roster is a *selection* — criteria, petitions from
  citizens who applied and were cut, dissent struck from the record. The horror isn't that 143 were
  saved; it's that you signed who wasn't.
- Delivered by: City Hall (the selection) + **Marcus's** Echo (the left-off) + **Rosa's** ward (the
  un-selected dying) + the Case File question evolving `why only 143?` → **`who did you leave out — and why?`**

### Dr. Lena Sorkin — LOCKED (design) · build: PLANNED (the warned breach)
- Your **containment lead**. She ran the breach numbers and brought them to you **three times**; you
  authorized the program anyway. She then **accepted upload herself** — she is one of the 142.
- Her Echo amplifies your guilt **without diluting it**: you were warned, in writing, by name. The
  architect (you) remains the one who signed and the one who carries it. Pays off at the **Research
  Annex** — her warnings filed exactly where the breach happened: the outbreak was *foreseen*.

These are delivered region-by-region; the Journal holds them as **Open Questions** until proven.

## 3. Characters

### The Player — LOCKED
Amnesiac. **The architect** — built or ran Project Haven, then erased their own memory rather than
carry the guilt of it (the self-wipe). Tied to Mercy General and Project Haven; every clue points
back at them. Name/role surface gradually via Memory Fragments; the full identity is a Phase-3 payoff.

### Ellie Marsh — LOCKED
The voice guiding you. Reads as a scared survivor through the prologue (keep that). She knew you
before the wipe. She is the one texting — never "Kim." **She is the connected, wearing a voice**: she
accepted upload and is part of the Signal now, reaching you through Kim's number. Across Phase 3 she
becomes **less human** in small cracks (the shell thinning), never a blunt declaration. Ladder (tone):
`i remember you.` → `i remember all of you.` → `i remember everyone.` → `i can still hear them.`
Then the player asks: *who is "them"?*

**The phone — LOCKED mechanics of the lie.** Nobody is holding Kim's phone. Ellie exists in the
network and **spoofs Kim's number and identity**; the texts arrive on the player's own phone (the
one on the apartment floor, contact saved as KIM — the player knew Kim before the wipe). Her opening
story — "found a phone, you were the last call, our stairwell" — is the **fabricated survivor
persona**, wrapped around facts the Signal genuinely knows (Kim *is* dead in the player's stairwell;
the player *did* call her last). Rule for all writing: any line that implies Ellie has a body or a
location is a **lie that happens to contain a true, Signal-known observation**. Phase 3 payoff: the
moment the player realizes no hand ever held that phone.

### Kim Alvarez — LOCKED
- Haven resident, **one of the 143**. **Ellie's closest friend.** Communications technician.
- **She rejected connection.** When the uploads began she refused her slot and **fled Haven into
  Harwick — to find the architect**, the one person who could stop it or explain it. The player's
  unexplained "last call" is the other half of this: you called her, she came, and by the time she
  reached your building you had already wiped yourself. She died in your stairwell trying to reach
  someone who no longer existed.
- **How refusing killed her:** not directly. Refusal put her *outside* the Signal during the
  outbreak — alone in a city the wild Signal was tearing apart, and the city killed her. She is the
  player's road not taken: exactly the situation the player survives in the prologue.
- The **dead woman in the stairwell** — the body in Ellie's "found a phone" story (Day 1).
- **Her refused slot is the 143rd the board still counts** — held open, now claimed for the player
  (§2). Her death off-compound is why Haven's own records never corrected the count.
- **Payoff:** the contact is named **KIM** at first; the name flips to **ELLIE** mid-prologue (this
  flip already exists in code). The reveal: Ellie was always the one texting, *through Kim's number
  and identity*. Kim never connected; Ellie did. This makes `KIM → ELLIE` mean something.
- **Spoiler discipline (locked):** the prologue stays **subtle** — Kim is only "KIM", the dead
  phone-owner the player called right before. The full identity (**Kim Alvarez**, comms tech, one of
  the 143, Ellie's closest friend who rejected the Signal, why she was in your stairwell) surfaces
  **only in Phase 3 (Haven region)**.

### The 143 — LOCKED motif
Haven's resident count. Seed the number everywhere in Haven (door numbers, population logs,
whiteboards, sticky notes) **without explanation**, then pay it off later as "143 residents."
They are not missing and not dead: they connected, and **the Signal walked them out the gate.**
Connected minds actually number **142** (Kim refused); the board's 143 is the player's slot (§2).

### The Echoes — LOCKED (design) · build: PLANNED
The Signal holds **142 running minds**. Phase 3 lets the player **recover Echoes** of them — not
talking characters, but fragments the Signal keeps replaying: a frozen text thread, a looped voice
note, a diary still writing itself. Terse, found, unbearable. Echoes are the SOMA move in Dead
Signal's register: they turn the 143 from a number into **people**, so "the Signal walked them out the
gate" finally *lands* — and they literalize Ellie's `i can still hear them` (now the player can too).

**Rules (restraint holds).** Phase 3 **only** — never the prologue. 2–4 lines each. Surfaced at
Signal-dense / powered nodes. An Echo *cracks*, it never explains; no melodrama, no exposition. New
Case File category **`ECHOES`** (§6).

**The recurring cast — 7 faces for the 143:**
- **Theo** — a child, ~8. `mom says it's like a nap on the bus. you wake up somewhere better.` → `…is she coming too?` (The 143 included kids.)
- **Rosa** — a Mercy nurse who went to Haven; kept the un-selected dying comfortable to the end. `the ones they picked, i kept comfortable. the rest i just kept warm.`
- **Walt** — old, terminal; the **moral counterweight**. Upload was mercy and he *chose* it. `i was going to die with tubes in me. this i picked. don't you dare grieve me.`
- **Priya** — the **regretter**; recanted a breath too late. `i said i'd changed my mind. the tech looked at me like i'd asked to un-ring a bell.`
- **Marcus** — took his slot; the person he loved was **cut from the list**. `i asked if he could have mine. they said it doesn't transfer. what does that make me.` (Carries the *unchosen* into one human.)
- **Dr. Lena Sorkin** — your containment lead / Cassandra (§2). `i brought you the numbers three times. you signed anyway.`
- **June** — sided with **Kim**; argued the lifeboat would drown the city. Ties to City Hall's dissent.

**Kim is NOT an Echo — E3, the absence beat.** She refused; she never went in, so there is nothing of
her in the Signal. At the **Signal Core** the player goes looking for her among the running minds and
she isn't there: *"you look for her the way you look for a name in a list. she isn't running. she isn't
anywhere. she meant it."* The one voice you trusted is the one the Signal can't give you. Pure restraint
— it costs nothing and lands hardest. (Reinforces Kim as the counterweight, §2/§3.)

## 4. Tone & writing rules — LOCKED
- **Survival carries over, softened.** Not removed. P1–2 = "battery is life"; P3 = "battery is
  exploration" — power is a strategic resource (phone + charger + radio + flashlight), not a constant
  countdown. The player still feels vulnerable; survival doesn't dominate the investigation.
- **The infected stay unexplained in the prologue.** Call them "it" / "something" / "what's out
  there." Never "infected" in Ellie's voice as a diagnosis, never hints of the half-connected truth.
  The wrongness should read as zombie-adjacent until the Research Annex says otherwise.
- **Ellie's cracks are slow and sparse.** Never "I AM THE SIGNAL." Unease, not exposition.
- **Ellie never demonstrably acts in physical space.** She observes, warns, knows — she never opens
  a door, never appears, never produces an object. (Protects the no-body truth, §3.)
- **Empty Haven is unnerving, not just mysterious** — repeated 143s, lights on, coffee cold, no people
  — and **no bodies.** Never stage corpses inside Haven; the absence is the clue (they walked).
- **Lowercase, terse texting voice** for Ellie; italic centered narration for the world.
- **Reveal less, imply more.** If a beat explains the mystery, cut it to a *crack*.
- **Echoes crack, they don't confess** (Expansion v2). A recovered mind is a fragment mid-thought —
  2–4 lines, no scene, no resolution. Never let an Echo narrate the mystery; it only makes the 143
  human. The child and the regretter are the hardest lines in the game precisely because they are the
  *shortest*. Never stage them for shock.

## 5. Phase 3 regions — LOCKED
**Structure: hub & spoke.** Phase 3 opens at **Haven** (your base — the dead phone, Ellie still
reachable, the 143). From Haven the player chooses a region to investigate; regions unlock
progressively with light gating. Each holds **one truth** (the locked reveals, §2).

| Region | Truth | Identity | Central question | Key evidence | Gate | Tone |
|---|---|---|---|---|---|---|
| **Haven** | Ellie | Empty compound built for 143 | *What is Ellie?* | resident logs, Kim's comms station, the photo wall, the 143 everywhere, the uncorrected roster (Kim's refusal never logged) | start (hub) | unnerving, lived-in, abandoned |
| **Mercy General** | You | The hospital from your route | *Who were you / why the wipe?* | your patient file, an admit/procedure record, a room that's *yours* | early | clinical, personal, dread |
| **Communications Array** | The Signal | Source of the looping broadcast | *What is the Signal? what does connection do?* | transmitter logs, the loop's origin, Kim's last transmission | mid (needs a Haven clue) | electromagnetic, wrong, humming |
| **City Hall** | Project Haven | The project's origin/authority | *What was Project Haven for?* | the charter, the 143 roster, who signed off | mid | bureaucratic rot, cover-up |
| **Research Annex** | The outbreak | Where it began | *What is the outbreak? what are the infected? how does Haven relate?* | lab logs, patient zero, the containment breach, the Project↔Signal link, **what the player has been fighting** | late (needs 2 truths) | the worst place; the answer |

**Reveal cadence:** each region delivers its single truth as its payoff; Research Annex ties the upload
tech to the dying world — including the half-connected truth that recontextualizes every prologue
FIGHT. Spoiler discipline holds — a region states its truth only when the player earns it there.

**Build status — PHASE 3 COMPLETE (3A–3F shipped).** Haven hub + four truth spokes (Mercy/Comms/City
Hall/Annex) + the **finale**. Gating: Mercy/Comms from Haven leads (any order); **City Hall** truth-
gated on "you"; **the Annex** count-gated (2 truths); the **finale** appears at Haven's gate yard once
**all 4 truths** are uncovered.
**The finale (3F) — a final call at Haven (bookends the prologue's first call); two AMBIGUOUS,
definitive endings, neither "wins" (SOMA-tone).** Answering pays off the last held threads: **what
Ellie is** (she accepted upload — she's the connected; no one ever held the phone, it's been her
reaching); **the 143 walked out** the open gate after a clean upload ("that's what a finished one
does" — *where* they went stays OPEN, §2); **your held slot** (the board counts you; Kim refused hers);
**Kim** the counterweight (she stayed herself, the city took her). Then the choice:
- **Accept** ("Let her take you in") → you go in — warm, together — but a body slumps against a wall,
  eyes open; "you are not sure you are anyone at all." (Signal-green ending screen.)
- **Refuse** ("Put the phone down") → you stay yourself, alone in a dead city, mortal — Kim's road;
  "you are still yourself. for as long as that lasts." (cold-grey ending screen.)
`profile.ending` ("accept"/"refuse") records the choice. Region truth details below describe the
current shipped canon.
**The Research Annex's truth = THE OUTBREAK ("the worst place; the answer" — full, blunt, §2):** the
`containment_core` states it plainly — the **outbreak = the Signal breaching Haven's containment** into
Harwick; the **infected are the half-connected** (people, minds half-pulled in, bodies still moving);
**every FIGHT in the prologue was a half-connected person** ("you didn't know. you do now."); and your
**Project Haven built the Signal that did it all** (Haven's 143 went in clean; the city got the spill).
Ellie's crack is grief, not exposition: *"i felt every one of them go out."* **Held for the finale
(3F):** where the 143 went / that they "**walked out**"; **what Ellie is** / that she chose upload; the
**Accept/Refuse** choice + your held slot. City Hall is below.
**City Hall's truth = PROJECT HAVEN (RESTRAINED reveal — cold documents, no editorializing):** the
`charter_vault` lays out that Project Haven was a **sanctioned program to upload the 143** into the
Signal "before the end" — the charter, the **143 roster** (Kim's name, and yours), and the
**authorization signed by you, as architect**. Ellie's crack = the roster rung **"i remember
everyone."** **Held at City Hall:** the moral "lifeboat for the few" framing + the cover-up's extent
(present the facts, let the player feel it); **what "the end" was** and **that Haven's Signal caused
the outbreak** (→ Research Annex, not foreshadowed). Held hook: *"why only 143 — and what were they so
sure was coming?"* Comms is below.

**Haven / Mercy / Comms shipped detail.** Haven is the explorable hub; Mercy and Comms are truth
spokes unlocked from Haven leads.
**Comms's truth = THE SIGNAL (mechanism + no-body phone, "what Ellie is" HELD for the finale):**
the `signal_core` states the Signal is an **upload network** — minds copied in; the connected are
**inside** it, not dead; the **143 are in there**; and the "KIM" texts have been a **transmission** —
**no hand ever held the phone**. `kim_booth` carries **Kim's last transmission** (she refused — "it
isn't sleep" — and went to find the architect, you; she died as herself). Ellie's crack steps to the
next rung (**"i can still hear them."**) and a deliberately **unanswered** question lands ("if no hand
ever held the phone — what's been texting you?"). **Held at Comms:** what Ellie *is* / that she chose
upload (→ finale); and the outbreak / **infected = half-connected** / combat = mercy (→ Research Annex,
not foreshadowed). Unlock: investigating **Haven's comms desk** (Kim's K.A. station) surfaces the array
lead. Mercy is below.

**Mercy General shipped detail.** Mercy is the first spoke that pays off a truth. **Mercy's truth = YOU (full reveal):** investigating room 312
states that you were **Project Haven's architect** and **erased your own memory at Mercy, out of
guilt** (admit record · self-authorized memory-ablation order · room 312 is yours · your note: "i
built it. i can't carry what that means. let me forget"). Mercy reveals **only** your identity + the
self-wipe — *not* what the Signal is, *not* the 143 upload, *not* the infected; the guilt's "over
**what**?" is the deliberate hook to City Hall (what Project Haven was) and the Research Annex (the
outbreak). Unlock gating: investigating **Haven's records office** surfaces the Mercy lead (a NEW LEAD
card) → Mercy travellable from the outer road; truth payoff drops a **TRUTH UNCOVERED** card and a
Case File **TRUTHS** entry. Ellie's Mercy crack is a single ladder rung ("i remember all of you").

### Phase 3 deepening — Expansion v2 — LOCKED (design) · build: PLANNED
The shipped regions **stand**; this layers depth onto them without touching the truths, the gating, or
the endings. Three levers: a human **sub-story** per region, **~2× nodes**, and **truth-by-assembly**
(S1). No new mechanics; strict restraint. Target: Phase 3 grows from ~35 nodes to ~65.

| Region | Sub-story (the human thread under the plot-truth) | New nodes (indicative) | Echoes |
|---|---|---|---|
| **Haven hub** | *"the last day."* A community caught mid-life. The 143 walked out on their own feet, one timestamp after another. | infirmary · children's room · quiet room/chapel · gate log; bunk 143 = Kim's made-but-empty refused bunk | Theo, Walt |
| **Mercy** | *the sealed ward means something* — the patients who were **dying and not selected**; Rosa kept them comfortable because Haven had no slot. | a second patient room that isn't yours · staff offices/Echoes | Rosa |
| **Comms** | *Kim, dramatized* — her workspace, the argument logs (June listened, most didn't), the counter-broadcast she couldn't send, the moment she walked. | operator bay · the failed counter-broadcast · (E3 lands at Signal Core) | June; **Kim's absence (E3)** |
| **City Hall** | *the selection* — criteria, citizen petitions (the unchosen in their own hand), June's struck dissent. Truth deepens to **"you chose 143 names."** | petitions/mail room · dissent record | June |
| **Research Annex** | *patient zero was a person* — the first subjects' history (consent? the terminally ill?); Sorkin's breach warnings filed where the breach happened. | first-subject cell · the oldest, half-degraded Echo | Sorkin, patient zero |

- **S1 — truth by assembly.** A region's truth **resolves only once its 2–3 supporting pieces are
  surfaced**; the Case File visibly assembles evidence → deduction → **TRUTH**. Investigation, not
  receipt. Region truths, gates, and Accept/Refuse endings are otherwise **unchanged**.
- **U1 — the unchosen, threaded** (not a new region): City Hall (the selection) + Marcus's Echo +
  Rosa's ward + the evolving Case File question (§2). Maximum moral weight per node; fits ~2× cleanly.
- **Held OPEN (author's call, not in this pass):** **U2** — a dedicated *citizen-shelter* region for
  the unchosen (a thematic region holding no new truth; pushes toward the top of ~2×). **X1** — shading
  the two endings by what the player recovered (same two screens, more personal convergence). Both are
  documented so they can be picked up later without re-planning.

### Survival in Phase 3 — "battery is exploration" — BUILT
Power becomes route-planning instead of a constant death clock. Movement drains the phone, powered
nodes can refill a low battery, dusk pressures the player toward shelter, and being caught outside
costs HP without ending the run. The tool-drain layer (radio/flashlight as separate consumers) remains
a future tuning idea, not current shipped behavior.

## 6. The investigation layer — BUILT
Memories/Clues are no longer passive rewards — they feed a persistent **Case File** (the
Investigation Board + Journal). Implemented, opened from the in-game **FILE** button:

- **Board categories (built):** `MEMORIES` (9), `CLUES` (3), `PEOPLE`, `LOCATIONS`. **Expansion v2
  adds `ECHOES`** — the recovered fragments of the 142 running minds (§3); build: PLANNED.
- **Journal:** `KNOWN FACTS` (what you've proven) + `OPEN QUESTIONS` (what you haven't).
- Entries start locked (`???`) and unlock as the matching fragment/clue is collected. People/Locations
  reveal names/notes over time (kept spoiler-safe in the prologue per §3).
- Persists per save slot (reuses the per-slot profile system).
- **Built beyond the original spec:** Open Questions surface as in-chat **NEW QUESTION** cards and
  **evolve** as the mystery deepens ("Why is Haven empty?" → "Where are the 143?"; "Who was Kim?" →
  "Was Kim one of the 143?") via a **QUESTION UPDATED** card, driven by the Haven **143** contradiction
  record. A once-per-slot nudge teaches the FILE button.
- **Example Known Facts (provable in the prologue):** Ellie knew me before the wipe · Project Haven
  existed before the outbreak · Haven was populated ~3 weeks before Day 1 · the board counts 143 present
  while you stand alone.
- **Example Open Questions:** Why did I erase my memory? · Who was Kim? · Why did I call Ellie? ·
  Why is Haven empty? · Who is Ellie?

- **Expansion v2 — the board becomes an investigation (build: PLANNED).** Two additions: the
  **`ECHOES`** category (the 142 minds, §3), and **S1 truth-by-assembly** — a region's truth surfaces
  only once its 2–3 supporting facts are collected, and the Journal shows the deduction assembling
  (evidence → contradiction → **TRUTH**) instead of a single truth-room dump. The unchosen adds one
  evolving question: `why only 143?` → **`who did you leave out — and why?`** (§2).

## 7. Haven = the first crack, NOT the answer — LOCKED
The prologue ends at Haven. It must **crack** the mystery, never explain it.
- Keep: Haven empty/unnerving; Ellie tied to your route's evidence (the route-specific *crack*).
- Trim: any beat that over-explains (the corkboard "you see her / labeled" dump).
- End the finale on `i remember you.` → **the call goes dead.** → `click.` Player alone. No answers.
- Do **not** reveal: self-wipe, "you were the investigator," what Ellie is, the connection truth,
  what the infected are, that the 143 walked, that the board counts the player.
- **Phase 3 handoff (build, Phase 3A).** After `click.` the prologue **auto-flows** into the Phase 3
  Haven hub — there is no standalone "to be continued" completion screen anymore. The silence after the call
  *is* the "player alone" beat: a short narrator breath (`you're still here. alone.`) carries straight
  into the gate yard. Resources carry over ("battery is exploration"); prologue progress/100% still
  commits at the handoff. The transition gives **no answers** — Phase 3 earns them region by region.

## 8. What's already canon in the build
- Harwick; three routes (Mercy General / Metro / Route 9); shortwave Haven broadcast w/ GPS coords.
- 9 Memory Fragments (3 per route pool, 1 random/run) + 3 Clues (1 per route): hospital→*patient file,
  the name is yours*; metro→*broadcast log, Haven named 2 weeks pre-broadcast*; route9→*deployment order,
  personnel reassigned to Project Haven*.
- KIM→ELLIE contact-name flip exists. Haven evidence ties Ellie to the compound before Day 1 —
  route-specific (her face, voice, or name in Haven-linked records, surfaced at Haven's Records office).
- **The phone is the player's own** — found on the apartment floor, contact saved as KIM. Ellie's
  "found a phone" line is her persona's lie (§3). Any copy implying the player carries *Kim's* phone
  is wrong and must be corrected (one Case File note in `DeadSignal.jsx` — see changelog).
- **Language:** in P1–2 the player hears a *broadcast* (shortwave/loop/coordinates/transmission). Reserve
  "the **Signal**" for the deeper Phase-3 mystery (the phone-pressure beat near Haven is the first use).
- Per-slot progression: fragments/clues accumulate toward 100% across playthroughs.
- **Case File built** (§6): board + journal, evolving Open Questions (NEW QUESTION / QUESTION UPDATED
  cards). The Haven finale includes the impossible **143 residents / 143 present** record — a
  contradiction, not an explanation (§7 holds: it cracks, never answers).
- **Phase 3 built** (§5): Haven hub, Mercy, Communications Array, City Hall, Research Annex, truth
  tracking, day/night shelter pressure, finale call, and Accept/Refuse endings.
- **Ellie's first crack:** on the Haven approach she volunteers unease about her own knowledge
  ("i don't know how i know that") — slow and sparse, no exposition (§4).
- **Presentation/QoL:** a spoiler-safe **Story** lore page (the guide stays unnamed), an **Options**
  screen (volume + mute), an in-game pause that **freezes the dialogue**, human-paced Ellie texts,
  intent-coded choices, accurate location labels, and procedural audio (message blips, resource
  stings, a rare **Signal-distortion** artifact at memory recovery / the approach / the 143 record /
  the call).

### Prologue second act — Expansion v2 — LOCKED (design) · build: PLANNED
Give the crossing a real journey without breaking the tight battery economy or the spoiler discipline
(the prologue still only *cracks* — zero answers, no Echoes).
- **P1 — a real midpoint per route.** Each route gains a **second leg** with its own character. The
  midpoint is a **trace of others who ran before you** — a scrawled route, a dead phone, a child's
  shoe — seeding the *unchosen* theme early and spoiler-safe (just "people were here, and they didn't
  make it"). Never named, never explained.
- **P2 — the shelter becomes a scene.** Today it's a resource stop; make it the prologue's quiet
  heart — signs of the previous occupant, the first faint wrongness in the broadcast, one more Ellie
  crack that makes the `KIM → ELLIE` flip land harder. Still zero answers.
- **P3 — deepen Ellie in the prologue.** A few more sparse cracks and warmth so the guide is a
  *relationship*, not a quest-giver — which makes every Phase 3 revelation about her cut deeper.
  Strictly within the crack ladder (§3); she never over-shows and never acts in physical space (§4).

## 9. Stop-doing list — LOCKED
Not worth more time pre-Phase-3: more encounter types, more random exploration beats, more Haven
flavor text, additional survival mechanics. Build the investigation layer and the regions instead.
**Combat stays as-is** — its job is done; its meaning arrives in Phase 3 (Research Annex), not
through more mechanics.

> **Expansion v2 carve-out (2026-07-06).** The stop-doing list above governs **mechanics** — it still
> holds in full: **no new combat, no new survival systems, no new encounter types.** It does **not**
> forbid the sanctioned **narrative-density** work in Expansion v2 (Echoes, region sub-stories, the
> unchosen, the prologue second act, truth-by-assembly). That work adds *authored text and nodes*, not
> systems, and is the deliberate answer to "the story is too shallow / too short." Restraint (§4) is
> the ceiling on all of it.

---

## Changelog — Expansion v2 (July 2026)

The story read shallow and short for a premium game. Diagnosis: each region was a corridor to a single
one-paragraph truth-dump, the Signal's 142 minds had no faces, and the deepest question (*why only
143?*) was left off the page. This pass adds **narrative density, not mechanics**, at strict restraint.
**Scope: design/docs only — no code yet; every item is flagged build: PLANNED. STORY.md is the
blueprint the implementation works off later.** Locked design decisions:

1. **Echoes (E1–E3, §3).** New `ECHOES` Case File category; the player recovers fragments of the 142
   running minds. A 7-face recurring cast (Theo · Rosa · Walt · Priya · Marcus · Sorkin · June). **Kim
   is deliberately NOT an Echo** — her absence at the Signal Core is the beat (she refused; nothing of
   her is in the Signal).
2. **The unchosen (U1, §2).** Locks *why only 143*: a containment ceiling (Sorkin's math) plus the
   architect's choice to fill it **now**; the same act saved the 143 and spilled the wild Signal into
   everyone else. **You signed who wasn't saved.** Threaded through City Hall + Marcus + Rosa's ward +
   an evolving Case File question. (**U2**, a dedicated citizen-shelter region, held OPEN.)
3. **Dr. Lena Sorkin (§2/§3).** New named figure — your containment lead who **warned you three times**
   and went in anyway. Amplifies the architect's guilt without diluting it; pays off at the Annex (the
   breach was foreseen).
4. **Region deepening + sub-stories (R1–R5, §5).** Each shipped region keeps its one truth but gains a
   human sub-story and ~2× nodes (Phase 3 ~35 → ~65). Truths, gates, and endings unchanged.
5. **Truth-by-assembly (S1, §6).** A region's truth resolves only after its 2–3 supporting pieces are
   found; the Case File shows the deduction assembling. Investigation, not receipt.
6. **Prologue second act (P1–P3, §8).** A real midpoint per route, the shelter as a scene, deeper
   Ellie — all spoiler-safe; the prologue still only cracks.
7. **§9 reconciled.** The stop-doing list still forbids new *mechanics* (combat/survival/encounters);
   a carve-out sanctions the Expansion v2 *narrative* work. (**X1**, ending-texture shading, held OPEN.)

## Changelog — consistency pass (June 2026)

Holes found and the locked fixes, for the record:

1. **Infected logic was self-contradicting** ("bodies are the discard" vs "everyone not yet taken").
   → Replaced with the **two-mode connection** keystone (§2): clean Haven uploads vs the wild Signal's
   half-connected. Infected = partially connected people. Combat justified; Research Annex payoff added.
2. **No bodies at Haven despite "the body is left behind."** → Completed connection **walks the body
   out** — the 143 left through the open gate (§2, §3 motif). Destination stays OPEN.
3. **PRESENT 143 should be 142** (Kim refused). → The board counts minds and **counts the player** in
   Kim's refused slot (§2). Feeds the Phase 3 Accept/Refuse choice.
4. **Kim's death had no mechanism.** → Refusal put her outside the Signal during the outbreak; the
   city killed her, not the refusal itself (§3).
5. **Kim's body location was unexplained** (Haven resident dead in the player's stairwell). → She fled
   Haven to find the architect; the player's last call summoned her; she arrived post-wipe (§3).
6. **Phone contradiction:** Case File said "her phone is the one you carry"; the intro establishes the
   player's own phone. → Build is canon; board copy must be patched. Locked the no-body phone truth:
   Ellie spoofs Kim's number; nobody holds Kim's phone (§3).
7. **Wipe-motivation drift across docs** (architect's guilt vs investigator-in-denial). → **Architect's
   guilt is the only canon**; the investigator framing in older docs is superseded (§2).
8. **Real-time day gates** (Lifeline-style pacing — wall-clock nights) were designed and built, then
   **dropped** for smooth prologue→Phase-3 flow; the inert scaffolding was removed from the build
   (2026-07-01). The completion screen it replaced (`phase2_complete`) was culled the same day — the
   prologue auto-flows into Phase 3.
9. **Encounter risk was illegible** — every dangerous choice wore the same static yellow `[risk]`
   while the resolver computed live odds from noise + weapon. → Computed tier tags (2026-07-02):
   `[LOW]`/`[MED]`/`[HIGH]` from the resolver's own odds functions (`pSneak`/`pRun`/`pFight`,
   single source of truth shared by the roll and the tag), `[COSTLY]` for the no-roll FORCE;
   an untagged gamble gets a tag injected only when its odds degrade to MED/HIGH, so the quiet
   option stays quiet while it's genuinely favorable. Display-only — deltas, dispatch, and
   route tuning untouched. The tag is HUD register (like `[+1 Noise]`); Ellie never speaks it.
10. **The drain loop had no relief** — the legs are a continuous squeeze (transition drain, noise,
    encounters) with nothing quiet before the Haven cache. → The **calm beat** (2026-07-02): one
    guaranteed breather per run, mid path-leg (the lead-queue slot between the two encounter
    leads) — no drain, no encounter, no loot, no battery (choiceless; it auto-flows back to the
    nav screen). Three narrator stillness lines + one Ellie line that deliberately breaks her
    clipped register (warmth, not information). One-shot (`calmFired`, save-persisted); never
    fires in Phase 3 — lead queues exist only in the prologue legs.
