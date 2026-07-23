import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlayChooser } from "@/components/play-chooser";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

describe("PlayChooser", () => {
  it("explains MiniPay auto-entry when no MiniPay provider is present", () => {
    delete (window as Window & { ethereum?: { isMiniPay?: boolean } }).ethereum;

    render(<PlayChooser />);

    expect(screen.getByText("Choose a lobby")).toBeInTheDocument();
    expect(screen.getByText("Rooms, scores, and unlocked titles stay independent on each network.")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("aria-atomic", "true");
    expect(screen.getByRole("status")).toHaveTextContent("MiniPay opens the Celo lobby automatically when it is available on this device.");
    expect(replace).not.toHaveBeenCalled();
  });

  it("announces the automatic Celo redirect for MiniPay", () => {
    (window as Window & { ethereum?: { isMiniPay?: boolean } }).ethereum = { isMiniPay: true };

    render(<PlayChooser />);

    expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveAttribute("aria-atomic", "true");
    expect(screen.getByRole("status")).toHaveTextContent("MiniPay detected on this device. Redirecting to the Celo lobby now.");
    expect(screen.getByRole("link", { name: "Enter the Celo lobby" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("link", { name: "Enter the Celo lobby" })).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("link", { name: "Enter the Celo lobby" })).toHaveAccessibleDescription(
      "Built for MiniPay and mobile wallets. Navigation is temporarily unavailable while Odd One redirects MiniPay to the Celo lobby automatically.",
    );
    expect(screen.getByRole("link", { name: "Enter the Stacks lobby" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("link", { name: "Enter the Stacks lobby" })).toHaveAccessibleDescription(
      "Clarity-native play alongside Bitcoin. Navigation is temporarily unavailable while Odd One redirects MiniPay to the Celo lobby automatically.",
    );
    expect(screen.getByRole("link", { name: "Back to the Odd One homepage" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("link", { name: "Back to the Odd One homepage" })).toHaveAccessibleDescription(
      "Navigation is temporarily unavailable while Odd One redirects MiniPay to the Celo lobby automatically.",
    );
    expect(replace).toHaveBeenCalledWith("/play/celo");
  });

  it("blocks chooser link activation while MiniPay is auto-redirecting", () => {
    (window as Window & { ethereum?: { isMiniPay?: boolean } }).ethereum = { isMiniPay: true };

    render(<PlayChooser />);

    const celoLink = screen.getByRole("link", { name: "Enter the Celo lobby" });
    const celoClick = createEvent.click(celoLink);
    fireEvent(celoLink, celoClick);
    expect(celoClick.defaultPrevented).toBe(true);

    const stacksLink = screen.getByRole("link", { name: "Enter the Stacks lobby" });
    const stacksClick = createEvent.click(stacksLink);
    fireEvent(stacksLink, stacksClick);
    expect(stacksClick.defaultPrevented).toBe(true);

    const homeLink = screen.getByRole("link", { name: "Back to the Odd One homepage" });
    const homeClick = createEvent.click(homeLink);
    fireEvent(homeLink, homeClick);
    expect(homeClick.defaultPrevented).toBe(true);
  });

  it("gives each network card a destination-focused accessible name", () => {
    delete (window as Window & { ethereum?: { isMiniPay?: boolean } }).ethereum;

    render(<PlayChooser />);

    expect(screen.getByRole("link", { name: "Enter the Celo lobby" })).toHaveAttribute("href", "/play/celo");
    expect(screen.getByRole("link", { name: "Enter the Celo lobby" })).toHaveAccessibleDescription(
      "Built for MiniPay and mobile wallets.",
    );
    expect(screen.getByRole("link", { name: "Enter the Stacks lobby" })).toHaveAttribute("href", "/play/stacks");
    expect(screen.getByRole("link", { name: "Enter the Stacks lobby" })).toHaveAccessibleDescription(
      "Clarity-native play alongside Bitcoin.",
    );
  });

  it("gives the return link a homepage-focused accessible name", () => {
    delete (window as Window & { ethereum?: { isMiniPay?: boolean } }).ethereum;

    render(<PlayChooser />);

    expect(screen.getByRole("link", { name: "Return to the Odd One homepage" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Back to the Odd One homepage" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Back to the Odd One homepage" })).toHaveTextContent(
      "Back to the homepage",
    );
  });
});
