import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Home", () => {
  it("offers a skip link to the main content", () => {
    render(<Home />);

    expect(screen.getByRole("link", { name: /skip to main content/i })).toHaveAttribute("href", "#main-content");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  });

  it("names the primary navigation landmark", () => {
    render(<Home />);

    expect(screen.getByRole("navigation", { name: /primary/i })).toBeInTheDocument();
  });

  it("hides the decorative probability field from assistive technology", () => {
    const { container } = render(<Home />);

    expect(container.querySelector(".probability-field")).toHaveAttribute("aria-hidden", "true");
  });

  it("marks decorative landing icons as hidden from assistive technology", () => {
    const { container } = render(<Home />);

    const decorativeIcons = container.querySelectorAll("svg.lucide");
    expect(decorativeIcons.length).toBeGreaterThan(0);

    decorativeIcons.forEach((icon) => {
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon).toHaveAttribute("focusable", "false");
    });
  });
});
