# Dead Signal

A text-message survival narrative. You wake with no memory in an outbreak-stricken
city and your only contact is **Ellie**, a stranger texting you toward a broadcast
signal called *Haven*. Scripted story beats are interleaved with live, AI-driven
exchanges (via the Anthropic Messages API), resource management (battery, water,
food, HP, noise), branching paths, random encounters, and recovered memory
fragments that persist across runs.

The entire game is a single React component: [`src/DeadSignal.jsx`](src/DeadSignal.jsx).

## Tech stack

- React 18 + Vite
- Anthropic Messages API for Ellie's dynamic dialogue

## Getting started

```bash
npm install
cp .env.example .env   # then add your Anthropic API key
npm run dev
```

Open the URL Vite prints (default http://localhost:5173).

### The AI backend

Ellie's live dialogue calls the Anthropic Messages API. A browser must never hold
your API key, so local dev routes requests through a Vite proxy that injects the
key server-side:

1. Put your key in `.env` as `ANTHROPIC_API_KEY`.
2. Keep `VITE_API_URL=/api/messages` (already in `.env.example`).

With those set, the game calls the same-origin `/api/messages`, and
[`vite.config.js`](vite.config.js) forwards it to `https://api.anthropic.com/v1/messages`
with the key and `anthropic-version` header attached.

If `VITE_API_URL` is unset, the game falls back to calling `api.anthropic.com`
directly from the browser — this only works inside the Claude artifact sandbox
(where an upstream proxy supplies auth), not in a standalone deployment.

> **Deploying publicly?** The Vite proxy is a dev-only convenience. For a hosted
> build you'll need your own small backend (serverless function, edge worker, etc.)
> that holds the key and exposes a `/api/messages` endpoint, then set `VITE_API_URL`
> to point at it.

### Memory persistence

The game saves recovered memory fragments between runs. In the Claude sandbox this
uses `window.storage`; running standalone, [`src/main.jsx`](src/main.jsx) shims that
API onto `localStorage`, so persistence works either way.

## Scripts

| Command           | What it does                          |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Start the Vite dev server (with proxy) |
| `npm run build`   | Production build to `dist/`           |
| `npm run preview` | Serve the production build locally    |

## Project structure

```
.
├── index.html            # Vite entry HTML
├── vite.config.js        # Vite config + dev API proxy
├── package.json
├── .env.example          # Template for ANTHROPIC_API_KEY / VITE_API_URL
├── src/
│   ├── main.jsx          # Mounts the app; storage shim + API URL wiring
│   └── DeadSignal.jsx    # The entire game
└── backup/               # Local dev backups (gitignored)
```

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE).
