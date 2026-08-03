import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export default function NotFound() {
  return <main className="center-screen" aria-labelledby="not-found-title" aria-describedby="not-found-copy">
    <Link aria-label="Return to the Odd One homepage" href="/">
      <BrandMark decorative />
    </Link>
    <span className="display-number" aria-hidden="true">?</span>
    <h1 id="not-found-title">This number is not in play.</h1>
    <p id="not-found-copy">The page may have moved, the room link may be incomplete or mistyped, or the room may belong to the other network. Room links stay separate on Celo and Stacks, so reopen the full link, choose a lobby, or jump straight into the correct network.</p>
    <nav className="hero-actions not-found-actions" aria-label="Not found recovery actions">
      <Link aria-label="Open the lobby chooser from the not found page" className="action action-lime" href="/play">Choose a lobby</Link>
      <Link aria-label="Open the Celo lobby from the not found page" className="action action-lime" href="/play/celo">Open Celo lobby</Link>
      <Link aria-label="Open the Stacks lobby from the not found page" className="action action-ghost" href="/play/stacks">Open Stacks lobby</Link>
      <Link aria-label="Return to the Odd One homepage from the not found page" className="action action-ghost" href="/">Return home</Link>
    </nav>
  </main>;
}
