import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
export default defineConfig({ resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } }, test: { environment: "jsdom", globals: true, setupFiles: ["./ui-tests/setup.ts"], include: ["ui-tests/**/*.test.ts", "ui-tests/**/*.test.tsx"] } });
