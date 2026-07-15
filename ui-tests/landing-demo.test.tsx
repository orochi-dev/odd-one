import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingDemo } from "@/components/landing-demo";
describe("LandingDemo",()=>{it("runs a clearly labeled simulated reveal",()=>{render(<LandingDemo/>);expect(screen.getByText("Interactive preview")).toBeInTheDocument();fireEvent.click(screen.getByRole("button",{name:"3"}));fireEvent.click(screen.getByRole("button",{name:/run the reveal/i}));expect(screen.getByText(/stood alone/i)).toBeInTheDocument();fireEvent.click(screen.getByRole("button",{name:/play it again/i}));expect(screen.getByRole("button",{name:/run the reveal/i})).toBeInTheDocument();});});
