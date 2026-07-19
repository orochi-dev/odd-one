import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound from "@/app/not-found";

describe("NotFound", () => {
  it("offers clear recovery paths", () => {
    const { container } = render(<NotFound />);

    expect(screen.getByRole("heading", { name: /this number is not in play/i })).toBeInTheDocument();
    expect(screen.getByText(/the page may have moved, or the room link may no longer be valid/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /return to the odd one homepage/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /choose a lobby/i })).toHaveAttribute("href", "/play");
    expect(screen.getByRole("link", { name: /return home/i })).toHaveAttribute("href", "/");
    expect(container.querySelector(".brand-symbol")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".brand-symbol")).toHaveAttribute("focusable", "false");
    expect(container.querySelector(".display-number")).toHaveAttribute("aria-hidden", "true");
  });
});
