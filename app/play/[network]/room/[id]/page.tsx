import { notFound } from "next/navigation";
import { RoomView } from "@/components/game-ui";
import { isNetwork } from "@/lib/game";
export default async function RoomPage({params}:{params:Promise<{network:string;id:string}>}){const{network,id}=await params;if(!isNetwork(network)||!/^[1-9]\d*$/.test(id))notFound();return <RoomView network={network} id={BigInt(id)}/>;}
