# Dead Signal — Accessibility Plan

| | |
| --- | --- |
| **Version** | 1.4 |
| **Status** | Living — the option set + screen-reader semantics are built (M-A11Y stages 1–2); the photosensitivity audit, content notes and on-device AT passes remain |
| **Last updated** | 2026-07-12 |
| **Owner** | Jharek (design/QA) |
| **Standard** | WCAG 2.2 AA (baseline) |
| **Companion docs** | [PRD](../product/PRD.md) · [Art Bible](../art/ART.md) · [Audio Bible](../audio/AUDIO.md) · [Technical Design](../technical/DESIGN.md) |

> **Purpose.** How *Dead Signal* is made playable by as many people as possible, and how we verify
> it. The good news up front: because the game is **reading + tapping with no reflex demands**, it
> starts from a strong accessibility position, and several features are **already shipped**. This
> plan credits those, then scopes the gaps to a WCAG 2.2 AA baseline. PRD priority: **P1**.

---

## Table of contents

1. [What's already in place](#1-whats-already-in-place)
2. [Principles & standard](#2-principles--standard)
3. [Visual](#3-visual)
4. [Motor](#4-motor)
5. [Timing & pacing](#5-timing--pacing)
6. [Hearing](#6-hearing)
7. [Photosensitivity](#7-photosensitivity)
8. [Cognitive](#8-cognitive)
9. [Screen readers & semantics](#9-screen-readers--semantics)
10. [Content & trauma notes](#10-content--trauma-notes)
11. [The Options roadmap](#11-the-options-roadmap)
12. [Testing & audit checklist](#12-testing--audit-checklist)
13. [Risks & appendix](#13-risks--appendix)

---

## 1. What's already in place

Verified in `src/DeadSignal.jsx` / `index.html` — these are **shipped**, not aspirational:

- **No reflex, ever.** The game is tap/click decisions only; there is no timing-based fail state. The
  real-time day gates were *designed and then dropped* (`STORY.md` changelog #8), so nothing rushes
  the player.
- **`prefers-reduced-motion` is honored.** A global media query (`KEYFRAMES_FI`) collapses all
  animation and transition durations to ~0 when the OS requests reduced motion — so the fade-ins,
  `sigpulse`, and the Signal flicker all quiet down automatically. This is also our first line of
  defense on photosensitivity (§7).
- **Fully playable muted.** All critical information is **textual/visual**; audio is purely additive
  (Audio Bible §8). Nothing is audio-only.
- **Pause freezes the dialogue.** Pausing halts the message queue mid-beat and resumes it — a comfort
  and cognitive-load feature, not just a menu.
- **Native, focusable controls.** Choices and menu items are real `<button>` elements — keyboard-
  focusable and activatable by default. Some already carry `aria-label`s.
- **Color is not the sole carrier for risk.** Risk tiers show a **text tag** (`[LOW]/[MED]/[HIGH]/
  [COSTLY]`) alongside color, and resource deltas are labeled (`[+N Food]`) — meaning is not
  color-dependent.
- **Save anywhere.** Progress persists per slot and resumes at a safe point — no long unsaved stretches.

That's a strong baseline. The rest of this plan hardens it and fills the gaps.

---

## 2. Principles & standard

- **Baseline: WCAG 2.2 AA.** Where a criterion is cheap to exceed (AAA), we take it.
- **Console/platform readiness.** If the game is ever wrapped for consoles, their accessibility
  guidelines (Xbox/PlayStation/Nintendo) largely overlap WCAG for a text UI; the CVAA is more
  relevant to real-time comms than to a single-player narrative game, but its spirit (text
  alternatives, configurable UI) is honored here.
- **Accessibility is a design stance, not a toggle.** The no-reflex core (§4) and muted-playability
  (§6) are structural, not bolted-on.

---

## 3. Visual

**Contrast (measured against the `#070707` canvas):**

| Foreground | Use | Ratio | WCAG |
| --- | --- | --- | --- |
| `#4a9e6b` signal-green | accent, choices, live text | **≈ 6.1 : 1** | ✅ AA normal & large (AAA large) |
| `#c8b896` parchment | Case File evidence | ≈ 9 : 1 | ✅ AA/AAA |
| `#7a7a7a` mid-grey | secondary text | ≈ 4.7 : 1 | ✅ AA normal (borderline) |
| `#6a6a6a` dim-grey | de-emphasized labels | **≈ 3.7 : 1** | ⚠️ **fails AA for small text** |

**Contrast — done (M-A11Y stage 1, 2026-07-12).** Every text color that carries meaning now resolves
through a CSS custom property (`A11Y_TOKENS` in `DeadSignal.jsx`) instead of a hardcoded hex, and the
**HIGH CONTRAST** option (§11) swaps the whole set for AA-clearing values. Measured on `#070707`:

| Token | Default | Ratio | High contrast | Ratio |
| --- | --- | --- | --- | --- |
| `--ds-dim` | `#6a6a6a` | ⚠️ 3.7 : 1 | `#a6a6a6` | ✅ 8.3 : 1 |
| `--ds-mid` | `#7a7a7a` | 4.7 : 1 | `#b4b4b4` | ✅ 9.7 : 1 |
| `--ds-faint` | `#5a5a5a` | ⚠️ 2.9 : 1 | `#9a9a9a` | ✅ 7.2 : 1 |
| `--ds-locked` | `#2f2f2f` | ⚠️ 1.5 : 1 | `#7a7a7a` | ✅ 4.7 : 1 |
| `--ds-note` | `#8a8a7a` | 5.8 : 1 | `#c0c0ae` | ✅ 10.9 : 1 |
| `--ds-sub` | `#7a8a7e` | 5.5 : 1 | `#adc2b3` | ✅ 10.7 : 1 |
| `--ds-subhead` | `#5a7a64` | ⚠️ 4.2 : 1 | `#93bda0` | ✅ 9.6 : 1 |
| `--ds-warm` | `#7a6a6a` | ⚠️ 3.9 : 1 | `#b39f9f` | ✅ 8.0 : 1 |

The locked (`———`) board rows are included deliberately: they carry meaning ("not found yet"), so they
are not treated as decoration. The signal-green (6.1 : 1) and parchment (10.3 : 1) already pass and are
untouched — the terminal aesthetic stays the default, and the lift is opt-in.

**Other visual work:**
- **Text scaling — done (2026-07-12).** The **TEXT SIZE** option (100/115/130/150%) scales the document
  root font-size, which the `rem`/`clamp()` sizing carries through the whole UI; it stacks with browser
  zoom rather than replacing it. *Still to verify on device: layout holds at 150% + 200% zoom together
  (WCAG 1.4.4) with no clipping.*
- **Reflow.** Confirm the phone layout reflows to 320px CSS width with no horizontal scroll (WCAG 1.4.10) — it's already phone-first, so this should largely hold; verify.
- **Dyslexia-friendly option.** Offer an alternate readable font (e.g. Atkinson Hyperlegible) as an
  option — note this trades against the IBM Plex Mono terminal aesthetic (Art Bible §4), so it's a
  toggle, not the default.
- **Focus visibility.** Ensure a clear, high-contrast focus indicator on every control (WCAG 2.4.7 /
  2.4.11) — native buttons help, but the custom dark styling must not suppress the focus ring.

---

## 4. Motor

- **No-reflex (shipped).** No action requires speed, timing, dragging, or precise gestures. This
  clears the hardest motor barriers by design (WCAG 2.5.x).
- **Touch targets.** Verify choice/menu buttons meet **≥ 44×44 px** (WCAG 2.5.8 AA target size);
  widen padding where the tight terminal styling makes them short.
- **Full keyboard operability.** Native buttons are focusable; complete the pass: a logical tab
  order, no keyboard traps (WCAG 2.1.1/2.1.2), Enter/Space activation, and the Case File / pause
  overlays returning focus sensibly on close.
- **No path-dependent gestures.** Nothing needs a swipe or multi-touch; keep it that way.

---

## 5. Timing & pacing

- **Pause-freezes-dialogue (shipped)** and **no forced timeouts** (real-time gates dropped) satisfy
  WCAG 2.2.1 comfortably.
- **Text-speed / instant reveal — done (M-A11Y stage 1, 2026-07-12).** The **TEXT SPEED** option
  (*Slow / Normal / Fast / Instant*) and **tap-to-complete** are built — see §11 for how. This was the
  single highest-value a11y add: it serves slow readers, fast readers and screen-reader users alike.
- **No auto-advancing content** that can't be paused — confirm every timed reveal is pause-covered.

---

## 6. Hearing

Strong by construction:

- **Muted-playable (shipped).** Every audio cue has a non-audio counterpart: a **message** renders as
  text; a **resource sting** mirrors a HUD number change; the **completion chord** accompanies a
  completion screen.
- **The Signal cue is audio-visual (shipped).** The `signal()` distortion is always paired with the
  on-screen `sigFlicker` (Art Bible §5.2 / Audio Bible §5.2), so deaf/HoH players still receive the
  "the Signal is here" beat.
- **The Echo recovery cue needs a visual equivalent — Expansion v2 · build: BUILT 2026-07-10.** Echoes surface
  by a story-gated **audio cue** — a sibling of the existing `signal()` distortion (`STORY.md` §3).
  Because that cue signals *an Echo is recoverable here*, it must ship paired with an on-screen
  counterpart, exactly as the Signal cue is paired with `sigFlicker` — so a deaf/HoH or muted player
  never misses that a fragment is present. All Echo **content is textual** (2–4 lines of found text,
  read on the board), so recovery and reading are already fully playable muted; this only extends the
  existing "audio cue always has a visual twin" rule to the new cue. **Built (2026-07-10):** the cue is `audioEngine.echo()` and its visual twin is the **ECHO RECOVERED** card — it renders the fragment's 2–4 lines as text (cyan) plus a `sigFlicker` pulse, so a muted/deaf/HoH player both sees the recovery and reads the fragment. Present in code; confirm in the on-device muted run.
- **No spoken dialogue**, so captions/subtitles are not required — but if voiced content is ever
  added, it must ship with captions.
- **Action:** make sure the visual counterparts are *sufficient on their own* (test a full playthrough
  with sound off — now including the Echo cue and Echo text), and consider optional **haptics** (§11)
  as an added non-audio channel on mobile.

---

## 7. Photosensitivity

The one area needing an explicit audit, because the Signal identity is built on **green glow +
flicker**.

- **Already dampened:** `prefers-reduced-motion` collapses the flicker/pulse durations (§1), so
  motion-sensitive users on OS reduced-motion already get a calmer screen.
- **Audit (WCAG 2.3.1):** measure the `sigFlicker` and any bright-green `#7fffa0` flashes against the
  **general flash threshold** — no more than **3 general flashes per second**, and limited area/
  luminance change. The cue is brief and infrequent (story-gated), which helps, but it must be
  measured, not assumed.
- **"Reduce flashing" toggle — built (2026-07-12).** Independent of OS reduced-motion (a player can
  want the flicker gone without wanting all motion gone). It holds `sigflicker`, `flash`, `slowflash`,
  `pu` and `sigpulse` at a steady opacity, so the *meaning* of the Signal beat survives — dimmed signal
  bars still read as an unstable signal, they just stop flashing. Covers the Echo cue's `sigFlicker`
  twin and the S1 `assembly_note` flash by construction, since both ride the same keyframes.
  *Still outstanding: the measured flash-rate/area audit below — the toggle mitigates, it doesn't
  substitute for measuring the default.*
- **Never** stack the flash with a full-screen luminance jump.
- **Expansion v2 — fold the Echo cue into this audit · build: BUILT 2026-07-10.** The Echo recovery cue's
  visual twin (§6) is planned as a **sibling/extension of the Signal distortion**. If it reuses or
  extends the `sigFlicker`/green-glow visual, it falls under the same WCAG 2.3.1 audit — measure it
  for flash rate, area, and luminance change, and make sure the "reduce flashing" toggle and OS
  reduced-motion damp it too (an Echo present should still be legible with flashing reduced). If it
  ships as a distinct visual, audit it on its own terms; either way it is in scope, not assumed safe.

---

## 8. Cognitive

- **The Case File is a comprehension aid.** It externalizes memory — known facts, open questions, and
  the contradictions that drive the mystery — so players don't have to hold the plot in their head.
  Treat it as an accessibility feature and keep it clear and consistent.
- **Plain, consistent patterns.** One interaction model (read → choose), consistent button styling,
  consistent HUD registers, no hidden mechanics. Keep it.
- **Save-anywhere + resume-safe** reduces the penalty for interruptions.
- **Optional simplified motion/quiet mode** (ties to §7) for lower sensory load.
- **Reading load.** The text-speed/instant option (§5) is also a cognitive-load lever.
- **Expansion v2 — the structural advantage holds · build: BUILT 2026-07-10.** The added content (Echoes,
  region sub-stories, truth-by-assembly, the deepened prologue) is **authored text and Case File
  entries — reading and tapping, no new mechanics** (`STORY.md` §5, §9 carve-out). It adds no reflex
  demand, no timing fail state, and nothing that can't be paused: every new beat is read at the
  player's pace, the pause still freezes the dialogue (§5), and the Case File still externalizes the
  (now larger) plot so it need not be held in the head. The heavier *emotional* load (§10) is the
  thing that rises, not the *interaction* load — the game's core accessibility posture is unchanged.

---

## 9. Screen readers & semantics

**Built — M-A11Y stage 2 (2026-07-12).** This was the largest engineering piece in the plan. The
shape of the solution: *the game already says everything out loud in text* — it just wasn't marked up
so assistive tech could hear it.

- **The transcript is the live region (`role="log"`).** Everything a player must not miss arrives
  there as a message: Ellie, narration, `CASE FILE UPDATED`, `ECHO RECOVERED`, the assembly card,
  `TRUTH UNCOVERED`. Marking the log once therefore carries the whole story — no bespoke
  announcements, nothing to keep in sync as content grows. It is **`aria-live="polite"`** (a new line
  queues behind the one being read rather than cutting it off) and **`aria-relevant="additions"`**,
  which is what stops a screen reader re-reading the entire backlog every time React re-renders the
  list or a save is restored into it.
- **The HUD announcer.** The registers — battery, health, water, food, noise, day, area, signal — are
  chrome *outside* the log, and they change silently. A sighted player watches the number tick; a
  blind player would simply never learn they'd been hurt. So the registers are diffed each render and
  **only what actually changed** is spoken, as one polite sentence, from an off-screen
  `role="status"` region deliberately placed **outside** the log so a resource tick can never
  interleave with the line being read. The first pass primes the baseline silently: on arrival the HUD
  isn't news, and the player can read it whenever they like. The one exception is **battery critical**,
  which is `role="alert"` — assertive, because it's the only state that can end the run.
- **Meaning, not glyphs.** Every register carries a spoken name — *"battery 34 percent"*, not *"34%"*;
  *"health 8 of 10, bleeding"*. The things that only draw those values (the signal bars, the battery
  icon, the avatar, the `▸`/`▾` chevrons, the `›` and `∴` on the assembly card, the `· · ·` typing
  dots and the `· · ·` continue sentinel) are `aria-hidden` and given a text equivalent where they
  carry meaning — so AT reads the meaning once, not the picture and then the meaning.
- **Semantic structure.** One `<main>` landmark, a named `<nav>` for the action bar, `role="heading"`
  on the screen titles (`role`, not `<h1>`: identical to AT, zero effect on a tightly-tuned layout),
  and the pause overlay as a proper `role="dialog" aria-modal` so AT stays inside it instead of
  wandering the frozen chat behind. Reading order follows DOM order, which already matches the visual
  order (narration → choices).
- **The Case File is an accordion, so it's marked as one.** Sections and entries are `aria-expanded`
  expanders named with their label and count. An unlocked **Echo** announces as a Case File entry like
  any other and its 2–4 lines read in visual order. Locked rows — a dim `———` on screen, *nothing* read
  aloud — now say **"locked — not found yet"**: that's a state the player needs (how much is left to
  find), not decoration.
- **Truth-by-assembly announces as a deduction.** The assembly card reads each supporting piece and
  then the conclusion, with the `∴` spoken as the word it stands for ("therefore") — so a non-sighted
  player perceives the *reasoning*, not just the result. The withholding beat ("still missing: …") and
  every supporting piece already arrive as text in the log, so the assembling is audible end-to-end.
- **Still to do:** focus management (returning focus sensibly when the Case File / pause overlays
  close) and the **on-device AT passes** — VoiceOver (iOS/Safari), NVDA, TalkBack. A DOM harness can
  prove the tree is correct; only a real screen reader can judge whether it's *pleasant to listen to*.
- **Expansion v2 — the new board content inherits every rule · build: BUILT 2026-07-10.** The new **`ECHOES`**
  Case File category and **truth-by-assembly** (`STORY.md` §6) are additional board/journal content and
  must meet the same bar as the existing categories: keyboard-navigable, screen-reader friendly, and
  readable against the `#070707` canvas (the §3 contrast/scaling work and the §5 text-speed/instant-
  reveal option all apply to Echo text and assembled truths too). Two specifics: (1) an unlocked
  **Echo** entry announces as a new Case File entry like any other, and its 2–4 lines read in visual
  order; (2) **truth-by-assembly** — where the Journal visibly assembles *evidence → deduction →
  TRUTH* as the 2–3 supporting pieces are found — must announce the assembling state changes (a new
  supporting piece added, and the moment a **TRUTH** resolves) so a non-sighted player perceives the
  deduction, not just the final result. Keep locked (`???`) placeholders labeled as such.
- **Test with real AT:** VoiceOver (iOS/Safari) and NVDA/TalkBack.

---

## 10. Content & trauma notes

*Dead Signal* deals in heavy material — an outbreak, grief, bodies (by absence), self-erasure, and a
philosophical horror about the loss of self. Accessibility includes **psychological** access:

- Provide a brief, **spoiler-safe content note** at the outset (themes: survival horror, grief, loss
  of identity) so players can make an informed choice — without spoiling the twist.
- Keep the existing restraint (no gore, no staged bodies — `STORY.md` §4) as a deliberate harm-
  reduction choice.
- If distributed on storefronts, mirror these in the store's content descriptors.

**Expansion v2 — raised emotional intensity · build: BUILT 2026-07-10.** The Echoes and the *unchosen* thread
(`STORY.md` §2, §3, §5) push the emotional register harder than the shipped build, so the content-notes
surface must widen to cover them (still spoiler-safe — themes named, twist withheld). **BUILT 2026-07-10 — the specific beats that landed:** Theo (a child among the uploaded), Priya (the regretter), Rosa's sealed ward at Mercy (the un-selected dying), Marcus + the City Hall citizen petitions + the prologue's child's-shoe traces (the unchosen / people left behind), patient zero (consent — the terminally ill 'volunteers'), Sorkin (you were warned by name), and the decision log (you chose 143 over safety). All spoiler-safe; the §4 restraint ceiling (Echoes crack, 2–4 lines, no gore, never staged for shock) held throughout. Add coverage for:

- **A child among the uploaded** (Theo) — the game's hardest line by design; the prologue second act
  also implies child loss by object (a child's shoe as a trace of those who didn't make it, `STORY.md`
  §8). Flag *harm to / endangerment of children* as a theme.
- **Regret / irreversible consent** (Priya, the regretter who recanted too late) — a theme of a
  choice that can't be un-made.
- **The left-behind / "unchosen"** (Marcus's cut loved one; a city died so 143 were saved; *you signed
  who wasn't*) — survivor's guilt and moral culpability for others' deaths.
- **The un-selected dying** (Rosa's ward — those given no slot, kept only comfortable) — death of the
  vulnerable / triage.

These sit alongside the existing grief, self-erasure, and bodies-by-absence notes; the spoiler-safe
outset note should broaden its theme list accordingly (e.g. *"survival horror, grief, loss of identity,
harm to children, and moral guilt over who is saved"* — enough to inform without revealing the twist).
Any **content toggles** this plan contemplates (§11 roadmap) should be scoped to let a player who opts
into content notes see these specific categories flagged, and the restraint ceiling (§4 of `STORY.md` —
Echoes *crack*, never stage for shock; 2–4 lines; no gore) remains the harm-reduction backbone even as
intensity rises.

---

## 11. The Options roadmap

The Options screen offers **volume + mute** and a data-reset, plus — as of **M-A11Y stage 1
(2026-07-12)** — an **ACCESSIBILITY** section carrying the four P1 settings. All are persisted via
the existing `window.storage` pattern (`ds_a11y`), restored on mount, and re-validated on load, so a
stale or hand-edited payload can never leave the game unplayable.

| Setting | Category | Priority | Status |
| --- | --- | --- | --- |
| Text speed (Slow/Normal/Fast/**Instant**) + tap-to-complete | Timing/cognitive | **P1 (highest value)** | ✅ **built** 2026-07-12 |
| Reduce flashing (independent of OS) | Photosensitivity | P1 | ✅ **built** 2026-07-12 |
| Text size / UI scale (100/115/130/150%) | Visual | P1 | ✅ **built** 2026-07-12 |
| High-contrast / brighten dim text | Visual | P1 | ✅ **built** 2026-07-12 |
| Dyslexia-friendly font | Visual | P2 | 🔜 |
| Haptics on/off (mobile) | Hearing/feedback | P2 | 🔜 |
| Language selector | (Localization) | P2 | 🔜 (M-LOC) |

**How they're built** (`src/DeadSignal.jsx`):

- **Text speed** is a uniform multiplier applied inside `setT`, the single funnel every gameplay timer
  already went through for the pause feature. Because *every* delay scales by the same factor —
  including the bridges that schedule the next beat off the previous beat's own duration — the
  authored order is identical at any speed. `Instant` is a near-zero scale (0.04), **not** zero: at a
  true zero a later beat could clear an earlier one's timers before they rendered.
- **Tap-to-complete** (`flushDialogue`) doesn't dump text and guess at the state — it *runs the beat's
  own pending timers in order, immediately*, so the lines, the typing indicator, the choice reveal and
  any `onShown` hook all land exactly as authored, just without the pacing. It flushes only the current
  beat's queue (`dialogueRef`), never the bridge timers (`pendingRef`) — so it **completes a beat, it
  never skips ahead** — and it's a no-op while paused. Reachable by tapping the transcript (the phone
  gesture) or the **REVEAL** button, which is a real focusable control for keyboard/AT users and sits in
  the choices slot, so it costs no extra layout.
- **Reduce flashing** redefines the flashing keyframes by name (a later `@keyframes` of the same name
  wins), holding `sigflicker`/`flash`/`slowflash`/`pu`/`sigpulse` at a steady opacity. The elements —
  and their meaning — stay: dimmed signal bars still read as an unstable signal, they just stop
  flashing. Independent of OS reduced-motion, because a player can want the flicker gone without
  wanting all motion gone.
- **Text size** scales the document root font-size; the UI is sized in `rem`/`clamp()` throughout, so
  the whole interface scales, and it stacks with browser zoom rather than fighting it.
- **High contrast** lifts the sub-AA greys through CSS custom properties (`A11Y_TOKENS`), overridden on
  `<html>` — see §3.

---

## 12. Testing & audit checklist

- **Automated — `npm run qa:a11y` (built 2026-07-12).** A browserless harness
  ([`scripts/qa/qa-a11y.mjs`](../../scripts/qa/qa-a11y.mjs), QA.md §6.8): the accessibility surface is
  DOM, not pixels, so it renders the **real component** into jsdom, drives it to the chat, the Case
  File and the Options screen, and asserts on the actual accessibility tree — live-region roles, every
  control named, nothing focusable hidden from AT, `aria-expanded` flipping, and that toggling high
  contrast really does repaint the token on `<html>`. It catches exactly what a human tester misses (an
  unnamed button, a glyph read aloud as punctuation) and leaves to real AT what only real AT can judge.
- **Automated:** axe / Lighthouse a11y pass on each screen (contrast, names, roles, order).
- **Contrast:** re-measure every text color on `#070707` (see §3 table); fix sub-AA text.
- **Keyboard-only:** complete a full playthrough with no pointer — reach and activate every control,
  no traps, visible focus throughout.
- **Screen reader:** VoiceOver (iOS) + NVDA — messages announced, order correct, controls labeled.
- **Muted:** full playthrough with sound off — no lost information.
- **Reduced-motion + reduce-flashing:** verify both calm the Signal cue while preserving its meaning.
- **Photosensitivity:** flash-rate/area measurement on the Signal cue and bright-green flashes.
- **Zoom/reflow:** 200% zoom and 320px width — no clipping, no horizontal scroll.
- **Targets:** every interactive control ≥ 44×44 px.

Include an accessibility smoke test in the release gate (PRD §8).

---

## 13. Risks & appendix

### 13.1 Risks
| Risk | Impact | Mitigation |
| --- | --- | --- |
| Screen-reader support underscoped | Blind players can't play a *text* game | Prioritize the `aria-live` chat + AT testing early |
| Dim-grey text fails AA | Low-vision readability | §3 contrast audit + brighten |
| Signal flicker triggers photosensitivity | Harm + compliance | Reduced-motion (done) + reduce-flashing toggle + flash audit |
| Terminal aesthetic vs. readability | Design/access tension | Options (font/contrast/size) as opt-in, aesthetic stays default |

### 13.2 Related documents
- The Signal flicker (visual): [Art Bible §5](../art/ART.md) · the audio half: [Audio Bible §5, §8](../audio/AUDIO.md)
- Requirements: [PRD §7.2 NFR-5, §8](../product/PRD.md)
- Readability/font overlap: [Localization Plan §6](../localization/LOCALIZATION.md)
- Canon/restraint: [`STORY.md`](../narrative/STORY.md) §4

### 13.3 Change log
| Version | Date | Notes |
| --- | --- | --- |
| 1.0 | 2026-07-06 | First accessibility plan. Credits shipped features (reduced-motion, muted-playable, no-reflex, native buttons, ARIA); measured contrast; scoped the option set + screen-reader + photosensitivity work. |
| 1.1 | 2026-07-06 | **Expansion v2 (build: PLANNED, docs only).** Widened the content/trauma notes (§10) for the raised intensity — a child among the uploaded, the regretter, the left-behind/*unchosen*, the un-selected dying. Added a visual equivalent for the Echo recovery audio cue (§6) and folded that cue into the photosensitivity audit (§7). Brought the new `ECHOES` board category + truth-by-assembly under the screen-reader/keyboard/contrast bar (§9). Reaffirmed the structural advantage — new content is reading + tapping, no reflexes, pausable (§8). WCAG 2.2 AA framing unchanged. |
| 1.4 | 2026-07-12 | **M-A11Y stage 2 — screen readers & semantics (§9) BUILT.** The insight that shaped it: the game already says everything in text, it just wasn't marked up to be heard. The **transcript is the live region** (`role="log"`, `aria-live="polite"`, `aria-relevant="additions"`) — so dialogue, narration, CASE FILE UPDATED, ECHO RECOVERED, the assembly card and TRUTH UNCOVERED all announce themselves as they land, with no bespoke per-feature announcements to keep in sync, and the backlog is never re-read on re-render or save-restore. The **HUD registers** (battery/health/water/food/noise/day/area/signal) change silently outside the log, so they're diffed each render and only what changed is spoken, from an off-screen `role="status"` placed **outside** the log so a resource tick can't interleave with the line being read; battery-critical is the one `role="alert"`. Every register speaks meaning, not glyphs ("battery 34 percent", not "34%"); the bars, icons, chevrons, `›`/`∴`, typing dots and the `· · ·` continue sentinel are `aria-hidden` with text equivalents. Structure: one `<main>`, a named `<nav>`, `role="heading"` titles, the pause overlay as a real `role="dialog" aria-modal`. The Case File is marked as the accordion it is (`aria-expanded`, named sections), Echo lines read in visual order, and locked `———` rows now say **"locked — not found yet"**. Truth-by-assembly reads evidence → *therefore* → TRUTH, so the deduction is perceivable, not just its result. **New harness: `npm run qa:a11y`** ([`scripts/qa/qa-a11y.mjs`](../../scripts/qa/qa-a11y.mjs)) renders the real component into jsdom and asserts on the live accessibility tree — 30+ checks green, incl. an end-to-end proof that high contrast repaints the `<html>` token. Full regression green (build 995 modules, map 0 warnings, save 8/8). **Still open:** focus management on overlay close, and the on-device AT passes (VoiceOver/NVDA/TalkBack) — a DOM harness proves the tree is right; only a screen reader can judge whether it's pleasant to listen to. |
| 1.3 | 2026-07-12 | **M-A11Y stage 1 — the Options set is BUILT.** The four P1 settings from §11 ship in an **ACCESSIBILITY** section of the Options screen, persisted via `window.storage` (`ds_a11y`) and re-validated on load: **text speed** (Slow/Normal/Fast/Instant) + **tap-to-complete**; **reduce flashing**; **text size** (100–150%); **high contrast**. Text speed is a uniform multiplier inside `setT` — the one funnel every gameplay timer already passed through for pause — so authored beat order is identical at any speed; *Instant* is a near-zero (0.04) rather than a true zero, which would let a later beat clear an earlier one before it rendered. Tap-to-complete **runs the current beat's own timers in order, immediately** (lines, typing indicator, choices, `onShown` hooks all land as authored) and touches only that beat's queue — it completes a beat, it never skips ahead; reachable by tapping the transcript or the focusable **REVEAL** control. §3 rewritten with the measured token table: every meaning-bearing grey now resolves through a CSS custom property and high contrast lifts all eight above AA (incl. the locked `———` rows, which carry meaning). Verified: clean build (995 modules), map harness 0 warnings, save 8/8, contrast/target-size/ARIA checks green. **Still open in M-A11Y:** the screen-reader/`aria-live` work (§9), the measured photosensitivity audit (§7), the content/trauma note surface (§10), and the on-device keyboard/muted/zoom passes (§12). |
| 1.2 | 2026-07-10 | **Expansion v2 content BUILT — a11y delta logged (M-EXP crit: a11y deltas).** Flipped the content flags PLANNED→BUILT. Confirmed the Echo cue's **visual twin exists** (`audioEngine.echo()` + the ECHO RECOVERED text card + `sigFlicker`, §6); folded the echo cue + the S1 `assembly_note` flash into the photosensitivity audit (§7); recorded the specific raised-intensity beats now in the build (§10 — Theo, Priya, Rosa's ward, Marcus/petitions/child's-shoe unchosen, patient-zero consent, Sorkin's warning, the 143 decision); brought the `ECHOES` board category + the S1 assembly card + the prologue midpoint/shelter under the SR/keyboard/contrast/text-speed bar (§8/§9). Structural advantage holds — all reading + tapping, pausable, muted-playable. The **a11y option set + audit (M-A11Y) is still PLANNED** — only the content it must cover has landed. WCAG 2.2 AA framing unchanged. |

*End of document.*
