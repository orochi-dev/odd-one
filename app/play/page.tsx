import type { Metadata } from "next";
import { PlayChooser } from "@/components/play-chooser";

export const metadata: Metadata = {
  title: "Choose a network lobby",
  description: "Choose the Celo or Stacks lobby to start a room, with MiniPay opening the Celo lobby automatically when it is available."
};

export default function PlayPage() {
  return <PlayChooser />;
}
