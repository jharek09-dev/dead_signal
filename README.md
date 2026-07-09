# Dead Signal

Dead Signal is a deterministic text-message survival mystery. You wake in Harwick with no memory,
a dying phone, and a contact saved as **KIM**. The voice on the other end says there is a way out:
follow a shortwave broadcast toward **Haven**, keep the line alive, and find out why your own past
keeps showing up in the evidence.

Every exchange is hand-authored. There are no AI calls, no API keys, and no network-dependent story
generation: the game runs from scripted story beats, route-aware atmosphere, encounters, timers,
and persistent save data.

The entire game lives in a single React component: [`src/DeadSignal.jsx`](src/DeadSignal.jsx).

## How it plays

- **Opening crossing.** The first act takes you from a locked apartment across Harwick by one of
  three routes: Mercy General, the Metro tunnels, or Route 9. Battery, food, water, HP, noise, and
  a rechargeable charger all matter.
- **Haven investigation.** Reaching Haven opens the larger mystery: a hub-and-spoke investigation
  across the compound and the city beyond it. Regions unlock as evidence turns into leads.
- **Case File.** Memory fragments, route clues, people, locations, known facts, open questions,
  and uncovered truths persist in a detective-board style Case File. Question cards surface in chat
  when the story gives you something new to worry about.
- **Branching pressure.** Route choice, search choices, encounters, supplies, and noise change what
  happens along the way. The game is local and deterministic, but a run can still go very wrong.
- **Phone-native presentation.** Human-paced Ellie texts, intent-coded choices, a pausable dialogue
  queue, accurate location labels, procedural audio, save slots, and an installable PWA shell support
  the text-message feel.
- **Endings.** The investigation leads to a final choice with two definitive endings. Public copy
  stays spoiler-safe; the full canon lives in [`STORY.md`](docs/narrative/STORY.md).

## Current status

- Full prologue, Haven handoff, Phase 3 investigation, finale, and endings are implemented.
- GitHub Pages deployment is configured through `.github/workflows/deploy.yml`.
- The project is still evolving through polish passes: dialogue pacing, HUD layout, story continuity,
  save/load behavior, and presentation cleanup.
- A **narrative-depth expansion is in design** — deeper regions, a richer investigation layer, and a
  longer opening — specified in the docs and not yet in the build.

## Tech stack

- React 18
- Vite
- Tone.js for procedural audio

## Getting started

```bash
npm install
npm run dev
```

Open the URL Vite prints, usually `http://localhost:5173`.

No configuration or API keys are required.

### Persistence

The game stores three save profiles plus accumulated progress between runs. In the Claude sandbox
this uses `window.storage`; when running standalone, [`src/main.jsx`](src/main.jsx) shims that API
onto `localStorage`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run icons` | Regenerate PWA icons from `public/icon.svg` |

## Project structure

```text
.
|-- index.html                 # Vite entry HTML and PWA meta
|-- vite.config.js             # Vite config
|-- package.json
|-- docs/                      # All documentation — GDD, PRD, DESIGN, Production, Audio, Art,
|                              #   the STORY.md canon (docs/narrative/), exports. See docs/README.md
|-- public/                    # PWA assets, icons, manifest
|-- scripts/
|   `-- gen-icons.mjs          # Regenerates PWA icons from icon.svg
|-- .github/workflows/         # GitHub Pages deploy workflow
`-- src/
    |-- main.jsx               # App mount and storage shim
    |-- audio.js               # Procedural audio engine
    `-- DeadSignal.jsx         # The game
```

## Documentation

The full design, product, and engineering documentation lives in **[`docs/`](docs/README.md)**:

- [Game Design Document](docs/design/GDD.md) — how it plays
- [Product Requirements](docs/product/PRD.md) — what we're building and why
- [Technical Design](docs/technical/DESIGN.md) — how it's built
- [Documentation hub](docs/README.md) — the index of everything (incl. planned Production, Audio,
  Art, Localization, and Accessibility docs)

[`STORY.md`](docs/narrative/STORY.md) contains major spoilers and is the internal canon source. The
README and in-game Story page stay spoiler-safe on purpose.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
