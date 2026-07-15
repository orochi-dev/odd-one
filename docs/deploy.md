# Deployment guide

Deployment is an explicit future operation. Never place private keys in `NEXT_PUBLIC_*` variables.

## Celo

1. Set `PRIVATE_KEY` and the appropriate private RPC variables.
2. Run `npm run compile:celo && npm run test:celo`.
3. Deploy Sepolia with `npm run deploy:celo:sepolia`.
4. Record address, transaction, and deployment block.
5. Set the corresponding private address and run `npm run verify:celo:sepolia`.
6. Test MiniPay, then repeat for mainnet only after the launch checklist passes.
7. Publish the address and block through the matching `NEXT_PUBLIC_*` variables.

## Stacks

1. Set `STACKS_PRIVATE_KEY`, `STACKS_NETWORK`, and a positive fee cap.
2. Run `npm run check:stacks && npm run test:stacks`.
3. Deploy testnet with `npm run deploy:stacks:testnet`.
4. Record the transaction and contract ID.
5. Test with Stacks Connect before any mainnet deployment.

Deploy commands print the network, address/contract ID, transaction ID, and explorer location. They do not edit environment files.
