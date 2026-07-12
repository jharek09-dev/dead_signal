// ─── Dead Signal — browserless accessibility harness (M-A11Y) ────────────────────────────────
// QA.md §6.8. There is no browser in the QA sandbox, but the accessibility surface is DOM, not
// pixels — so we can render the real component into jsdom, drive it to the chat, the Case File and
// the Options screen, and assert on the actual accessibility tree. That covers the things a human
// tester reliably misses (an unnamed button, a live region that re-reads its backlog, a glyph read
// aloud as punctuation) and leaves the on-device gates — VoiceOver, NVDA, TalkBack — to do what only
// they can: judge whether the result is pleasant to listen to.
//
//   node scripts/qa/qa-a11y.mjs
//
// Requires devDependency `jsdom`; esbuild comes along with vite. Exit code 0 = clean.

import { build } from "esbuild";
import { JSDOM } from "jsdom";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// ── 1. bundle the component for node ─────────────────────────────────────────────────────────
const out = mkdtempSync(join(tmpdir(), "ds-a11y-"));
const bundle = join(out, "bundle.mjs");
await build({
  stdin: {
    contents: `
      import React from "react";
      import { createRoot } from "react-dom/client";
      import { act } from "react-dom/test-utils";
      import DeadSignal from "./src/DeadSignal.jsx";
      export { React, createRoot, act, DeadSignal };`,
    resolveDir: process.cwd(),
    loader: "jsx",
    sourcefile: "a11y-entry.jsx",
  },
  bundle: true, format: "esm", platform: "node", jsx: "automatic",
  define: { "import.meta.env": '{"DEV":false,"PROD":true,"BASE_URL":"/"}' },
  outfile: bundle, logLevel: "error",
});

// ── 2. a DOM to render into ──────────────────────────────────────────────────────────────────
const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>",
  { pretendToBeVisual: true, url: "http://localhost/" });
const { window } = dom;
window.localStorage.setItem("ds_instant", "1"); // collapse the pacing timers — read at module load
const store = new Map();
window.storage = {                              // the game's persistence API (main.jsx shims it too)
  get: async (k) => (store.has(k) ? { value: store.get(k) } : null),
  set: async (k, v) => { store.set(k, v); },
  delete: async (k) => { store.delete(k); },
};
window.HTMLElement.prototype.scrollIntoView = () => {};  // not implemented by jsdom
window.HTMLElement.prototype.scrollTo = () => {};
for (const k of ["window", "document", "HTMLElement", "Element", "Node", "getComputedStyle",
                 "localStorage", "requestAnimationFrame", "cancelAnimationFrame", "MutationObserver", "MouseEvent"])
  Object.defineProperty(globalThis, k, { value: window[k], configurable: true, writable: true });
Object.defineProperty(globalThis, "navigator", { value: window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const { React, createRoot, act, DeadSignal } = await import(`file://${bundle}`);
const D = window.document;
const q = (s) => [...D.querySelectorAll(s)];
const tick = async (ms = 100) => { await act(async () => { await new Promise((r) => setTimeout(r, ms)); }); };

let fails = 0;
const chk = (ok, msg, extra = "") => {
  console.log((ok ? "  ✓ " : "  ✗ ") + msg + (ok || !extra ? "" : `  — ${extra}`));
  if (!ok) fails++;
};
// A control is "named" if AT can announce it: an aria-label, or visible text that isn't aria-hidden.
const named = (b) => (b.getAttribute("aria-label") || "").trim() ||
  [...b.childNodes].filter((n) => n.getAttribute?.("aria-hidden") !== "true")
    .map((n) => n.textContent || "").join("").trim();
const byLabel = (l) => q("button").find((b) => (b.getAttribute("aria-label") || "").toLowerCase() === l);

// ── 3. drive it to the chat ──────────────────────────────────────────────────────────────────
const root = createRoot(D.getElementById("root"));
await act(async () => { root.render(React.createElement(DeadSignal, { edition: "day1Demo" })); });
await tick(150);
for (let i = 0; i < 8 && !D.querySelector("[role=log]"); i++) {
  const btn = D.querySelector("button");
  if (btn) await act(async () => { btn.click(); });
  else await act(async () => { (D.querySelector("#root > div") || D.body).dispatchEvent(new window.MouseEvent("click", { bubbles: true })); });
  await tick(200);
}
await tick(500);
if (!D.querySelector("[role=log]")) { console.error("could not reach the chat screen — harness broken, not the game"); process.exit(2); }

// ── 4. the chat ──────────────────────────────────────────────────────────────────────────────
console.log("\n§9 — live regions");
const log = D.querySelector("[role=log]");
chk(!!log, "the transcript is a role=log live region");
chk(log.getAttribute("aria-live") === "polite", "polite — it queues behind the line being read, never cuts it off");
chk(log.getAttribute("aria-relevant") === "additions", "additions only — the backlog is never re-read on re-render or save-restore");
chk(!!log.getAttribute("aria-label"), "the transcript has an accessible name");
chk(q("[role=status].ds-sr").length >= 1, "the HUD announcer exists, off-screen");
chk(q("[role=log] [role=status]").length === 0, "the announcer sits OUTSIDE the log — a resource tick can't interleave with a line");
chk(q("[role=alert]").length <= 1, "role=alert stays reserved for the one thing that can end the run");

console.log("\n§9 — every control is named");
const unnamed = q("button").filter((b) => !named(b));
chk(unnamed.length === 0, `all ${q("button").length} controls on the chat screen are named`,
  unnamed.map((b) => b.outerHTML.slice(0, 60)).join(" | "));

console.log("\n§9 — nothing focusable is hidden from AT");
const hiddenFocusable = q("[aria-hidden=true]")
  .flatMap((e) => [...e.querySelectorAll("button,a,input,[tabindex]")].concat(e.matches("button,a,input") ? [e] : []));
chk(hiddenFocusable.length === 0, "no aria-hidden subtree contains a focusable control", hiddenFocusable.map((e) => e.tagName).join(","));

console.log("\n§9 — the HUD speaks meaning, not glyphs");
const labels = q("[aria-label]").map((e) => e.getAttribute("aria-label"));
chk(labels.some((l) => /^battery \d+ percent$/.test(l)), "battery reads \"battery N percent\", not \"34%\"");
chk(labels.some((l) => /^health \d+ of 10/.test(l)), "health reads \"health N of 10\"");
chk(q(".ds-sr").some((e) => /signal/i.test(e.textContent)), "the signal bars have a spoken equivalent");
chk(q("[role=group][aria-label=status]").length === 1, "the HUD is a named status group");

console.log("\n§9 — landmarks");
chk(q("main").length === 1, "one main landmark");
chk(q("nav[aria-label]").length === 1, "the action bar is a named nav landmark");

console.log("\n§3/§5 — the stage-1 option set still stands");
const css = q("style").map((s) => s.textContent).join("");
chk(css.includes("--ds-dim"), "the contrast tokens are defined at :root");
chk(css.includes(".ds-sr"), "the visually-hidden utility ships on every screen");

// ── 5. the Case File ─────────────────────────────────────────────────────────────────────────
await act(async () => { byLabel("case file")?.click(); });
await tick(150);
console.log("\n§9 — the Case File");
chk(q("[role=heading]").length >= 1, "the board announces its heading");
const secs = q("button[aria-expanded]");
chk(secs.length > 0, `board sections are real expanders (${secs.length})`);
chk(secs.every((b) => named(b)), "every section is named with its label and count, not a chevron");
if (secs[0]) {
  const before = secs[0].getAttribute("aria-expanded");
  await act(async () => { secs[0].click(); });
  await tick(80);
  chk(q("button[aria-expanded]")[0].getAttribute("aria-expanded") !== before, "opening a section flips aria-expanded");
}
const locked = q("[aria-label*='locked']");
chk(locked.every((e) => /not found yet/.test(e.getAttribute("aria-label"))), `locked rows say what they mean, not "———" (${locked.length})`);
chk(q("button").every(named), "no unnamed control on the board");

// ── 6. Options — the stage-1 controls under AT ───────────────────────────────────────────────
await act(async () => { q("button").find((b) => /BACK/i.test(b.textContent || ""))?.click(); });
await tick(120);
await act(async () => { byLabel("menu")?.click(); });
await tick(80);
await act(async () => { q("button").find((b) => /^Options$/i.test((b.textContent || "").trim()))?.click(); });
await tick(150);

console.log("\n§11 — the accessibility options under AT");
const pressed = q("button[aria-pressed]");
chk(pressed.length >= 10, `every a11y control exposes its state (${pressed.length} aria-pressed)`);
chk(q("[role=group][aria-labelledby]").length >= 2, "text speed and text size are labelled groups");
const speeds = pressed.filter((b) => /^text speed/.test(b.getAttribute("aria-label") || ""));
chk(speeds.length === 4, "four text-speed options");
chk(speeds.filter((b) => b.getAttribute("aria-pressed") === "true").length === 1, "exactly one speed reads as current");
const hc = pressed.find((b) => b.getAttribute("aria-label") === "high contrast");
chk(!!hc, "high contrast is a named toggle");
if (hc) {
  const was = hc.getAttribute("aria-pressed");
  await act(async () => { hc.click(); });
  await tick(80);
  const now = q("button[aria-pressed]").find((b) => b.getAttribute("aria-label") === "high contrast").getAttribute("aria-pressed");
  chk(was !== now, "toggling it flips aria-pressed");
  // …and does the actual work: the token is repainted on <html>, which is what lifts the sub-AA greys.
  chk(D.documentElement.style.getPropertyValue("--ds-dim") === "#a6a6a6",
    "…and repaints the contrast token on <html>", D.documentElement.style.getPropertyValue("--ds-dim") || "(unset)");
}
chk(q("button").every(named), "no unnamed control on the Options screen");

rmSync(out, { recursive: true, force: true });
console.log(fails
  ? `\n✗ ${fails} accessibility check${fails === 1 ? "" : "s"} failed`
  : "\n✅ all accessibility checks pass — on-device AT (VoiceOver / NVDA / TalkBack) still required");
process.exit(fails ? 1 : 0);
