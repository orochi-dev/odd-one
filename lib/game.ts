import type { Network, OddOneRoom, PlayerStats, RoomOutcome, RoomPhase } from "./types";

export const PAGE_SIZE = 12;
export const MAX_PLAYERS = 12;
export const MIN_REVEALS = 3;
export const MAX_NUMBER = 20;
export const COMMIT_SECONDS = 1200;
export const REVEAL_SECONDS = 600;
export const ZERO_EVM_ADDRESS = "0x0000000000000000000000000000000000000000";

export const outcomeByCode: Record<number, RoomOutcome> = { 0: "pending", 1: "winner", 2: "draw", 3: "no-contest" };

export function getPhase(room: OddOneRoom, now = Math.floor(Date.now() / 1000)): RoomPhase {
  if (room.finalized) return "settled";
  if (now < room.commitEndAt) return "commit";
  if (now < room.revealEndAt) return "reveal";
  return "awaiting-finalization";
}

export function phaseLabel(phase: RoomPhase) {
  return ({ commit: "Pick phase", reveal: "Reveal now", "awaiting-finalization": "Ready to settle", settled: "Final result" } as const)[phase];
}

export function secondsRemaining(room: OddOneRoom, now = Math.floor(Date.now() / 1000)) {
  const phase = getPhase(room, now);
  if (phase === "commit") return Math.max(0, room.commitEndAt - now);
  if (phase === "reveal") return Math.max(0, room.revealEndAt - now);
  return 0;
}

export function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

export function shortAddress(address: string, size = 5) {
  if (!address) return "Not connected";
  if (address.length <= size * 2 + 3) return address;
  return `${address.slice(0, size)}…${address.slice(-size)}`;
}

export function formatMoment(timestamp: number) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp * 1000));
}

export function canonicalRoomUrl(appUrl: string, network: Network, id: bigint | string) {
  return `${appUrl.replace(/\/$/, "")}/play/${network}/room/${id}`;
}

export function canonicalProfileUrl(appUrl: string, network: Network, address: string) {
  return `${appUrl.replace(/\/$/, "")}/play/${network}/profile/${address}`;
}

export function primaryTitle(score: bigint) {
  if (score >= 1500n) return "Odd Royalty";
  if (score >= 750n) return "Mindbender";
  if (score >= 250n) return "Outlier";
  if (score >= 25n) return "Reader";
  return "New Face";
}

export function achievementTitles(stats: PlayerStats) {
  const titles: string[] = [];
  if (stats.wins > 0n) titles.push("Pattern Breaker");
  if (stats.numberOneWins > 0n) titles.push("One of One");
  if (stats.bestRevealStreak >= 5n) titles.push("Unbroken");
  return titles;
}

export function isNetwork(value: string): value is Network { return value === "celo" || value === "stacks"; }
export function isNumberChoice(value: number) { return Number.isInteger(value) && value >= 1 && value <= MAX_NUMBER; }

export function roomResultCopy(room: OddOneRoom) {
  if (!room.finalized) return "The board is still in motion.";
  if (room.outcome === "no-contest") return "Not enough reveals. No contest.";
  if (room.outcome === "draw") return "Every low number found company. Draw.";
  return `Number ${room.winningNumber} stood alone.`;
}
