import "dotenv/config";
import hardhatEthersPlugin from "@nomicfoundation/hardhat-ethers";
import hardhatEthersChaiMatchersPlugin from "@nomicfoundation/hardhat-ethers-chai-matchers";
import hardhatMochaPlugin from "@nomicfoundation/hardhat-mocha";
import hardhatVerifyPlugin from "@nomicfoundation/hardhat-verify";
import { defineConfig } from "hardhat/config";
import { serverEnv } from "./lib/server-env";

const accounts = /^0x[0-9a-fA-F]{64}$/.test(serverEnv.privateKey) ? [serverEnv.privateKey] : undefined;
const apiKey = serverEnv.etherscanApiKey || serverEnv.celoscanApiKey;

export default defineConfig({
  plugins: [hardhatEthersPlugin, hardhatEthersChaiMatchersPlugin, hardhatMochaPlugin, hardhatVerifyPlugin],
  solidity: { version: "0.8.24", settings: { optimizer: { enabled: true, runs: 200 } } },
  networks: {
    celo: { type: "http", chainType: "generic", url: serverEnv.celoMainnetRpc, chainId: 42220, accounts },
    celoSepolia: { type: "http", chainType: "generic", url: serverEnv.celoSepoliaRpc, chainId: 11142220, accounts }
  },
  chainDescriptors: {
    42220: { name: "Celo Mainnet", chainType: "generic", blockExplorers: { etherscan: { name: "Celoscan", url: "https://celoscan.io", apiUrl: "https://api.etherscan.io/v2/api" } } },
    11142220: { name: "Celo Sepolia", chainType: "generic", blockExplorers: { blockscout: { name: "Celo Sepolia Blockscout", url: "https://celo-sepolia.blockscout.com", apiUrl: "https://celo-sepolia.blockscout.com/api" } } }
  },
  verify: apiKey ? { etherscan: { apiKey } } : { etherscan: { enabled: false } }
});
