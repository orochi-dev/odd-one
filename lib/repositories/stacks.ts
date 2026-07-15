import { getStacksApi, publicEnv, txExplorerUrl } from "../env";
import { outcomeByCode } from "../game";
import type { OddOneRepository, OddOneRoom, PlayerStats, TransactionObserver, TransactionResult } from "../types";
import { friendlyContractError } from "./errors";

type ClarityJson = { type?: string; value?: unknown; data?: unknown };
const contract = () => ({ address: publicEnv.stacksContractAddress, name: publicEnv.stacksContractName });
function unwrap(value: unknown): unknown { const item = value as ClarityJson; const type = item?.type?.toLowerCase() || ""; if ((type.includes("response") || type.includes("optional") || type === "ok" || type === "some") && !type.includes("err") && "value" in item) return unwrap(item.value); return value; }
function scalar(value: unknown): unknown { const item = unwrap(value) as ClarityJson; return item && typeof item === "object" && "value" in item ? scalar(item.value) : item; }
function asBigInt(value: unknown) { return BigInt(String(scalar(value) ?? 0)); }
function asString(value: unknown) { const item = scalar(value); return typeof item === "string" ? item : ""; }
function asBool(value: unknown) { const item = scalar(value); return item === true || item === "true"; }
function optionalPrincipal(value: unknown) { const item = value as ClarityJson; if (item?.type?.toLowerCase().includes("none") || item?.value === null) return null; return asString(value) || null; }
function tuple(value: unknown) { const item = unwrap(value) as ClarityJson; const result = item?.value ?? item?.data ?? item; return result && typeof result === "object" ? result as Record<string, unknown> : null; }

async function readOnly(functionName: string, args: unknown[], sender: string) {
  const { fetchCallReadOnlyFunction, cvToJSON } = await import("@stacks/transactions");
  const response = await fetchCallReadOnlyFunction({ contractAddress: contract().address, contractName: contract().name, functionName, functionArgs: args as never, senderAddress: sender || contract().address || "ST000000000000000000002AMW42H", network: publicEnv.stacksNetwork });
  return cvToJSON(response);
}

function mapRoom(value: unknown, id: bigint): OddOneRoom | null {
  const item = tuple(value); if (!item) return null;
  const winner = optionalPrincipal(item.winner);
  return { id, network: "stacks", creator: asString(item.creator), visibility: asBool(item.listed) ? "public" : "unlisted", createdAt: Number(asBigInt(item["created-at"])), commitEndAt: Number(asBigInt(item["commit-end-at"])), revealEndAt: Number(asBigInt(item["reveal-end-at"])), committedCount: Number(asBigInt(item["committed-count"])), revealedCount: Number(asBigInt(item["revealed-count"])), finalized: asBool(item.finalized), outcome: outcomeByCode[Number(asBigInt(item.outcome))] || "pending", winner, winningNumber: Number(asBigInt(item["winning-number"])) || null };
}
function mapStats(value: unknown): PlayerStats { const item = tuple(value) || {}; return { score: asBigInt(item.score), roomsPlayed: asBigInt(item["rooms-played"]), reveals: asBigInt(item.reveals), wins: asBigInt(item.wins), numberOneWins: asBigInt(item["number-one-wins"]), currentRevealStreak: asBigInt(item["current-streak"]), bestRevealStreak: asBigInt(item["best-streak"]) }; }

export function createStacksRepository(account = ""): OddOneRepository {
  const waitForConfirmation = async (hash: string) => {
    for (let attempt = 0; attempt < 90; attempt++) {
      const response = await fetch(`${getStacksApi()}/extended/v1/tx/${hash}`);
      if (response.ok) {
        const result = await response.json() as { tx_status?: string; events?: Array<{ contract_log?: { value?: { repr?: string } } }> };
        if (result.tx_status === "success") return result;
        if (result.tx_status?.startsWith("abort") || result.tx_status?.startsWith("dropped")) throw new Error(`Stacks transaction ended with ${result.tx_status}.`);
      }
      await new Promise((resolve) => window.setTimeout(resolve, 2000));
    }
    throw new Error("The Stacks transaction is still pending. Refresh after it confirms.");
  };
  const call = async (functionName: string, functionArgs: unknown[], observer?: TransactionObserver): Promise<TransactionResult> => {
    if (!account) throw new Error("Connect a Stacks wallet first.");
    const { request } = await import("@stacks/connect");
    observer?.({ phase: "awaiting-signature", message: "Approve the move in your Stacks wallet." });
    try {
      const response = await request("stx_callContract", { contract: `${contract().address}.${contract().name}` as `${string}.${string}`, functionName, functionArgs: functionArgs as never, network: publicEnv.stacksNetwork });
      const hash = response.txid || ""; if (!hash) throw new Error("The wallet did not return a transaction ID.");
      const explorerUrl = txExplorerUrl("stacks", hash);
      observer?.({ phase: "confirming", message: "Move submitted. Waiting for Stacks.", hash, explorerUrl });
      const receipt = await waitForConfirmation(hash);
      const repr = receipt.events?.map((event) => event.contract_log?.value?.repr || "").join(" ") || "";
      const roomId = functionName === "create-room" ? BigInt(repr.match(/room-id: u(\d+)/)?.[1] || 0) || undefined : undefined;
      observer?.({ phase: "confirmed", message: "Move confirmed on Stacks.", hash, explorerUrl });
      return { hash, explorerUrl, roomId };
    } catch (error) { throw friendlyContractError(error); }
  };
  return {
    network: "stacks", configured: Boolean(contract().address && contract().name),
    async getTotalRooms() { return asBigInt(await readOnly("get-total-rooms", [], account || contract().address)); },
    async getRoom(id) { try { return mapRoom(await readOnly("get-room", [(await import("@stacks/transactions")).Cl.uint(id)], account || contract().address), id); } catch { return null; } },
    async getPlayerEntry(id, owner) { const { Cl } = await import("@stacks/transactions"); try { const item = tuple(await readOnly("get-entry", [Cl.uint(id), Cl.principal(owner)], owner)); return item ? { wallet: owner, committed: true, revealed: asBool(item.revealed), number: asBool(item.revealed) ? Number(asBigInt(item.number)) : null } : null; } catch { return null; } },
    async getParticipants(id) { const room = await this.getRoom(id); if (!room) return []; const { Cl } = await import("@stacks/transactions"); const owners = await Promise.all(Array.from({ length: room.committedCount }, (_, i) => readOnly("get-participant", [Cl.uint(id), Cl.uint(i)], account || contract().address).then(asString))); return Promise.all(owners.map((owner) => this.getPlayerEntry(id, owner).then((entry) => entry!))); },
    async getNumberCounts(id) { const { Cl } = await import("@stacks/transactions"); return Promise.all(Array.from({ length: 20 }, (_, i) => readOnly("get-number-count", [Cl.uint(id), Cl.uint(i + 1)], account || contract().address).then((value) => Number(asBigInt(value))))); },
    async getPlayerStats(owner) { const { Cl } = await import("@stacks/transactions"); return mapStats(await readOnly("get-player-stats", [Cl.principal(owner)], owner)); },
    async getCreatedCount(owner) { const { Cl } = await import("@stacks/transactions"); return asBigInt(await readOnly("get-created-count", [Cl.principal(owner)], owner)); },
    async getPlayedCount(owner) { const { Cl } = await import("@stacks/transactions"); return asBigInt(await readOnly("get-played-count", [Cl.principal(owner)], owner)); },
    async getCreatedIds(owner, start, count) { const { Cl } = await import("@stacks/transactions"); return Promise.all(Array.from({ length: count }, (_, i) => readOnly("get-created-id", [Cl.principal(owner), Cl.uint(start + BigInt(i))], owner).then(asBigInt))); },
    async getPlayedIds(owner, start, count) { const { Cl } = await import("@stacks/transactions"); return Promise.all(Array.from({ length: count }, (_, i) => readOnly("get-played-id", [Cl.principal(owner), Cl.uint(start + BigInt(i))], owner).then(asBigInt))); },
    async createRoom(input, observer) { const { Cl } = await import("@stacks/transactions"); return call("create-room", [Cl.bufferFromHex(input.commitment.replace(/^0x/, "")), Cl.bool(input.listed)], observer); },
    async commitNumber(input, observer) { const { Cl } = await import("@stacks/transactions"); return call("commit-number", [Cl.uint(input.roomId), Cl.bufferFromHex(input.commitment.replace(/^0x/, ""))], observer); },
    async revealNumber(input, observer) { const { Cl } = await import("@stacks/transactions"); return call("reveal-number", [Cl.uint(input.roomId), Cl.uint(input.number), Cl.bufferFromHex(input.salt.replace(/^0x/, ""))], observer); },
    async finalizeRoom(id, observer) { const { Cl } = await import("@stacks/transactions"); return call("finalize-room", [Cl.uint(id)], observer); }
  };
}
export const stacksParsing = { unwrap, asBigInt, asString, asBool, optionalPrincipal, tuple, mapRoom, mapStats };
