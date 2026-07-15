import { createPublicClient, createWalletClient, custom, decodeEventLog, defineChain, http, type Address, type EIP1193Provider, type Hex } from "viem";
import { oddOneCeloAbi } from "../celo-abi";
import { getCeloChainId, getCeloExplorer, getCeloRpc, publicEnv } from "../env";
import { outcomeByCode, ZERO_EVM_ADDRESS } from "../game";
import type { OddOneRepository, OddOneRoom, PlayerStats, TransactionObserver, TransactionResult } from "../types";
import { friendlyContractError } from "./errors";

export type InjectedProvider = EIP1193Provider & { isMiniPay?: boolean };
const chain = defineChain({ id: getCeloChainId(), name: publicEnv.celoNetwork === "celo" ? "Celo" : "Celo Sepolia", nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 }, rpcUrls: { default: { http: [getCeloRpc()] } }, blockExplorers: { default: { name: "Celo Explorer", url: getCeloExplorer() } } });
const publicClient = createPublicClient({ chain, transport: http(getCeloRpc()) });

function values(raw: unknown) { return Array.isArray(raw) ? raw : Object.values(raw as Record<string, unknown>); }
function mapRoom(raw: unknown, network: "celo" = "celo"): OddOneRoom {
  const item = values(raw) as [bigint, Address, boolean, bigint, bigint, bigint, number, number, boolean, number, number, Address];
  return { id: item[0], network, creator: item[1], visibility: item[2] ? "public" : "unlisted", createdAt: Number(item[3]), commitEndAt: Number(item[4]), revealEndAt: Number(item[5]), committedCount: Number(item[6]), revealedCount: Number(item[7]), finalized: item[8], outcome: outcomeByCode[Number(item[9])] || "pending", winningNumber: Number(item[10]) || null, winner: item[11] === ZERO_EVM_ADDRESS ? null : item[11] };
}
function mapStats(raw: unknown): PlayerStats {
  const item = values(raw) as bigint[];
  return { score: item[0], roomsPlayed: item[1], reveals: item[2], wins: item[3], numberOneWins: item[4], currentRevealStreak: item[5], bestRevealStreak: item[6] };
}

export function createCeloRepository(provider?: InjectedProvider, account?: string): OddOneRepository {
  const address = publicEnv.celoContractAddress as Address;
  const wallet = provider ? createWalletClient({ account: account as Address | undefined, chain, transport: custom(provider) }) : null;
  const read = async <T>(functionName: string, args: readonly unknown[] = []) => publicClient.readContract({ address, abi: oddOneCeloAbi, functionName: functionName as never, args: args as never }) as Promise<T>;
  const write = async (functionName: string, args: readonly unknown[], observer?: TransactionObserver): Promise<TransactionResult> => {
    if (!wallet || !account) throw new Error("Connect a Celo wallet first.");
    observer?.({ phase: "awaiting-signature", message: "Approve the move in your Celo wallet." });
    try {
      const hash = await wallet.writeContract({ address, abi: oddOneCeloAbi, functionName: functionName as never, args: args as never, account: account as Address, chain });
      const explorerUrl = `${getCeloExplorer()}/tx/${hash}`;
      observer?.({ phase: "confirming", message: "Move submitted. Waiting for Celo.", hash, explorerUrl });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      let roomId: bigint | undefined;
      if (functionName === "createRoom") for (const log of receipt.logs) {
        try { const decoded = decodeEventLog({ abi: oddOneCeloAbi, data: log.data, topics: log.topics }); if (decoded.eventName === "RoomCreated") roomId = (decoded.args as unknown as { roomId: bigint }).roomId; } catch { /* another event */ }
      }
      observer?.({ phase: "confirmed", message: "Move confirmed on Celo.", hash, explorerUrl });
      return { hash, explorerUrl, roomId };
    } catch (error) { throw friendlyContractError(error); }
  };
  return {
    network: "celo", configured: Boolean(address), getTotalRooms: () => read<bigint>("totalRooms"),
    async getRoom(id) { try { return mapRoom(await read("getRoom", [id])); } catch (error) { if (String(error).includes("RoomNotFound")) return null; throw friendlyContractError(error); } },
    async getPlayerEntry(id, owner) { const item = values(await read("getEntry", [id, owner as Address])) as [Hex, boolean, number]; return item[0] === `0x${"0".repeat(64)}` ? null : { wallet: owner, committed: true, revealed: item[1], number: item[1] ? Number(item[2]) : null }; },
    async getParticipants(id) { const room = await this.getRoom(id); if (!room) return []; const owners = await Promise.all(Array.from({ length: room.committedCount }, (_, i) => read<Address>("getParticipant", [id, i]))); return Promise.all(owners.map((owner) => this.getPlayerEntry(id, owner).then((entry) => entry!))); },
    async getNumberCounts(id) { return Promise.all(Array.from({ length: 20 }, (_, i) => read<number>("getNumberCount", [id, i + 1]).then(Number))); },
    async getPlayerStats(owner) { return mapStats(await read("getPlayerStats", [owner as Address])); },
    getCreatedCount: (owner) => read("getCreatedCount", [owner as Address]), getPlayedCount: (owner) => read("getPlayedCount", [owner as Address]),
    async getCreatedIds(owner, start, count) { return Promise.all(Array.from({ length: count }, (_, i) => read<bigint>("getCreatedId", [owner as Address, start + BigInt(i)]))); },
    async getPlayedIds(owner, start, count) { return Promise.all(Array.from({ length: count }, (_, i) => read<bigint>("getPlayedId", [owner as Address, start + BigInt(i)]))); },
    createRoom: (input, observer) => write("createRoom", [input.commitment as Hex, input.listed], observer),
    commitNumber: (input, observer) => write("commitNumber", [input.roomId, input.commitment as Hex], observer),
    revealNumber: (input, observer) => write("revealNumber", [input.roomId, input.number, input.salt as Hex], observer),
    finalizeRoom: (id, observer) => write("finalizeRoom", [id], observer)
  };
}
export { chain as celoChain };
