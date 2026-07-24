"use client";
import { useEffect, useRef, useState } from "react";

const crowd = [1, 1, 4, 8];
const previewNumbers = [1, 2, 3, 4, 5];
export function LandingDemo() {
  const [selected, setSelected] = useState(2); const [revealed, setRevealed] = useState(false);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const shouldRestoreFocusRef = useRef(false);
  const previewTitleId = "landing-preview-title";
  const previewHintId = "preview-hint";
  const previewResultId = "preview-result";
  const picks = [selected, ...crowd]; const counts = picks.reduce<Record<number, number>>((map, number) => ({ ...map, [number]: (map[number] || 0) + 1 }), {});
  const winner = Object.entries(counts).filter(([, count]) => count === 1).map(([number]) => Number(number)).sort((a, b) => a - b)[0];
  const orbitLabel = (pick: number, index: number) => {
    if (!revealed) return index === 0 ? "Your pick is still hidden" : `Preview player ${index} is still hidden`;
    return index === 0 ? `You revealed ${pick}` : `Preview player ${index} revealed ${pick}`;
  };
  const centerLabel = !revealed ? "Your secret pick" : winner === undefined ? "Preview draw" : "Lowest unique number";
  const centerValue = !revealed ? selected : winner === undefined ? "DRAW" : winner;
  const resultCopy = winner === undefined
    ? "No number stood alone. This preview round is a draw."
    : winner === selected
      ? "You stood alone. That is +105 points."
      : `Your ${selected} was crowded out. Number ${winner} stood alone.`;
  const focusOption = (number: number) => {
    const optionIndex = previewNumbers.indexOf(number);
    if (optionIndex === -1) return;
    optionRefs.current[optionIndex]?.focus();
  };
  const moveSelection = (direction: "next" | "previous" | "first" | "last") => {
    const currentIndex = previewNumbers.indexOf(selected);
    if (currentIndex === -1) return;
    if (direction === "first") {
      const nextNumber = previewNumbers[0];
      setSelected(nextNumber);
      focusOption(nextNumber);
      return;
    }
    if (direction === "last") {
      const nextNumber = previewNumbers[previewNumbers.length - 1];
      setSelected(nextNumber);
      focusOption(nextNumber);
      return;
    }
    const offset = direction === "next" ? 1 : -1;
    const nextIndex = (currentIndex + offset + previewNumbers.length) % previewNumbers.length;
    const nextNumber = previewNumbers[nextIndex];
    setSelected(nextNumber);
    focusOption(nextNumber);
  };
  const handlePickerKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        moveSelection("next");
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        moveSelection("previous");
        break;
      case "Home":
        event.preventDefault();
        moveSelection("first");
        break;
      case "End":
        event.preventDefault();
        moveSelection("last");
        break;
      default:
        break;
    }
  };
  useEffect(() => {
    if (!revealed && shouldRestoreFocusRef.current) {
      focusOption(selected);
      shouldRestoreFocusRef.current = false;
    }
  }, [revealed, selected]);
  const handleReset = () => {
    shouldRestoreFocusRef.current = true;
    setRevealed(false);
  };
  return <section className="demo-stage" role="region" aria-labelledby={previewTitleId}>
    <h2 id={previewTitleId} className="sr-only">Interactive Odd One preview</h2>
    <div className="demo-head"><span className="preview-pill">Interactive preview</span><span className="mono">ROOM #0042</span></div>
    <div className={`demo-orbit ${revealed ? "is-revealed" : ""}`}>
      <div className="spotlight" />
      <div className="demo-center" role="status" aria-live="polite" aria-atomic="true">
        <small>{centerLabel}</small><strong>{centerValue}</strong>
      </div>
      {picks.map((pick, index) => <span
        className={`orbit-player orbit-${index}`}
        aria-label={orbitLabel(pick, index)}
        key={`${index}-${pick}`}
      >{revealed ? pick : "?"}</span>)}
    </div>
    {!revealed ? <>
      <p id={previewHintId}>Preview only. This sample uses picks 1-5; live rooms use the full 1-20 range. Lowest unique number wins the round. Arrow keys wrap between preview numbers, while Home and End jump to the ends.</p>
      <div className="number-row" role="radiogroup" aria-label="Choose your preview number" aria-describedby={previewHintId} aria-activedescendant={`preview-pick-${selected}`} aria-keyshortcuts="ArrowRight ArrowDown ArrowLeft ArrowUp Home End" onKeyDown={handlePickerKeyDown}>{previewNumbers.map((number, index) => <button type="button" id={`preview-pick-${number}`} role="radio" aria-label={`Pick ${number} for the preview`} aria-checked={selected === number} aria-posinset={index + 1} aria-setsize={previewNumbers.length} tabIndex={selected === number ? 0 : -1} className={selected === number ? "selected" : ""} onClick={() => setSelected(number)} ref={(element) => {
        optionRefs.current[index] = element;
      }} key={number}>{number}</button>)}</div>
      <button type="button" className="action action-lime" aria-label={`Run the preview reveal with pick ${selected}`} aria-describedby={previewHintId} onClick={() => setRevealed(true)}>Run the preview reveal</button>
    </> : <div className="demo-result" role="status" aria-live="polite" aria-atomic="true"><p id={previewResultId}>{resultCopy}</p><button type="button" className="text-button" aria-label={`Reset the preview with pick ${selected}`} aria-describedby={previewResultId} onClick={handleReset}>Reset the preview</button></div>}
  </section>;
}
