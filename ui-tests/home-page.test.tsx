import { render, screen, within } from "@testing-library/react";
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
    expect(screen.getByRole("img", { name: "Odd One" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Jump to the Odd One rules and timeline" })).toHaveAttribute("href", "#rules");
    expect(screen.getByRole("link", { name: "Jump to the Celo and Stacks network overview" })).toHaveTextContent("Networks");
    expect(screen.getByRole("link", { name: "Jump to the Celo and Stacks network overview" })).toHaveAttribute("href", "#onchain");
  });

  it("gives each play entry point a distinct accessible lobby label", () => {
    render(<Home />);

    expect(screen.getByRole("link", { name: "Choose a lobby from the homepage navigation" })).toHaveAttribute("href", "/play");
    expect(screen.getByRole("link", { name: "Choose a lobby and start playing Odd One" })).toHaveAttribute("href", "/play");
    expect(screen.getByRole("link", { name: "Choose a lobby from the final call to action" })).toHaveAttribute("href", "/play");
  });

  it("gives the hero rules jump link a descriptive accessible name", () => {
    render(<Home />);

    expect(screen.getByRole("link", { name: "Learn how Odd One works" })).toHaveAttribute("href", "#rules");
  });

  it("exposes the hero proof points as a named list", () => {
    render(<Home />);

    const quickFacts = screen.getByRole("list", { name: "Odd One quick facts" });

    expect(quickFacts).toHaveTextContent("No entry fee");
    expect(quickFacts).toHaveTextContent("3–12 players");
    expect(quickFacts).toHaveTextContent("Celo + Stacks");
    expect(within(quickFacts).getAllByRole("listitem")).toHaveLength(3);
  });

  it("hides the decorative probability field from assistive technology", () => {
    const { container } = render(<Home />);

    expect(container.querySelector(".probability-field")).toHaveAttribute("aria-hidden", "true");
  });

  it("exposes the public onchain warning as a named region", () => {
    render(<Home />);

    expect(screen.getByRole("region", { name: "The chain remembers the room." })).toBeInTheDocument();
  });

  it("exposes the network explainer as a named region", () => {
    render(<Home />);

    expect(screen.getByRole("region", { name: "Celo in MiniPay. Stacks beside Bitcoin." })).toHaveAccessibleDescription(
      "Your rooms and scores live independently on each network. There is no account server, indexer, or hidden operator. Fast mobile play with automatic MiniPay wallet access. Clarity-native rooms with the same timing and scoring rules.",
    );
  });

  it("exposes the rules section as a named region", () => {
    render(<Home />);

    expect(screen.getByRole("region", { name: "Simple rules. Suspicious minds." })).toBeInTheDocument();
  });

  it("exposes the hero intro as a named region", () => {
    render(<Home />);

    expect(screen.getByRole("region", { name: "Go low. Stay unique." })).toBeInTheDocument();
  });

  it("exposes the timeline explainer as a named region", () => {
    render(<Home />);

    expect(screen.getByRole("region", { name: "Thirty minutes. No host advantage." })).toBeInTheDocument();
  });

  it("exposes the round timeline as an ordered list of steps", () => {
    render(<Home />);

    const timeline = screen.getByRole("list", { name: "Odd One round timeline" });
    const steps = within(timeline).getAllByRole("listitem");

    expect(steps).toHaveLength(3);
    expect(timeline).toHaveTextContent("20:00");
    expect(timeline).toHaveTextContent("Secret pick phase");
    expect(timeline).toHaveTextContent("10:00");
    expect(timeline).toHaveTextContent("Public reveal phase");
    expect(timeline).toHaveTextContent("Anyone can settle");
    expect(within(steps[2]).getByText("↓")).toHaveAttribute("aria-hidden", "true");
  });

  it("exposes the strategy explainer as a named region", () => {
    render(<Home />);

    expect(screen.getByRole("region", { name: "One is perfect. Unless everyone knows it." })).toBeInTheDocument();
  });

  it("exposes the room visibility explainer as a named region", () => {
    render(<Home />);

    expect(screen.getByRole("region", { name: "Public and unlisted room visibility" })).toBeInTheDocument();
    expect(screen.getByText("Listed in the lobby for anyone ready to join a live room.")).toBeInTheDocument();
  });

  it("exposes the final call to action as a named region", () => {
    render(<Home />);

    expect(screen.getByRole("region", { name: "There is only one way to find out." })).toBeInTheDocument();
    expect(screen.getByText("Pick Celo or Stacks, then join a room already in motion or open one of your own.")).toBeInTheDocument();
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

  it("keeps the footer brand mark decorative", () => {
    const { container } = render(<Home />);

    expect(container.querySelector(".landing-footer .brand-lockup")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByLabelText("Odd One")).not.toContainElement(container.querySelector(".landing-footer .brand-lockup"));
  });

  it("states the footer disclosure with the no-fee and no-prize-pool wording", () => {
    render(<Home />);

    expect(screen.getByText("A free strategy game. No entry fee, prize pool, or financial value.")).toBeInTheDocument();
  });
});
