import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export default function NotFound() {
  return <main className="center-screen">
    <BrandMark />
    <span className="display-number">?</span>
    <h1>This number is not in play.</h1>
    <p>The page may have moved, or the room link may no longer be valid.</p>
    <div className="hero-actions">
      <Link className="action action-lime" href="/play">Back to the lobby</Link>
      <Link className="action action-ghost" href="/">Visit the landing page</Link>
    </div>
  </main>;
}
