import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoomView } from "@/components/game-ui";
import { isNetwork } from "@/lib/game";

const networkLabel: Record<"celo" | "stacks", string> = {
  celo: "Celo",
  stacks: "Stacks"
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ network: string; id: string }>;
}): Promise<Metadata> {
  const { network, id } = await params;

  if (!isNetwork(network) || !/^[1-9]\d*$/.test(id)) {
    return {};
  }

  const label = networkLabel[network];
  const roomLabel = `Room #${id.padStart(4, "0")}`;

  return {
    title: `${roomLabel} on ${label}`,
    description: `Open ${roomLabel} on ${label} to join the round, track the timer, or reveal your Odd One pick.`
  };
}

export default async function RoomPage({ params }: { params: Promise<{ network: string; id: string }> }) {
  const { network, id } = await params;
  if (!isNetwork(network) || !/^[1-9]\d*$/.test(id)) notFound();
  return <RoomView network={network} id={BigInt(id)} />;
}
