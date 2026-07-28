import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound from "@/app/not-found";

describe("NotFound", () => {
  it("offers clear recovery paths", () => {
    const { container } = render(<NotFound />);

    expect(screen.getByRole("main")).toHaveAttribute("aria-labelledby", "not-found-title");
    expect(screen.getByRole("main")).toHaveAttribute("aria-describedby", "not-found-copy");
    expect(screen.getByRole("heading", { name: /this number is not in play/i })).toBeInTheDocument();
    expect(screen.getByText(/the page may have moved, or the room link may be incomplete or mistyped. open the lobby chooser or paste the full room link again/i)).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Not found recovery actions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to the Odd One homepage" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /open the lobby chooser from the not found page/i })).toHaveAttribute("href", "/play");
    expect(screen.getByRole("link", { name: /open the lobby chooser from the not found page/i })).toHaveTextContent("Choose a lobby");
    expect(screen.getByRole("link", { name: /return to the odd one homepage from the not found page/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /return to the odd one homepage from the not found page/i })).toHaveTextContent("Return home");
    expect(container.querySelector(".brand-symbol")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".brand-symbol")).toHaveAttribute("focusable", "false");
    expect(container.querySelector(".display-number")).toHaveAttribute("aria-hidden", "true");
  });
});
