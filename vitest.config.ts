import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node", globals: true, env: { CLARINET_MANIFEST_PATH: "./Clarinet.toml" }, include: ["stacks/tests/**/*.test.ts"] } });
