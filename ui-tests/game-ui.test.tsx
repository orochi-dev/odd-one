import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  it("uses radio semantics for the selected live number", () => {
    render(<NumberPicker selected={7} onSelect={vi.fn()} />);

    expect(screen.getByRole("group", { name: "Pick a number from one to twenty" })).toBeVisible();
    const picker = screen.getByRole("radiogroup", { name: "Pick a number from one to twenty" });
    expect(picker).toHaveAccessibleDescription("Use arrow keys to move between picks. Arrow keys wrap between 1 and 20. Home jumps to 1 and End jumps to 20.");
    expect(picker).toHaveAttribute("aria-activedescendant", "live-pick-7");
    expect(picker).toHaveAttribute("aria-keyshortcuts", "ArrowRight ArrowDown ArrowLeft ArrowUp Home End");
    const pickSeven = screen.getByRole("radio", { name: "Pick 7 — plausibly odd" });
    expect(pickSeven).toHaveAttribute("id", "live-pick-7");
    expect(pickSeven).toHaveAttribute("aria-checked", "true");
    expect(pickSeven).toHaveAttribute("aria-posinset", "7");
    expect(pickSeven).toHaveAttribute("aria-setsize", "20");
    expect(screen.getByRole("radio", { name: "Pick 8 — plausibly odd" })).toHaveAttribute("aria-checked", "false");
  });

  it("supports keyboard navigation for live number picks", () => {
    const onSelect = vi.fn();
    render(<NumberPicker selected={7} onSelect={onSelect} />);

    const picker = screen.getByRole("radiogroup", { name: "Pick a number from one to twenty" });
    const pickSeven = screen.getByRole("radio", { name: "Pick 7 — plausibly odd" });
    const pickEight = screen.getByRole("radio", { name: "Pick 8 — plausibly odd" });

    pickSeven.focus();
    expect(pickSeven).toHaveFocus();
    expect(pickSeven).toHaveAttribute("tabindex", "0");
    expect(pickEight).toHaveAttribute("tabindex", "-1");

    fireEvent.keyDown(picker, { key: "ArrowRight" });
    expect(onSelect).toHaveBeenCalledWith(8);
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
    expect(screen.getByRole("button", { name: "Refresh Celo rooms" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Create a room from the Celo lobby hero" })).toHaveAttribute("href", "/play/celo/create");
    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Create a room from the empty Open rooms view" })).toHaveAttribute("href", "/play/celo/create");
    });
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", "celo-tab-open");
    expect(screen.getByRole("tab", { name: "Open rooms" })).toHaveAttribute("aria-controls", "celo-lobby-panel");
  });

  it("names the missing contract variable in the setup state", () => {
    const repository: OddOneRepository = {
      network: "celo",
      configured: false,
      getTotalRooms: vi.fn(),
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

    expect(screen.getByText("NEXT_PUBLIC_ODD_ONE_CELO_CONTRACT_ADDRESS")).toBeVisible();
    expect(screen.getByRole("link", { name: "Open the Celo contract explorer" })).toHaveAttribute("href", "https://explorer.example");
  });

  it("hides the decorative room-card phase badge from assistive technology", async () => {
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
        commitEndAt: 4_102_444_800,
        revealEndAt: 4_102_445_400,
        committedCount: 3,
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
      expect(screen.getByRole("link", { name: "Room #0007, Open for picks, 3 of 12 players committed, Public room" })).toBeVisible();
    });
    expect(container.querySelector(".room-phase-icon")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("link", { name: "Room #0007, Open for picks, 3 of 12 players committed, Public room" })).toBeVisible();
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

  it("gives the settled-room winner link an explicit profile label", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_900_000);

    const winner = "0x1234567890abcdef1234567890abcdef12345678";
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
        committedCount: 3,
        revealedCount: 3,
        finalized: true,
        outcome: "winner",
        winner,
        winningNumber: 2,
      }),
      getPlayerEntry: vi.fn().mockResolvedValue(null),
      getParticipants: vi.fn().mockResolvedValue([]),
      getNumberCounts: vi.fn().mockResolvedValue([0, 1, 2, ...Array(17).fill(0)]),
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
      expect(screen.getByRole("heading", { name: "Number 2 wins." })).toBeVisible();
    });
    expect(screen.getByRole("link", { name: "Open winner profile for 0x123…45678" })).toHaveAttribute("href", `/play/celo/profile/${winner}`);
    expect(screen.queryByRole("img", { name: "Player signal for 0x123…45678" })).not.toBeInTheDocument();
  });

  it("announces transaction updates as a single live status", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000);

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
        revealedCount: 1,
        finalized: false,
        outcome: "pending",
        winner: null,
        winningNumber: null,
      }),
      getPlayerEntry: vi.fn().mockResolvedValue({
        wallet: "0x1234567890abcdef1234567890abcdef12345678",
        committed: true,
        revealed: true,
        number: 2,
      }),
      getParticipants: vi.fn().mockResolvedValue([
        {
          wallet: "0x1234567890abcdef1234567890abcdef12345678",
          committed: true,
          revealed: true,
          number: 2,
        },
      ]),
      getNumberCounts: vi.fn().mockResolvedValue([0, 1, ...Array(18).fill(0)]),
      getPlayerStats: vi.fn(),
      getCreatedCount: vi.fn(),
      getPlayedCount: vi.fn(),
      getCreatedIds: vi.fn(),
      getPlayedIds: vi.fn(),
      createRoom: vi.fn(),
      commitNumber: vi.fn(),
      revealNumber: vi.fn(),
      finalizeRoom: vi.fn().mockImplementation(async (_roomId, setState) => {
        setState({
          phase: "broadcasting",
          message: "Broadcasting the final tally.",
          explorerUrl: "https://explorer.example/tx/0x123",
        });
      }),
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
      expect(screen.getByRole("button", { name: "Finalize result" })).toBeVisible();
    });
    fireEvent.click(screen.getByRole("button", { name: "Finalize result" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("broadcasting");
    });
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("status")).toHaveAttribute("aria-atomic", "true");
    expect(screen.getByRole("link", { name: "View broadcasting transaction in the block explorer" })).toHaveAttribute("href", "https://explorer.example/tx/0x123");
  });

  it("gives the reveal count board readable list labels", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000);

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
        committedCount: 2,
        revealedCount: 2,
        finalized: false,
        outcome: "pending",
        winner: null,
        winningNumber: null,
      }),
      getPlayerEntry: vi.fn().mockResolvedValue(null),
      getParticipants: vi.fn().mockResolvedValue([]),
      getNumberCounts: vi.fn().mockResolvedValue([0, 2, ...Array(18).fill(0)]),
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
      expect(screen.getByRole("heading", { name: "Turn on the board." })).toBeVisible();
    });
    expect(screen.getByRole("list", { name: "Reveal counts by number" })).toBeVisible();
    expect(screen.getByRole("listitem", { name: "Number 2 picked 2 times" })).toBeVisible();
    expect(screen.getByRole("listitem", { name: "Number 1 not picked" })).toBeVisible();
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
    expect(screen.getByRole("alert")).toHaveTextContent("Room not found.");
    expect(container.querySelector(".empty-state span")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("link", { name: "Choose the Celo lobby from the missing room page" })).toHaveAttribute("href", "/play/celo");
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
    expect(screen.getByText("Celo player")).toBeVisible();
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

    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("status")).toHaveAttribute("aria-atomic", "true");
    expect(screen.getByRole("heading", { name: "Reading the player signal" })).toBeVisible();
    expect(container.querySelector(".empty-state span")).toHaveAttribute("aria-hidden", "true");
  });

  it("announces profile loading errors as alerts", async () => {
    const repository: OddOneRepository = {
      network: "celo",
      configured: true,
      getTotalRooms: vi.fn(),
      getRoom: vi.fn(),
      getPlayerEntry: vi.fn(),
      getParticipants: vi.fn(),
      getNumberCounts: vi.fn(),
      getPlayerStats: vi.fn().mockRejectedValue(new Error("Profile could not be loaded.")),
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

    render(
      <ProfileView network="celo" address="0x1234567890abcdef1234567890abcdef12345678" />
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Profile could not be loaded.");
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

  it("exposes room participants as a labeled list", async () => {
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
        committedCount: 2,
        revealedCount: 1,
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
        {
          wallet: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          committed: true,
          revealed: true,
          number: 4,
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

    const participants = await screen.findByRole("list", { name: "Room participants" });
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(participants).toHaveTextContent("0x123…45678");
    expect(participants).toHaveTextContent("committed");
    expect(participants).toHaveTextContent("0xabc…fabcd");
    expect(participants).toHaveTextContent("revealed");
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

  it("announces lobby loading failures as alerts", async () => {
    const repository: OddOneRepository = {
      network: "celo",
      configured: true,
      getTotalRooms: vi.fn().mockRejectedValue(new Error("RPC timed out.")),
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

    expect(await screen.findByRole("alert")).toHaveTextContent("Signal lost");
    expect(screen.getByRole("alert")).toHaveTextContent("RPC timed out.");
  });

  it("announces the lobby loading skeleton as a polite atomic status", () => {
    const repository: OddOneRepository = {
      network: "celo",
      configured: true,
      getTotalRooms: vi.fn(() => new Promise(() => {})),
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

    expect(screen.getByRole("status")).toHaveTextContent("Reading the rooms…");
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("status")).toHaveAttribute("aria-atomic", "true");
    expect(container.querySelector(".room-grid.loading-grid")).toHaveAttribute("aria-hidden", "true");
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
    expect(screen.getByRole("link", { name: "Back up first, then enter the room" })).toHaveAccessibleDescription("Back up the ticket before leaving this screen.");
    expect(container.querySelector(".share-box svg")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".share-box svg")).toHaveAttribute("focusable", "false");
  });
});
