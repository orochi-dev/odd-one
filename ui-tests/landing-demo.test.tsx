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
    expect(screen.getByText("Preview only. This sample uses picks 1-5; live rooms use the full 1-20 range. Lowest unique number wins the round. Use arrow keys, Home, or End to move between preview numbers.")).toBeInTheDocument();
    expect(screen.getByLabelText("Your pick is still hidden")).toBeInTheDocument();
    expect(screen.getByLabelText("Preview player 1 is still hidden")).toBeInTheDocument();

    const picker = screen.getByRole("radiogroup", { name: /choose your preview number/i });
    expect(picker).toHaveAttribute("aria-describedby", "preview-hint");
    expect(picker).toHaveAttribute("aria-keyshortcuts", "ArrowRight ArrowDown ArrowLeft ArrowUp Home End");

    const option = within(picker).getByRole("radio", { name: /pick 5 for the preview/i });
    expect(option).toHaveAttribute("aria-checked", "false");
    expect(option).toHaveAttribute("aria-posinset", "5");
    expect(option).toHaveAttribute("aria-setsize", "5");

    fireEvent.click(option);
    expect(option).toHaveAttribute("aria-checked", "true");
    const revealButton = screen.getByRole("button", { name: /run the preview reveal with pick 5/i });
    expect(revealButton).toHaveAttribute("aria-describedby", "preview-hint");

    fireEvent.click(revealButton);

    const result = screen.getByText("Your 5 was crowded out. Number 4 stood alone.").closest(".demo-result");
    expect(result).not.toBeNull();
    expect(result).toHaveAttribute("aria-atomic", "true");
    expect(screen.getByText("Your 5 was crowded out. Number 4 stood alone.")).toHaveAttribute("id", "preview-result");
    expect(screen.getByRole("button", { name: /reset the preview with pick 5/i })).toHaveAttribute("aria-describedby", "preview-result");
    expect(screen.getByLabelText("You revealed 5")).toBeInTheDocument();
    expect(screen.getByLabelText("Preview player 1 revealed 1")).toBeInTheDocument();
    expect(screen.getByText("Your 5 was crowded out. Number 4 stood alone.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /reset the preview/i }));
    const restoredOption = screen.getByRole("radio", { name: /pick 5 for the preview/i });
    expect(restoredOption).toHaveFocus();
    expect(screen.getByRole("button", { name: /run the preview reveal with pick 5/i })).toBeInTheDocument();
  });

  it("announces preview state changes through a live region", () => {
    render(<LandingDemo />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Your secret pick");
    expect(status).toHaveTextContent("2");

    fireEvent.click(screen.getByRole("radio", { name: /pick 5 for the preview/i }));
    expect(status).toHaveTextContent("Your secret pick");
    expect(status).toHaveTextContent("5");

    fireEvent.click(screen.getByRole("button", { name: /run the preview reveal with pick 5/i }));
    expect(status).toHaveTextContent("Lowest unique number");
    expect(status).toHaveTextContent("4");
  });

  it("supports keyboard navigation in the preview radio group", () => {
    render(<LandingDemo />);

    const picker = screen.getByRole("radiogroup", { name: /choose your preview number/i });
    expect(picker).toHaveAttribute("aria-keyshortcuts", "ArrowRight ArrowDown ArrowLeft ArrowUp Home End");
    const pickTwo = within(picker).getByRole("radio", { name: /pick 2 for the preview/i });
    const pickThree = within(picker).getByRole("radio", { name: /pick 3 for the preview/i });
    const pickFive = within(picker).getByRole("radio", { name: /pick 5 for the preview/i });
    const pickOne = within(picker).getByRole("radio", { name: /pick 1 for the preview/i });

    expect(pickTwo).toHaveAttribute("tabindex", "0");
    expect(pickThree).toHaveAttribute("tabindex", "-1");
    pickTwo.focus();
    expect(pickTwo).toHaveFocus();

    fireEvent.keyDown(picker, { key: "ArrowRight" });
    expect(pickThree).toHaveAttribute("aria-checked", "true");
    expect(pickThree).toHaveAttribute("tabindex", "0");
    expect(pickThree).toHaveFocus();

    fireEvent.keyDown(picker, { key: "End" });
    expect(pickFive).toHaveAttribute("aria-checked", "true");
    expect(pickFive).toHaveAttribute("tabindex", "0");
    expect(pickFive).toHaveFocus();

    fireEvent.keyDown(picker, { key: "Home" });
    expect(pickOne).toHaveAttribute("aria-checked", "true");
    expect(pickOne).toHaveAttribute("tabindex", "0");
    expect(pickOne).toHaveFocus();

    fireEvent.keyDown(picker, { key: "ArrowLeft" });
    expect(pickFive).toHaveAttribute("aria-checked", "true");
    expect(pickFive).toHaveFocus();
  });
});
