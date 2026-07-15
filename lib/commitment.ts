import { encodeAbiParameters, keccak256, type Address, type Hex } from "viem";
import { contractId, getCeloChainId, networkId, publicEnv } from "./env";
import type { Network, RevealTicket } from "./types";

export function generateSalt(): Hex {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export async function makeCommitment(input: { network: Network; roomId: bigint; wallet: string; number: number; salt: string }) {
  if (input.network === "celo") {
    const encoded = encodeAbiParameters(
      [{ type: "address" }, { type: "uint256" }, { type: "uint256" }, { type: "address" }, { type: "uint8" }, { type: "bytes32" }],
      [publicEnv.celoContractAddress as Address, BigInt(getCeloChainId()), input.roomId, input.wallet as Address, input.number, input.salt as Hex]
    );
    return keccak256(encoded);
  }
  const { Cl, serializeCV } = await import("@stacks/transactions");
  const value = Cl.tuple({
    domain: Cl.stringAscii("odd-one-stacks-v1"),
    "room-id": Cl.uint(input.roomId),
    player: Cl.principal(input.wallet),
    number: Cl.uint(input.number),
    salt: Cl.bufferFromHex(input.salt.replace(/^0x/, ""))
  });
  const serialized = serializeCV(value);
  const bytes = Uint8Array.from((serialized.startsWith("0x") ? serialized.slice(2) : serialized).match(/.{2}/g) || [], (value) => Number.parseInt(value, 16));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `0x${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function buildRevealTicket(input: Omit<RevealTicket, "version" | "networkId" | "contractId" | "createdAt" | "checksum">): Promise<RevealTicket> {
  const base = {
    version: 1 as const,
    network: input.network,
    networkId: networkId(input.network),
    contractId: contractId(input.network),
    roomId: input.roomId,
    wallet: input.wallet,
    number: input.number,
    salt: input.salt,
    commitment: input.commitment,
    commitTransactionId: input.commitTransactionId,
    createdAt: Math.floor(Date.now() / 1000)
  };
  return { ...base, checksum: await sha256(JSON.stringify(base)) };
}

export async function parseRevealTicket(raw: string, expected?: Partial<Pick<RevealTicket, "network" | "contractId" | "roomId" | "wallet">>) {
  const parsed = JSON.parse(raw) as RevealTicket;
  if (parsed.version !== 1 || !["celo", "stacks"].includes(parsed.network) || !/^0x[0-9a-fA-F]{64}$/.test(parsed.salt) || !/^0x[0-9a-fA-F]{64}$/.test(parsed.commitment) || parsed.number < 1 || parsed.number > 20) {
    throw new Error("This reveal ticket is not valid.");
  }
  const { checksum, ...base } = parsed;
  if (checksum !== await sha256(JSON.stringify(base))) throw new Error("This reveal ticket was changed or corrupted.");
  for (const key of ["network", "contractId", "roomId", "wallet"] as const) {
    const wanted = expected?.[key];
    if (wanted && String(parsed[key]).toLowerCase() !== String(wanted).toLowerCase()) throw new Error(`This ticket belongs to a different ${key.replace(/Id$/, "").toLowerCase()}.`);
  }
  return parsed;
}

export function ticketFilename(ticket: RevealTicket) { return `odd-one-${ticket.network}-room-${ticket.roomId}.reveal.json`; }
