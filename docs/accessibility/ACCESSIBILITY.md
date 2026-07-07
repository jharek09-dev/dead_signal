# Dead Signal — Accessibility Plan

| | |
| --- | --- |
| **Version** | 1.1 |
| **Status** | Living — some features shipped, an option set + audits remain |
| **Last updated** | 2026-07-06 |
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

**Action:** audit every use of the dimmest greys (`#6a6a6a` and below). Where they carry real text at
small sizes, brighten to ≥ `#7a7a7a` (AA) or promote to large text. Purely decorative/disabled text
can stay but should be verified as non-essential.

**Other visual work:**
- **Text scaling.** The UI uses `rem`/`clamp()` sizing (good), but there is no in-game **text-size
  option** yet. Add a size/scale control; verify layout holds at 200% zoom (WCAG 1.4.4) without loss.
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
- **Text-speed / instant reveal — the key gap.** Messages currently stream at a fixed human pace
  (`scheduleMessages`, `NOTIF_DELAY`). Add an **Options control**: *Slow / Normal / Fast / Instant*,
  and a tap-to-complete (tap reveals the rest of the current line immediately). This helps slow
  readers, fast readers, and screen-reader users alike, and is the single highest-value a11y add.
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
- **The Echo recovery cue needs a visual equivalent — Expansion v2 · build: PLANNED.** Echoes surface
  by a story-gated **audio cue** — a sibling of the existing `signal()` distortion (`STORY.md` §3).
  Because that cue signals *an Echo is recoverable here*, it must ship paired with an on-screen
  counterpart, exactly as the Signal cue is paired with `sigFlicker` — so a deaf/HoH or muted player
  never misses that a fragment is present. All Echo **content is textual** (2–4 lines of found text,
  read on the board), so recovery and reading are already fully playable muted; this only extends the
  existing "audio cue always has a visual twin" rule to the new cue. Verify in the muted playthrough.
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
- **Add a "reduce flashing" toggle** (independent of OS reduced-motion) that replaces the flicker
  with a static, non-flashing indicator (e.g. a steady border tint) while keeping the *meaning* of
  the Signal beat.
- **Never** stack the flash with a full-screen luminance jump.
- **Expansion v2 — fold the Echo cue into this audit · build: PLANNED.** The Echo recovery cue's
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
- **Expansion v2 — the structural advantage holds · build: PLANNED.** The added content (Echoes,
  region sub-stories, truth-by-assembly, the deepened prologue) is **authored text and Case File
  entries — reading and tapping, no new mechanics** (`STORY.md` §5, §9 carve-out). It adds no reflex
  demand, no timing fail state, and nothing that can't be paused: every new beat is read at the
  player's pace, the pause still freezes the dialogue (§5), and the Case File still externalizes the
  (now larger) plot so it need not be held in the head. The heavier *emotional* load (§10) is the
  thing that rises, not the *interaction* load — the game's core accessibility posture is unchanged.

---

## 9. Screen readers & semantics

The gap that needs the most engineering:

- **Live regions for incoming messages.** New chat messages stream in via timers; they must be
  announced. Wrap the chat log in an `aria-live="polite"` region (or announce each new message) so a
  screen-reader user hears the conversation as it arrives — this is essential for a text game.
- **Semantic structure.** Headings/landmarks for menus, the Case File, and the chat; buttons already
  native. Ensure the **reading order** matches the visual order (narration → choices).
- **Labels.** Extend the existing `aria-label`s to every control; give HUD registers accessible names
  (e.g. "battery 34 percent" not just "34%"). Icons/glyphs get text alternatives.
- **State changes announced.** Resource changes, a new Case File entry, and phase transitions should
  be perceivable without sight.
- **Expansion v2 — the new board content inherits every rule · build: PLANNED.** The new **`ECHOES`**
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

**Expansion v2 — raised emotional intensity · build: PLANNED.** The Echoes and the *unchosen* thread
(`STORY.md` §2, §3, §5) push the emotional register harder than the shipped build, so the content-notes
surface must widen to cover them (still spoiler-safe — themes named, twist withheld). Add coverage for:

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

Today the Options screen offers **volume + mute** (persisted) and a data-reset. Proposed additions,
all persisted via the existing `window.storage` pattern:

| Setting | Category | Priority |
| --- | --- | --- |
| Text speed (Slow/Normal/Fast/**Instant**) + tap-to-complete | Timing/cognitive | **P1 (highest value)** |
| Reduce flashing (independent of OS) | Photosensitivity | P1 |
| Text size / UI scale | Visual | P1 |
| High-contrast / brighten dim text | Visual | P1 |
| Dyslexia-friendly font | Visual | P2 |
| Haptics on/off (mobile) | Hearing/feedback | P2 |
| Language selector | (Localization) | P2 |

---

## 12. Testing & audit checklist

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

*End of document.*
