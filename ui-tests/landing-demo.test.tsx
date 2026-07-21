import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingDemo } from "@/components/landing-demo";

describe("LandingDemo", () => {
  it("exposes the simulated round as a labeled region", () => {
    render(<LandingDemo />);

    expect(screen.getByRole("region", { name: "Simulated Odd One round" })).toBeVisible();
  });

  it("runs a clearly labeled simulated reveal", () => {
    render(<LandingDemo />);

    expect(screen.getByText("Interactive preview")).toBeInTheDocument();
    expect(screen.getByText("Preview only. This sample uses picks 1-5; live rooms use the full 1-20 range. Lowest unique number wins the round.")).toBeInTheDocument();
    expect(screen.getByLabelText("Your pick is still hidden")).toBeInTheDocument();
    expect(screen.getByLabelText("Preview player 2 is still hidden")).toBeInTheDocument();

    const picker = screen.getByRole("group", { name: /choose your preview number/i });
    expect(picker).toHaveAttribute("aria-describedby", "preview-hint");

    const option = within(picker).getByRole("button", { name: /pick 5 for the preview/i });
    expect(option).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(option);
    const revealButton = screen.getByRole("button", { name: /run the preview reveal/i });
    expect(revealButton).toHaveAttribute("aria-describedby", "preview-hint");

    fireEvent.click(revealButton);

    const result = screen.getByText("Your 5 was crowded out. Number 4 stood alone.").closest(".demo-result");
    expect(result).not.toBeNull();
    expect(result).toHaveAttribute("aria-atomic", "true");
    expect(screen.getByLabelText("You revealed 5")).toBeInTheDocument();
    expect(screen.getByLabelText("Preview player 2 revealed 1")).toBeInTheDocument();
    expect(screen.getByText("Your 5 was crowded out. Number 4 stood alone.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /reset the preview/i }));
    expect(screen.getByRole("button", { name: /run the preview reveal/i })).toBeInTheDocument();
  });

  it("announces preview state changes through a live region", () => {
    render(<LandingDemo />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Your secret pick");
    expect(status).toHaveTextContent("2");

    fireEvent.click(screen.getByRole("button", { name: /pick 5 for the preview/i }));
    expect(status).toHaveTextContent("Your secret pick");
    expect(status).toHaveTextContent("5");

    fireEvent.click(screen.getByRole("button", { name: /run the preview reveal/i }));
    expect(status).toHaveTextContent("Lowest unique number");
    expect(status).toHaveTextContent("4");
  });
});
