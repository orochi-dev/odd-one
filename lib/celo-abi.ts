export const oddOneCeloAbi = [
  { type: "event", name: "RoomCreated", inputs: [
    { name: "roomId", type: "uint256", indexed: true }, { name: "creator", type: "address", indexed: true },
    { name: "listed", type: "bool", indexed: false }, { name: "commitEndAt", type: "uint64", indexed: false }, { name: "revealEndAt", type: "uint64", indexed: false }
  ] },
  { type: "function", name: "totalRooms", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "getRoom", stateMutability: "view", inputs: [{ name: "roomId", type: "uint256" }], outputs: [{ name: "", type: "tuple", components: [
    { name: "id", type: "uint256" }, { name: "creator", type: "address" }, { name: "listed", type: "bool" },
    { name: "createdAt", type: "uint64" }, { name: "commitEndAt", type: "uint64" }, { name: "revealEndAt", type: "uint64" },
    { name: "committedCount", type: "uint8" }, { name: "revealedCount", type: "uint8" }, { name: "finalized", type: "bool" },
    { name: "outcome", type: "uint8" }, { name: "winningNumber", type: "uint8" }, { name: "winner", type: "address" }
  ] }] },
  { type: "function", name: "getEntry", stateMutability: "view", inputs: [{ name: "roomId", type: "uint256" }, { name: "player", type: "address" }], outputs: [{ name: "", type: "tuple", components: [
    { name: "commitment", type: "bytes32" }, { name: "revealed", type: "bool" }, { name: "number", type: "uint8" }
  ] }] },
  { type: "function", name: "getParticipant", stateMutability: "view", inputs: [{ name: "roomId", type: "uint256" }, { name: "index", type: "uint8" }], outputs: [{ name: "", type: "address" }] },
  { type: "function", name: "getNumberCount", stateMutability: "view", inputs: [{ name: "roomId", type: "uint256" }, { name: "number", type: "uint8" }], outputs: [{ name: "", type: "uint8" }] },
  { type: "function", name: "getPlayerStats", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ name: "", type: "tuple", components: [
    { name: "score", type: "uint256" }, { name: "roomsPlayed", type: "uint256" }, { name: "reveals", type: "uint256" },
    { name: "wins", type: "uint256" }, { name: "numberOneWins", type: "uint256" }, { name: "currentRevealStreak", type: "uint256" }, { name: "bestRevealStreak", type: "uint256" }
  ] }] },
  ...["getCreatedCount", "getPlayedCount"].map((name) => ({ type: "function", name, stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ name: "", type: "uint256" }] })),
  ...["getCreatedId", "getPlayedId"].map((name) => ({ type: "function", name, stateMutability: "view", inputs: [{ name: "player", type: "address" }, { name: "index", type: "uint256" }], outputs: [{ name: "", type: "uint256" }] })),
  { type: "function", name: "createRoom", stateMutability: "nonpayable", inputs: [{ name: "commitment", type: "bytes32" }, { name: "listed", type: "bool" }], outputs: [{ name: "roomId", type: "uint256" }] },
  { type: "function", name: "commitNumber", stateMutability: "nonpayable", inputs: [{ name: "roomId", type: "uint256" }, { name: "commitment", type: "bytes32" }], outputs: [] },
  { type: "function", name: "revealNumber", stateMutability: "nonpayable", inputs: [{ name: "roomId", type: "uint256" }, { name: "number", type: "uint8" }, { name: "salt", type: "bytes32" }], outputs: [] },
  { type: "function", name: "finalizeRoom", stateMutability: "nonpayable", inputs: [{ name: "roomId", type: "uint256" }], outputs: [] }
] as const;
