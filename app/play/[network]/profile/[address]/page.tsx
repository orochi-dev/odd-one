import { notFound } from "next/navigation";
import { ProfileView } from "@/components/game-ui";
import { isNetwork } from "@/lib/game";
export default async function ProfilePage({params}:{params:Promise<{network:string;address:string}>}){const{network,address}=await params;if(!isNetwork(network)||!address)notFound();return <ProfileView network={network} address={address}/>;}
