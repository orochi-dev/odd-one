"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";

export function PlayChooser() {
  const router = useRouter();
  const chooserBodyId = useId();
  const chooserNoteId = useId();
  const redirectHintId = useId();
  const [redirectingToCelo] = useState(() => {
    if (typeof window === "undefined") return false;
    const provider = (window as unknown as { ethereum?: { isMiniPay?: boolean } }).ethereum;
    return provider?.isMiniPay === true;
  });
  const preventRedirectNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
    if (redirectingToCelo) event.preventDefault();
  };
  const redirectProps = redirectingToCelo ? { "aria-disabled": "true" as const, tabIndex: -1, onClick: preventRedirectNavigation } : {};

  useEffect(() => {
    if (redirectingToCelo) router.replace("/play/celo");
  }, [redirectingToCelo, router]);

  return <main className="network-chooser" aria-busy={redirectingToCelo} aria-labelledby="play-chooser-title" aria-describedby={`${chooserBodyId} ${chooserNoteId}`}><Link aria-label="Return to the Odd One homepage" aria-describedby={redirectingToCelo ? redirectHintId : undefined} href="/" {...redirectProps}><BrandMark decorative /></Link><div className="chooser-copy"><span className="eyebrow">Choose a lobby</span><h1 id="play-chooser-title">Same game.<br/>Different signal.</h1><p id={chooserBodyId}>Rooms, scores, earned titles, and room links stay separate on each network.</p><p id={chooserNoteId} className="chooser-note" role={redirectingToCelo ? "status" : undefined} aria-live={redirectingToCelo ? "polite" : undefined} aria-atomic={redirectingToCelo ? "true" : undefined}>{redirectingToCelo ? "MiniPay detected on this device. Redirecting to the Celo lobby now." : "If MiniPay is available on this device, Odd One opens the Celo lobby automatically. Otherwise, choose Celo or Stacks below."}</p>{redirectingToCelo && <p id={redirectHintId} className="sr-only">Navigation is temporarily unavailable while Odd One redirects MiniPay to the Celo lobby automatically.</p>}</div><div className={`chooser-grid${redirectingToCelo ? " is-redirecting" : ""}`}><Link href="/play/celo" aria-label="Enter the Celo lobby" aria-describedby={redirectingToCelo ? `celo-network-note ${redirectHintId}` : "celo-network-note"} {...redirectProps}><span className="chain-letter">C</span><div><h2>Celo</h2><p id="celo-network-note">Built for MiniPay and mobile wallets.</p></div><strong aria-hidden="true">→</strong></Link><Link href="/play/stacks" aria-label="Enter the Stacks lobby" aria-describedby={redirectingToCelo ? `stacks-network-note ${redirectHintId}` : "stacks-network-note"} {...redirectProps}><span className="chain-letter stacks">S</span><div><h2>Stacks</h2><p id="stacks-network-note">Clarity-native play alongside Bitcoin.</p></div><strong aria-hidden="true">→</strong></Link></div><Link aria-label="Back to the Odd One homepage" aria-describedby={redirectingToCelo ? redirectHintId : undefined} className={`back-link${redirectingToCelo ? " is-redirecting" : ""}`} href="/" {...redirectProps}>← Back to the homepage</Link></main>;
}
