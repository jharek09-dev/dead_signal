# Dead Signal

A text-message survival mystery. You wake in an outbreak-stricken city with no memory, and
your only contact is **Ellie** — a stranger texting you toward a broadcast signal called
*Haven*. Every exchange is hand-authored, deterministic content (scripted story beats +
location-aware atmosphere) — no AI, no API. You manage resources, pick branching routes,
survive encounters, and recover fragments of who you are — piecing them into an
investigation as the truth slowly cracks open.

The entire game is a single React component: [`src/DeadSignal.jsx`](src/DeadSignal.jsx).

## How it plays

- **A three-day crossing.** Wake and make contact, cross the city toward Haven along one of
  three routes (hospital, metro, or highway) — sheltering for the night — then reach Haven.
  Each day closes on a quiet resolution beat.
- **Survival economy.** The phone drains battery every beat; food, water, HP, and a noise
  meter all matter. A portable charger is a rechargeable reserve you refill at power sources
  you search out.
- **Branching + encounters.** Your route and your choices change which beats, hazards, and
  loot you hit. Pacing runs off an invisible route map, not an AI.
- **An investigation that builds.** Recovered **memory fragments** (9) and **clues** (3) feed
  a persistent **Case File** — a detective board of people, locations, known facts, and open
  questions that surface as you uncover them. Open it any time from the in-game **FILE**
  button.
- **Save profiles.** Three slots, each its own profile: mid-run save and resume, plus
  playthroughs and collected fragments/clues that accumulate across runs toward **100%**.
- **Presentation.** A **Story** lore page and an **Options** screen (volume slider + mute) off the
  main menu; an in-game pause that **freezes the dialogue** and resumes mid-beat; procedural audio
  (message blips, resource stings, a rare Signal-distortion artifact); and it's an **installable PWA**.

## Tech stack

- React 18 + Vite

## Getting started

```bash
npm install
npm run dev
```

Open the URL Vite prints (default http://localhost:5173). No configuration or API keys are
required — the game runs entirely on local content.

### Persistence

The game stores its three save profiles (and your accumulated progress) between runs. In the
Claude sandbox this uses `window.storage`; running standalone, [`src/main.jsx`](src/main.jsx)
shims that API onto `localStorage`, so persistence works either way.

## Scripts

| Command           | What it does                          |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Start the Vite dev server             |
| `npm run build`   | Production build to `dist/`           |
| `npm run preview` | Serve the production build locally    |
| `npm run icons`   | Regenerate the PWA icons from `public/icon.svg` |

## Project structure

```
.
├── index.html            # Vite entry HTML (PWA meta)
├── vite.config.js        # Vite config
├── package.json
├── prd.md                # Product status — what's built / what's next
├── STORY.md              # Story bible / canon (⚠ spoilers)
├── PLAN.md               # AI-removal + battery-economy roadmap (historical, complete)
├── public/               # PWA assets — icons + manifest.webmanifest
├── scripts/
│   └── gen-icons.mjs     # Regenerates the PWA icons from icon.svg
├── .github/workflows/    # GitHub Pages deploy
├── src/
│   ├── main.jsx          # Mounts the app; storage shim
│   ├── audio.js          # Procedural audio engine (Tone.js)
│   └── DeadSignal.jsx    # The entire game
└── backup/               # Local dev backups (gitignored)
```

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE).
