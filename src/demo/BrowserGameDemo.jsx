import { useEffect, useMemo, useRef, useState } from "react";
import DeadSignalLogo from "./DeadSignalLogo.jsx";

const initialMessages = [
  { from: "system", text: "connection recovered / contact unknown" },
  { from: "ellie", text: "found a phone. don't know whose." },
  { from: "ellie", text: "you were the last call on it. you still alive?" },
];

const caseEntries = {
  phone: "The phone was already beside you when you woke up.",
  contact: "The contact is saved as KIM, but the voice says Ellie.",
  charger: "Battery is the clock. The charger buys time, not safety.",
  stairwell: "Something happened in the stairwell before you woke.",
  haven: "A shortwave loop is broadcasting coordinates for Haven.",
};

const script = {
  wake: {
    choices: [
      {
        text: "yeah. i'm here. i don't remember anything.",
        next: "room",
        add: [
          { from: "you", text: "yeah. i'm here. i don't remember anything." },
          { from: "ellie", text: "no memory at all?" },
          { from: "ellie", text: "okay. battery first. look around. anything to charge with?" },
        ],
        unlock: ["phone", "contact"],
      },
      {
        text: "alive. whose phone is this?",
        next: "room",
        add: [
          { from: "you", text: "alive. whose phone is this?" },
          { from: "ellie", text: "i was hoping you knew." },
          { from: "ellie", text: "listen. if it's at nine percent, move fast. find power." },
        ],
        unlock: ["phone", "contact"],
      },
    ],
  },
  room: {
    choices: [
      {
        text: "search the apartment for a charger.",
        next: "door",
        add: [
          { from: "you", text: "searching the apartment." },
          { from: "narrator", text: "kitchen drawer. cracked cable. wall adapter warm like it was just used." },
          { from: "system", text: "charger recovered / battery stabilized" },
          { from: "ellie", text: "good. now secure the door. don't give the hallway a reason to notice you." },
        ],
        unlock: ["charger"],
      },
    ],
  },
  door: {
    choices: [
      {
        text: "check the stairwell before barricading.",
        next: "broadcast",
        add: [
          { from: "you", text: "checking the stairwell." },
          { from: "narrator", text: "one flight down. a phone buzzing under a dead hand." },
          { from: "ellie", text: "don't look too long. please." },
        ],
        unlock: ["stairwell"],
      },
      {
        text: "barricade the door and stay quiet.",
        next: "broadcast",
        add: [
          { from: "you", text: "barricading the door." },
          { from: "narrator", text: "chair under the knob. towel under the gap. breath held until the hallway passes." },
          { from: "ellie", text: "good. quiet keeps you alive tonight." },
        ],
      },
    ],
  },
  broadcast: {
    choices: [
      {
        text: "tune the shortwave loop.",
        next: "end",
        add: [
          { from: "you", text: "i hear something on the radio." },
          { from: "narrator", text: "a voice repeats coordinates through static. same phrase. same signal. Haven." },
          { from: "ellie", text: "that's where we go when morning comes." },
          { from: "system", text: "demo complete / day two continues in the full version" },
        ],
        unlock: ["haven"],
      },
    ],
  },
  end: { choices: [] },
};

export default function BrowserGameDemo({ onExit }) {
  const [step, setStep] = useState("wake");
  const [messages, setMessages] = useState(initialMessages);
  const [unlocked, setUnlocked] = useState(["phone"]);
  const [caseOpen, setCaseOpen] = useState(true);
  const idRef = useRef(0);
  const messagesRef = useRef(null);

  const choices = script[step]?.choices || [];
  const isComplete = step === "end";
  const battery = isComplete ? 18 : step === "wake" ? 9 : step === "room" ? 9 : 14;

  const unlockedEntries = useMemo(
    () => unlocked.map((key) => [key, caseEntries[key]]).filter(([, value]) => value),
    [unlocked]
  );

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const choose = (choice) => {
    setMessages((prev) => [
      ...prev,
      ...choice.add.map((msg) => ({ ...msg, id: `m${idRef.current++}` })),
    ]);
    if (choice.unlock) {
      setUnlocked((prev) => Array.from(new Set([...prev, ...choice.unlock])));
    }
    setStep(choice.next);
  };

  const restart = () => {
    idRef.current = 0;
    setStep("wake");
    setMessages(initialMessages);
    setUnlocked(["phone"]);
    setCaseOpen(true);
  };

  return (
    <section className="play-stage" aria-label="Dead Signal playable browser demo">
      <aside className="play-rail play-rail--left">
        <p className="eyebrow">demo controls</p>
        <h2>Day 1 / Apartment</h2>
        <div className="rail-stats">
          <span>signal</span><strong>unstable</strong>
          <span>battery</span><strong>{battery}%</strong>
          <span>objective</span><strong>{isComplete ? "survive morning" : "secure the room"}</strong>
        </div>
        <div className="rail-actions">
          <button type="button" onClick={() => setCaseOpen((v) => !v)}>{caseOpen ? "Hide Case File" : "Show Case File"}</button>
          <button type="button" onClick={restart}>Restart Demo</button>
          <button type="button" onClick={onExit}>Exit Demo</button>
        </div>
      </aside>

      <div className="signal-terminal">
        <div className="terminal-top">
          <span className="terminal-logo"><DeadSignalLogo variant="terminal" /></span>
          <strong>KIM / unverified</strong>
        </div>
        <div className="terminal-messages" ref={messagesRef}>
          {messages.map((msg, index) => (
            <div className={`terminal-row terminal-row--${msg.from}`} key={msg.id || `${msg.from}-${index}`}>
              {msg.text}
            </div>
          ))}
        </div>
        <div className="terminal-choices">
          {choices.length > 0 ? choices.map((choice, index) => (
            <button type="button" key={choice.text} onClick={() => choose(choice)}>
              <span>{index + 1}</span>
              {choice.text}
            </button>
          )) : (
            <div className="terminal-end">
              <p>Night falls. The next day opens in the full version.</p>
              <button type="button" onClick={restart}>Replay the demo</button>
            </div>
          )}
        </div>
      </div>

      <aside className={`play-rail play-rail--right${caseOpen ? "" : " is-collapsed"}`}>
        <p className="eyebrow">case file</p>
        <h2>Open Threads</h2>
        <ul className="case-notes">
          {unlockedEntries.map(([key, note]) => <li key={key}>{note}</li>)}
        </ul>
        <div className="case-question">
          <span>current question</span>
          <p>Why was your last call already waiting on the floor?</p>
        </div>
      </aside>
    </section>
  );
}
