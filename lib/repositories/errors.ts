const messages: Record<string, string> = {
  InvalidCommitment: "The hidden pick is not valid.", InvalidNumber: "Choose a number from 1 to 20.", RoomNotFound: "This room does not exist.",
  CommitClosed: "The pick phase has closed.", RevealNotOpen: "The reveal phase has not started.", RevealClosed: "The reveal window has closed.",
  RevealStillOpen: "Counts stay concealed until reveal ends.", RoomFull: "This room already has 12 players.", AlreadyCommitted: "This wallet already picked in this room.",
  ActiveRoomExists: "Finish or wait for your active room before joining another.", NotCommitted: "This wallet did not enter the room.",
  AlreadyRevealed: "Your number is already revealed.", InvalidReveal: "This number and ticket do not match the commitment.",
  TooEarlyToFinalize: "The reveal window is still open.", AlreadyFinalized: "This room is already settled."
};
const clarityCodes: Record<string, string> = { u400: "InvalidCommitment", u401: "InvalidNumber", u402: "RoomNotFound", u403: "CommitClosed", u404: "RevealNotOpen", u405: "RevealClosed", u406: "RevealStillOpen", u407: "RoomFull", u408: "AlreadyCommitted", u409: "ActiveRoomExists", u410: "NotCommitted", u411: "AlreadyRevealed", u412: "InvalidReveal", u413: "TooEarlyToFinalize", u414: "AlreadyFinalized" };

export function friendlyContractError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  if (/reject|denied|cancelled by user/i.test(raw)) return new Error("Transaction rejected in the wallet.");
  const name = Object.keys(messages).find((item) => raw.includes(item)) || Object.entries(clarityCodes).find(([code]) => raw.includes(code))?.[1];
  return new Error(name ? messages[name] : "The network could not complete that action. Check your wallet and try again.");
}
