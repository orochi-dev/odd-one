import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import { metadata } from "@/app/layout";

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
});
