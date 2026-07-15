import { initSimnet } from "@stacks/clarinet-sdk";
try {
  const simnet = await initSimnet("./Clarinet.toml", true);
  console.log(`Clarity check passed at block ${simnet.blockHeight}.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
