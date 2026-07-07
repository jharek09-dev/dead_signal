# Dead Signal — Localization Plan

| | |
| --- | --- |
| **Version** | 1.1 |
| **Status** | Planning — pre-implementation (strings not yet externalized) |
| **Last updated** | 2026-07-06 |
| **Owner** | Jharek (loc/eng) |
| **Canon source** | [`STORY.md`](../narrative/STORY.md) |
| **Companion docs** | [PRD](../product/PRD.md) · [Technical Design](../technical/DESIGN.md) · [Art Bible](../art/ART.md) |

> **Purpose.** How *Dead Signal* becomes translatable and ships in more than one language. The plan
> is front-loaded on one hard dependency — **string externalization** — because nothing else in
> localization can begin until the text is extracted from the game logic. Priority in the [PRD](../product/PRD.md)
> is **P2** (a polished-launch/fast-follow goal, not ship-blocking).

---

## Table of contents

1. [Readiness assessment](#1-readiness-assessment)
2. [The critical path: string externalization](#2-the-critical-path-string-externalization)
3. [String architecture](#3-string-architecture)
4. [Target languages & tiers](#4-target-languages--tiers)
5. [Culturalization & voice](#5-culturalization--voice)
6. [Typography & script coverage](#6-typography--script-coverage)
7. [UI constraints on a phone](#7-ui-constraints-on-a-phone)
8. [Pipeline & tooling](#8-pipeline--tooling)
9. [QA & LQA](#9-qa--lqa)
10. [Effort & sequencing](#10-effort--sequencing)
11. [Risks](#11-risks)
12. [Appendix](#12-appendix)

---

## 1. Readiness assessment

**Current state: English-only, fully hardcoded.** Every player-facing string is authored inline in
`src/DeadSignal.jsx` — inside the module-scope data pools (`INTRO_LINES`, `PATH_BEATS`,
`EXPLORE_BEATS`, `STATE_LINES`, `HAVEN_*`, `ENCOUNTERS`, `BOARD_*`, the finale/ending arrays, UI
labels) and in the render code. There is **no i18n scaffolding** — no string table, no locale
switch, no message-format layer.

**Scale.** The authored surface is large for a text game: on the order of **several hundred string
literals** (the data pools alone carry hundreds of `msgs`/`choices`/`text`/`name`/`note` entries),
plus UI chrome (menus, HUD registers, Options, Case File labels). This is the product — it is
text-dense by nature.

**Implication.** Localization is **not a translation task first; it is a refactor first.** Until
strings are externalized, there is nothing for a translator to touch. This document treats
externalization as milestone zero.

---

## 2. The critical path: string externalization

Extract every player-facing string out of `DeadSignal.jsx` into a **locale catalog**, and have the
game read from it by key.

**Approach (recommended):**

1. **Inventory & tag.** Sweep the data pools + render layer; mark each string as *content* (story
   beats, Ellie/narrator lines) vs *chrome* (menus, HUD, labels). Content and chrome localize
   differently (content is voiced; chrome is terse and length-critical).
2. **Key every string.** Give each a stable key (§3). Story beats key by their existing structure
   (e.g. `beat.hospital.leg1.enc2.msg[0]`), chrome by function (`ui.menu.start`).
3. **Externalize to `en` catalog.** Move the strings into a base-language catalog file(s); replace
   inline literals with key lookups via a tiny `t(key)` helper. **The game must play identically
   after this step** (English from the catalog) — that's the checkpoint (mirrors the "never break the
   build" rule from [`PLAN.md`](../production/PLAN.md)).
4. **Only then** are other locales just additional catalogs.

**Determinism is preserved.** Catalogs are static local assets bundled at build — no network, no
runtime fetch (respects PRD NFR-1). Locale is chosen from device/browser language with a manual
override in Options.

> **Expansion v2 · build: PLANNED — the Phase-3 surface roughly doubles.** The Expansion v2 narrative
> pass (`STORY.md` §3/§5/§8 + Changelog — Expansion v2) adds a large block of *new translatable
> content*: **~14 Echo fragments** (2–4 lines each, the 7-face cast), **~30 new Phase-3 node
> onEnter/atmosphere strings** (region sub-stories; Phase 3 text roughly **doubles**, ~35 → ~65
> nodes), the **"unchosen"** strings (City Hall selection/petitions/dissent) with the **evolving Case
> File question** (`why only 143?` → `who did you leave out — and why?`), the **prologue second-act**
> strings (route midpoints, the shelter scene, extra Ellie cracks), and one new Case File category
> label **`ECHOES`**. **Critical-path implication:** externalization (M-LOC0) is *still* the gate, and
> it must land **before** this content is authored into the build. If the ~2× of new Phase-3 text is
> written back into inline literals in `DeadSignal.jsx`, the extraction debt compounds — the milestone-
> zero refactor grows against a moving target. Externalize first, then let the Expansion v2 content
> land as keyed strings from day one. (No code exists for any of this yet; all of it is design-only.)

---

## 3. String architecture

- **Format.** A flat or lightly-nested key→string map per locale (JSON is the pragmatic choice; it
  diffs well and every TMS speaks it). One base `en` catalog is the source of truth translators work
  from.
- **Key schema.** `<domain>.<area>.<id>` — e.g. `story.haven.final.call`, `ui.hud.battery`,
  `casefile.question.kim`, `ending.accept.line3`. Keys are English-descriptive and **never change
  meaning** once shipped (changing a string = new key or a versioned key, so stale translations are
  detectable).
- **Placeholders & format.** Use a message-format standard (**ICU MessageFormat**) for any
  interpolation (resource counts, `[+N Food]`, `143`) and for **plurals** — plural rules differ per
  language (e.g. Slavic languages have 3–4 plural forms; battery "%d%%" is fine but any "N items"
  needs ICU). Keep placeholders named, not positional.
- **Registers as metadata.** Tag each content string with its **voice** (`ellie` / `narrator` /
  `player-choice` / `hud`) so translators keep the register (§5) and so a per-locale style guide can
  target them. **Expansion v2 (build: PLANNED)** adds an **`echo`** voice tag for the recovered
  fragments of the 142 minds — a distinct, terse, mid-thought register that must not be flattened into
  `narrator` (§5.1).
- **What NOT to externalize.** Purely numeric/`·` continuation tokens, internal ids, the `143`
  number itself (it is a number, not a word — §5), and debug strings.

---

## 4. Target languages & tiers

A proposed rollout. Final selection is a business decision (PRD open question) driven by the target
markets and the distribution channel.

| Tier | Languages | Rationale |
| --- | --- | --- |
| **Pilot** | 1 language (suggest **Spanish, es-419** or **French, fr**) | Latin script (no new font), large audience, validates the whole pipeline cheaply |
| **Tier 1** | FR, DE, ES-419, PT-BR, IT | Latin-script, high-ROI Western markets; all covered by the current font |
| **Tier 2** | JA, ZH-Hans, KO, RU | High-value but each adds **script/font work** (CJK, Cyrillic) — see §6 |
| **Tier 3+** | ZH-Hant, PL, TR, others | Demand-driven expansion |

**Sequencing logic:** prove the pipeline on one Latin language, ship Tier 1 (no font changes), then
take on Tier 2 where each language carries extra typographic cost. Interactive-fiction audiences
skew toward EN/JA/ZH/DE/FR/RU, so Tier 2 is where much of the remaining reach is — plan for it, don't
front-load it.

---

## 5. Culturalization & voice

The traps that a straight translation would break. These need **per-locale creative decisions**, not
literal translation.

- **The `143` motif — mostly safe, one nuance.** In-game, **143 is the resident count** (the status
  board, the bunks, the player's held slot). As a *number* it is universal and must stay `143`
  everywhere. The *cultural resonance* — 143 as pager/text shorthand for "I love you" (letter counts
  1-4-3) — is an **English-culture Easter egg**, not load-bearing. Do not try to localize it; just
  ensure no translated line leans on the "love" reading. Document it so translators understand why
  the number is fixed. **Expansion v2 note (build: PLANNED):** the motif now also underpins **Echo /
  roster content** — the 143 is a *count of people* (bunk 143 = Kim's empty refused bunk, the roster
  the architect signed, the evolving `why only 143?` question). Keep it fixed as a number there too;
  the watch-item is unchanged but its footprint grows.
- **`KIM → ELLIE` contact-name flip.** Proper names carry across languages; keep **Kim** and **Ellie**
  as-is (or apply standard transliteration for non-Latin scripts — e.g. キム／エリー in JA). The *beat*
  (the reader noticing the name change) works in any language — protect it by keeping the flip
  visually obvious in every locale. **Expansion v2 note (build: PLANNED):** the flip's meaning now
  extends into Echo/roster content — Kim is deliberately **not** an Echo (the Signal Core "absence
  beat," `STORY.md` §3), while Ellie is the connected voice; the contrast the flip sets up must stay
  legible wherever both names appear across Phase 3.
- **Ellie's lowercase, terse register — the hard one.** Ellie speaks in **all-lowercase** as a
  characterization (diminished, tired, intimate). **Case is an English/Latin device** — CJK scripts
  have no case, so "lowercase" conveys nothing there. Each such language needs an **equivalent
  register** (e.g. in JA: plain/casual form, minimal particles, no honorifics; in general: clipped
  sentences, lowercase where the script supports it, informal register). This is a **style-guide
  deliverable per language**, agreed with the translator, not a mechanical rule.
- **The narrator's centered italic, sparse voice.** Keep the terseness and present-tense immediacy;
  italics render fine cross-script but carry less weight in CJK — pair with the existing centering.
- **Spoiler discipline is a translation constraint.** Translators must preserve the *cracks-not-
  answers* rule (`STORY.md` §4): a line that merely implies must not become a line that states. Ship
  translators the relevant `STORY.md` context under NDA so they translate the subtext correctly.

### 5.1 Expansion v2 culturalization watch-items — build: PLANNED

New traps introduced by the Expansion v2 narrative pass (`STORY.md` §3/§5/§8). Design-only; no code
exists yet. Fold these into the per-language style guide alongside the items above.

- **The child Echo (Theo) — register + content-rating sensitivity.** Theo is a child (~8); his Echo
  is a child processing upload as *"a nap on the bus"* (`STORY.md` §3). Two demands per locale: (1) an
  **age-appropriate child register** — the diction of an ~8-year-old in that language, which is not a
  mechanical translation of the English; and (2) **content-rating sensitivity** — a child facing death
  is handled differently across ratings boards/markets (some locales are stricter about implied harm
  to minors). Flag Theo's fragments for **per-market classification review** before ship; the source
  restraint (short, oblique, never staged for shock — §4) is what keeps it shippable, and translation
  must *preserve* that restraint rather than sharpen it.
- **The terse Echo register — restraint must survive translation.** Echoes are **2–4 lines, found,
  mid-thought — never a scene, never a confession** (`STORY.md` §4: "Echoes crack, they don't
  confess"). The failure mode in translation is **melodrama**: a language's natural instinct to soften,
  explain, or emotionally underline will turn a fragment into a speech. **Restraint is canon** — the
  child (Theo) and the regretter (Priya) are the hardest lines in the game *because they are the
  shortest*. Give translators an explicit brief: match the clipped length, keep the ambiguity, do not
  add connective/emotional scaffolding. Treat this as a **new voice tag** (`echo`, §3) with its own
  style-guide entry, distinct from `narrator`.
- **The "unchosen / who did you leave out" moral framing.** The Expansion v2 spine (`STORY.md` §2, the
  unchosen) turns on a moral accusation — *you signed who wasn't saved* — carried by City Hall's
  selection/petitions/dissent, Marcus's Echo, and the evolving question `why only 143?` →
  `who did you leave out — and why?`. The framing is **accusatory-but-restrained**, second-person, and
  must not tip into either sermon or melodrama in any locale. The pivot from **quantity** ("only 143")
  to **culpability** ("who did *you* leave out") is the load-bearing shift — protect the second-person
  "you" and the shift itself; some languages will need a deliberate choice of address/formality to keep
  the accusation personal (see the Ellie register note on informality above).
- **Character names — consistency across locales (build: PLANNED).** Expansion v2 adds a named cast
  that recurs across many strings (Echoes, roster, City Hall, Case File `PEOPLE`). **Lock a single
  rendering per name per locale** to avoid drift: **Theo · Rosa · Walt · Priya · Marcus · Dr. Lena
  Sorkin · June · Kim · Ellie**. Latin-script locales keep them as-is; non-Latin scripts apply a
  **fixed, agreed transliteration** (as with キム／エリー for Kim/Ellie) recorded in a per-locale name
  glossary so the *same* character reads identically everywhere. Watch **Dr. Lena Sorkin** specifically:
  keep the honorific/title handling consistent (title order and abbreviation of "Dr." differ per
  language), and keep first/last-name usage matching how the source deploys it.

---

## 6. Typography & script coverage

- **Current font: `IBM Plex Mono`** (Google Fonts, weights 300/400), fallback `'Courier New',
  monospace`. IBM Plex Mono covers **Latin, Greek, and Cyrillic** — so **Tier 1 + Russian** are
  typographically ready.
- **CJK is the gap.** IBM Plex Mono has **no CJK glyphs**. Japanese/Chinese/Korean need a different
  face — IBM ships **IBM Plex Sans JP/KR/TC/SC** (keeps the brand family) or fall back to **Noto Sans
  Mono CJK**. Note CJK "monospace" is really *duospace* (full-width glyphs) — the terminal grid look
  will shift; validate the aesthetic per script (Art Bible §4 is Latin-specific).
- **Font loading & offline.** The current `@import` pulls the font from Google Fonts at runtime. For
  determinism/offline (PRD NFR-1) and for large CJK faces, **self-host and subset** the fonts and
  bundle them; lazy-load the CJK face only for CJK locales to keep the bundle small.
- **RTL (Arabic/Hebrew).** Out of initial scope, but if ever added: the phone-native layout, HUD
  corner anchoring, and choice alignment all need a `dir="rtl"` pass. Flag as a larger effort.

---

## 7. UI constraints on a phone

Text games live or die on **string length** in a narrow column.

- **Choice buttons** are capped (`MAX_VISIBLE_CHOICES = 4`, `HARD_CHOICE_CAP = 5`) and sit in a
  fixed-width pane. German/French/Russian commonly run **+30–40%** longer than English — choices must
  wrap gracefully or the translator must have a **length budget** per key.
- **HUD registers** (`BATTERY`, `CHARGER`, `FOOD`, `WATER`, `HP`, `NOISE`, risk tags) are tight,
  uppercase, corner-anchored. Prefer **abbreviations/icons** that don't balloon; give translators the
  pixel budget, not just the word.
- **Message bubbles** reflow, so story text is more forgiving — but very long compound words (DE) and
  no-space scripts (JA/ZH line-breaking) need CSS `word-break`/`overflow-wrap` and CJK line-break
  rules tested.
- **Pseudo-localization** (§9) is how we catch all of this before a single real translation.

---

## 8. Pipeline & tooling

- **Catalog in repo** (`/locales/<lang>.json`), `en` as source of truth; bundled at build (no
  runtime fetch).
- **TMS/handoff.** Any JSON-native TMS (Crowdin, Lokalise, Weblate, or a lightweight PR-based flow
  for a solo dev). Ship translators the **key + English + voice tag + length budget + context note**
  (screenshot or `STORY.md` reference).
- **Pseudo-loc build.** A generated `en-XA`-style catalog that pads length (+40%), adds accents, and
  brackets strings — run the whole game in it to surface truncation, concatenation, and hardcoded-
  string leaks **before** paying for translation.
- **ICU** for plurals/interpolation; a lint that fails the build on a missing key or a placeholder
  mismatch between `en` and a target.
- **Locale selection.** Auto-detect from `navigator.language`; manual override persisted in Options
  (alongside volume/mute), using the same `window.storage` persistence.

---

## 9. QA & LQA

- **Pseudo-loc pass** (pre-translation): no truncation, no clipped choices, no concatenation bugs, no
  missed strings.
- **Linguistic QA in context:** play each language through the prologue on a real phone screen —
  register consistency (Ellie stays terse/informal), spoiler discipline intact, no overflow.
- **Script rendering:** CJK line-breaking, diacritic clipping, font-fallback boxes (reuse the
  null/glyph discipline from the doc pipeline), RTL mirroring if in scope.
- **Plurals & numbers:** verify ICU plural forms and that `143` and resource counts render correctly
  in every locale.
- **Regression:** the base `en`-from-catalog build must remain byte-identical in behavior to the
  pre-externalization build (the milestone-zero checkpoint).

---

## 10. Effort & sequencing

```
M-LOC0  Externalize strings (en catalog + t() lookup)   ← the whole gate; en plays identically
   │
M-LOC1  Pseudo-loc pass + fix overflow/leaks
   │
M-LOC2  Pilot language (1, Latin) — full pipeline proof + LQA
   │
M-LOC3  Tier 1 (FR/DE/ES-419/PT-BR/IT) — no font work
   │
M-LOC4  Tier 2 (JA/ZH/KO/RU) — self-host + subset fonts, CJK face, per-script style guides
```

Externalization (M-LOC0) is the large, one-time engineering cost. Everything after it is
per-language content + LQA. Localization can land **post-launch** without blocking release (PRD §8).

> **Expansion v2 · build: PLANNED — budget impact.** The Expansion v2 pass roughly **doubles the
> Phase-3 translatable word count** (Echoes + ~30 new node strings + the unchosen; §2). Every
> per-language line (M-LOC2 onward) scales with word count, so **each locale's translation + LQA cost
> for Phase 3 grows by ~2×** versus the pre-expansion estimate. M-LOC0 itself does not get 2× harder if
> it lands *first* (it externalizes today's surface once), but it **does** balloon if the new content
> is authored inline before extraction — reinforcing the sequencing above. Re-baseline the per-language
> effort figures against the ~65-node Phase 3 once the Expansion v2 strings are authored.

---

## 11. Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Externalization drifts / never happens | Loc permanently blocked | Treat M-LOC0 as a standalone refactor with its own checkpoint; do it before the surface grows |
| Register/voice lost in translation | Ellie stops feeling like Ellie | Voice tags per string + per-language style guide + LQA |
| Spoiler leak via translation | Breaks the mystery | Translators get `STORY.md` context under NDA; spoiler check in LQA |
| Phone-UI overflow (DE/RU/CJK) | Clipped choices/HUD | Pseudo-loc first; length budgets per key |
| CJK font cost/aesthetic shift | Bundle bloat, look breaks | Self-host + subset; lazy-load CJK; validate the terminal look per script |
| Google-Fonts runtime import | Breaks offline determinism | Self-host fonts as part of M-LOC0/M-LOC4 |
| Expansion v2 content authored inline (build: PLANNED) | Externalization debt compounds; per-language cost balloons | Land M-LOC0 before the ~2× Phase-3 content; author Echoes/new nodes/unchosen as keyed strings from day one (§2, §10) |
| Echo restraint lost in translation (build: PLANNED) | Terse fragments become melodrama; child Echo mis-registered | `echo` voice tag + per-language brief on clipped length/ambiguity; Theo flagged for per-market content-rating review (§5.1) |

---

## 12. Appendix

### 12.1 Glossary
- **Externalization** — moving strings out of code into locale catalogs; the loc critical path.
- **Culturalization** — adapting meaning/register, not just words (the `143`, lowercase-Ellie cases).
- **Pseudo-loc** — a fake locale that stress-tests length/encoding before real translation.
- **ICU MessageFormat** — the standard for plurals/interpolation across languages.
- **Voice tag** — per-string metadata (`ellie`/`narrator`/`hud`/`echo`) that preserves register.
- **Echo** (Expansion v2, build: PLANNED) — a recovered 2–4-line fragment of one of the 142 uploaded
  minds (`STORY.md` §3); its own terse `echo` voice tag, restraint-critical in translation.
- **The unchosen** (Expansion v2, build: PLANNED) — the moral thread (*who did you leave out?*, §5.1);
  a second-person, accusatory-but-restrained register to preserve per locale.

### 12.2 Related documents
- Requirements: [PRD §7.2 NFR-6](../product/PRD.md), [PRD §12 open questions](../product/PRD.md)
- Where the strings live: [Technical Design §3 / §12](../technical/DESIGN.md)
- Voice & canon: [`STORY.md`](../narrative/STORY.md) §3–§4 · [Art Bible §4 typography](../art/ART.md)
- Accessibility (font-size/readability overlap): [Accessibility Plan](../accessibility/ACCESSIBILITY.md)

### 12.3 Change log
| Version | Date | Notes |
| --- | --- | --- |
| 1.0 | 2026-07-06 | First localization plan. Grounded in the real (hardcoded) string surface + the IBM Plex Mono font reality. |
| 1.1 | 2026-07-06 | Expansion v2 (build: PLANNED, docs-only): flagged the ~2× Phase-3 string growth (Echoes + ~30 new nodes + the unchosen) and its budget/critical-path impact (§2, §10); added §5.1 culturalization watch-items (child Echo/Theo register + content-rating, terse-Echo restraint, the "unchosen" framing) and a locked cast name list; added the `echo` voice tag (§3) and two Expansion v2 risk rows (§11). No canon changed; `STORY.md` remains source of truth. |

*End of document.*
