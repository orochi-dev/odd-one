import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound from "@/app/not-found";

describe("NotFound", () => {
  it("offers clear recovery paths", () => {
    const { container } = render(<NotFound />);

    expect(screen.getByRole("heading", { name: /this number is not in play/i })).toBeInTheDocument();
    expect(screen.getByText(/the page may have moved, or the room link may no longer be valid/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to the lobby/i })).toHaveAttribute("href", "/play");
    expect(screen.getByRole("link", { name: /visit the landing page/i })).toHaveAttribute("href", "/");
    expect(container.querySelector(".display-number")).toHaveAttribute("aria-hidden", "true");
  });
});
