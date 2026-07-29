import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import { metadata } from "@/app/layout";
import { metadata as playMetadata } from "@/app/play/page";
import { generateMetadata as generateNetworkMetadata } from "@/app/play/[network]/page";
import { generateMetadata as generateCreateMetadata } from "@/app/play/[network]/create/page";
import { generateMetadata as generateProfileMetadata } from "@/app/play/[network]/profile/[address]/page";
import { generateMetadata as generateRoomMetadata } from "@/app/play/[network]/room/[id]/page";

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

  it("describes room creation as taking the first seat before inviting others", async () => {
    await expect(generateCreateMetadata({ params: Promise.resolve({ network: "celo" }) })).resolves.toMatchObject({
      description:
        "Open a new Odd One room on Celo, take the first seat yourself, and invite other players onto the same network.",
    });
  });

  it("describes each network lobby as a place to join before commit closes or create a room", async () => {
    await expect(generateNetworkMetadata({ params: Promise.resolve({ network: "stacks" }) })).resolves.toMatchObject({
      description:
        "Browse live Odd One rooms on Stacks, join before commit closes, or create a new room on that network.",
    });
  });

  it("describes room metadata as a timed join window before reveal", async () => {
    await expect(
      generateRoomMetadata({ params: Promise.resolve({ network: "stacks", id: "7" }) }),
    ).resolves.toMatchObject({
      description:
        "Open Room #0007 on Stacks to join before commit closes, track the timer, or reveal your Odd One pick.",
    });
  });

  it("describes player profiles as points, streaks, titles, and room history", async () => {
    await expect(
      generateProfileMetadata({
        params: Promise.resolve({
          network: "celo",
          address: "0x1234567890abcdef1234567890abcdef12345678",
        }),
      }),
    ).resolves.toMatchObject({
      description:
        "Review Odd One points, wins, reveal streaks, unlocked titles, and recent rooms for 0x1234...5678 on Celo.",
    });
  });
});
