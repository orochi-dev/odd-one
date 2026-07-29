import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import { metadata } from "@/app/layout";
import { metadata as playMetadata } from "@/app/play/page";

describe("layout metadata", () => {
  it("disables mobile format detection for game copy", () => {
    expect(metadata.formatDetection).toEqual({
      telephone: false,
      email: false,
      address: false,
    });
  });

  it("configures the installed app shell for Odd One", () => {
    expect(metadata.appleWebApp).toEqual({
      capable: true,
      title: "Odd One",
      statusBarStyle: "black-translucent",
    });
  });

  it("keeps the web manifest aligned with the landing copy and portrait play", () => {
    const webManifest = manifest();

    expect(webManifest.description).toContain("hope nobody thought like you");
    expect(webManifest.orientation).toBe("portrait");
  });

  it("describes the chooser as a place to join a room or open one", () => {
    expect(playMetadata.description).toBe(
      "Choose the Celo or Stacks lobby to join a room or open your own, with MiniPay opening the Celo lobby automatically when it is available.",
    );
  });
});
