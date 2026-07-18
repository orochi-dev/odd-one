import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/app-shell";

describe("AppShell", () => {
  it("offers a skip link to the game shell main content", () => {
    render(
      <AppShell
        network="celo"
        account="0x1234567890abcdef1234567890abcdef12345678"
        connected
        connecting={false}
        isMiniPay={false}
        onConnect={vi.fn()}
        onDisconnect={vi.fn()}
      >
        <div>Room content</div>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: /skip to main content/i })).toHaveAttribute("href", "#app-main-content");
    expect(screen.getByRole("main")).toHaveAttribute("id", "app-main-content");
  });

  it("marks the active network and labels the disconnect control", () => {
    render(
      <AppShell
        network="celo"
        account="0x1234567890abcdef1234567890abcdef12345678"
        connected
        connecting={false}
        isMiniPay={false}
        onConnect={vi.fn()}
        onDisconnect={vi.fn()}
      >
        <div>Room content</div>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: /return to the odd one homepage/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Celo" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Stacks" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("img", { name: /wallet signal for 0x123…45678/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /disconnect wallet 0x123…45678/i })).toBeInTheDocument();
  });

  it("uses network-specific copy for the primary connect action", () => {
    render(
      <AppShell
        network="stacks"
        account=""
        connected={false}
        connecting={false}
        isMiniPay={false}
        onConnect={vi.fn()}
        onDisconnect={vi.fn()}
      >
        <div>Room content</div>
      </AppShell>,
    );

    expect(screen.getByRole("button", { name: "Connect Stacks wallet" })).toBeInTheDocument();
  });

  it("keeps the loading copy aligned with the active network", () => {
    render(
      <AppShell
        network="celo"
        account=""
        connected={false}
        connecting
        isMiniPay={false}
        onConnect={vi.fn()}
        onDisconnect={vi.fn()}
      >
        <div>Room content</div>
      </AppShell>,
    );

    expect(screen.getByRole("button", { name: "Connect Celo wallet" })).toHaveTextContent("Opening Celo wallet…");
  });
});
