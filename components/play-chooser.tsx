"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";

export function PlayChooser() {
  const router = useRouter();

  useEffect(() => {
    const provider = (window as unknown as { ethereum?: { isMiniPay?: boolean } }).ethereum;
    if (provider?.isMiniPay) router.replace("/play/celo");
  }, [router]);

  return <main className="network-chooser"><BrandMark/><div className="chooser-copy"><span className="eyebrow">Choose your stage</span><h1>Same game.<br/>Different signal.</h1><p>Rooms, scores, and titles stay independent on each network.</p></div><div className="chooser-grid"><Link href="/play/celo"><span className="chain-letter">C</span><div><h2>Celo</h2><p>Built for MiniPay and mobile wallets.</p></div><strong>→</strong></Link><Link href="/play/stacks"><span className="chain-letter stacks">S</span><div><h2>Stacks</h2><p>Clarity-native play alongside Bitcoin.</p></div><strong>→</strong></Link></div><Link className="back-link" href="/">← Back to the show</Link></main>;
}
