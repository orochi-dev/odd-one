import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NumberPicker } from "@/components/game-ui";

describe("NumberPicker", () => {
  it("groups the choices under an accessible legend and marks the selected value", () => {
    render(<NumberPicker selected={7} onSelect={vi.fn()} />);

    expect(screen.getByRole("group", { name: "Pick a number from one to twenty" })).toBeVisible();
    expect(screen.getByRole("button", { name: "7 plausibly odd" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "8 plausibly odd" })).toHaveAttribute("aria-pressed", "false");
  });
});
