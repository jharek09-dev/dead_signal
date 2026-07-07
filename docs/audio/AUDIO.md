# Dead Signal — Audio Bible

| | |
| --- | --- |
| **Version** | 1.1 |
| **Status** | Living — reflects `src/audio.js` + its callsites in `src/DeadSignal.jsx` |
| **Last updated** | 2026-07-06 |
| **Owner** | Jharek (audio/design/dev) |
| **Canon source** | [`STORY.md`](../narrative/STORY.md) — the Signal motif and tone rules |
| **Companion docs** | [GDD](../design/GDD.md) · [Technical Design](../technical/DESIGN.md) · [PRD](../product/PRD.md) |

> **Purpose.** The single reference for how *Dead Signal* sounds and why. It defines the audio
> philosophy, the full palette, the signature **Signal** motif and the rules that govern it, the
> mix, playback lifecycle, and audio accessibility. All sound is **procedural** (Tone.js) — there
> are no audio assets to manage; this document *is* the sound design.
>
> **Ground truth.** The engine is `src/audio.js`; the cue placements are its callsites in
> `src/DeadSignal.jsx`. Where this doc gives numbers, they are the shipped values.

---

## Table of contents

1. [Audio philosophy](#1-audio-philosophy)
2. [The soundscape at a glance](#2-the-soundscape-at-a-glance)
3. [The procedural engine](#3-the-procedural-engine)
4. [Sound palette](#4-sound-palette)
5. [The Signal — the signature motif](#5-the-signal--the-signature-motif)
6. [Mix & headroom](#6-mix--headroom)
7. [Playback lifecycle](#7-playback-lifecycle)
8. [Audio accessibility](#8-audio-accessibility)
9. [Music direction](#9-music-direction)
10. [Implementation reference](#10-implementation-reference)
11. [Future & open questions](#11-future--open-questions)
12. [Appendix](#12-appendix)

---

## 1. Audio philosophy

Audio in *Dead Signal* follows the same restraint as everything else (GDD Pillar 5). Four rules:

### 1.1 Silence is the bed
**There is no looping ambient music or drone — by design.** A city that has gone quiet should
*sound* quiet. The absence of a soundtrack is the soundtrack. Every sound the game makes is therefore
an event, and events in silence carry weight. This is the single most important audio decision.

### 1.2 Sound is feedback, not decoration
The palette is almost entirely **short UI/feedback one-shots**: a tap, a message blip, a resource
sting. They confirm the player's actions and the game's state on a phone-native interface. They are
functional first, atmospheric second.

### 1.3 One sound is allowed to mean something
The **Signal distortion** cue (§5) is the exception that proves the rule. It is the only
"atmospheric" sound, it is rare, it is **story-gated**, and it always means the same thing: *the
Signal is here.* Because everything else is functional and sparse, this one cue can carry dread.

### 1.4 The game is fully playable in silence
No critical information is audio-only. Every cue has a textual or visual counterpart (a message
appears, a resource number changes, a screen flickers). Audio is **purely additive** — see §8.

---

## 2. The soundscape at a glance

| Layer | Sound | Character | Trigger |
| --- | --- | --- | --- |
| **UI** | `tapResponse` | Soft triangle blip (C5) | Tapping a story choice |
| **UI** | `tapMenu` | Softer sine blip (A5) | Menu / navigation taps |
| **Messaging** | `blip` | Very quiet high sine (E6) | An incoming message arrives |
| **Resources** | `gain` | Rising two-note sting (A4→E5) | Gaining a resource / good outcome |
| **Resources** | `loss` | Low falling sting (C4) | Losing a resource / taking damage |
| **Terminal** | `terminal("complete")` | Consonant resolve chord (Cmaj7) | Completing a run |
| **The Signal** | `signal` | Pink-noise crackle + detuned chirp | **Story beats only** (§5) |
| **Echo recovery** *(v2 · PLANNED)* | recovered-voice one-shot | Quieter, degraded Signal sibling | **Recovering an Echo only** (§5.5) |

That is the entire soundscape. Seven voices, no loops. **Expansion v2 (build: PLANNED)** adds one
story-gated **one-shot** — the recovered-voice Echo cue (§5.5) — and no ambient systems; silence
stays the bed (§1.1).

---

## 3. The procedural engine

`src/audio.js` is a **module-scope Tone.js singleton**. It builds a fixed set of synth nodes **once**
on first unlock and retriggers them by name; the game just calls methods like `audioEngine.blip()`.

Key architectural properties:

- **Additive & safe.** Every method is a **no-op until unlocked and while muted**, so game code never
  needs to guard an audio call. Muting or a failed unlock silences everything without branching.
- **Lazy-loaded.** Tone.js (~380 kB) is `import()`-ed on the first user gesture (§7), keeping it off
  the initial bundle.
- **No asset pipeline.** Everything is synthesized. There are no audio files to author, localize,
  compress, or stream — a deliberate fit for the offline, deterministic product (PRD NFR-1).
- **Signal chain:** voices → `master` gain → `Limiter(-2)` → destination, with a `Reverb` tail
  branch feeding only the completion chord. (Full mix in §6.)

---

## 4. Sound palette

Exact synth specifications (from `src/audio.js`). All levels are per-voice dB trims under the master.

### 4.1 UI — taps
The two tap voices separate *acting on the story* from *navigating menus*.

| Voice | Synth | Envelope (a/d/s/r) | Level | Note | Fires at |
| --- | --- | --- | --- | --- | --- |
| `tapResponse` | Triangle | 0.001 / 0.12 / 0 / 0.07 | −9 dB | C5 | Story-choice taps (`DeadSignal.jsx` :2963, :3770, :4495) |
| `tapMenu` | Sine | 0.002 / 0.15 / 0 / 0.10 | −9 dB | A5 | Menu/navigation taps (:4189) |

Triangle vs. sine gives the story tap a touch more edge than the menu tap — the player subconsciously
hears the difference between "I made a choice" and "I moved through a menu."

### 4.2 Messaging — the blip
| Voice | Synth | Envelope | Level | Note | Fires at |
| --- | --- | --- | --- | --- | --- |
| `blip` | Sine | 0.001 / 0.05 / 0 / 0.04 | **−24 dB** | E6 | An incoming message renders (:2501, :2538) |

Deliberately the **quietest** voice in the game (−24 dB) and very short. It reads as a phone's
message tick, not an alert — present but never intrusive across a long text conversation.

### 4.3 Resources — the stings
One triangle "sting" voice, played two ways, so gain and loss are instantly distinguishable by
**contour**:

| Method | Pattern | Reads as | Fires at |
| --- | --- | --- | --- |
| `gain()` | A4 → E5 (rising, +0.09 s apart) | Relief / pickup | Resource gain, good outcomes (:2546, :3625–3626) |
| `loss()` | C4 (low, longer 0.22 s) | Cost / damage | Resource loss, damage (:2546, :2604, :3527, :3627) |

Rising interval = good; low single note = bad. No text needed to feel the difference — but the number
also changes on the HUD (§8).

### 4.4 Terminal — the resolve chord
| Voice | Synth | Envelope | Level | Chord | Fires at |
| --- | --- | --- | --- | --- | --- |
| `resolve` | PolySynth(Sine) | 0.4 / 1.2 / 0.2 / 3.5 | −13 dB | **C4·E4·G4·B4** (Cmaj7), 4 s, through reverb | Run completion (`terminal("complete")`) |

The **only** consonant, sustained, reverbed sound in the game. A major-7 chord with a long release —
a quiet exhale that marks a completed run. Offline/dead terminals are **silent** (there is no ambient
bed to cut, so their silence is the statement).

---

## 5. The Signal — the signature motif

> This is the audio identity of the game. Treat it as canon (`STORY.md`): players **learn** that
> *this sound = the Signal.* Protect that association by never spending it cheaply.

### 5.1 What it is (sound design)
A corrupted-transmission artifact built from three nodes:

- **`sigNoise`** — a pink-noise burst (NoiseSynth, env 0.004 / 0.2 / 0 / 0.06, **−20 dB**) routed
  through
- **`sigFilter`** — a **band-pass at 1400 Hz, Q 1.6** (gives the noise a narrow, radio-static
  "voice" band), plus
- **`sigChirp`** — a sine voice (**−22 dB**) playing two detuned notes: **B5** (0.05 s, at +0.02 s)
  then **F♯5** (0.06 s, at +0.14 s) — a short, falling two-note chirp, like a word half-formed and
  lost.

The result reads as *something trying to speak through static.* It is quiet by design and routes to
master so mute/volume apply.

### 5.2 The visual coupling (critical)
**Every `signal()` call is paired with a visual flicker** (`setSigFlicker(true)`, cleared after
~0.9–1.6 s depending on the beat). The distortion is therefore **audio-visual**, never audio-only —
which is both a dread amplifier and the core of its accessibility story (§8). Where the audio
crackles, the screen flickers.

### 5.3 The gating rules (do not break these)
- **Story beats only.** `signal()` **never** fires on routine actions — not on taps, not on ordinary
  messages, not on resource changes. If it starts feeling common, it has failed.
- **Reserved association.** It always means the Signal is present/acting. Never use it as a generic
  "alert."
- **Sparse.** Across a full playthrough it should fire only at the moments below.

### 5.4 Where it fires (the complete list)
Every shipped `signal()` callsite, and what it scores:

| # | Beat | Callsite | Why |
| --- | --- | --- | --- |
| 1 | A `signal`/`record143` beat effect — incl. the **impossible 143 record** | `:1969` | The prologue's first wrongness; the count that can't be true |
| 2 | A **memory fragment** surfacing | `:3813` | "a memory surfacing through the Signal" |
| 3 | A **Phase 3 truth** uncovered | `:3439` | The moment a region gives up its answer |
| 4 | **Entering the finale** | `:3727` | The last call begins |
| 5 | The **Accept/Refuse** choice resolving | `:3743` | The decision lands |
| 6 | **"i remember you."** — Ellie's signature line | `:4038` | "that sound = Ellie/the Signal," right up against the words |

These map to the canon list in `STORY.md` §8 (approach/memory/143 record/the call) plus the Phase-3
truth and finale beats. **New `signal()` calls must clear the §5.3 bar** before being added.

### 5.5 Echo recovery — the "recovered voice" one-shot — Expansion v2 · build: PLANNED
> Canon: `STORY.md` §3 (the Echoes) and §4 ("Echoes crack, they don't confess"). Phase 3 lets the
> player recover short fragments (2–4 lines) of the Signal's **142 running minds** — a frozen text
> thread, a looped voice note, a diary still writing. Recovering an Echo is a **story-gated moment**.
> This is *narrative-density* work, not a new system: an **additive one-shot**, no new ambient
> systems, no looping bed (§1.1 holds — the pillar is the ceiling).

**Proposed sonic identity — a sibling of the Signal cue, not a new sound.** An Echo is a *mind
surfaced*, so it should read as the Signal's own voice, but **quieter and more degraded** — the same
family as `signal()` (§5.1), dialled down and worn thin:

- Reuse the Signal's architecture (pink-noise burst → the 1400 Hz band-pass "voice" band → a detuned
  sine chirp) so the ear places it instantly as *the Signal*, then bend it toward **recovery, not
  presence**: lower the level a few dB **below** `signal()` (target ~−24 to −26 dB — around the
  message-blip floor, the quietest register in the game), soften the noise attack, and let the chirp
  **settle** rather than fall away — a word that *almost* forms instead of one lost. Where `signal()`
  is "the Signal is here," the Echo variant is "a mind surfaced."
- **One dedicated one-shot**, fired **only** when an Echo is recovered — never on routine actions,
  never on ordinary node entry, never on Case File opens. It inherits every §5.3 gating rule.
- **Audio-visual, like its parent (§5.2).** Pair it with a flicker — but a **fainter/shorter** one
  than the full Signal flicker, so recovery reads as distinct from presence and the deaf/HoH beat
  still lands (§8). Same photosensitivity audit applies.
- The player should **learn to read it** the way they learn `signal()`: sparse enough that when it
  arrives, it means *someone is in there.* This resolves the open question in §11 ("a second Signal
  variant?") **in the narrow, story-gated direction only** — a recovered-voice sibling, not a general
  "observing vs. acting" split.

**Restraint rules for the emotionally heavy Echoes (do not break these).** The Echoes are
text-forward by canon; the sound design must **not editorialize grief**:

- **The child (Theo) and the regretter (Priya) get NO musical underscoring and NO stinger.** No chord,
  no swell, no `gain`/`loss` sting, no "shock" cue. `STORY.md` §4: these are the *shortest, hardest*
  lines in the game precisely because they are unscored. Let the recovered-voice one-shot (or **even
  nothing** — near-silence is a legitimate choice for these two) carry them, then let the text sit.
- **Never score an Echo for melodrama.** No Echo gets a bespoke sting, a resolve chord, or a stinger
  for impact. The one-shot marks *that a mind surfaced*, not *how to feel about it* — the sound must
  never tell the player the beat is sad. Walt's is a chosen mercy, not a tragedy; the mix treats all
  seven faces the same (a plain recovery), and the **words** do the differentiating.

**Kim's absence — E3, the pointed silence — Expansion v2 · build: PLANNED.** Canon: `STORY.md` §3
("Kim is NOT an Echo") and the Changelog. At the **Signal Core**, the player looks for Kim among the
running minds and she isn't there. **The audio for this beat is the Echo/Signal cue conspicuously NOT
firing.** Everywhere else a recovered mind surfaces with the recovered-voice one-shot; here — where
the player most expects it — there is **pointed silence**, no flicker, no chirp. The engine's default
quiet (§1.1) becomes the statement: the one voice the player trusted is the one the Signal can't give
back. Do not fill it with a substitute sting or a sad chord; **the missing cue is the cue.**

---

## 6. Mix & headroom

- **Master chain:** `master` Gain → `Limiter(-2)` → destination. The limiter at −2 dB catches peaks
  so overlapping one-shots never clip.
- **Master headroom:** `MASTER_DB = -4`. Individual voices are trimmed **below** this (−9 to −24 dB),
  leaving room before the limiter.
- **User controls:** `volume` (0–1) scales the master; `muted` forces the master to 0. **Mute always
  wins** over volume. Both ramp smoothly (`applyMasterGain`) to avoid clicks.
- **Reverb** exists only as a tail for the completion chord — nothing else is sent to it, so the game
  stays dry and close (a phone speaker, not a hall).
- **Relative loudness (loudest → quietest):** taps (−9) → loss/resolve (−12/−13) → Signal noise/chirp
  (−20/−22) → message blip (−24). The things you *do* are the most audible; atmosphere sits under.

---

## 7. Playback lifecycle

Browser autoplay policy blocks sound until a user gesture, so:

- **`unlock()`** runs on the first pointer/key gesture: dynamically imports Tone.js, `await`s
  `Tone.start()`, and **confirms the context actually resumed** (retrying `resume()` once). If it
  can't confirm a running context, it **bails without marking unlocked**, so the next gesture retries
  — audio simply arrives one tap later, which is acceptable because it's additive.
- **iOS specifics:** it deliberately does **not** set `navigator.audioSession.type = "playback"`
  (that leaks audio to the background and wedges the context). `resume()` is called on
  return-to-foreground and on subsequent taps to recover a suspended context.
- **State restore:** mute/volume are read from storage before the first gesture and applied the
  moment audio unlocks.
- **Diagnostics:** the on-screen `?debug` overlay surfaces `audioEngine.status()`
  (`unlocked/muted/volume/context state/hasNodes`).

Because of all this, engineering can call any cue at any time without checking whether audio is ready.

---

## 8. Audio accessibility

Audio is **purely additive** — the game is fully playable muted, which is a first-class design stance
(PRD NFR-5). Specifics:

- **Nothing is audio-only.** Message arrivals render text; resource stings mirror a HUD number change;
  the completion chord accompanies a completion screen.
- **The Signal cue is audio-visual.** Its screen flicker (§5.2) means deaf/HoH players still receive
  the "the Signal is here" beat. **Action item (Accessibility Plan):** verify the flicker is strong
  enough to stand alone, make it optional/adjustable, and **audit it for photosensitivity** (it is a
  brief screen-state change coupled to the green Signal identity — must pass a flash-rate check).
- **Controls today:** volume slider + mute, persisted. **Roadmap:** expose these prominently and
  consider a separate "reduce flashing" toggle tied to the sigFlicker.
- **No timing-critical audio.** Nothing must be *heard in time* — the game has no reflex beats.

Full treatment lives in the [Accessibility Plan](../accessibility/) (planned); this section is the
audio-specific input to it.

---

## 9. Music direction

**There is no score, and that is the direction.** A composed soundtrack would contradict Pillar 1
(silence as the bed) and soften the dread the game builds through restraint. The position:

- **Default: no music.** The empty city and the quiet phone are the mood.
- **If music is ever added** (a deliberate future decision, not a gap to fill): it should be
  **diegetic or near-diegetic** (a broadcast, static, a signal artifact — extensions of the Signal
  palette), extremely sparse, and reserved for a *single* structural moment (e.g. an ending), never a
  continuous underscore. Any such addition must pass the §5.3 "does it cheapen the silence?" test.
- **The completion resolve chord is the ceiling** for how "musical" the game currently gets — and it
  is four seconds long, once per run.

---

## 10. Implementation reference

### 10.1 Public methods (`audioEngine`)
| Method | Purpose |
| --- | --- |
| `unlock()` | Lazy-load + start the audio context on first gesture |
| `isUnlocked()` / `status()` | State query / debug snapshot |
| `setMuted(m)` / `setVolume(v)` | User controls (mute wins; volume 0–1) |
| `resume()` | Recover a suspended context (foreground/tap) |
| `tapResponse()` / `tapMenu()` | UI taps |
| `blip()` | Incoming message |
| `gain()` / `loss()` | Resource stings |
| `signal()` | **Story-gated** Signal distortion (§5) |
| `terminal(kind)` | Terminal screen; only `"complete"` makes sound |

### 10.2 Callsite map (in `src/DeadSignal.jsx`)
- **Lifecycle:** `unlock` :2300 · `resume` :2315–2316 · `setMuted`/`setVolume` :2262/:2270/:2280/:2288
- **blip:** :2501, :2538 · **gain:** :2546, :3625, :3626 · **loss:** :2546, :2604, :3527, :3627
- **tapResponse:** :2963, :3770, :4495 · **tapMenu:** :4189
- **signal:** :1969, :3439, :3727, :3743, :3813, :4038 (see §5.4)

---

## 11. Future & open questions

- **Tool-drain audio layer?** The GDD/`STORY.md` mention radio/flashlight as possible separate power
  consumers (a future tuning idea). If built, they'd want subtle on/off ticks — but weigh against §1.
- **A second Signal variant?** A softer vs. harsher distortion to distinguish "the Signal observing"
  from "the Signal acting"? Only if it doesn't dilute the single-meaning rule (§1.3). **Partly settled
  by Expansion v2 (build: PLANNED):** §5.5 introduces one story-gated sibling — the quieter
  *recovered-voice* Echo cue ("a mind surfaced") — but deliberately **not** a general observing/acting
  split. Any further variant still faces the §1.3 bar.
- **Haptics (mobile)?** The blip/stings/Signal cue could pair with light vibration — an accessibility
  win (a felt channel) and a phone-native touch. Unbuilt; a candidate for the Accessibility Plan.
- **Reduce-flashing toggle** for the sigFlicker (§8) — likely a requirement, pending the a11y audit.

---

## 12. Appendix

### 12.1 Glossary
- **One-shot** — a short, retriggered sound with no loop.
- **The Signal cue** — the `signal()` distortion artifact; the game's audio signature (§5).
- **sigFlicker** — the screen-flicker visual coupled to every Signal cue.
- **Additive audio** — audio that only ever *adds*; muting/failure removes it with no logic change.

### 12.2 Related documents
- Engine internals: [Technical Design §6](../technical/DESIGN.md#6-audio-engine)
- Audio direction summary: [GDD §11](../design/GDD.md#11-audio-direction)
- The Signal as narrative: [`STORY.md`](../narrative/STORY.md) §2, §8
- Accessibility (audio inputs feed it): [Accessibility Plan](../accessibility/) (planned)

### 12.3 Change log
| Version | Date | Notes |
| --- | --- | --- |
| 1.0 | 2026-07-06 | First Audio Bible. Grounded in `src/audio.js` and its callsites; the Signal-cue firing list is exhaustive as of this build. |
| 1.1 | 2026-07-06 | **Expansion v2 · build: PLANNED** (docs only, no code). Added the **Echo-recovery** treatment (§5.5): a quieter/degraded sibling of the `signal()` cue as a story-gated **one-shot** ("a mind surfaced"); restraint rules for the heavy Echoes (child/regretter get **no** underscoring or stinger); **Kim's absence** at the Signal Core = the cue conspicuously **not** firing (pointed silence). Registered the cue in §2, reconciled §11's "second Signal variant" question. No looping bed, no new ambient systems — additive one-shot only (§1.1). |

*End of document.*
