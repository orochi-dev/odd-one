import type { Metadata } from "next";
import { PlayChooser } from "@/components/play-chooser";

export const metadata: Metadata = {
  title: "Choose a lobby",
  description: "Choose the Celo or Stacks lobby and start a room on the network you want to play."
};

export default function PlayPage() {
  return <PlayChooser />;
}
