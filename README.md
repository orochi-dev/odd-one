# Odd One

**Go low. Stay unique.** Odd One is a free, fast strategy game on Celo and Stacks. Three to twelve wallets secretly choose a number from 1–20. After the reveal window, the lowest number selected exactly once wins.

Odd One has no entry fee, prizes, token, custody, financial value, backend, database, indexer, administrator, or upgrade path.

## Game loop

1. A creator starts a public or unlisted room and commits a hidden number.
2. Other wallets have 20 minutes to commit.
3. Players have 10 minutes to reveal their original number and salt.
4. Anyone finalizes. Fewer than three reveals is no-contest; no unique number is a draw.
5. A valid reveal earns 5 points and a win adds 100.

The reveal ticket is stored locally and can be exported, backed up, and imported later to complete reveal. It contains the secret number and salt and must not be shared before reveal.

## Development

Requirements: Node.js 22.13+, npm, and Clarinet 4 for the native Clarity CLI commands.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Without contract addresses, the landing page remains complete and application routes display an explicit setup state. They never fabricate live room data.

## Architecture

- Next.js 16 and React 19
- A shared `OddOneRepository` interface with independent Celo and Stacks adapters
- Viem and injected EIP-1193 wallets for Celo/MiniPay
- Stacks Connect and Stacks Transactions for Stacks
- Solidity 0.8.24 with Hardhat 3
- Clarity 4 with Clarinet
- IndexedDB reveal vault with portable, checksummed JSON tickets

The contracts are the only source of truth. Each network maintains separate rooms, histories, points, and titles.

## Verification

```bash
npm run lint
npm run typecheck
npm run test:celo
npm run check:stacks
npm run test:stacks
npm run test:ui
npm run build
npm run verify
npm run verify:full
```

## Deployment

Deployment is intentionally not performed as part of the code-ready delivery. After filling the deployment variables:

```bash
npm run deploy:celo:sepolia
npm run verify:celo:sepolia
npm run deploy:celo:mainnet
npm run deploy:stacks:testnet
npm run deploy:stacks:mainnet
```

See `docs/deploy.md` and `docs/launch-checklist.md` before any network action.
