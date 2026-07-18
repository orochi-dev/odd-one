import { render, screen } from "@testing-library/react";
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

    expect(screen.getByRole("status")).toHaveTextContent(
      "MiniPay opens the Celo lobby automatically when it is available.",
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it("announces the automatic Celo redirect for MiniPay", () => {
    (window as Window & { ethereum?: { isMiniPay?: boolean } }).ethereum = { isMiniPay: true };

    render(<PlayChooser />);

    expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent(
      "MiniPay detected. Redirecting to the Celo lobby now.",
    );
    expect(replace).toHaveBeenCalledWith("/play/celo");
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

    expect(screen.getByRole("link", { name: "Back to the Odd One homepage" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Back to the Odd One homepage" })).toHaveTextContent(
      "Back to the homepage",
    );
  });
});
