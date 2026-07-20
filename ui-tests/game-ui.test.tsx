import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Lobby, NumberPicker, ProfileView, RoomView, TicketSheet } from "@/components/game-ui";
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
        visibility: "unlisted",
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
    expect(screen.getByRole("link", { name: "Back to the Celo lobby from room 0007" })).toHaveAttribute("href", "/play/celo");
  });

  it("uses wallet-first copy for the disconnected room commit action", async () => {
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
      expect(screen.getByRole("button", { name: "Connect wallet to pick" })).toBeVisible();
    });
  });

  it("uses chooser-aligned recovery copy when a room is missing", async () => {
    const repository: OddOneRepository = {
      network: "celo",
      configured: true,
      getTotalRooms: vi.fn(),
      getRoom: vi.fn().mockResolvedValue(null),
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

    const { container } = render(<RoomView network="celo" id={7n} />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Room not found." })).toBeVisible();
    });
    expect(container.querySelector(".empty-state span")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("link", { name: "Choose a lobby" })).toHaveAttribute("href", "/play/celo");
  });

  it("announces the room loading placeholder as a polite atomic status", async () => {
    const repository: OddOneRepository = {
      network: "celo",
      configured: true,
      getTotalRooms: vi.fn(),
      getRoom: vi.fn(() => new Promise(() => {})),
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

    const { container } = render(<RoomView network="celo" id={7n} />);

    await waitFor(() => {
      expect(screen.getByText("Reading the room…")).toBeVisible();
    });
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("status")).toHaveAttribute("aria-atomic", "true");
    expect(container.querySelector(".loading-number")).toHaveAttribute("aria-hidden", "true");
  });

  it("hides the decorative empty-state marker when a player has no room history", async () => {
    const repository: OddOneRepository = {
      network: "celo",
      configured: true,
      getTotalRooms: vi.fn(),
      getRoom: vi.fn(),
      getPlayerEntry: vi.fn(),
      getParticipants: vi.fn(),
      getNumberCounts: vi.fn(),
      getPlayerStats: vi.fn().mockResolvedValue({
        score: 0,
        wins: 0,
        reveals: 0,
        currentRevealStreak: 0,
        bestRevealStreak: 0,
      }),
      getCreatedCount: vi.fn(),
      getPlayedCount: vi.fn().mockResolvedValue(0n),
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

    const { container } = render(
      <ProfileView network="celo" address="0x1234567890abcdef1234567890abcdef12345678" />
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "No rooms yet." })).toBeVisible();
    });
    expect(container.querySelector(".empty-state.compact span")).toHaveAttribute("aria-hidden", "true");
  });

  it("hides the decorative profile loading marker from assistive technology", () => {
    const repository: OddOneRepository = {
      network: "celo",
      configured: true,
      getTotalRooms: vi.fn(),
      getRoom: vi.fn(),
      getPlayerEntry: vi.fn(),
      getParticipants: vi.fn(),
      getNumberCounts: vi.fn(),
      getPlayerStats: vi.fn().mockResolvedValue({
        score: 0,
        wins: 0,
        reveals: 0,
        currentRevealStreak: 0,
        bestRevealStreak: 0,
      }),
      getCreatedCount: vi.fn(),
      getPlayedCount: vi.fn().mockResolvedValue(0n),
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

    const { container } = render(
      <ProfileView network="celo" address="0x1234567890abcdef1234567890abcdef12345678" />
    );

    expect(screen.getByRole("heading", { name: "Reading the player signal" })).toBeVisible();
    expect(container.querySelector(".empty-state span")).toHaveAttribute("aria-hidden", "true");
  });

  it("hides decorative room icons from assistive technology", async () => {
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
      account: "0x1234567890abcdef1234567890abcdef12345678",
      connected: true,
      connecting: false,
      isMiniPay: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      repository,
    });

    const { container } = render(<RoomView network="celo" id={7n} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Share link for room 0007" })).toBeVisible();
    });

    const decorativeIcons = container.querySelectorAll("svg.lucide");
    expect(decorativeIcons.length).toBeGreaterThan(0);

    decorativeIcons.forEach((icon) => {
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon).toHaveAttribute("focusable", "false");
    });
  });

  it("keeps lobby room-card visibility icons out of the tab order", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_200_000);

    const repository: OddOneRepository = {
      network: "celo",
      configured: true,
      getTotalRooms: vi.fn().mockResolvedValue(1n),
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

    const { container } = render(<Lobby network="celo" />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /room #0007/i })).toBeVisible();
    });

    const icon = container.querySelector(".room-card-head svg.lucide");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("focusable", "false");
  });

  it("hides decorative lobby empty-state markers from assistive technology", async () => {
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

    const { container } = render(<Lobby network="celo" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "No rooms in this light." })).toBeVisible();
    });

    expect(container.querySelector(".empty-state span")).toHaveAttribute("aria-hidden", "true");
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

    const { container } = render(<TicketSheet ticket={ticket} backedUp={false} setBackedUp={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Copy reveal ticket for room 7" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Download reveal ticket for room 7" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy shareable room link for room 7" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Back up first, then enter the room" })).toHaveAttribute("href", "/play/celo/room/7");
    expect(container.querySelector(".share-box svg")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".share-box svg")).toHaveAttribute("focusable", "false");
  });
});
