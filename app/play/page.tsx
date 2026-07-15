import type { Metadata } from "next";
import { PlayChooser } from "@/components/play-chooser";

export const metadata: Metadata = {
  title: "Choose a network",
  description: "Pick Celo or Stacks to enter the Odd One lobby and start a room on the chain you want to play."
};

export default function PlayPage() {
  return <PlayChooser />;
}
