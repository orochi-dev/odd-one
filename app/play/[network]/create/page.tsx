import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CreateRoomView } from "@/components/game-ui";
import { isNetwork } from "@/lib/game";

const networkLabel: Record<"celo" | "stacks", string> = {
  celo: "Celo",
  stacks: "Stacks"
};

export async function generateMetadata({ params }: { params: Promise<{ network: string }> }): Promise<Metadata> {
  const { network } = await params;

  if (!isNetwork(network)) {
    return {};
  }

  const label = networkLabel[network];

  return {
    title: `Create ${label} room`,
    description: `Open a new Odd One room on ${label} and invite players onto the same network.`
  };
}

export default async function CreatePage({ params }: { params: Promise<{ network: string }> }) {
  const { network } = await params;
  if (!isNetwork(network)) notFound();
  return <CreateRoomView network={network} />;
}
