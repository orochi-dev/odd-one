"use client";
import Link from "next/link";
import { BrandMark } from "./brand-mark";
import { PlayerSignal } from "./player-signal";
import { shortAddress } from "@/lib/game";
import type { Network } from "@/lib/types";

export function AppShell({ network, account, connected, connecting, isMiniPay, onConnect, onDisconnect, children }: { network: Network; account: string; connected: boolean; connecting: boolean; isMiniPay: boolean; onConnect(): void; onDisconnect(): void; children: React.ReactNode }) {
  const networkLabel = network === "celo" ? "Celo" : "Stacks";
  const connectLabel = connecting ? `Opening ${networkLabel} wallet` : `Connect ${networkLabel} wallet`;
  const celoLobbyLabel = network === "celo" ? "Current lobby: Celo" : "Open the Celo lobby";
  const stacksLobbyLabel = network === "stacks" ? "Current lobby: Stacks" : "Open the Stacks lobby";
  return <div className="app-canvas">
    <a className="skip-link" href="#app-main-content">Skip to main content</a>
    <header className="app-header">
      <Link href="/" aria-label="Return to the Odd One homepage" className="brand-link"><BrandMark /></Link>
      <nav className="network-tabs" aria-label="Choose a network lobby"><Link aria-label={celoLobbyLabel} aria-current={network === "celo" ? "page" : undefined} className={network === "celo" ? "active" : ""} href="/play/celo">Celo</Link><Link aria-label={stacksLobbyLabel} aria-current={network === "stacks" ? "page" : undefined} className={network === "stacks" ? "active" : ""} href="/play/stacks">Stacks</Link></nav>
      <div className="wallet-zone">{connected ? <><PlayerSignal address={account} size={34} /><button type="button" aria-label={`Disconnect wallet ${shortAddress(account)}`} className="wallet-chip" onClick={onDisconnect}>{shortAddress(account)}</button></> : isMiniPay ? <span className="wallet-chip" role="status" aria-live="polite" aria-atomic="true">Connecting MiniPay…</span> : <button type="button" aria-label={connectLabel} className="action action-small" onClick={onConnect} disabled={connecting}>{connecting ? `Opening ${networkLabel} wallet…` : `Connect ${networkLabel} wallet`}</button>}</div>
    </header>
    <main id="app-main-content" className="app-main" tabIndex={-1}>{children}</main>
  </div>;
}
