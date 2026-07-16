"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";

export function PlayChooser() {
  const router = useRouter();
  const [redirectingToCelo, setRedirectingToCelo] = useState(false);

  useEffect(() => {
    const provider = (window as unknown as { ethereum?: { isMiniPay?: boolean } }).ethereum;
    if (provider?.isMiniPay) {
      setRedirectingToCelo(true);
      router.replace("/play/celo");
    }
  }, [router]);

  return <main className="network-chooser"><BrandMark/><div className="chooser-copy"><span className="eyebrow">Choose your stage</span><h1>Same game.<br/>Different signal.</h1><p>Rooms, scores, and titles stay independent on each network.</p><p className="chooser-note" role="status" aria-live="polite">{redirectingToCelo ? "MiniPay detected. Taking you straight to the Celo lobby." : "MiniPay opens the Celo lobby automatically when it is available."}</p></div><div className="chooser-grid"><Link href="/play/celo" aria-label="Enter the Celo lobby"><span className="chain-letter">C</span><div><h2>Celo</h2><p>Built for MiniPay and mobile wallets.</p></div><strong aria-hidden="true">→</strong></Link><Link href="/play/stacks" aria-label="Enter the Stacks lobby"><span className="chain-letter stacks">S</span><div><h2>Stacks</h2><p>Clarity-native play alongside Bitcoin.</p></div><strong aria-hidden="true">→</strong></Link></div><Link aria-label="Back to the Odd One homepage" className="back-link" href="/">← Back to the show</Link></main>;
}
