import hre from "hardhat";
async function main() {
  const { ethers } = await hre.network.create(); const network = await ethers.provider.getNetwork();
  const contract = await ethers.deployContract("OddOneArena"); const transaction = contract.deploymentTransaction();
  await contract.waitForDeployment(); const receipt = transaction ? await transaction.wait() : null;
  const address = await contract.getAddress(); const explorer = Number(network.chainId) === 42220 ? "https://celoscan.io" : "https://celo-sepolia.blockscout.com";
  console.log("OddOneArena deployed"); console.log("network:", hre.globalOptions.network); console.log("chainId:", Number(network.chainId));
  console.log("address:", address); console.log("deploymentTx:", transaction?.hash ?? ""); console.log("deploymentBlock:", receipt?.blockNumber ?? "");
  console.log("explorer:", `${explorer}/address/${address}`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
