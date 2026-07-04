import { useEffect, useState } from "react";
import BrowserGameDemo from "./BrowserGameDemo.jsx";
import DeadSignalLogo from "./DeadSignalLogo.jsx";
import "./browser-demo.css";

const storySections = [
  ["The Situation", "Harwick went dark three days ago. Power gone, streets emptied, and whatever moves out there now is not what it used to be. Your phone is almost dead."],
  ["The Voice", "You woke with no memory of how you got here. A stranger texts the phone beside you: a way out, if you keep moving and keep the line alive."],
  ["The Goal", "A broadcast loops the same coordinates: somewhere still standing. Haven. Cross the city, keep the battery alive, reach it."],
];

const playBeats = [
  ["Survive", "Battery, food, water, and nerve form the clock."],
  ["Choose", "Your replies shape risk, resources, and what you learn."],
  ["Investigate", "Evidence moves from texts into a persistent case file."],
  ["Return Tomorrow", "The full game is built for tense multi-session play."],
];

const caseCategories = [
  ["Memories", "0/9", "Fragmented flashes of who you were before Harwick went dark."],
  ["Clues", "0/3", "Route evidence tying you to Mercy, Haven, and the broadcast."],
  ["People", "3", "Kim. Ellie. You. None of those files agree yet."],
  ["Locations", "5", "Harwick, Mercy General, Haven, and places still locked."],
  ["Known Facts", "0", "Nothing proven yet. The board is waiting."],
  ["Open Questions", "5", "Why did you call Kim? Why can't you remember?"],
];

const evidenceCards = [
  ["phone", "The phone was already beside you when you woke up.", "known"],
  ["kim", "The contact is saved as KIM. You called her before this.", "person"],
  ["ellie", "A stranger answers as Ellie. She says she remembers you.", "person"],
  ["broadcast", "Haven is broadcasting coordinates into a dead city.", "lead"],
  ["battery", "Battery is the lifeline. Every message matters.", "resource"],
  ["question", "Why was your last call already waiting on the floor?", "open"],
];

const getRoute = () => {
  if (typeof window === "undefined") return "home";
  return window.location.hash === "#play" ? "play" : "home";
};

export default function BrowserDemo() {
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    const onHash = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHash);
    onHash();
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (hash) => {
    if (typeof window === "undefined") return;
    window.location.hash = hash;
  };

  if (route === "play") {
    return (
      <main className="site-shell site-shell--play">
        <div className="site-bg" aria-hidden="true" />
        <Header onPlay={() => go("play")} isPlaying />
        <BrowserGameDemo onExit={() => go("home")} />
      </main>
    );
  }

  return (
    <main className="site-shell">
      <div className="site-bg" aria-hidden="true" />
      <Header onPlay={() => go("play")} />

      <section className="hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow">browser demo available now</p>
          <DeadSignalLogo variant="hero" />
          <p className="tagline">A text-message survival mystery about memory, guilt, and the voice on the other end.</p>
          <p className="hero-body">
            Wake in Harwick with no memory, a dying phone, and a stranger who knows the city too well.
            Follow the signal. Build the case file. Survive long enough to learn why Haven called you.
          </p>
          <div className="hero-actions">
            <button className="primary-cta" type="button" onClick={() => go("play")}>Play Demo</button>
            <a className="secondary-cta" href="#about">About the Game</a>
          </div>
          <div className="status-strip" aria-label="release status">
            <span>demo available now</span>
            <span>full game in development</span>
            <span>case file enabled</span>
          </div>
        </div>

        <aside className="hero-card" aria-label="transmission preview">
          <div className="card-topline">
            <span>incoming</span>
            <strong>9% power</strong>
          </div>
          <div className="signal-preview">
            <p>found a phone in the stairwell.</p>
            <p>you were the last call on it.</p>
            <p className="signal-preview__dim">you still alive?</p>
          </div>
          <div className="hero-card-footer">
            <span>contact: KIM</span>
          </div>
        </aside>
      </section>

      <section className="site-section" id="about">
        <div className="section-heading">
          <p className="eyebrow">about</p>
          <h2>Transmission recovered: Greater Harwick.</h2>
        </div>
        <div className="transmission-panel">
          <div className="transmission-header">
            <span>status: dark / 72h</span>
            <strong>keep the signal alive</strong>
          </div>
          <div className="story-grid">
            {storySections.map(([title, body]) => (
              <article className="story-card" key={title}>
                <span>{title}</span>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="playbeat-strip">
          {playBeats.map(([title, body]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section case-section" id="case-file">
        <div className="section-heading">
          <p className="eyebrow">case file</p>
          <h2>Every answer creates a worse question.</h2>
        </div>
        <div className="case-file-showcase">
          <div className="case-ledger">
            {caseCategories.map(([label, count, body]) => (
              <article key={label}>
                <div>
                  <span>{label}</span>
                  <strong>{count}</strong>
                </div>
                <p>{body}</p>
              </article>
            ))}
          </div>
          <div className="evidence-board" aria-label="sample case file evidence">
            {evidenceCards.map(([label, body, type]) => (
              <article className={`evidence-card evidence-card--${type}`} key={label}>
                <span>{label}</span>
                <p>{body}</p>
              </article>
            ))}
            <svg className="thread-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path d="M18 20 L48 38 L80 18" />
              <path d="M20 76 L48 38 L82 76" />
              <path d="M48 38 L50 58" />
            </svg>
          </div>
        </div>
      </section>

      <section className="premium-band" id="full-version">
        <div>
          <p className="eyebrow">full version</p>
          <h2>The first night is only the hook.</h2>
          <p>
            The premium release continues through the city, Haven, and the investigation behind the Signal.
          </p>
        </div>
        <button className="primary-cta" type="button" onClick={() => go("play")}>Play Demo</button>
      </section>
    </main>
  );
}

function Header({ onPlay, isPlaying = false }) {
  return (
    <header className={`site-header${isPlaying ? " site-header--play" : ""}`}>
      <a className="site-brand" href="#home" aria-label="Dead Signal home">
        <DeadSignalLogo variant="header" />
      </a>
      {!isPlaying && (
        <nav className="site-nav" aria-label="site navigation">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#case-file">Case File</a>
          <button type="button" onClick={onPlay}>Play Demo</button>
        </nav>
      )}
    </header>
  );
}
