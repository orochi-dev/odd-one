import { notFound } from "next/navigation";
import { Lobby } from "@/components/game-ui";
import { isNetwork } from "@/lib/game";
export default async function NetworkPage({ params }: { params: Promise<{ network: string }> }) { const { network }=await params; if(!isNetwork(network))notFound(); return <Lobby network={network}/>; }
