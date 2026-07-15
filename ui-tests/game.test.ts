import { describe, expect, it } from "vitest";
import { achievementTitles, canonicalRoomUrl, formatCountdown, getPhase, primaryTitle } from "@/lib/game";
import type { OddOneRoom, PlayerStats } from "@/lib/types";

const room: OddOneRoom = { id:1n,network:"celo",creator:"0x1",visibility:"public",createdAt:100,commitEndAt:1300,revealEndAt:1900,committedCount:3,revealedCount:0,finalized:false,outcome:"pending",winner:null,winningNumber:null };
describe("game domain",()=>{
  it("derives exact phases",()=>{expect(getPhase(room,1299)).toBe("commit");expect(getPhase(room,1300)).toBe("reveal");expect(getPhase(room,1900)).toBe("awaiting-finalization");expect(getPhase({...room,finalized:true},1900)).toBe("settled");});
  it("formats timers and canonical routes",()=>{expect(formatCountdown(125)).toBe("02:05");expect(canonicalRoomUrl("https://odd.one/","stacks",7n)).toBe("https://odd.one/play/stacks/room/7");});
  it("unlocks score and achievement titles",()=>{const stats:PlayerStats={score:1500n,roomsPlayed:12n,reveals:10n,wins:2n,numberOneWins:1n,currentRevealStreak:5n,bestRevealStreak:5n};expect(primaryTitle(stats.score)).toBe("Odd Royalty");expect(achievementTitles(stats)).toEqual(["Pattern Breaker","One of One","Unbroken"]);});
});
