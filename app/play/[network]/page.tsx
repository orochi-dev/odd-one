import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Lobby } from "@/components/game-ui";
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
    title: `${label} lobby`,
    description: `Browse live Odd One rooms on ${label}, or jump in and start a round on that network.`
  };
}

export default async function NetworkPage({ params }: { params: Promise<{ network: string }> }) {
  const { network } = await params;
  if (!isNetwork(network)) notFound();
  return <Lobby network={network} />;
}
