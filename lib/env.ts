import type { Address } from "viem";
import type { Network } from "./types";

export type CeloNetwork = "celo" | "celoSepolia";
export type StacksNetwork = "mainnet" | "testnet";
const read = (value: string | undefined, fallback = "") => value?.trim() || fallback;

export const publicEnv = {
  appUrl: read(process.env.NEXT_PUBLIC_APP_URL, "http://localhost:3000"),
  talentVerification: read(process.env.NEXT_PUBLIC_TALENT_PROJECT_VERIFICATION),
  celoNetwork: (read(process.env.NEXT_PUBLIC_CELO_NETWORK, "celo") === "celo" ? "celo" : "celoSepolia") as CeloNetwork,
  celoContractAddress: read(process.env.NEXT_PUBLIC_ODD_ONE_CELO_CONTRACT_ADDRESS) as Address | "",
  celoDeploymentBlock: read(process.env.NEXT_PUBLIC_ODD_ONE_CELO_DEPLOYMENT_BLOCK),
  celoMainnetRpc: read(process.env.NEXT_PUBLIC_CELO_MAINNET_RPC_URL, "https://forno.celo.org"),
  celoSepoliaRpc: read(process.env.NEXT_PUBLIC_CELO_SEPOLIA_RPC_URL, "https://forno.celo-sepolia.celo-testnet.org"),
  stacksNetwork: (read(process.env.NEXT_PUBLIC_STACKS_NETWORK, "mainnet") === "mainnet" ? "mainnet" : "testnet") as StacksNetwork,
  stacksContractAddress: read(process.env.NEXT_PUBLIC_ODD_ONE_STACKS_CONTRACT_ADDRESS),
  stacksContractName: read(process.env.NEXT_PUBLIC_ODD_ONE_STACKS_CONTRACT_NAME, "odd-one-arena"),
  stacksMainnetApi: read(process.env.NEXT_PUBLIC_STACKS_API_MAINNET, "https://api.hiro.so"),
  stacksTestnetApi: read(process.env.NEXT_PUBLIC_STACKS_API_TESTNET, "https://api.testnet.hiro.so")
};

export const getCeloChainId = () => publicEnv.celoNetwork === "celo" ? 42220 : 11142220;
export const getCeloRpc = () => publicEnv.celoNetwork === "celo" ? publicEnv.celoMainnetRpc : publicEnv.celoSepoliaRpc;
export const getCeloExplorer = () => publicEnv.celoNetwork === "celo" ? "https://celoscan.io" : "https://celo-sepolia.blockscout.com";
export const getStacksApi = () => publicEnv.stacksNetwork === "mainnet" ? publicEnv.stacksMainnetApi : publicEnv.stacksTestnetApi;
export const contractConfigured = (network: Network) => network === "celo" ? Boolean(publicEnv.celoContractAddress) : Boolean(publicEnv.stacksContractAddress && publicEnv.stacksContractName);
export const contractId = (network: Network) => network === "celo" ? publicEnv.celoContractAddress : `${publicEnv.stacksContractAddress}.${publicEnv.stacksContractName}`;
export const networkId = (network: Network) => network === "celo" ? String(getCeloChainId()) : publicEnv.stacksNetwork;
export const txExplorerUrl = (network: Network, hash: string) => network === "celo"
  ? `${getCeloExplorer()}/tx/${hash}`
  : `https://explorer.hiro.so/txid/${hash.startsWith("0x") ? hash : `0x${hash}`}?chain=${publicEnv.stacksNetwork}`;
export const contractExplorerUrl = (network: Network) => network === "celo"
  ? `${getCeloExplorer()}/address/${publicEnv.celoContractAddress}`
  : `https://explorer.hiro.so/contract-call/${publicEnv.stacksContractAddress}/${publicEnv.stacksContractName}?chain=${publicEnv.stacksNetwork}`;
