import { expect } from "chai";
import { network } from "hardhat";
import type { BaseContract, ContractRunner, ContractTransactionResponse } from "ethers";

type Connection = Awaited<ReturnType<typeof network.create>>;
type Arena = BaseContract & {
  createRoom(commitment: string, listed: boolean): Promise<ContractTransactionResponse>;
  commitNumber(id: number, commitment: string): Promise<ContractTransactionResponse>;
  revealNumber(id: number, number: number, salt: string): Promise<ContractTransactionResponse>;
  finalizeRoom(id: number): Promise<ContractTransactionResponse>;
  computeCommitment(id: number, player: string, number: number, salt: string): Promise<string>;
  getRoom(id: number): Promise<{ committedCount: bigint; revealedCount: bigint; finalized: boolean; outcome: bigint; winningNumber: bigint; winner: string; listed: boolean }>;
  getEntry(id: number, player: string): Promise<{ revealed: boolean; number: bigint }>;
  getParticipant(id: number, index: number): Promise<string>;
  getNumberCount(id: number, number: number): Promise<bigint>;
  getPlayerStats(player: string): Promise<{ score: bigint; roomsPlayed: bigint; reveals: bigint; wins: bigint; numberOneWins: bigint; currentRevealStreak: bigint; bestRevealStreak: bigint }>;
  getCreatedCount(player: string): Promise<bigint>;
  getPlayedCount(player: string): Promise<bigint>;
  getCreatedId(player: string, index: number): Promise<bigint>;
  getPlayedId(player: string, index: number): Promise<bigint>;
};

const connected = (contract: BaseContract, runner: ContractRunner) => contract.connect(runner) as unknown as Arena;
const salt = (value: number) => `0x${value.toString(16).padStart(64, "0")}`;

describe("OddOneArena", function () {
  let ethers: Connection["ethers"];
  before(async () => { ({ ethers } = await network.create()); });

  async function fixture() {
    const signers = await ethers.getSigners();
    const arena = (await (await ethers.getContractFactory("OddOneArena")).deploy()) as unknown as Arena;
    await arena.waitForDeployment();
    return { arena, signers };
  }

  async function commitment(arena: Arena, room: number, player: string, number: number, saltValue: number) {
    return arena.computeCommitment(room, player, number, salt(saltValue));
  }

  async function move(seconds: number) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine", []);
  }

  it("creates a listed room, commits the creator and indexes history", async () => {
    const { arena, signers } = await fixture();
    const hash = await commitment(arena, 0, signers[0].address, 4, 1);
    await expect(connected(arena, signers[0]).createRoom(hash, true)).to.emit(arena, "RoomCreated");
    const room = await arena.getRoom(1);
    expect(room.listed).to.equal(true);
    expect(room.committedCount).to.equal(1);
    expect(await arena.getParticipant(1, 0)).to.equal(signers[0].address);
    expect(await arena.getCreatedCount(signers[0].address)).to.equal(1);
    expect(await arena.getPlayedId(signers[0].address, 0)).to.equal(1);
  });

  it("matches the frontend ABI commitment fixture", async () => {
    const { arena, signers } = await fixture();
    const contractAddress = await arena.getAddress();
    const network = await ethers.provider.getNetwork();
    const expected = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256", "uint256", "address", "uint8", "bytes32"],
      [contractAddress, network.chainId, 9, signers[0].address, 6, salt(44)]
    ));
    expect(await arena.computeCommitment(9, signers[0].address, 6, salt(44))).to.equal(expected);
  });

  it("enforces capacity, duplicate commitments and one active room", async () => {
    const { arena, signers } = await fixture();
    await connected(arena, signers[0]).createRoom(await commitment(arena, 0, signers[0].address, 1, 1), false);
    await expect(connected(arena, signers[0]).createRoom(salt(99), true)).to.be.revertedWithCustomError(arena, "ActiveRoomExists");
    for (let index = 1; index < 12; index++) {
      await connected(arena, signers[index]).commitNumber(1, await commitment(arena, 1, signers[index].address, index + 1, index + 1));
    }
    await expect(connected(arena, signers[1]).commitNumber(1, salt(42))).to.be.revertedWithCustomError(arena, "RoomFull");
    expect((await arena.getRoom(1)).committedCount).to.equal(12);
  });

  it("enforces phase boundaries and commitment integrity", async () => {
    const { arena, signers } = await fixture();
    await connected(arena, signers[0]).createRoom(await commitment(arena, 0, signers[0].address, 7, 7), true);
    await expect(connected(arena, signers[0]).revealNumber(1, 7, salt(7))).to.be.revertedWithCustomError(arena, "RevealNotOpen");
    await move(1200);
    await expect(connected(arena, signers[1]).commitNumber(1, salt(1))).to.be.revertedWithCustomError(arena, "CommitClosed");
    await expect(connected(arena, signers[0]).revealNumber(1, 6, salt(7))).to.be.revertedWithCustomError(arena, "InvalidReveal");
    await expect(connected(arena, signers[0]).revealNumber(1, 7, salt(7))).to.emit(arena, "NumberRevealed").withArgs(1, signers[0].address, 7);
    await expect(connected(arena, signers[0]).revealNumber(1, 7, salt(7))).to.be.revertedWithCustomError(arena, "AlreadyRevealed");
  });

  it("selects the lowest unique number and awards points", async () => {
    const { arena, signers } = await fixture();
    const picks = [1, 1, 2, 4];
    await connected(arena, signers[0]).createRoom(await commitment(arena, 0, signers[0].address, picks[0], 10), true);
    for (let i = 1; i < picks.length; i++) {
      await connected(arena, signers[i]).commitNumber(1, await commitment(arena, 1, signers[i].address, picks[i], 10 + i));
    }
    await move(1200);
    for (let i = 0; i < picks.length; i++) await connected(arena, signers[i]).revealNumber(1, picks[i], salt(10 + i));
    await move(600);
    await expect(arena.finalizeRoom(1)).to.emit(arena, "RoomFinalized").withArgs(1, 1, signers[2].address, 2, 4);
    const result = await arena.getRoom(1);
    expect(result.winner).to.equal(signers[2].address);
    expect(result.winningNumber).to.equal(2);
    expect((await arena.getPlayerStats(signers[2].address)).score).to.equal(105);
    expect((await arena.getPlayerStats(signers[0].address)).score).to.equal(5);
  });

  it("records a number-one win and history stats", async () => {
    const { arena, signers } = await fixture();
    const picks = [1, 2, 2];
    await connected(arena, signers[0]).createRoom(await commitment(arena, 0, signers[0].address, 1, 1), true);
    for (let i = 1; i < 3; i++) await connected(arena, signers[i]).commitNumber(1, await commitment(arena, 1, signers[i].address, 2, i + 1));
    await move(1200);
    for (let i = 0; i < 3; i++) await connected(arena, signers[i]).revealNumber(1, picks[i], salt(i + 1));
    await move(600);
    await arena.finalizeRoom(1);
    const player = await arena.getPlayerStats(signers[0].address);
    expect(player.numberOneWins).to.equal(1);
    expect(player.wins).to.equal(1);
    expect(player.bestRevealStreak).to.equal(1);
  });

  it("settles no-contest and draw outcomes", async () => {
    const { arena, signers } = await fixture();
    await connected(arena, signers[0]).createRoom(await commitment(arena, 0, signers[0].address, 1, 1), true);
    await connected(arena, signers[1]).commitNumber(1, await commitment(arena, 1, signers[1].address, 2, 2));
    await move(1800);
    await arena.finalizeRoom(1);
    expect((await arena.getRoom(1)).outcome).to.equal(3);

    await connected(arena, signers[0]).createRoom(await commitment(arena, 0, signers[0].address, 3, 3), true);
    for (let i = 1; i < 4; i++) await connected(arena, signers[i]).commitNumber(2, await commitment(arena, 2, signers[i].address, i < 2 ? 3 : 4, i + 3));
    await move(1200);
    const drawPicks = [3, 3, 4, 4];
    for (let i = 0; i < 4; i++) await connected(arena, signers[i]).revealNumber(2, drawPicks[i], salt(i + 3));
    await move(600);
    await arena.finalizeRoom(2);
    expect((await arena.getRoom(2)).outcome).to.equal(2);
  });

  it("resets the effective streak after a missed reveal", async () => {
    const { arena, signers } = await fixture();
    await connected(arena, signers[0]).createRoom(await commitment(arena, 0, signers[0].address, 5, 1), true);
    await move(1800);
    expect((await arena.getPlayerStats(signers[0].address)).currentRevealStreak).to.equal(0);
    await connected(arena, signers[0]).createRoom(await commitment(arena, 0, signers[0].address, 6, 2), true);
    expect((await arena.getPlayerStats(signers[0].address)).currentRevealStreak).to.equal(0);
  });

  it("rejects early and duplicate finalization, missing rooms and hidden counts", async () => {
    const { arena, signers } = await fixture();
    await connected(arena, signers[0]).createRoom(await commitment(arena, 0, signers[0].address, 1, 1), true);
    await expect(arena.getNumberCount(1, 1)).to.be.revertedWithCustomError(arena, "RevealStillOpen");
    await expect(arena.finalizeRoom(1)).to.be.revertedWithCustomError(arena, "TooEarlyToFinalize");
    await move(1800);
    await arena.finalizeRoom(1);
    await expect(arena.finalizeRoom(1)).to.be.revertedWithCustomError(arena, "AlreadyFinalized");
    await expect(arena.getRoom(2)).to.be.revertedWithCustomError(arena, "RoomNotFound");
  });
});
