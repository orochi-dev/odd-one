export type Network = "celo" | "stacks";
export type RoomVisibility = "public" | "unlisted";
export type RoomPhase = "commit" | "reveal" | "awaiting-finalization" | "settled";
export type RoomOutcome = "pending" | "winner" | "draw" | "no-contest";

export type OddOneRoom = {
  id: bigint;
  network: Network;
  creator: string;
  visibility: RoomVisibility;
  createdAt: number;
  commitEndAt: number;
  revealEndAt: number;
  committedCount: number;
  revealedCount: number;
  finalized: boolean;
  outcome: RoomOutcome;
  winner: string | null;
  winningNumber: number | null;
};

export type PlayerEntry = { wallet: string; committed: boolean; revealed: boolean; number: number | null };
export type PlayerStats = {
  score: bigint; roomsPlayed: bigint; reveals: bigint; wins: bigint; numberOneWins: bigint;
  currentRevealStreak: bigint; bestRevealStreak: bigint;
};

export type RevealTicket = {
  version: 1; network: Network; networkId: string; contractId: string; roomId: string; wallet: string;
  number: number; salt: string; commitment: string; commitTransactionId: string | null; createdAt: number; checksum: string;
};

export type TransactionPhase = "idle" | "connecting" | "awaiting-signature" | "submitted" | "confirming" | "confirmed" | "rejected" | "failed";
export type TransactionState = { phase: TransactionPhase; message: string; hash?: string; explorerUrl?: string };
export type TransactionObserver = (state: TransactionState) => void;
export type TransactionResult = { hash: string; explorerUrl: string; roomId?: bigint };
export type CreateRoomInput = { listed: boolean; commitment: string };
export type CommitNumberInput = { roomId: bigint; commitment: string };
export type RevealNumberInput = { roomId: bigint; number: number; salt: string };

export interface OddOneRepository {
  readonly network: Network;
  readonly configured: boolean;
  getTotalRooms(): Promise<bigint>;
  getRoom(id: bigint): Promise<OddOneRoom | null>;
  getPlayerEntry(id: bigint, address: string): Promise<PlayerEntry | null>;
  getParticipants(id: bigint): Promise<PlayerEntry[]>;
  getNumberCounts(id: bigint): Promise<number[]>;
  getPlayerStats(address: string): Promise<PlayerStats>;
  getCreatedCount(address: string): Promise<bigint>;
  getPlayedCount(address: string): Promise<bigint>;
  getCreatedIds(address: string, start: bigint, count: number): Promise<bigint[]>;
  getPlayedIds(address: string, start: bigint, count: number): Promise<bigint[]>;
  createRoom(input: CreateRoomInput, observer?: TransactionObserver): Promise<TransactionResult>;
  commitNumber(input: CommitNumberInput, observer?: TransactionObserver): Promise<TransactionResult>;
  revealNumber(input: RevealNumberInput, observer?: TransactionObserver): Promise<TransactionResult>;
  finalizeRoom(id: bigint, observer?: TransactionObserver): Promise<TransactionResult>;
}
