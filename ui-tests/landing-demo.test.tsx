import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingDemo } from "@/components/landing-demo";

describe("LandingDemo", () => {
  it("exposes the interactive preview as a heading-labeled region", () => {
    render(<LandingDemo />);

    expect(screen.getByRole("heading", { name: "Interactive Odd One preview" })).toHaveClass("sr-only");
    const region = screen.getByRole("region", { name: "Interactive Odd One preview" });

    expect(region).toBeVisible();
    expect(region).toHaveAccessibleDescription(
      "Interactive preview Preview room #0042 Preview only. This sample uses picks 1-5; live rooms use the full 1-20 range. The other preview players stay fixed at 1, 1, 4, and 8 so you can see how uniqueness changes. Lowest unique number wins the round. Arrow keys wrap between preview numbers, while Home and End jump to the ends.",
    );
  });

  it("runs a clearly labeled simulated reveal", () => {
    render(<LandingDemo />);

    expect(screen.getByText("Interactive preview")).toBeInTheDocument();
    expect(screen.getByText("Preview only. This sample uses picks 1-5; live rooms use the full 1-20 range. The other preview players stay fixed at 1, 1, 4, and 8 so you can see how uniqueness changes. Lowest unique number wins the round. Arrow keys wrap between preview numbers, while Home and End jump to the ends.")).toBeInTheDocument();
    expect(screen.getByLabelText("Your pick is still hidden")).toBeInTheDocument();
    expect(screen.getByLabelText("Preview player 1 is still hidden")).toBeInTheDocument();

    const picker = screen.getByRole("radiogroup", { name: /choose your preview number/i });
    expect(picker).toHaveAttribute("aria-describedby", "preview-hint preview-selection");
    expect(picker).not.toHaveAttribute("aria-activedescendant");
    expect(picker).toHaveAttribute("aria-keyshortcuts", "ArrowRight ArrowDown ArrowLeft ArrowUp Home End");
    expect(picker).toHaveAttribute("aria-orientation", "horizontal");

    const option = within(picker).getByRole("radio", { name: /pick 5 for the preview/i });
    expect(option).toHaveAttribute("aria-checked", "false");
    expect(option).toHaveAttribute("aria-posinset", "5");
    expect(option).toHaveAttribute("aria-setsize", "5");

    fireEvent.click(option);
    expect(picker).not.toHaveAttribute("aria-activedescendant");
    expect(option).toHaveAttribute("aria-checked", "true");
    const revealButton = screen.getByRole("button", { name: /run the preview reveal with pick 5/i });
    expect(revealButton).toHaveAttribute("aria-describedby", "preview-hint");

    fireEvent.click(revealButton);

    const resultMessage = screen.getByText("Your 5 was crowded out. Number 4 stood alone and takes the preview round.");
    const result = resultMessage.closest(".demo-result");
    expect(result).not.toBeNull();
    expect(result).not.toHaveAttribute("role");
    expect(resultMessage).toHaveAttribute("id", "preview-result");
    const resetButton = screen.getByRole("button", { name: /try another preview number after revealing 5/i });
    expect(resetButton).toHaveAttribute("aria-describedby", "preview-result");
    expect(resetButton).toHaveTextContent("Try another preview pick");
    expect(resetButton).toHaveFocus();
    expect(screen.getByLabelText("You revealed 5")).toBeInTheDocument();
    expect(screen.getByLabelText("Preview player 1 revealed 1")).toBeInTheDocument();
    expect(resultMessage).toBeInTheDocument();

    fireEvent.click(resetButton);
    const restoredOption = screen.getByRole("radio", { name: /pick 5 for the preview/i });
    expect(restoredOption).toHaveFocus();
    expect(screen.getByRole("button", { name: /run the preview reveal with pick 5/i })).toBeInTheDocument();
  });

  it("announces preview state changes through a live region", () => {
    render(<LandingDemo />);

    const status = screen.getByRole("status");
    const region = screen.getByRole("region", { name: "Interactive Odd One preview" });
    expect(status).toHaveAttribute("aria-describedby", "preview-hint");
    expect(status).toHaveTextContent("Your secret pick");
    expect(status).toHaveTextContent("2");
    expect(region).toHaveAccessibleDescription(
      "Interactive preview Preview room #0042 Preview only. This sample uses picks 1-5; live rooms use the full 1-20 range. The other preview players stay fixed at 1, 1, 4, and 8 so you can see how uniqueness changes. Lowest unique number wins the round. Arrow keys wrap between preview numbers, while Home and End jump to the ends.",
    );

    fireEvent.click(screen.getByRole("radio", { name: /pick 5 for the preview/i }));
    expect(status).toHaveAttribute("aria-describedby", "preview-hint");
    expect(status).toHaveTextContent("Your secret pick");
    expect(status).toHaveTextContent("5");

    fireEvent.click(screen.getByRole("button", { name: /run the preview reveal with pick 5/i }));
    expect(status).toHaveAttribute("aria-describedby", "preview-result");
    expect(status).toHaveTextContent("Lowest unique number");
    expect(status).toHaveTextContent("4");
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(region).toHaveAccessibleDescription(
      "Interactive preview Preview room #0042 Your 5 was crowded out. Number 4 stood alone and takes the preview round.",
    );
  });

  it("explains the preview scoring breakdown on a winning reveal", () => {
    render(<LandingDemo />);

    fireEvent.click(screen.getByRole("radio", { name: /pick 2 for the preview/i }));
    fireEvent.click(screen.getByRole("button", { name: /run the preview reveal with pick 2/i }));

    expect(
      screen.getByText("You stood alone with 2. That preview win is 105 points total: 100 to win, 5 to reveal."),
    ).toBeInTheDocument();
  });

  it("supports keyboard navigation in the preview radio group", () => {
    render(<LandingDemo />);

    const picker = screen.getByRole("radiogroup", { name: /choose your preview number/i });
    expect(picker).not.toHaveAttribute("aria-activedescendant");
    expect(picker).toHaveAttribute("aria-keyshortcuts", "ArrowRight ArrowDown ArrowLeft ArrowUp Home End");
    expect(picker).toHaveAttribute("aria-orientation", "horizontal");
    const pickTwo = within(picker).getByRole("radio", { name: /pick 2 for the preview/i });
    const pickThree = within(picker).getByRole("radio", { name: /pick 3 for the preview/i });
    const pickFive = within(picker).getByRole("radio", { name: /pick 5 for the preview/i });
    const pickOne = within(picker).getByRole("radio", { name: /pick 1 for the preview/i });

    expect(pickTwo).toHaveAttribute("tabindex", "0");
    expect(pickThree).toHaveAttribute("tabindex", "-1");
    pickTwo.focus();
    expect(pickTwo).toHaveFocus();

    fireEvent.keyDown(picker, { key: "ArrowRight" });
    expect(picker).not.toHaveAttribute("aria-activedescendant");
    expect(pickThree).toHaveAttribute("aria-checked", "true");
    expect(pickThree).toHaveAttribute("tabindex", "0");
    expect(pickThree).toHaveFocus();

    fireEvent.keyDown(picker, { key: "End" });
    expect(picker).not.toHaveAttribute("aria-activedescendant");
    expect(pickFive).toHaveAttribute("aria-checked", "true");
    expect(pickFive).toHaveAttribute("tabindex", "0");
    expect(pickFive).toHaveFocus();

    fireEvent.keyDown(picker, { key: "Home" });
    expect(picker).not.toHaveAttribute("aria-activedescendant");
    expect(pickOne).toHaveAttribute("aria-checked", "true");
    expect(pickOne).toHaveAttribute("tabindex", "0");
    expect(pickOne).toHaveFocus();

    fireEvent.keyDown(picker, { key: "ArrowLeft" });
    expect(picker).not.toHaveAttribute("aria-activedescendant");
    expect(pickFive).toHaveAttribute("aria-checked", "true");
    expect(pickFive).toHaveFocus();
  });
});
