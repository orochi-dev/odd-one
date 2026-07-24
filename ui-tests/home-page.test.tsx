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

    expect(screen.getByRole("banner", { name: "Odd One homepage" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Homepage sections and lobby" })).toBeInTheDocument();
  });

  it("gives each play entry point a distinct accessible lobby label", () => {
    render(<Home />);

    expect(screen.getByRole("link", { name: "Choose a lobby from the homepage navigation" })).toHaveAttribute("href", "/play");
    expect(screen.getByRole("link", { name: "Choose a lobby and start playing Odd One" })).toHaveAttribute("href", "/play");
    expect(screen.getByRole("link", { name: "Choose a lobby from the final call to action" })).toHaveAttribute("href", "/play");
  });

  it("hides the decorative probability field from assistive technology", () => {
    const { container } = render(<Home />);

    expect(container.querySelector(".probability-field")).toHaveAttribute("aria-hidden", "true");
  });

  it("exposes the public onchain warning as a named region", () => {
    render(<Home />);

    expect(screen.getByRole("region", { name: "The chain remembers the room." })).toBeInTheDocument();
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
