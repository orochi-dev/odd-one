const read = (value: string | undefined, fallback = "") => value?.trim() || fallback;
export const serverEnv = {
  privateKey: read(process.env.PRIVATE_KEY),
  celoMainnetRpc: read(process.env.CELO_MAINNET_RPC_URL, "https://forno.celo.org"),
  celoSepoliaRpc: read(process.env.CELO_SEPOLIA_RPC_URL, "https://forno.celo-sepolia.celo-testnet.org"),
  etherscanApiKey: read(process.env.ETHERSCAN_API_KEY),
  celoscanApiKey: read(process.env.CELOSCAN_API_KEY),
  celoMainnetAddress: read(process.env.ODD_ONE_CELO_CONTRACT_ADDRESS_MAINNET),
  celoSepoliaAddress: read(process.env.ODD_ONE_CELO_CONTRACT_ADDRESS_SEPOLIA),
  stacksPrivateKey: read(process.env.STACKS_PRIVATE_KEY),
  stacksNetwork: read(process.env.STACKS_NETWORK, "mainnet"),
  stacksDeployFee: Number(read(process.env.STACKS_DEPLOY_FEE_MICROSTX, "300000"))
};
