"use client";
import Link from "next/link";
import { BrandMark } from "./brand-mark";
import { PlayerSignal } from "./player-signal";
import { shortAddress } from "@/lib/game";
import type { Network } from "@/lib/types";

export function AppShell({ network, account, connected, connecting, isMiniPay, onConnect, onDisconnect, children }: { network: Network; account: string; connected: boolean; connecting: boolean; isMiniPay: boolean; onConnect(): void; onDisconnect(): void; children: React.ReactNode }) {
  return <div className="app-canvas">
    <header className="app-header">
      <Link href="/" className="brand-link"><BrandMark /></Link>
      <nav className="network-tabs" aria-label="Network"><Link className={network === "celo" ? "active" : ""} href="/play/celo">Celo</Link><Link className={network === "stacks" ? "active" : ""} href="/play/stacks">Stacks</Link></nav>
      <div className="wallet-zone">{connected ? <><PlayerSignal address={account} size={34} /><button className="wallet-chip" onClick={onDisconnect}>{shortAddress(account)}</button></> : isMiniPay ? <span className="wallet-chip">Connecting MiniPay…</span> : <button className="action action-small" onClick={onConnect} disabled={connecting}>{connecting ? "Opening wallet…" : "Connect"}</button>}</div>
    </header>
    <main className="app-main">{children}</main>
  </div>;
}
