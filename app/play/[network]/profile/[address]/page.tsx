import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileView } from "@/components/game-ui";
import { isNetwork } from "@/lib/game";

const networkLabel: Record<"celo" | "stacks", string> = {
  celo: "Celo",
  stacks: "Stacks"
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ network: string; address: string }>;
}): Promise<Metadata> {
  const { network, address } = await params;

  if (!isNetwork(network) || !address) {
    return {};
  }

  const label = networkLabel[network];
  const shortAddress = address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;

  return {
    title: `${shortAddress} profile`,
    description: `Review Odd One wins, points, and room history for ${shortAddress} on ${label}.`
  };
}

export default async function ProfilePage({
  params
}: {
  params: Promise<{ network: string; address: string }>;
}) {
  const { network, address } = await params;
  if (!isNetwork(network) || !address) notFound();
  return <ProfileView network={network} address={address} />;
}
