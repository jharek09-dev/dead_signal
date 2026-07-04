import DeadSignal from "../DeadSignal.jsx";

export default function BrowserGameDemo({ onExit }) {
  return (
    <DeadSignal
      presentation="desktopDemo"
      edition="day1Demo"
      onDemoExit={onExit}
    />
  );
}
