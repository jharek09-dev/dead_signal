# Dead Signal

A text-message survival narrative. You wake with no memory in an outbreak-stricken
city, and your only contact is **Ellie** — a stranger texting you toward a broadcast
signal called *Haven*. Every exchange is hand-authored, deterministic content: scripted
story beats and location-aware atmosphere drive the conversation — no AI, no API. Along
the way you manage resources (battery, water, food, HP, noise), pick branching paths,
survive random encounters, and recover memories that persist across runs.

The entire game is a single React component: [`src/DeadSignal.jsx`](src/DeadSignal.jsx).

## How it plays

- **Three days.** Day 1 — wake in the apartment and make contact. Day 2 — cross the city
  toward Haven along one of three routes (hospital, metro, or highway), then shelter for
  the night. Day 3 — the approach and the Haven finale. Each day closes on a quiet
  resolution beat.
- **Survival economy.** The phone drains 1% battery per beat; food, water, HP, and a
  noise meter all matter. A portable charger is a rechargeable reserve you bleed into the
  phone, refilled at power sources you search out — with a guaranteed top-up at Haven.
- **Branching + encounters.** Your route and your choices change which beats, hazards, and
  loot you hit. Pacing is driven by an invisible route map, not by an AI.
- **Memories that persist.** Recover up to **9 memory fragments** and **3 clues** about who
  you are; they carry across runs.
- **Three save slots** with mid-run save and resume.

## Tech stack

- React 18 + Vite

## Getting started

```bash
npm install
npm run dev
```

Open the URL Vite prints (default http://localhost:5173). No configuration or API
keys are required — the game runs entirely on local content.

### Persistence

The game persists your three save slots and recovered memories between runs. In the
Claude sandbox this uses `window.storage`; running standalone, [`src/main.jsx`](src/main.jsx)
shims that API onto `localStorage`, so persistence works either way.

## Scripts

| Command           | What it does                          |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Start the Vite dev server             |
| `npm run build`   | Production build to `dist/`           |
| `npm run preview` | Serve the production build locally    |

## Project structure

```
.
├── index.html            # Vite entry HTML
├── vite.config.js        # Vite config
├── package.json
├── PLAN.md               # Rehaul roadmap (AI removal + battery economy)
├── src/
│   ├── main.jsx          # Mounts the app; storage shim
│   └── DeadSignal.jsx    # The entire game
└── backup/               # Local dev backups (gitignored)
```

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE).
