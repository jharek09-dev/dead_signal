# Dead Signal — Art Bible

| | |
| --- | --- |
| **Version** | 1.2 |
| **Status** | Living — reflects the shipped UI in `src/DeadSignal.jsx` + `index.html` (Expansion v2 additions flagged **build: PLANNED**) |
| **Last updated** | 2026-07-06 |
| **Owner** | Jharek (art/design/dev) |
| **Canon source** | [`STORY.md`](../narrative/STORY.md) — tone rules (restraint, no staged bodies, the Signal) |
| **Companion docs** | [GDD](../design/GDD.md) · [Audio Bible](../audio/AUDIO.md) · [Technical Design](../technical/DESIGN.md) |
| **Wireframes** | [`wireframes/Dead-Signal-Wireframes.html`](wireframes/Dead-Signal-Wireframes.html) — a single self-contained HTML wireframe, screens 01–07 (§12) |

> **Purpose.** The visual direction for *Dead Signal*: the look, the color and type systems, the
> Signal as a visual motif, component treatments, the ending screens, and the wireframe set. The
> game has **no illustrated art** — the aesthetic is entirely typography, color, layout, and glow on
> a near-black screen. This document *is* the visual identity.
>
> **Ground truth.** Every hex value here is taken from the shipped UI. When this doc and the code
> disagree, the code wins and this doc is stale.

---

## Table of contents

1. [Visual pillars](#1-visual-pillars)
2. [The look in one paragraph](#2-the-look-in-one-paragraph)
3. [Color system](#3-color-system)
4. [Typography](#4-typography)
5. [The Signal as a visual motif](#5-the-signal-as-a-visual-motif)
6. [Layout & framing](#6-layout--framing)
7. [Iconography & HUD](#7-iconography--hud)
8. [Component treatments](#8-component-treatments)
9. [Ending screens](#9-ending-screens)
10. [Motion](#10-motion)
11. [Marketing & key art](#11-marketing--key-art)
12. [The wireframe set](#12-the-wireframe-set)
13. [Appendix](#13-appendix)

---

## 1. Visual pillars

### Pillar 1 — Phone-native, always
The frame is a phone. Everything is a message, a HUD readout, a contact header, or a case file. We
never render a camera view, an avatar, or illustrated scenery. This is the cheapest *and* the most
immersive choice — the medium is the fiction (GDD Pillar 2).

### Pillar 2 — Terminal-noir
Monospace type, uppercase labels, wide letter-spacing, a near-black screen, thin green rules. The
game looks like a **dying handset running a terminal** — cold, technical, and a little wrong. Beauty
comes from restraint and glow, not detail.

### Pillar 3 — The green means the Signal
One accent color — a sickly, glowing **signal-green** — carries all the meaning. It is the live
element on a dead screen. Because nothing else competes for attention, the green *is* the Signal, and
its glow/flicker is the game's one supernatural tell (§5).

### Pillar 4 — Absence over spectacle
No staged bodies, no gore, no jump-scare imagery (`STORY.md` §4). Empty Haven is lights-on and
people-gone. The horror is what *isn't* drawn. Whitespace (blackspace) is a tool.

---

## 2. The look in one paragraph

A `#070707` black screen. A single word logo — **DEAD** in dead grey, **SIGNAL** in glowing green
that softly pulses. Everything is **IBM Plex Mono**. Text arrives as messages: the guide's in
lowercase, the world's in centered italic. A thin HUD sits in the corners — battery, signal — with
uppercase vitals below. Choices are bordered buttons in dim green that light up on hover. When the
Signal touches the story, the screen flickers and a green glow swells. That's the whole visual
language: black, mono, and one green that means something.

---

## 3. Color system

The palette is deliberately tiny. **Canvas + one accent + a semantic set + neutral grays + a warm
Case File tone.** All values are the shipped hexes.

### 3.1 Core
| Role | Hex | Notes |
| --- | --- | --- |
| **Canvas** | `#070707` | The near-black background everywhere (also `index.html` `theme-color`) |
| **Signal green (accent)** | `#4a9e6b` | THE color — text, borders, gains, the live logo, hover |
| **Signal glow** | `rgba(74,158,107,0.6)` / `…0.25` | Text-shadow bloom on the live green |
| **Bright green flash** | `#7fffa0` | Peak of a Signal event / brightest glow |
| **Dim green (borders)** | `#1d3a22` · `#3a5a44` | Resting button borders, quiet rules |

### 3.2 Semantic — risk & resources
| Meaning | Hex | Where |
| --- | --- | --- |
| **Low risk** | `#4a9e6b` (green) | `[RISK]` tag, low tier |
| **Medium risk / caution** | `#c8a020` (amber) | `[RISK]` tag, med tier; noise/attracts |
| **High risk** | `#8b4a4a` (red) | `[RISK]` tag, high tier |
| **Risk-choice frame** | border `#4a351b`, text `#c89a58`, amber glow | Gamble choices |
| **Gain / −noise (good)** | `#4a9e6b` | Resource deltas that help |
| **Danger / damage / loss** | `#8b2020` · `#e08a8a` · `#ff8a8a` | HP loss, death, hostile |

### 3.3 Case File — the warm exception
The investigation board is the one place that warms up — a **manila/parchment** family against the
black, so evidence *feels* physical (paper on a dark desk):

| Role | Hex |
| --- | --- |
| Parchment / evidence text | `#c8b896` · `#c8b98a` · `#d8c79b` |
| Aged / secondary paper | `#8a7a58` · `#b89a6a` |

> **Expansion v2 · build: PLANNED — ECHOES don't warm up.** The `ECHOES` category (a recovered mind,
> `STORY.md` §3/§6) is **not** paper — it's a mind the Signal is still replaying, so it reads on the
> *screen-native* axis, not the manila one. Pull it off the parchment family toward the cold-cyan
> "wrong frequency" tones (§3.4, `#4ab5c8` · `#7accd4`) sitting on the raw `#070707` canvas, so an Echo
> is visibly *transmission* where a MEMORY/CLUE is *paper*. Keep it dim; no new hue (§3 rule). A faint
> signal-glow may edge an Echo when its node is powered, but the fragment stays underpowered and half-
> there — never a bright, whole readout.

### 3.4 Cold cyan — the wrong frequency
A cold **cyan** (`#4ab5c8` · `#7accd4`) appears sparingly for Signal/broadcast/comms contexts — the
"wrong frequency" counterpoint to the warmer green. Use it only where the fiction is about the
transmission itself.

### 3.5 Neutrals
`#4a4a4a` (dead logo / disabled) · `#6a6a6a`·`#7a7a7a` (muted text) · `#1c1c1c`·`#2a2a2a`·`#3a3a3a`
(panels, bubbles, rules). Keep neutral text **dim** — the screen should feel underpowered.

> **Rule:** never introduce a new hue. New states reuse this set. The whole point is that green is
> the only color the eye chases.

---

## 4. Typography

- **One typeface: `'IBM Plex Mono', 'Courier New', monospace`.** The entire UI is monospaced. This is
  the terminal-noir backbone — do not mix in a proportional font.
- **Case:** UI chrome and HUD labels are **UPPERCASE** with wide tracking (`letter-spacing` ~0.12–0.18em).
  Story text is natural case (the guide is lowercase by voice; §8).
- **Weight:** mostly regular; the logo and a few emphases go bold (700).
- **Scale (relative):** logo ~2.4rem; body/message ~0.8–0.95rem; HUD labels ~0.66–0.72rem. Small,
  dense, phone-sized.
- **The logo:** one word, two treatments — `DEAD` in dead grey `#4a4a4a`, `SIGNAL` in live green
  `#4a9e6b` with the glow and a slow `sigpulse`. It encodes the whole premise in the wordmark: the
  dead thing and the living signal, fused.

---

## 5. The Signal as a visual motif

The green is not just an accent — it is the game's supernatural presence, and it behaves.

- **Glow.** Live green elements carry a text-shadow bloom (`rgba(74,158,107,0.6)` + a wider `0.25`
  halo). Glow = alive/Signal; flat = inert.
- **`sigpulse`.** A slow 3s opacity breathe (0.78 ↔ 1.0) on the live logo — the Signal is *idling*,
  always faintly on.
- **`sigFlicker` (the distortion).** On story-gated Signal beats the screen flickers — the visual
  half of the audio `signal()` cue (see [Audio Bible §5.2](../audio/AUDIO.md#5-the-signal--the-signature-motif)).
  Audio and visual fire together; **where the screen flickers, the crackle plays.** This coupling is
  the game's signature moment and the backbone of its audio-accessibility (a deaf player still sees
  the Signal act).
- **Escalation.** Toward peaks, green pushes to the bright `#7fffa0` flash. Reserve it — like the
  audio cue, overuse kills the meaning (`STORY.md` §4: reveal less, imply more).
- **Photosensitivity watch.** The flicker/flash is a screen-state change tied to the green identity —
  it **must** pass a flash-rate audit and get a "reduce flashing" toggle (Accessibility Plan).

---

## 6. Layout & framing

**Portrait, phone-first.** The document is locked (`index.html` fixes `html,body,#root`,
`position:fixed` body) to kill iOS rubber-banding; the app scrolls its own panes.

Vertical stack, top to bottom:

1. **HUD corners** — signal (top-left region) and battery (top-right region), corner-anchored so they
   never fight the conversation.
2. **Contact header** — the current contact/location label (e.g. `KIM` → `ELLIE`).
3. **Chat pane** (`.ds-chat`, scrolls) — message bubbles + centered italic narration.
4. **Vitals bar** (`.ds-vitals`) — the survival readouts.
5. **Choices pane** (`.ds-choices-pane`) — the intent-coded choice buttons + the `FILE` button.

Message alignment: **guide/Ellie left**, **player choices as buttons** below; **narration centered**
and italic so the world's voice is visibly not the phone's UI (protects the frame, GDD Pillar 2).

---

## 7. Iconography & HUD

Text-first, mono glyphs — no illustrated icons. The HUD speaks in **registers**:

- **Vitals:** `BATTERY %`, `CHARGER %/empty`, `FOOD`, `WATER`, `HP`, `NOISE`, `SIGNAL`. Uppercase,
  spaced, dim until they matter; battery pulses (`pulseBattery`) on change.
- **Risk tags:** `[RISK]` colored by tier — green `#4a9e6b` (low) / amber `#c8a020` (med) / red
  `#8b4a4a` (high) — plus `[COSTLY]` for the no-roll FORCE. HUD register only; the guide never speaks
  them (GDD §7.3).
- **Resource deltas:** `[+N Food]` / `[−1 Battery]` / `[−Noise]` inline, green for good, red for bad.
- **Advance affordance:** a `▸` marker leads menu/continue buttons (`▸  START`, `▸  CONTINUE`).

The HUD's job is to be legible at a glance and to *recede* — the conversation is the star.

---

## 8. Component treatments

- **Message bubble (guide/Ellie).** Left-aligned, lowercase, dim panel (`#1c1c1c`–`#2a2a2a`), soft
  edges; text near-white but not bright. Human-paced reveal (Audio `blip` on arrival).
- **Narration.** Centered, *italic*, no bubble — the world speaking through the device.
- **Choice button (default).** Transparent fill, `1px` dim-green border (`#1d3a22`), green text
  (`#4a9e6b`), uppercase, tracked; **hover lights the border + text to full `#4a9e6b`**. Intent-coded
  variants recolor per action type.
- **Risk choice.** Amber frame (border `#4a351b`, text `#c89a58`, faint amber glow) — a gamble reads
  warm/dangerous before it's tapped.
- **Case File — board.** Parchment tones on black; categories `MEMORIES / CLUES / PEOPLE /
  LOCATIONS`; locked entries render as `???` and warm into legibility as they unlock.
- **Case File — journal.** `KNOWN FACTS` vs `OPEN QUESTIONS`; a **contradiction** pairs two facts
  into the question they force. `NEW QUESTION` / `QUESTION UPDATED` cards surface in chat.
- **Region node (Phase 3).** A hub-and-spoke map: Haven center; spokes (Mercy / Comms / City Hall /
  Annex) shown **locked** (dim/grey), **available** (green border), or **truth-uncovered** (filled
  green + a `TRUTH` mark).

### Expansion v2 · build: PLANNED — the board becomes an investigation

> These treatments are **planned, not shipped**. They layer onto the existing Case File and Phase 3
> screens without touching the palette rule (§3) or the restraint pillar (§1.4). `STORY.md` §3/§6 win
> any conflict.

- **Case File — the `ECHOES` category (a recovered mind).** A fifth board lane beside `MEMORIES /
  CLUES / PEOPLE / LOCATIONS` (§8 board bullet). An Echo is a *fragment the Signal keeps replaying* —
  a frozen text thread, a looped voice note, a diary still writing — so it must read **unlike an
  evidence card.** Direction:
  - **Transmission, not paper.** Style it on the cold-cyan / signal axis on raw `#070707` (§3.3 note),
    *not* the manila parchment. A MEMORY is a document you found; an Echo is a mind still running.
  - **Degraded & fragmentary.** The text is mid-thought and incomplete — 2–4 lines, terse, lowercase,
    with the edges eaten: dropped characters, a trailing cursor that never finishes, a looped line that
    repeats, dimmed/`···` gaps where the fragment corrupts. It should feel *half-there*, never a clean
    block. Locked entries still render `???` and resolve into the fragment as recovered — but the
    resolved state stays degraded; it never fully "prints."
  - **RESTRAINT is the ceiling — text-forward, no imagery, ever.** No illustration, no portrait, no
    staged scene for **any** Echo, and this is absolute for **Theo (the child)** and **Priya (the
    regretter)**: their fragments are the shortest, hardest lines in the game (`STORY.md` §4) and land
    *because* they are bare text on black. Never dress them for shock — no photo of a child, no visual
    of the moment of regret. Absence over spectacle (§1.4) holds hardest here.
  - **Kim's absence (E3) is a non-card.** At the Signal Core the player looks for Kim among the running
    minds and she isn't there (`STORY.md` §3). Do not build an Echo card for her; if anything renders,
    it is an *empty slot* / the search returning nothing — the one lane the Signal can't fill. Pure
    negative space; nothing to draw.
- **Case File — truth-by-assembly (S1).** A region's truth now *resolves* on the board once its 2–3
  supporting pieces are collected (`STORY.md` §6), so the visual is a **deduction assembling**, not a
  single truth-room dump. Direction: the supporting evidence cards (parchment) sit collected; a thin
  green rule *draws the link* between them (evidence → the contradiction they force → the resolved
  **`TRUTH`**), reusing the journal's existing contradiction pairing (§8 journal bullet) rather than a
  new motif. The `TRUTH` is the one warm→green moment: the deduction lands in signal-green (the same
  `TRUTH` mark used on region nodes). Before assembly, the slot reads `???`/incomplete — the player
  *sees* the case being built, evidence by evidence.

### Expansion v2 · build: PLANNED — new Phase 3 environments

> The Phase 3 deepening (~2× nodes, `STORY.md` §5) adds intimate sub-story nodes. The game has **no
> illustrated scenery** (§1.1) — these are rendered as location labels, found text, and message/HUD
> chrome like every other node. What follows is *art-direction restraint*, not a request for imagery.
> No bodies are ever staged; **absence is the clue** (§1.4, `STORY.md` §4).

- **The children's room (Haven).** Quiet, **not maudlin.** No staged child, no shoe placed for a gut-
  punch, no sentiment dialed up. The room reads through small ordinary detail left mid-life (Theo's
  Echo lives here, `STORY.md` §5) — the horror is that it's *tidy and empty*, the 143 walked out (they
  weren't taken). Handle it colder than the instinct says to.
- **The quiet room / chapel (Haven).** Stillness as the register — a place for pause, near-empty,
  underpowered. No religious spectacle; just the last-day hush.
- **The infirmary & gate log (Haven).** Clinical-plain and a ledger of departures — the gate log is
  the "walked out on their own feet, one timestamp after another" beat (`STORY.md` §5) rendered as a
  cold list of names/times, not a scene. Bunk 143 (Kim's made-but-empty refused bunk) is an *empty
  made bed* — absence, stated flat.
- **The sealed ward & second patient room (Mercy).** The un-selected dying (Rosa kept them comfortable,
  `STORY.md` §5) — no corpses staged; the ward reads through records and Rosa's Echo, the horror in
  who *wasn't* on the list. The second patient room "isn't yours" — clinical, personal-adjacent, empty.
- **The petitions / mail room (City Hall).** The unchosen **in their own hand** — citizen petitions,
  struck dissent (`STORY.md` §5/§2). Render as paper (the manila/parchment family, §3.3): stacks of
  applications, cut names, the selection made physical. Cold bureaucratic rot, no editorializing.
- **The first-subject observation cell (Research Annex).** The worst place. Patient-zero-as-a-person
  and the oldest, half-degraded Echo (`STORY.md` §5) — an observation cell rendered as logs and one
  badly-corrupted Echo (the most degraded ECHOES styling above, cyan eaten nearly to nothing). Still
  no staged body; the dread is the paperwork and the fragment, not gore.

- **Prologue-midpoint props (spoiler-safe).** The prologue second act (`STORY.md` §8) adds a route
  midpoint — *a trace of others who ran before you*: a scrawled route, a dead phone, **a child's shoe**.
  Direction: **restrained, glancing, never named or explained.** These are the *unchosen* theme seeded
  early (`STORY.md` §2) — "people were here, and they didn't make it" — so they must land as an
  ordinary detail passed in narration (centered italic, §8), **never** lingered on, captioned, or
  dressed for shock. The child's shoe is a single quiet line, not a beat. Zero Echoes, zero answers —
  the prologue only *cracks* (§1.4, `STORY.md` §7).

---

## 9. Ending screens

The two endings are a **color statement** (confirmed in code). Both are quiet, centered, and fade in
slowly (§10):

| | **Accept** — "Let her take you in." | **Refuse** — "Put the phone down." |
| --- | --- | --- |
| Primary | Signal-green `#6a9a78` | Cold grey `#7a7a82` |
| Subtitle | `#3a5a44` — *"— you accepted —"* | `#4a4a52` — *"— you refused —"* |
| Feeling | Warm, together, *gone* | Cold, alone, *still yourself* |
| Canvas | `#070707` (unchanged) | `#070707` (unchanged) |

Accept goes **into** the green (the Signal wins warmly); Refuse holds a **cold blue-grey** (mortal,
alone). Neither is bright, neither is a victory screen — SOMA-tone (GDD §9).

---

## 10. Motion

Restrained and slow — the screen is tired.

- **`fi` (fade-in).** The universal entrance: content fades up over ~1.2s. Endings stagger their
  fades (subtitle at +1.4s).
- **`sigpulse`.** The 3s logo breathe (§5).
- **`sigFlicker`.** The distortion flicker on Signal beats (~0.9–1.6s), audio-coupled (§5).
- **Typing.** Human-paced message reveal with a texting delay (never instant — GDD §7.6).
- **No** parallax, no bounce, no spinners. Motion is fade, pulse, and flicker only.

---

## 11. Marketing & key art

- **Hero asset = the wordmark** on black: `DEAD` grey / `SIGNAL` glowing green, pulsing. It's the
  logo, the icon, and the key art — consistent with the no-illustration identity.
- **Screenshots** should sell the *format*: a phone conversation mid-crossing, the HUD under
  pressure, the Case File board, a Signal-flicker frame. **Spoiler-safe** — never show a Phase-3
  truth card, the endings, or any `STORY.md` §4 answer in public copy.
- **Tone words for store copy:** *quiet, dread, mystery, survival, texting, alone.* Never "zombie,"
  never the twist.
- **Icon:** the existing `public/icon.svg` (green Signal mark). Keep it monochrome-green on black.

---

## 12. The wireframe set

The core screens live in **a single self-contained HTML wireframe:**
[`wireframes/Dead-Signal-Wireframes.html`](wireframes/Dead-Signal-Wireframes.html) — one file, no
external assets (the annotated screens are inlined as SVG), with a sticky nav (screens 01–07) and
scroll-spy. It uses the real palette + IBM Plex-style mono and callout annotations, so it doubles as a
layout spec and a pitch-deck asset. Open it in any browser.

| # | Screen | Shows |
| --- | --- | --- |
| 01 | Title / main menu | Logo treatment, `START / LOAD / STORY / OPTIONS`, save-slot entry |
| 02 | Core gameplay (hero) | HUD corners, contact header, message bubbles, narration, vitals bar, choices, FILE |
| 03 | Encounter | SNEAK/RUN/FIGHT/FORCE with `[LOW]/[MED]/[HIGH]/[COSTLY]` tags |
| 04 | Case File | Board (MEMORIES/CLUES/PEOPLE/LOCATIONS) + Journal (facts/questions/contradiction), **plus the Expansion v2 `ECHOES` lane + truth-by-assembly + Kim's absence** (`build: PLANNED`) |
| 05 | Phase 3 hub | Haven hub + 4 spokes with locked / available / truth-uncovered states (+ a v2 region-depth note) |
| 06 | Endings | Accept (green) vs Refuse (grey), side by side |
| 07 | **ECHOES — recovered minds** | The `ECHOES` category detail — degraded cold-cyan Echo fragments (Theo / Dr. Sorkin / patient-zero), Kim's absence as an empty slot; text-only, no imagery (**Expansion v2 · `build: PLANNED`**) |

> **Expansion v2 · build: PLANNED.** Screens 01–06 reflect the shipped UI. The **Case File
> additions** on screen 04 (the `ECHOES` lane — a fifth category beside MEMORIES/CLUES/PEOPLE/LOCATIONS,
> §8; **truth-by-assembly**, evidence → contradiction → `TRUTH`; and Kim's absence as a non-card) and
> the whole of **screen 07 (ECHOES)** are **design-locked in this Art Bible but not yet in the shipped
> build** — the wireframe flags them `build: PLANNED`. An Echo is *transmission, not paper*: cold-cyan,
> degraded, text only; Kim is deliberately not an Echo (§3.3 / §8, `STORY.md` §3/§6).

---

## 13. Appendix

### 13.1 Palette quick-reference
```
Canvas        #070707      Signal green  #4a9e6b   (glow rgba(74,158,107,.6))
Bright flash  #7fffa0      Dim borders   #1d3a22 / #3a5a44
Risk L/M/H    #4a9e6b / #c8a020 / #8b4a4a          Risk frame #4a351b / #c89a58
Danger        #8b2020 / #e08a8a / #ff8a8a          Cold cyan  #4ab5c8 / #7accd4
Case File     #c8b896 / #c8b98a / #d8c79b          Neutrals   #4a4a4a / #6a6a6a / #1c1c1c–#3a3a3a
Ending accept #6a9a78 (sub #3a5a44)                Ending refuse #7a7a82 (sub #4a4a52)
Type          'IBM Plex Mono', 'Courier New', monospace
```

### 13.2 Related documents
- The Signal (audio half): [Audio Bible §5](../audio/AUDIO.md#5-the-signal--the-signature-motif)
- Presentation internals: [Technical Design §8](../technical/DESIGN.md#8-presentation-layer)
- UX overview: [GDD §10](../design/GDD.md#10-ux-ui--presentation)
- Tone rules / restraint: [`STORY.md`](../narrative/STORY.md) §4
- Photosensitivity + flicker toggle: [Accessibility Plan](../accessibility/) (planned)

### 13.3 Change log
| Version | Date | Notes |
| --- | --- | --- |
| 1.0 | 2026-07-06 | First Art Bible + static SVG wireframe set. Palette/type taken from the shipped UI. |
| 1.1 | 2026-07-06 | **Expansion v2 · build: PLANNED** (docs only, no code). Added art direction for the `ECHOES` board category (transmission-not-paper, degraded/fragmentary text, text-forward with hard no-imagery on the child/regretter Echoes; Kim's absence as a non-card); truth-by-assembly deduction on the board (§8); new Phase 3 environment restraint notes — children's room, quiet room/chapel, infirmary, gate log, sealed ward, petitions room, first-subject cell (no staged bodies, absence is the clue); spoiler-safe prologue-midpoint props; ECHOES-not-paper color note (§3.3); and a wireframe TODO to add an ECHOES lane + truth-by-assembly to `04-casefile.svg` in a later pass. All flagged planned; `STORY.md` wins conflicts. |
| 1.2 | 2026-07-06 | Consolidated the 6 wireframe SVGs + viewer into one self-contained [`Dead-Signal-Wireframes.html`](wireframes/Dead-Signal-Wireframes.html); added screen 07 (ECHOES) and updated the Case File screen for the Expansion v2 board (ECHOES lane, truth-by-assembly, Kim's absence). Wireframe set is now a single file (§12); screen 07 + the Case File additions are `build: PLANNED`. |

*End of document.*
