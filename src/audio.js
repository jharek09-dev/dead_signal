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

const MASTER_DB = -8; // overall headroom; one-shots are mixed well below this

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
  const tapResp = mk({ oscillator: { type: "triangle" }, envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.06 } }, -20);
  const tapMenu = mk({ oscillator: { type: "sine" },     envelope: { attack: 0.002, decay: 0.14, sustain: 0, release: 0.10 } }, -18);
  const blip    = mk({ oscillator: { type: "sine" },     envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.04 } }, -30);
  const sting   = mk({ oscillator: { type: "triangle" }, envelope: { attack: 0.002, decay: 0.18, sustain: 0, release: 0.12 } }, -19);
  // Soft chord voice for the "complete" resolve tone.
  const resolve = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "sine" }, envelope: { attack: 0.4, decay: 1.2, sustain: 0.2, release: 3.5 } });
  resolve.volume.value = -16;
  resolve.connect(reverb); resolve.connect(master);

  nodes = { master, reverb, tapResp, tapMenu, blip, sting, resolve };
}

const audioEngine = {
  async unlock() {
    if (unlocked) return;
    try {
      await Tone.start();
      build();
      unlocked = true;
      // Apply whatever mute state was restored before the first gesture.
      nodes.master.gain.rampTo(muted ? 0 : Tone.dbToGain(MASTER_DB), 0.1);
    } catch (e) { /* leave unlocked false; methods stay no-ops */ }
  },

  isUnlocked() { return unlocked; },

  setMuted(m) {
    muted = !!m;
    if (!unlocked) return;
    nodes.master.gain.rampTo(muted ? 0 : Tone.dbToGain(MASTER_DB), 0.12);
  },

  // ── One-shots ──────────────────────────────────────────────────────────────
  tapResponse() { if (unlocked && !muted) try { nodes.tapResp.triggerAttackRelease("C3", 0.08); } catch (e) {} },
  tapMenu()     { if (unlocked && !muted) try { nodes.tapMenu.triggerAttackRelease("G3", 0.12); } catch (e) {} },
  blip()        { if (unlocked && !muted) try { nodes.blip.triggerAttackRelease("E6", 0.04); } catch (e) {} },
  gain() {
    if (!unlocked || muted) return;
    const t = Tone.now();
    try { nodes.sting.triggerAttackRelease("A4", 0.10, t); nodes.sting.triggerAttackRelease("E5", 0.12, t + 0.09); } catch (e) {}
  },
  loss() {
    if (!unlocked || muted) return;
    try { nodes.sting.triggerAttackRelease("F2", 0.22); } catch (e) {}
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
