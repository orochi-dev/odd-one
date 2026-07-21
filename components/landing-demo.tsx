"use client";
import { useState } from "react";

const crowd = [1, 1, 4, 8];
export function LandingDemo() {
  const [selected, setSelected] = useState(2); const [revealed, setRevealed] = useState(false);
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
  return <section className="demo-stage" role="region" aria-label="Simulated Odd One round">
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
      <p id={previewHintId}>Preview only. This sample uses picks 1-5; live rooms use the full 1-20 range. Lowest unique number wins the round.</p>
      <div className="number-row" role="group" aria-label="Choose your preview number" aria-describedby={previewHintId}>{[1, 2, 3, 4, 5].map((number) => <button type="button" aria-label={`Pick ${number} for the preview`} aria-pressed={selected === number} className={selected === number ? "selected" : ""} onClick={() => setSelected(number)} key={number}>{number}</button>)}</div>
      <button type="button" className="action action-lime" aria-label={`Run the preview reveal with pick ${selected}`} aria-describedby={previewHintId} onClick={() => setRevealed(true)}>Run the preview reveal</button>
    </> : <div className="demo-result" role="status" aria-live="polite" aria-atomic="true"><p id={previewResultId}>{resultCopy}</p><button type="button" className="text-button" aria-label={`Reset the preview with pick ${selected}`} aria-describedby={previewResultId} onClick={() => setRevealed(false)}>Reset the preview</button></div>}
  </section>;
}
