import { notFound } from "next/navigation";
import { CreateRoomView } from "@/components/game-ui";
import { isNetwork } from "@/lib/game";
export default async function CreatePage({params}:{params:Promise<{network:string}>}){const{network}=await params;if(!isNetwork(network))notFound();return <CreateRoomView network={network}/>;}
