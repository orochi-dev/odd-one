import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export default function NotFound() {
  return <main className="center-screen" aria-labelledby="not-found-title" aria-describedby="not-found-copy">
    <Link aria-label="Return to the Odd One homepage" href="/">
      <BrandMark decorative />
    </Link>
    <span className="display-number" aria-hidden="true">?</span>
    <h1 id="not-found-title">This number is not in play.</h1>
    <p id="not-found-copy">The page may have moved, or the room link may be missing a character. Open a lobby or paste the room link again.</p>
    <nav className="hero-actions" aria-label="Not found recovery actions">
      <Link aria-label="Open the lobby chooser from the not found page" className="action action-lime" href="/play">Choose a lobby</Link>
      <Link aria-label="Return to the Odd One homepage from the not found page" className="action action-ghost" href="/">Return home</Link>
    </nav>
  </main>;
}
