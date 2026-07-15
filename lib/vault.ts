import type { RevealTicket } from "./types";

const DB = "odd-one-reveal-vault";
const STORE = "tickets";
export const ticketKey = (network: string, contract: string, room: string, wallet: string) => `${network}:${contract}:${room}:${wallet}`.toLowerCase();

function openVault() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Private browser storage is unavailable."));
  });
}

async function operation<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openVault();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = run(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("The reveal vault could not be updated."));
    tx.oncomplete = () => db.close();
  });
}

export const revealVault = {
  available: () => typeof indexedDB !== "undefined",
  put(ticket: RevealTicket) { return operation("readwrite", (store) => store.put(ticket, ticketKey(ticket.network, ticket.contractId, ticket.roomId, ticket.wallet))); },
  get(network: string, contract: string, room: string, wallet: string) { return operation<RevealTicket | undefined>("readonly", (store) => store.get(ticketKey(network, contract, room, wallet))); },
  remove(ticket: RevealTicket) { return operation("readwrite", (store) => store.delete(ticketKey(ticket.network, ticket.contractId, ticket.roomId, ticket.wallet))); }
};
