import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Lobby, NumberPicker, RoomView, TicketSheet } from "@/components/game-ui";
import type { OddOneRepository } from "@/lib/types";
import { buildRevealTicket } from "@/lib/commitment";

const mockUseNetworkClient = vi.fn();

vi.mock("@/components/network-client", () => ({
  useNetworkClient: () => mockUseNetworkClient(),
}));

vi.mock("@/lib/env", () => ({
  contractId: () => "celo-contract",
  contractExplorerUrl: () => "https://explorer.example",
  networkId: () => "42220",
  publicEnv: { appUrl: "https://odd.one", celoContractAddress: "0x1", stacksContractAddress: "ST1" },
}));

describe("NumberPicker", () => {
  it("groups the choices under an accessible legend and marks the selected value", () => {
    render(<NumberPicker selected={7} onSelect={vi.fn()} />);

    expect(screen.getByRole("group", { name: "Pick a number from one to twenty" })).toBeVisible();
    expect(screen.getByRole("button", { name: "7 plausibly odd" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "8 plausibly odd" })).toHaveAttribute("aria-pressed", "false");
  });

  it("gives lobby tabs context-rich accessible names", async () => {
    const repository: OddOneRepository = {
      network: "celo",
      configured: true,
      getTotalRooms: vi.fn().mockResolvedValue(0n),
      getRoom: vi.fn(),
      getPlayerEntry: vi.fn(),
      getParticipants: vi.fn(),
      getNumberCounts: vi.fn(),
      getPlayerStats: vi.fn(),
      getCreatedCount: vi.fn(),
      getPlayedCount: vi.fn(),
      getCreatedIds: vi.fn(),
      getPlayedIds: vi.fn(),
      createRoom: vi.fn(),
      commitNumber: vi.fn(),
      revealNumber: vi.fn(),
      finalizeRoom: vi.fn(),
    };

    mockUseNetworkClient.mockReturnValue({
      account: null,
      connected: false,
      connecting: false,
      isMiniPay: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      repository,
    });

    render(<Lobby network="celo" />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Open rooms" })).toBeVisible();
    });
    expect(screen.getByRole("tab", { name: "Rooms ready to reveal" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "Finished rooms" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "My rooms" })).toBeVisible();
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", "celo-tab-open");
    expect(screen.getByRole("tab", { name: "Open rooms" })).toHaveAttribute("aria-controls", "celo-lobby-panel");
  });

  it("shows a single ticket importer during reveal when the saved ticket is missing", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_500_000);

    const repository: OddOneRepository = {
      network: "celo",
      configured: true,
      getTotalRooms: vi.fn(),
      getRoom: vi.fn().mockResolvedValue({
        id: 7n,
        network: "celo",
        creator: "0xcreator",
        visibility: "public",
        createdAt: 1_000,
        commitEndAt: 1_400,
        revealEndAt: 1_600,
        committedCount: 1,
        revealedCount: 0,
        finalized: false,
        outcome: "pending",
        winner: null,
        winningNumber: null,
      }),
      getPlayerEntry: vi.fn().mockResolvedValue({
        wallet: "0x1234567890abcdef1234567890abcdef12345678",
        committed: true,
        revealed: false,
        number: null,
      }),
      getParticipants: vi.fn().mockResolvedValue([
        {
          wallet: "0x1234567890abcdef1234567890abcdef12345678",
          committed: true,
          revealed: false,
          number: null,
        },
      ]),
      getNumberCounts: vi.fn().mockResolvedValue(Array(20).fill(0)),
      getPlayerStats: vi.fn(),
      getCreatedCount: vi.fn(),
      getPlayedCount: vi.fn(),
      getCreatedIds: vi.fn(),
      getPlayedIds: vi.fn(),
      createRoom: vi.fn(),
      commitNumber: vi.fn(),
      revealNumber: vi.fn(),
      finalizeRoom: vi.fn(),
    };

    mockUseNetworkClient.mockReturnValue({
      account: "0x1234567890abcdef1234567890abcdef12345678",
      connected: true,
      connecting: false,
      isMiniPay: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      repository,
    });

    render(<RoomView network="celo" id={7n} />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Prove your pick." })).toBeVisible();
    });
    expect(screen.getAllByText("Import reveal ticket")).toHaveLength(1);
  });

  it("gives the room share control a room-specific accessible name", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_200_000);

    const repository: OddOneRepository = {
      network: "celo",
      configured: true,
      getTotalRooms: vi.fn(),
      getRoom: vi.fn().mockResolvedValue({
        id: 7n,
        network: "celo",
        creator: "0xcreator",
        visibility: "public",
        createdAt: 1_000,
        commitEndAt: 1_400,
        revealEndAt: 1_600,
        committedCount: 1,
        revealedCount: 0,
        finalized: false,
        outcome: "pending",
        winner: null,
        winningNumber: null,
      }),
      getPlayerEntry: vi.fn().mockResolvedValue(null),
      getParticipants: vi.fn().mockResolvedValue([]),
      getNumberCounts: vi.fn().mockResolvedValue(Array(20).fill(0)),
      getPlayerStats: vi.fn(),
      getCreatedCount: vi.fn(),
      getPlayedCount: vi.fn(),
      getCreatedIds: vi.fn(),
      getPlayedIds: vi.fn(),
      createRoom: vi.fn(),
      commitNumber: vi.fn(),
      revealNumber: vi.fn(),
      finalizeRoom: vi.fn(),
    };

    mockUseNetworkClient.mockReturnValue({
      account: null,
      connected: false,
      connecting: false,
      isMiniPay: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      repository,
    });

    render(<RoomView network="celo" id={7n} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Share link for room 0007" })).toBeVisible();
    });
  });

  it("gives ticket backup and share actions room-specific accessible names", async () => {
    const ticket = await buildRevealTicket({
      network: "celo",
      roomId: "7",
      wallet: "0x0000000000000000000000000000000000000001",
      number: 4,
      salt: `0x${"1".repeat(64)}`,
      commitment: `0x${"2".repeat(64)}`,
      commitTransactionId: "0xabc",
    });

    render(<TicketSheet ticket={ticket} backedUp={false} setBackedUp={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Copy reveal ticket for room 7" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Download reveal ticket for room 7" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy shareable room link for room 7" })).toBeVisible();
  });
});
