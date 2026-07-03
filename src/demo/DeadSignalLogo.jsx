export default function DeadSignalLogo({ variant = "default" }) {
  return (
    <div className={`dead-signal-logo dead-signal-logo--${variant}`} aria-label="Dead Signal">
      <SignalMark />
      <span className="logo-word" aria-hidden="true">
        <span className="logo-dead">DEAD</span><span className="logo-signal">SIGNAL</span>
      </span>
    </div>
  );
}

function SignalMark() {
  return (
    <svg className="signal-mark" viewBox="0 0 512 512" aria-hidden="true">
      <rect className="signal-mark__glow" width="512" height="512" rx="92" />
      <rect className="signal-mark__bar" x="99" y="278" width="62" height="110" rx="18" />
      <rect className="signal-mark__bar" x="183" y="223" width="62" height="165" rx="18" />
      <rect className="signal-mark__bar" x="267" y="168" width="62" height="220" rx="18" />
      <rect className="signal-mark__dead" x="351" y="108" width="62" height="280" rx="18" />
    </svg>
  );
}
