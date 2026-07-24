import Link from "next/link";
import { ArrowRight, EyeOff, LockKeyhole, Radio, Trophy } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { LandingDemo } from "@/components/landing-demo";

export default function Home() {
  return <div className="landing">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="landing-nav" aria-label="Odd One homepage"><BrandMark /><nav aria-label="Homepage sections and lobby"><a href="#rules">How it works</a><a href="#onchain">Onchain</a><Link aria-label="Choose a lobby from the homepage navigation" className="nav-play" href="/play">Choose a lobby</Link></nav></header>
    <main id="main-content" tabIndex={-1}>
      <section className="hero section-wrap">
        <div className="hero-copy"><span className="eyebrow">A 30-minute game of nerve</span><h1>Go low.<br/><em>Stay unique.</em></h1><p>Pick a number nobody else will. When the curtain lifts, the lowest number standing alone takes the room.</p><div className="hero-actions"><Link aria-label="Choose a lobby and start playing Odd One" className="action action-lime" href="/play">Choose a lobby <ArrowRight aria-hidden="true" focusable="false" size={18}/></Link><a className="action action-ghost" href="#rules">Learn the trick</a></div><div className="hero-proof"><span>No entry fee</span><span>3–12 players</span><span>Celo + Stacks</span></div></div>
        <LandingDemo />
      </section>

      <section id="rules" className="rules-section section-wrap" aria-labelledby="rules-title"><div className="section-heading"><span className="eyebrow">Three moves. One outlier.</span><h2 id="rules-title">Simple rules.<br/>Suspicious minds.</h2></div><div className="rule-grid">
        <article><span className="rule-index">01 / PICK</span><EyeOff aria-hidden="true" focusable="false"/><h3>Hide a number</h3><p>Choose from 1 to 20. Your wallet publishes only a cryptographic commitment.</p></article>
        <article><span className="rule-index">02 / REVEAL</span><Radio aria-hidden="true" focusable="false"/><h3>Show your hand</h3><p>After 20 minutes, everyone gets ten minutes to reveal their original pick.</p></article>
        <article><span className="rule-index">03 / WIN</span><Trophy aria-hidden="true" focusable="false"/><h3>Stand alone</h3><p>The lowest number selected exactly once wins 100 points. Every reveal earns five.</p></article>
      </div></section>

      <section className="timeline-section" aria-labelledby="timeline-title"><div className="section-wrap timeline-wrap"><div><span className="eyebrow">The whole show</span><h2 id="timeline-title">Thirty minutes.<br/>No host advantage.</h2><p>The clock starts when the room is created and never pauses, even when all twelve seats fill.</p></div><div className="timeline"><div className="timeline-segment pick"><strong>20:00</strong><span>Secret pick phase</span></div><div className="timeline-segment reveal"><strong>10:00</strong><span>Public reveal phase</span></div><div className="timeline-finish"><strong>↓</strong><span>Anyone settles</span></div></div></div></section>

      <section className="strategy-section section-wrap" aria-labelledby="strategy-title"><div className="strategy-board"><div className="strategy-copy"><span className="eyebrow">The delicious problem</span><h2 id="strategy-title">One is perfect.<br/>Unless everyone knows it.</h2><p>Lower is stronger, uniqueness is everything. Odd One turns a tiny choice into a room full of second-guessing.</p></div><div className="probability-field" aria-hidden="true">{Array.from({ length: 20 }, (_, i) => <span style={{ "--n": i } as React.CSSProperties} key={i}>{i + 1}</span>)}</div></div></section>

      <section className="rooms-section section-wrap" aria-labelledby="room-visibility-title"><h2 id="room-visibility-title" className="sr-only">Public and unlisted room visibility</h2><article className="room-mode public"><Radio aria-hidden="true" focusable="false"/><span className="eyebrow">Public rooms</span><h3>Walk into the spotlight.</h3><p>Listed in the lobby for anyone looking for a game.</p></article><article className="room-mode unlisted"><LockKeyhole aria-hidden="true" focusable="false"/><span className="eyebrow">Unlisted rooms</span><h3>Send the signal yourself.</h3><p>Share the direct link. Unlisted is quieter, never private—blockchain activity remains public.</p></article></section>

      <section id="onchain" className="chain-section section-wrap" aria-labelledby="onchain-title"><div className="chain-copy"><span className="eyebrow">Same game. Two stages.</span><h2 id="onchain-title">Celo in MiniPay.<br/>Stacks beside Bitcoin.</h2><p>Your rooms and scores live independently on each network. There is no account server, indexer, or hidden operator.</p></div><div className="chain-panels"><article><span className="chain-letter">C</span><h3>Celo</h3><p>Fast mobile play with automatic MiniPay wallet access.</p></article><article><span className="chain-letter stacks">S</span><h3>Stacks</h3><p>Clarity-native rooms with the same timing and scoring rules.</p></article></div></section>

      <section className="public-section section-wrap" aria-labelledby="public-disclosure-title"><div className="public-stamp">PUBLIC<br/>BY DESIGN</div><div><span className="eyebrow">Before you enter</span><h2 id="public-disclosure-title">The chain remembers the room.</h2><p>Wallet addresses, commitments, revealed numbers, timestamps, and results are public and permanent. Your secret salt stays in your browser until you reveal it.</p></div></section>

      <section className="final-cta section-wrap"><span className="eyebrow">Think you know what they will pick?</span><h2>There is only one<br/>way to find out.</h2><Link aria-label="Choose a lobby from the final call to action" className="action action-orange" href="/play">Choose a lobby <ArrowRight aria-hidden="true" focusable="false" size={20}/></Link></section>
    </main>
    <footer className="landing-footer"><BrandMark/><p>A free strategy game. No bets, prizes, or financial value.</p><span className="mono">ODD ONE / 2026</span></footer>
  </div>;
}
