"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Clock3, Copy, Download, EyeOff, LockKeyhole, Radio, RefreshCw, Share2, Trophy, Upload } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { AppShell } from "./app-shell";
import { PlayerSignal } from "./player-signal";
import { useNetworkClient } from "./network-client";
import { buildRevealTicket, generateSalt, makeCommitment, parseRevealTicket, ticketFilename } from "@/lib/commitment";
import { contractId, contractExplorerUrl, publicEnv } from "@/lib/env";
import { achievementTitles, canonicalRoomUrl, formatCountdown, formatMoment, getPhase, PAGE_SIZE, phaseLabel, primaryTitle, roomCardStatusCopy, roomResultCopy, roomVisibilityCopy, secondsRemaining, shortAddress } from "@/lib/game";
import { revealVault } from "@/lib/vault";
import type { Network, OddOneRoom, PlayerEntry, PlayerStats, RevealTicket, TransactionState } from "@/lib/types";

const emptyStats: PlayerStats = { score: 0n, roomsPlayed: 0n, reveals: 0n, wins: 0n, numberOneWins: 0n, currentRevealStreak: 0n, bestRevealStreak: 0n };
const lobbyTabLabel: Record<"open" | "reveal" | "finished" | "mine", string> = {
  open: "Open rooms",
  reveal: "Rooms ready to reveal",
  finished: "Finished rooms",
  mine: "My rooms",
};
const numberOptions = Array.from({ length: 20 }, (_, i) => i + 1);

function SetupState({ network }: { network: Network }) {
  const networkLabel = network === "celo" ? "Celo" : "Stacks";
  const contractEnvVar = network === "celo"
    ? "NEXT_PUBLIC_ODD_ONE_CELO_CONTRACT_ADDRESS"
    : "NEXT_PUBLIC_ODD_ONE_STACKS_CONTRACT_ADDRESS";
  return <section className="setup-state"><span className="status-ribbon">Setup required</span><span className="setup-number">00</span><h1>The {networkLabel} stage is not wired yet.</h1><p>Add <code>{contractEnvVar}</code> before sharing live {networkLabel} rooms. Odd One never substitutes preview records for live rooms.</p><a className="action action-ghost" href={contractExplorerUrl(network)}>Open the {networkLabel} contract explorer</a></section>;
}

function TransactionNotice({ state }: { state: TransactionState | null }) { if (!state) return null; return <div className={`transaction-notice phase-${state.phase}`} role="status" aria-live="polite" aria-atomic="true"><span className="pulse-dot"/><div><strong>{state.phase.replace("-", " ")}</strong><p>{state.message}</p>{state.explorerUrl && <a target="_blank" rel="noreferrer" href={state.explorerUrl}>View transaction ↗</a>}</div></div>; }

function RoomCard({ room }: { room: OddOneRoom }) { const phase = getPhase(room); return <Link href={`/play/${room.network}/room/${room.id}`} className={`room-card room-${phase}`}>
  <div className="room-card-head"><span className="mono">ROOM #{room.id.toString().padStart(4, "0")}</span><span className="sr-only">{roomVisibilityCopy(room)}</span>{room.visibility === "unlisted" ? <LockKeyhole aria-hidden="true" focusable="false" size={15}/> : <Radio aria-hidden="true" focusable="false" size={15}/>}</div>
  <div className="room-card-body"><div className="room-phase-icon" aria-hidden="true">{phase === "commit" ? "?" : phase === "reveal" ? "!" : room.winningNumber || "–"}</div><div><span className="eyebrow">{phaseLabel(phase)}</span><h3>{room.committedCount} / 12 players</h3></div></div>
  <div className="room-card-foot"><span>{formatMoment(room.createdAt)}</span><span>{roomCardStatusCopy(room)}</span></div>
  </Link>; }

function NetworkFrame({ network, children }: { network: Network; children(client: ReturnType<typeof useNetworkClient>): React.ReactNode }) { const client = useNetworkClient(network); return <AppShell network={network} account={client.account} connected={client.connected} connecting={client.connecting} isMiniPay={client.isMiniPay} onConnect={() => void client.connect()} onDisconnect={() => void client.disconnect()}>{children(client)}</AppShell>; }

export function Lobby({ network }: { network: Network }) {
  return <NetworkFrame network={network}>{(client) => <LobbyBody network={network} client={client}/>}</NetworkFrame>;
}

function LobbyBody({ network, client }: { network: Network; client: ReturnType<typeof useNetworkClient> }) {
  const [rooms, setRooms] = useState<OddOneRoom[]>([]); const [mine, setMine] = useState<Set<string>>(new Set()); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [tab, setTab] = useState<"open"|"reveal"|"finished"|"mine">("open");
  const lobbyPanelId = `${network}-lobby-panel`;
  const load = useCallback(async () => { if (!client.repository.configured) { setLoading(false); return; } setLoading(true); setError(""); try { const total = await client.repository.getTotalRooms(); const count = Number(total > 24n ? 24n : total); const ids = Array.from({ length: count }, (_, i) => total - BigInt(i)); let allIds = ids; if (client.account) { const played = await client.repository.getPlayedCount(client.account); const take = Number(played > 12n ? 12n : played); const playedIds = take ? await client.repository.getPlayedIds(client.account, played - BigInt(take), take) : []; setMine(new Set(playedIds.map(String))); allIds = [...new Set([...ids, ...playedIds].map(String))].map(BigInt); } else setMine(new Set()); const items = (await Promise.all(allIds.map((id) => client.repository.getRoom(id)))).filter((room): room is OddOneRoom => Boolean(room)); setRooms(items.sort((a,b)=>Number(b.id-a.id))); } catch (err) { setError(err instanceof Error ? err.message : "Rooms could not be loaded."); } finally { setLoading(false); } }, [client.account, client.repository]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  if (!client.repository.configured) return <SetupState network={network}/>;
  const visible = rooms.filter((room) => { if (tab !== "mine" && room.visibility !== "public") return false; const phase = getPhase(room); if (tab === "open") return phase === "commit"; if (tab === "reveal") return phase === "reveal" || phase === "awaiting-finalization"; if (tab === "finished") return phase === "settled"; return mine.has(room.id.toString()); });
  return <>
    <section className="lobby-hero"><div><span className="eyebrow">{network} rooms / live from the contract</span><h1>Read the room.<br/><em>Then misread it.</em></h1></div><div className="lobby-actions"><button type="button" className="icon-action" onClick={() => void load()} aria-label={`Refresh ${network === "celo" ? "Celo" : "Stacks"} rooms`}><RefreshCw aria-hidden="true" focusable="false" size={18}/></button><Link className="action action-lime" href={`/play/${network}/create`}>Create a room</Link></div></section>
    <section className="lobby-controls"><div className="lobby-tabs" role="tablist" aria-label={`${network} room filters`}>{(["open","reveal","finished","mine"] as const).map((item) => <button type="button" id={`${network}-tab-${item}`} role="tab" aria-controls={lobbyPanelId} aria-label={lobbyTabLabel[item]} aria-selected={tab === item} className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item === "reveal" ? "Reveal now" : item === "mine" ? "My rooms" : item}</button>)}</div><span className="mono">LATEST 24 / PAGE SIZE {PAGE_SIZE}</span></section>
    <section id={lobbyPanelId} role="tabpanel" aria-labelledby={`${network}-tab-${tab}`}>{loading ? <><div className="sr-only" role="status" aria-live="polite" aria-atomic="true">Reading the rooms…</div><div className="room-grid loading-grid" aria-hidden="true">{[1,2,3].map((n) => <div className="room-card skeleton" key={n}/>)}</div></> : error ? <div className="empty-state" role="alert"><span aria-hidden="true">!</span><h2>Signal lost</h2><p>{error}</p><button type="button" className="action action-ghost" onClick={() => void load()}>Try again</button></div> : visible.length ? <div className="room-grid">{visible.map((room) => <RoomCard room={room} key={room.id.toString()}/>)}</div> : <div className="empty-state"><span aria-hidden="true">{tab === "reveal" ? "!" : "?"}</span><h2>No rooms in this light.</h2><p>{tab === "mine" && !client.connected ? "Connect your wallet to see rooms you created." : "Change the view or be the first to start the clock."}</p><Link className="action action-ghost" href={`/play/${network}/create`}>Create a room</Link></div>}</section>
  </>;
}

export function NumberPicker({ selected, onSelect }: { selected: number; onSelect(number: number): void }) {
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const moveSelection = (direction: "next" | "previous" | "first" | "last") => {
    const currentIndex = numberOptions.indexOf(selected);
    if (currentIndex === -1) return;
    if (direction === "first") {
      const nextNumber = numberOptions[0];
      onSelect(nextNumber);
      optionRefs.current[0]?.focus();
      return;
    }
    if (direction === "last") {
      const lastIndex = numberOptions.length - 1;
      const nextNumber = numberOptions[lastIndex];
      onSelect(nextNumber);
      optionRefs.current[lastIndex]?.focus();
      return;
    }
    const offset = direction === "next" ? 1 : -1;
    const nextIndex = (currentIndex + offset + numberOptions.length) % numberOptions.length;
    const nextNumber = numberOptions[nextIndex];
    onSelect(nextNumber);
    optionRefs.current[nextIndex]?.focus();
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        moveSelection("next");
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        moveSelection("previous");
        break;
      case "Home":
        event.preventDefault();
        moveSelection("first");
        break;
      case "End":
        event.preventDefault();
        moveSelection("last");
        break;
      default:
        break;
    }
  };

  return <fieldset className="number-picker"><legend className="sr-only">Pick a number from one to twenty</legend><div className="number-grid" role="radiogroup" aria-label="Pick a number from one to twenty" aria-keyshortcuts="ArrowRight ArrowDown ArrowLeft ArrowUp Home End" onKeyDown={handleKeyDown}>{numberOptions.map((number, index) => <button type="button" role="radio" aria-checked={selected === number} tabIndex={selected === number ? 0 : -1} className={selected === number ? "selected" : ""} onClick={() => onSelect(number)} ref={(element) => {
    optionRefs.current[index] = element;
  }} key={number}><span>{number}</span><small>{number < 5 ? "dangerously obvious" : number < 11 ? "plausibly odd" : "boldly high"}</small></button>)}</div></fieldset>;
}

export function CreateRoomView({ network }: { network: Network }) { return <NetworkFrame network={network}>{(client) => <CreateBody network={network} client={client}/>}</NetworkFrame>; }
function CreateBody({ network, client }: { network: Network; client: ReturnType<typeof useNetworkClient> }) {
  const [number, setNumber] = useState(2); const [listed, setListed] = useState(true); const [state, setState] = useState<TransactionState|null>(null); const [error, setError] = useState(""); const [ticket, setTicket] = useState<RevealTicket|null>(null); const [backedUp, setBackedUp] = useState(false);
  if (!client.repository.configured) return <SetupState network={network}/>;
  const create = async () => {
    setError(""); if (!client.connected) { try { await client.connect(); } catch (err) { setError(err instanceof Error ? err.message : "Wallet connection failed."); } return; }
    try {
      const salt = generateSalt(); const commitment = await makeCommitment({ network, roomId: 0n, wallet: client.account, number, salt });
      const result = await client.repository.createRoom({ listed, commitment }, setState); const roomId = result.roomId || await client.repository.getTotalRooms();
      const next = await buildRevealTicket({ network, roomId: roomId.toString(), wallet: client.account, number, salt, commitment, commitTransactionId: result.hash });
      if (revealVault.available()) await revealVault.put(next); setTicket(next);
    } catch (err) { setError(err instanceof Error ? err.message : "The room could not be created."); setState({ phase: "failed", message: "Room creation failed." }); }
  };
  return <section className="create-layout"><div className="create-copy"><Link aria-label={`Back to the ${network === "celo" ? "Celo" : "Stacks"} lobby`} className="back-link" href={`/play/${network}`}>← Lobby</Link><span className="eyebrow">Start the 30-minute clock</span><h1>Put a number<br/>under the light.</h1><p>Your choice is hidden behind a commitment. Save the reveal ticket; it is the only way to prove your original pick.</p><div className="phase-mini"><span><strong>20m</strong> hidden picks</span><span><strong>10m</strong> reveals</span><span><strong>12</strong> seats</span></div></div><div className="create-panel">
    {!ticket ? <><div className="panel-head"><span className="mono">YOUR SECRET NUMBER</span><strong>{number.toString().padStart(2,"0")}</strong></div><NumberPicker selected={number} onSelect={setNumber}/><fieldset className="visibility-field"><legend>Room discovery</legend><label className={listed ? "active" : ""}><input type="radio" checked={listed} onChange={() => setListed(true)}/><Radio aria-hidden="true" focusable="false"/> Public <small>Shown in the lobby</small></label><label className={!listed ? "active" : ""}><input type="radio" checked={!listed} onChange={() => setListed(false)}/><LockKeyhole aria-hidden="true" focusable="false"/> Unlisted <small>Shared by link</small></label></fieldset><div className="permanence-note"><EyeOff aria-hidden="true" focusable="false" size={20}/><p>Your wallet, commitment, reveal, and result will be public and permanent. Odd One cannot edit or delete a room.</p></div>{error && <p className="form-error" role="alert">{error}</p>}<button type="button" className="action action-lime full-action" onClick={() => void create()}>{client.connected ? "Commit and start room" : "Connect wallet to continue"}</button><TransactionNotice state={state}/></> : <TicketSheet ticket={ticket} backedUp={backedUp} setBackedUp={setBackedUp}/>}</div></section>;
}

export function TicketSheet({ ticket, backedUp, setBackedUp }: { ticket: RevealTicket; backedUp: boolean; setBackedUp(value: boolean): void }) {
  const url = canonicalRoomUrl(publicEnv.appUrl, ticket.network, ticket.roomId); const raw = JSON.stringify(ticket, null, 2);
  const copyTicket = async () => { await navigator.clipboard.writeText(raw); setBackedUp(true); };
  const download = () => { const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([raw], { type: "application/json" })); link.download = ticketFilename(ticket); link.click(); URL.revokeObjectURL(link.href); setBackedUp(true); };
  return <div className="ticket-sheet"><div className="success-mark"><Check aria-hidden="true" focusable="false"/></div><span className="eyebrow">Room #{ticket.roomId} is live</span><h2>Keep the reveal ticket secret.</h2><p>It contains number <strong>{ticket.number}</strong> and its salt. Do not share it before the reveal phase.</p><div className="ticket-actions"><button type="button" aria-label={`Copy reveal ticket for room ${ticket.roomId}`} onClick={() => void copyTicket()}><Copy aria-hidden="true" focusable="false"/> Copy ticket</button><button type="button" aria-label={`Download reveal ticket for room ${ticket.roomId}`} onClick={download}><Download aria-hidden="true" focusable="false"/> Download</button></div><div className="share-box"><QRCodeSVG aria-hidden="true" focusable="false" value={url} bgColor="#f6f4ee" fgColor="#09090f" size={130}/><div><span className="mono">ROOM LINK — SAFE TO SHARE</span><p>{url}</p><button type="button" aria-label={`Copy shareable room link for room ${ticket.roomId}`} className="text-button" onClick={() => void navigator.clipboard.writeText(url)}>Copy room link</button></div></div>{!backedUp && <p className="ticket-warning">Back up the ticket before leaving this screen.</p>}<Link className={`action full-action ${backedUp ? "action-lime" : "action-ghost"}`} href={`/play/${ticket.network}/room/${ticket.roomId}`}>{backedUp ? "Enter the room" : "Back up first, then enter the room"}</Link></div>;
}

export function RoomView({ network, id }: { network: Network; id: bigint }) { return <NetworkFrame network={network}>{(client) => <RoomBody network={network} id={id} client={client}/>}</NetworkFrame>; }
function RoomBody({ network, id, client }: { network: Network; id: bigint; client: ReturnType<typeof useNetworkClient> }) {
  const [room, setRoom] = useState<OddOneRoom|null>(); const [players, setPlayers] = useState<PlayerEntry[]>([]); const [entry, setEntry] = useState<PlayerEntry|null>(null); const [counts, setCounts] = useState<number[]>([]); const [ticket, setTicket] = useState<RevealTicket|null>(null); const [number, setNumber] = useState(2); const [now, setNow] = useState(() => Math.floor(Date.now()/1000)); const [state, setState] = useState<TransactionState|null>(null); const [error, setError] = useState("");
  const load = useCallback(async () => { if (!client.repository.configured) return; try { const next = await client.repository.getRoom(id); setRoom(next); if (!next) return; const nextPlayers = await client.repository.getParticipants(id); setPlayers(nextPlayers); if (client.account) { const own = await client.repository.getPlayerEntry(id, client.account); setEntry(own); try { const saved = await revealVault.get(network, contractId(network), id.toString(), client.account); if (saved) setTicket(saved); } catch { /* import remains available */ } } if (Math.floor(Date.now()/1000) >= next.revealEndAt) setCounts(await client.repository.getNumberCounts(id)); } catch (err) { setError(err instanceof Error ? err.message : "The room signal could not be loaded."); } }, [client.account, client.repository, id, network]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]); useEffect(() => { const timer = window.setInterval(() => setNow(Math.floor(Date.now()/1000)), 1000); return () => window.clearInterval(timer); }, []);
  if (!client.repository.configured) return <SetupState network={network}/>; if (room === undefined) return <div className="empty-state" role="status" aria-live="polite" aria-atomic="true"><span className="loading-number" aria-hidden="true">?</span><h2>Reading the room…</h2></div>; if (room === null) return <div className="empty-state" role="alert"><span aria-hidden="true">?</span><h2>Room not found.</h2><Link className="action action-ghost" href={`/play/${network}`}>Choose a lobby</Link></div>;
  const phase = getPhase(room, now); const remaining = secondsRemaining(room, now); const joined = Boolean(entry); const revealed = Boolean(entry?.revealed);
  const join = async () => { setError(""); if (!client.connected) { await client.connect(); return; } try { const salt = generateSalt(); const commitment = await makeCommitment({ network, roomId: id, wallet: client.account, number, salt }); const result = await client.repository.commitNumber({ roomId: id, commitment }, setState); const next = await buildRevealTicket({ network, roomId: id.toString(), wallet: client.account, number, salt, commitment, commitTransactionId: result.hash }); await revealVault.put(next); setTicket(next); await load(); } catch (err) { setError(err instanceof Error ? err.message : "The pick could not be committed."); } };
  const reveal = async () => { if (!ticket) { setError("Import the reveal ticket created when you picked."); return; } try { await client.repository.revealNumber({ roomId: id, number: ticket.number, salt: ticket.salt }, setState); await revealVault.remove(ticket); setTicket(null); await load(); } catch (err) { setError(err instanceof Error ? err.message : "The number could not be revealed."); } };
  const finalize = async () => { try { await client.repository.finalizeRoom(id, setState); await load(); } catch (err) { setError(err instanceof Error ? err.message : "The room could not be settled."); } };
  const importTicket = async (file: File) => { try { const parsed = await parseRevealTicket(await file.text(), { network, contractId: contractId(network), roomId: id.toString(), wallet: client.account }); await revealVault.put(parsed); setTicket(parsed); setError(""); } catch (err) { setError(err instanceof Error ? err.message : "Ticket import failed."); } };
  const share = async () => { const url = canonicalRoomUrl(publicEnv.appUrl, network, id); if (navigator.share) await navigator.share({ title: `Odd One room #${id}`, text: "Pick low. Stay unique.", url }); else await navigator.clipboard.writeText(url); };
  return <><section className="room-header"><div><Link aria-label={`Back to the ${network === "celo" ? "Celo" : "Stacks"} lobby from room ${id.toString().padStart(4, "0")}`} className="back-link" href={`/play/${network}`}>← Lobby</Link><div className="room-title-line"><span className="mono">ROOM #{id.toString().padStart(4,"0")}</span><span className={`status-ribbon phase-${phase}`}>{phaseLabel(phase)}</span>{room.visibility === "unlisted" && <span className="status-ribbon muted"><LockKeyhole aria-hidden="true" focusable="false" size={12}/> Unlisted</span>}</div><h1>{phase === "commit" ? "Choose without being chosen." : phase === "reveal" ? "The curtain is up." : room.finalized ? roomResultCopy(room) : "The board is ready."}</h1></div><button type="button" className="icon-action" onClick={() => void share()} aria-label={`Share link for room ${id.toString().padStart(4, "0")}`}><Share2 aria-hidden="true" focusable="false"/></button></section>
  <div className="room-layout"><section className="arena-panel"><div className="arena-clock"><Clock3 aria-hidden="true" focusable="false"/><span>{phase === "commit" || phase === "reveal" ? formatCountdown(remaining) : "00:00"}</span><small>{phase === "commit" ? "until reveals" : phase === "reveal" ? "left to reveal" : phase === "awaiting-finalization" ? "waiting to settle" : "final"}</small></div><div className={`player-ring count-${players.length}`}>{players.map((player, index) => <div className={`ring-player player-${index}`} key={player.wallet}><PlayerSignal address={player.wallet}/><span>{phase === "settled" || phase === "awaiting-finalization" ? player.number || "–" : player.revealed ? "✓" : "?"}</span></div>)}<div className="ring-center"><strong>{room.committedCount}</strong><small>of 12 seats</small></div></div><div className="player-list">{players.map((player) => <div key={player.wallet}><PlayerSignal address={player.wallet} size={30}/><span className="mono">{shortAddress(player.wallet)}</span><span>{player.revealed ? "revealed" : phase === "commit" ? "committed" : "waiting"}</span></div>)}</div></section>
  <aside className="move-panel">{phase === "commit" && !joined && <><span className="eyebrow">Your move</span><h2>Pick in secret.</h2><NumberPicker selected={number} onSelect={setNumber}/><button type="button" className="action action-lime full-action" onClick={() => void join()}>{client.connected ? `Commit number ${number}` : "Connect wallet to pick"}</button></>}{phase === "commit" && joined && <><span className="eyebrow">Commitment locked</span><h2>Your number is under wraps.</h2><div className="sealed-number"><EyeOff aria-hidden="true" focusable="false"/><span>{ticket?.number ?? "?"}</span></div><p>Stay on this page or return when the reveal clock begins. Keep your ticket secret.</p>{ticket && <button type="button" className="action action-ghost full-action" onClick={() => { const link=document.createElement("a"); link.href=URL.createObjectURL(new Blob([JSON.stringify(ticket,null,2)])); link.download=ticketFilename(ticket); link.click(); }}>Download ticket</button>}</>}{phase === "reveal" && joined && !revealed && <><span className="eyebrow">Reveal window open</span><h2>Prove your pick.</h2>{ticket ? <div className="reveal-ready"><strong>{ticket.number}</strong><span>ticket found</span></div> : <TicketImporter onFile={importTicket}/>}<button type="button" className="action action-orange full-action" disabled={!ticket} onClick={() => void reveal()}>Reveal number</button></>}{phase === "reveal" && (!joined || revealed) && <><span className="eyebrow">Reveal in progress</span><h2>{revealed ? "Your number is live." : "Spectator mode."}</h2><div className="sealed-number"><Radio aria-hidden="true" focusable="false"/><span>{revealed ? entry?.number : "?"}</span></div><p>Counts stay concealed in the normal interface until the timer ends.</p></>}{phase === "awaiting-finalization" && <><span className="eyebrow">The choices are in</span><h2>Turn on the board.</h2><CountBoard counts={counts}/><button type="button" className="action action-lime full-action" onClick={() => void finalize()}>Finalize result</button></>}{phase === "settled" && <><span className="eyebrow">Official result</span><h2>{room.outcome === "winner" ? `Number ${room.winningNumber} wins.` : room.outcome === "draw" ? "Nobody stood alone." : "No contest."}</h2><CountBoard counts={counts}/>{room.winner && <Link className="winner-chip" href={`/play/${network}/profile/${room.winner}`}><Trophy aria-hidden="true" focusable="false"/><PlayerSignal address={room.winner}/><span><small>Winner · +105</small>{shortAddress(room.winner)}</span></Link>}</>}{error && <p className="form-error" role="alert">{error}</p>}<TransactionNotice state={state}/></aside></div></>;
}

function TicketImporter({ onFile }: { onFile(file: File): void }) { return <label className="ticket-import"><Upload aria-hidden="true" focusable="false"/><span>Import reveal ticket</span><input type="file" accept="application/json,.json" onChange={(event) => { const file=event.target.files?.[0]; if (file) onFile(file); }}/></label>; }
function CountBoard({ counts }: { counts: number[] }) {
  return <div className="count-board" role="list" aria-label="Reveal counts by number">{Array.from({ length: 20 }, (_, i) => {
    const count = counts[i] ?? 0;
    return <span role="listitem" aria-label={`Number ${i + 1} picked ${count} ${count === 1 ? "time" : "times"}`} className={count === 1 ? "unique" : count > 1 ? "duplicate" : ""} key={i}><strong aria-hidden="true">{i + 1}</strong><small aria-hidden="true">{count}</small></span>;
  })}</div>;
}

export function ProfileView({ network, address }: { network: Network; address: string }) { return <NetworkFrame network={network}>{(client) => <ProfileBody network={network} address={address} client={client}/>}</NetworkFrame>; }
function ProfileBody({ network, address, client }: { network: Network; address: string; client: ReturnType<typeof useNetworkClient> }) {
  const [stats,setStats]=useState<PlayerStats>(emptyStats); const [rooms,setRooms]=useState<OddOneRoom[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  useEffect(()=>{ const timer=window.setTimeout(()=>{if(!client.repository.configured){setLoading(false);return;} void (async()=>{try{const [nextStats,count]=await Promise.all([client.repository.getPlayerStats(address),client.repository.getPlayedCount(address)]); setStats(nextStats); const take=Number(count>12n?12n:count); const start=count-BigInt(take); const ids=take?await client.repository.getPlayedIds(address,start,take):[]; const items=(await Promise.all(ids.reverse().map((id)=>client.repository.getRoom(id)))).filter((room):room is OddOneRoom=>Boolean(room)); setRooms(items);}catch(err){setError(err instanceof Error?err.message:"Profile could not be loaded.");}finally{setLoading(false);}})();},0);return()=>window.clearTimeout(timer);},[address,client.repository]);
  if(!client.repository.configured)return <SetupState network={network}/>; if(loading)return <div className="empty-state" role="status" aria-live="polite" aria-atomic="true"><span aria-hidden="true">…</span><h2>Reading the player signal</h2></div>;
  const achievements=achievementTitles(stats); return <><section className="profile-hero"><Link aria-label={`Back to the ${network === "celo" ? "Celo" : "Stacks"} lobby from this player profile`} className="back-link" href={`/play/${network}`}>← Lobby</Link><div className="profile-identity"><PlayerSignal address={address} size={92}/><div><span className="eyebrow">{network} player</span><h1>{primaryTitle(stats.score)}</h1><p className="mono">{shortAddress(address,9)}</p></div></div><div className="score-orb"><strong>{stats.score.toString()}</strong><span>points</span></div></section>{error&&<p className="form-error" role="alert">{error}</p>}<section className="stat-grid"><article><strong>{stats.wins.toString()}</strong><span>Wins</span></article><article><strong>{stats.reveals.toString()}</strong><span>Reveals</span></article><article><strong>{stats.currentRevealStreak.toString()}</strong><span>Current streak</span></article><article><strong>{stats.bestRevealStreak.toString()}</strong><span>Best streak</span></article></section><section className="achievement-section"><div><span className="eyebrow">Unlocked titles</span><h2>The titles you earned.</h2></div><div className="achievement-list"><span className="unlocked">{primaryTitle(stats.score)}</span>{["Pattern Breaker","One of One","Unbroken"].map((title)=><span className={achievements.includes(title)?"unlocked":"locked"} key={title}>{title}</span>)}</div></section><section className="history-section"><div className="section-line"><h2>Recent rooms</h2><span className="mono">DIRECT CONTRACT HISTORY</span></div>{rooms.length?<div className="room-grid">{rooms.map((room)=><RoomCard room={room} key={room.id.toString()}/>)}</div>:<div className="empty-state compact"><span aria-hidden="true">?</span><h2>No rooms yet.</h2></div>}</section></>;
}
