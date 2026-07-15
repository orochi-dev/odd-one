import { beforeEach, describe, expect, it } from "vitest";
import { initSimnet, type Simnet } from "@stacks/clarinet-sdk";
import { Cl } from "@stacks/transactions";
import { makeCommitment as makeFrontendCommitment } from "../../lib/commitment";

let simnet: Simnet;
let players: string[];
const CONTRACT = "odd-one-arena";
const salt = (value: number) => Cl.bufferFromHex(value.toString(16).padStart(64, "0"));

function makeCommitment(roomId: number, player: string, number: number, saltValue: number) {
  const result = simnet.callReadOnlyFn(CONTRACT, "make-commitment", [Cl.uint(roomId), Cl.principal(player), Cl.uint(number), salt(saltValue)], player);
  const printed = Cl.prettyPrint(result.result);
  return Cl.bufferFromHex(printed.match(/0x([0-9a-f]{64})/)![1]);
}

describe("odd-one-arena", () => {
  beforeEach(async () => {
    simnet = await initSimnet("./Clarinet.toml", true);
    players = [...simnet.getAccounts().values()];
  });

  it("creates and indexes the creator", () => {
    const result = simnet.callPublicFn(CONTRACT, "create-room", [makeCommitment(0, players[0], 4, 1), Cl.bool(true)], players[0]);
    expect(Cl.prettyPrint(result.result)).toBe("(ok u1)");
    expect(Cl.prettyPrint(simnet.callReadOnlyFn(CONTRACT, "get-created-count", [Cl.principal(players[0])], players[0]).result)).toBe("(ok u1)");
    expect(Cl.prettyPrint(simnet.callReadOnlyFn(CONTRACT, "get-played-id", [Cl.principal(players[0]), Cl.uint(0)], players[0]).result)).toBe("(ok u1)");
  });

  it("matches the frontend Clarity serialization fixture", async () => {
    const contractValue = makeCommitment(7, players[0], 6, 44);
    const frontendValue = await makeFrontendCommitment({ network: "stacks", roomId: 7n, wallet: players[0], number: 6, salt: `0x${(44).toString(16).padStart(64, "0")}` });
    expect(Cl.prettyPrint(contractValue)).toBe(frontendValue);
  });

  it("blocks duplicate and parallel active entries", () => {
    simnet.callPublicFn(CONTRACT, "create-room", [makeCommitment(0, players[0], 4, 1), Cl.bool(true)], players[0]);
    expect(Cl.prettyPrint(simnet.callPublicFn(CONTRACT, "commit-number", [Cl.uint(1), makeCommitment(1, players[0], 5, 2)], players[0]).result)).toBe("(err u408)");
    expect(Cl.prettyPrint(simnet.callPublicFn(CONTRACT, "create-room", [makeCommitment(2, players[0], 5, 2), Cl.bool(true)], players[0]).result)).toBe("(err u409)");
  });

  it("rejects reveal during the commitment phase", () => {
    simnet.callPublicFn(CONTRACT, "create-room", [makeCommitment(0, players[0], 4, 1), Cl.bool(true)], players[0]);
    expect(Cl.prettyPrint(simnet.callPublicFn(CONTRACT, "reveal-number", [Cl.uint(1), Cl.uint(4), salt(1)], players[0]).result)).toBe("(err u404)");
  });

  it("selects the lowest unique number and awards equivalent points", () => {
    const picks = [1, 1, 2, 4];
    simnet.callPublicFn(CONTRACT, "create-room", [makeCommitment(0, players[0], picks[0], 10), Cl.bool(true)], players[0]);
    for (let index = 1; index < picks.length; index++) {
      simnet.callPublicFn(CONTRACT, "commit-number", [Cl.uint(1), makeCommitment(1, players[index], picks[index], 10 + index)], players[index]);
    }
    simnet.mineEmptyBlocks(2);
    for (let index = 0; index < picks.length; index++) {
      expect(Cl.prettyPrint(simnet.callPublicFn(CONTRACT, "reveal-number", [Cl.uint(1), Cl.uint(picks[index]), salt(10 + index)], players[index]).result)).toBe("(ok true)");
    }
    simnet.mineEmptyBlock();
    expect(Cl.prettyPrint(simnet.callPublicFn(CONTRACT, "finalize-room", [Cl.uint(1)], players[0]).result)).toBe("(ok u1)");
    const winnerStats = simnet.callReadOnlyFn(CONTRACT, "get-player-stats", [Cl.principal(players[2])], players[2]);
    expect(Cl.prettyPrint(winnerStats.result)).toContain("score: u105");
    expect(Cl.prettyPrint(winnerStats.result)).toContain("wins: u1");
  });

  it("settles no-contest below three reveals", () => {
    simnet.callPublicFn(CONTRACT, "create-room", [makeCommitment(0, players[0], 1, 1), Cl.bool(false)], players[0]);
    simnet.callPublicFn(CONTRACT, "commit-number", [Cl.uint(1), makeCommitment(1, players[1], 2, 2)], players[1]);
    simnet.mineEmptyBlocks(3);
    expect(Cl.prettyPrint(simnet.callPublicFn(CONTRACT, "finalize-room", [Cl.uint(1)], players[2]).result)).toBe("(ok u3)");
    expect(Cl.prettyPrint(simnet.callPublicFn(CONTRACT, "finalize-room", [Cl.uint(1)], players[2]).result)).toBe("(err u414)");
  });

  it("enforces the commit and reveal boundaries", () => {
    simnet.callPublicFn(CONTRACT, "create-room", [makeCommitment(0, players[0], 3, 3), Cl.bool(true)], players[0]);
    simnet.mineEmptyBlocks(2);
    expect(Cl.prettyPrint(simnet.callPublicFn(CONTRACT, "commit-number", [Cl.uint(1), makeCommitment(1, players[1], 4, 4)], players[1]).result)).toBe("(err u403)");
    expect(Cl.prettyPrint(simnet.callPublicFn(CONTRACT, "reveal-number", [Cl.uint(1), Cl.uint(3), salt(3)], players[0]).result)).toBe("(ok true)");
    simnet.mineEmptyBlock();
    expect(Cl.prettyPrint(simnet.callPublicFn(CONTRACT, "reveal-number", [Cl.uint(1), Cl.uint(3), salt(3)], players[0]).result)).toBe("(err u405)");
  });

  it("exposes stable missing room and index errors", () => {
    expect(Cl.prettyPrint(simnet.callReadOnlyFn(CONTRACT, "get-room", [Cl.uint(99)], players[0]).result)).toBe("(err u402)");
    expect(Cl.prettyPrint(simnet.callReadOnlyFn(CONTRACT, "get-created-id", [Cl.principal(players[0]), Cl.uint(0)], players[0]).result)).toBe("(err u415)");
  });
});
