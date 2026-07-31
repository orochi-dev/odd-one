import type { Metadata } from "next";
import { PlayChooser } from "@/components/play-chooser";

export const metadata: Metadata = {
  title: "Choose a network lobby",
  description:
    "Choose the Celo or Stacks lobby to join a room or open your own, with rooms, scores, and profiles staying separate on each network and MiniPay opening Celo automatically when it is available.",
};

export default function PlayPage() {
  return <PlayChooser />;
}
