"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";

export function PlayChooser() {
  const router = useRouter();
  const [redirectingToCelo] = useState(() => {
    if (typeof window === "undefined") return false;
    const provider = (window as unknown as { ethereum?: { isMiniPay?: boolean } }).ethereum;
    return provider?.isMiniPay === true;
  });
  const redirectProps = redirectingToCelo ? { "aria-disabled": "true" as const, tabIndex: -1 } : {};

  useEffect(() => {
    if (redirectingToCelo) router.replace("/play/celo");
  }, [redirectingToCelo, router]);

  return <main className="network-chooser" aria-busy={redirectingToCelo}><Link aria-label="Return to the Odd One homepage" href="/" {...redirectProps}><BrandMark/></Link><div className="chooser-copy"><span className="eyebrow">Choose a lobby</span><h1>Same game.<br/>Different signal.</h1><p>Rooms, scores, and unlocked titles stay independent on each network.</p><p className="chooser-note" role="status" aria-live="polite" aria-atomic="true">{redirectingToCelo ? "MiniPay detected on this device. Redirecting to the Celo lobby now." : "MiniPay opens the Celo lobby automatically when it is available on this device."}</p></div><div className={`chooser-grid${redirectingToCelo ? " is-redirecting" : ""}`}><Link href="/play/celo" aria-label="Enter the Celo lobby" aria-describedby="celo-network-note" {...redirectProps}><span className="chain-letter">C</span><div><h2>Celo</h2><p id="celo-network-note">Built for MiniPay and mobile wallets.</p></div><strong aria-hidden="true">→</strong></Link><Link href="/play/stacks" aria-label="Enter the Stacks lobby" aria-describedby="stacks-network-note" {...redirectProps}><span className="chain-letter stacks">S</span><div><h2>Stacks</h2><p id="stacks-network-note">Clarity-native play alongside Bitcoin.</p></div><strong aria-hidden="true">→</strong></Link></div><Link aria-label="Back to the Odd One homepage" className={`back-link${redirectingToCelo ? " is-redirecting" : ""}`} href="/" {...redirectProps}>← Back to the homepage</Link></main>;
}
