import { describe, expect, it } from "vitest";
import { buildRevealTicket, parseRevealTicket } from "@/lib/commitment";
describe("reveal tickets",()=>{
  it("round-trips and validates scope",async()=>{const ticket=await buildRevealTicket({network:"celo",roomId:"7",wallet:"0x0000000000000000000000000000000000000001",number:4,salt:`0x${"1".repeat(64)}`,commitment:`0x${"2".repeat(64)}`,commitTransactionId:"0xabc"});const parsed=await parseRevealTicket(JSON.stringify(ticket),{network:"celo",roomId:"7",wallet:ticket.wallet});expect(parsed.number).toBe(4);});
  it("rejects modified and mismatched tickets",async()=>{const ticket=await buildRevealTicket({network:"stacks",roomId:"3",wallet:"ST1PLAYER",number:8,salt:`0x${"3".repeat(64)}`,commitment:`0x${"4".repeat(64)}`,commitTransactionId:null});await expect(parseRevealTicket(JSON.stringify({...ticket,number:9}))).rejects.toThrow(/changed|corrupted/);await expect(parseRevealTicket(JSON.stringify(ticket),{roomId:"4"})).rejects.toThrow(/different room/);});
});
