import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
export default function NotFound() { return <main className="center-screen"><BrandMark/><span className="display-number">?</span><h1>This number is not in play.</h1><Link className="action action-lime" href="/play">Back to the lobby</Link></main>; }
