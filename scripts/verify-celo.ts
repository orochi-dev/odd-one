import hre from "hardhat";
import { serverEnv } from "../lib/server-env";
async function main() {
  const address = hre.globalOptions.network === "celo" ? serverEnv.celoMainnetAddress : serverEnv.celoSepoliaAddress;
  if (!address) throw new Error("Missing the matching ODD_ONE_CELO_CONTRACT_ADDRESS environment value.");
  const runner = hre as unknown as { run(task: string, args: Record<string, unknown>): Promise<unknown> };
  await runner.run("verify:verify", { address, constructorArguments: [] }); console.log("Verified OddOneArena at", address);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
