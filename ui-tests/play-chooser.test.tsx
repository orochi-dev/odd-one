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

    expect(screen.getByRole("status")).toHaveTextContent(
      "MiniPay detected. Taking you straight to the Celo lobby.",
    );
    expect(replace).toHaveBeenCalledWith("/play/celo");
  });

  it("gives each network card a destination-focused accessible name", () => {
    delete (window as Window & { ethereum?: { isMiniPay?: boolean } }).ethereum;

    render(<PlayChooser />);

    expect(screen.getByRole("link", { name: "Enter the Celo lobby" })).toHaveAttribute("href", "/play/celo");
    expect(screen.getByRole("link", { name: "Enter the Stacks lobby" })).toHaveAttribute("href", "/play/stacks");
  });
});
