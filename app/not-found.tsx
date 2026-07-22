import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export default function NotFound() {
  return <main className="center-screen">
    <Link aria-label="Return to the Odd One homepage" href="/">
      <BrandMark />
    </Link>
    <span className="display-number" aria-hidden="true">?</span>
    <h1>This number is not in play.</h1>
    <p>The page may have moved, or the room link may no longer be valid.</p>
    <div className="hero-actions">
      <Link aria-label="Choose a lobby from the not found page" className="action action-lime" href="/play">Choose a lobby</Link>
      <Link className="action action-ghost" href="/">Return home</Link>
    </div>
  </main>;
}
