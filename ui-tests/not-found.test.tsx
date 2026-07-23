import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound from "@/app/not-found";

describe("NotFound", () => {
  it("offers clear recovery paths", () => {
    const { container } = render(<NotFound />);

    expect(screen.getByRole("alert")).toHaveAttribute("aria-labelledby", "not-found-title");
    expect(screen.getByRole("alert")).toHaveAttribute("aria-describedby", "not-found-copy");
    expect(screen.getByRole("heading", { name: /this number is not in play/i })).toBeInTheDocument();
    expect(screen.getByText(/the page may have moved, or the room link may no longer be valid/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to the Odd One homepage" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /choose a lobby from the not found page/i })).toHaveAttribute("href", "/play");
    expect(screen.getByRole("link", { name: /return to the odd one homepage from the not found page/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /return to the odd one homepage from the not found page/i })).toHaveTextContent("Return home");
    expect(container.querySelector(".brand-symbol")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".brand-symbol")).toHaveAttribute("focusable", "false");
    expect(container.querySelector(".display-number")).toHaveAttribute("aria-hidden", "true");
  });
});
