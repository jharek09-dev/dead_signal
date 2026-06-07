// ─── Dead Signal — procedural audio engine (Tone.js) ──────────────────────────
// A module-scope singleton. All nodes are built ONCE on first unlock and reused;
// the game just calls named methods. Everything is purely additive — if audio is
// muted or not yet unlocked, every method is a safe no-op.
//
// Scope: short UI/feedback one-shots only (clicks, message blip, resource stings)
// plus a quiet resolve tone when a run is completed. There is intentionally NO
// looping background ambience.
//
// Browser autoplay policy blocks sound until a user gesture, so nothing is built
// until unlock() runs from the first pointerdown/keydown.

import * as Tone from "tone";

const MASTER_DB = -4; // overall headroom; one-shots are mixed below this (the -2 limiter catches peaks)

let unlocked = false;
let muted    = false;
let nodes    = null;   // populated by build()

function build() {
  if (nodes) return;

  // Master chain: master gain → limiter → destination.
  const master  = new Tone.Gain(Tone.dbToGain(MASTER_DB));
  const limiter = new Tone.Limiter(-2);
  master.connect(limiter);
  limiter.toDestination();

  // A little reverb tail for the completion resolve chord.
  const reverb = new Tone.Reverb({ decay: 6, preDelay: 0.04, wet: 0.45 });
  reverb.connect(master);

  // ── One-shot voices (UI clicks, blip, resource stings). Each is built once
  //    and retriggered. They route to master so mute silences them too. ───────
  const mk = (opts, db) => {
    const s = new Tone.Synth(opts);
    s.volume.value = db;
    s.connect(master);
    return s;
  };
  const tapResp = mk({ oscillator: { type: "triangle" }, envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.07 } }, -9);
  const tapMenu = mk({ oscillator: { type: "sine" },     envelope: { attack: 0.002, decay: 0.15, sustain: 0, release: 0.10 } }, -9);
  const blip    = mk({ oscillator: { type: "sine" },     envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.04 } }, -24);
  const sting   = mk({ oscillator: { type: "triangle" }, envelope: { attack: 0.002, decay: 0.18, sustain: 0, release: 0.12 } }, -12);
  // Soft chord voice for the "complete" resolve tone.
  const resolve = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "sine" }, envelope: { attack: 0.4, decay: 1.2, sustain: 0.2, release: 3.5 } });
  resolve.volume.value = -13;
  resolve.connect(reverb); resolve.connect(master);

  nodes = { master, reverb, tapResp, tapMenu, blip, sting, resolve };
}

const audioEngine = {
  async unlock() {
    if (unlocked) return;
    try {
      // Do NOT set navigator.audioSession.type = "playback": that keeps audio playing while
      // the tab is backgrounded (it leaks out of the tab and leaves the context in a stuck
      // state on return). Safari's default session is browser-only — it suspends on
      // background and resumes on return, which is exactly what we want.
      await Tone.start();
      // iOS is finicky: confirm the context actually resumed; retry resume if not.
      let state;
      try {
        const c = Tone.getContext();
        state = c.state;
        if (state !== "running" && typeof c.resume === "function") { await c.resume(); state = c.state; }
      } catch (e) { state = undefined; }
      // If the context is readable AND still not running, bail WITHOUT marking unlocked
      // so the next user gesture (touchend/click) retries. If unreadable, proceed.
      if (state && state !== "running") return;
      build();
      unlocked = true;
      // Apply whatever mute state was restored before the first gesture.
      nodes.master.gain.rampTo(muted ? 0 : Tone.dbToGain(MASTER_DB), 0.1);
    } catch (e) { /* leave unlocked false; methods stay no-ops */ }
  },

  isUnlocked() { return unlocked; },

  // Diagnostic snapshot for the on-screen ?debug overlay.
  status() {
    let state = "n/a";
    try { state = Tone.getContext().state; } catch (e) {}
    return { unlocked, muted, state, hasNodes: !!nodes };
  },

  setMuted(m) {
    muted = !!m;
    if (!unlocked) return;
    nodes.master.gain.rampTo(muted ? 0 : Tone.dbToGain(MASTER_DB), 0.12);
  },

  // Resume the (single) context after the tab is backgrounded. Called on return-to-foreground
  // and on the next tap; iOS reliably resumes a plain-suspended context within a user gesture.
  resume() {
    if (!unlocked) return;
    try {
      const ctx = Tone.getContext();
      if (ctx.state !== "running" && typeof ctx.resume === "function") ctx.resume();
    } catch (e) {}
  },

  // ── One-shots ──────────────────────────────────────────────────────────────
  tapResponse() { if (unlocked && !muted) try { nodes.tapResp.triggerAttackRelease("C5", 0.10); } catch (e) {} },
  tapMenu()     { if (unlocked && !muted) try { nodes.tapMenu.triggerAttackRelease("A5", 0.12); } catch (e) {} },
  blip()        { if (unlocked && !muted) try { nodes.blip.triggerAttackRelease("E6", 0.04); } catch (e) {} },
  gain() {
    if (!unlocked || muted) return;
    const t = Tone.now();
    try { nodes.sting.triggerAttackRelease("A4", 0.10, t); nodes.sting.triggerAttackRelease("E5", 0.12, t + 0.09); } catch (e) {}
  },
  loss() {
    if (!unlocked || muted) return;
    try { nodes.sting.triggerAttackRelease("C4", 0.22); } catch (e) {}
  },

  // ── Terminal-screen audio ────────────────────────────────────────────────
  // Only completion has a sound now (a quiet consonant resolve); offline/dead
  // are silent since there is no longer a background bed to cut or decay.
  terminal(kind) {
    if (!unlocked || muted) return;
    if (kind === "complete") {
      try { nodes.resolve.triggerAttackRelease(["C4", "E4", "G4", "B4"], 4); } catch (e) {}
    }
  },
};

export default audioEngine;
