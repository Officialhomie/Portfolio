# Smart Contracts

This directory contains the smart contracts for the Web3 Portfolio Protocol, deployed on Base Mainnet.

## Contracts

### 1. VisitorBook.sol
Gas-optimized contract for storing visitor signatures on-chain.
- Stores visitor addresses, messages, and timestamps
- Prevents duplicate visits per address
- Emits events for indexing

### 2. ProjectNFT.sol
ERC-721 NFT contract for minting projects as NFTs.
- Each project is minted as an NFT with IPFS metadata
- Supports project endorsements
- Tracks project statistics

### 3. ProjectVoting.sol
Simple voting mechanism for favorite projects.
- One vote per address per project
- Tracks vote counts per project
- Emits events for indexing

### 4. VisitNFT.sol
Limited edition NFT for first-time portfolio visitors.
- First 100 visitors can mint free "Proof of Visit" NFT
- One NFT per address
- ERC-721 standard

## Setup with Foundry

1. Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. Install dependencies:
```bash
forge install OpenZeppelin/openzeppelin-contracts
```

3. Compile contracts:
```bash
forge build
```

4. Run tests:
```bash
forge test
```

5. Deploy to Base Mainnet:
```bash
forge script script/Deploy.s.sol --rpc-url base --broadcast --verify
```

## Environment Variables

Create a `.env` file:
```
PRIVATE_KEY=your_private_key
BASESCAN_API_KEY=your_basescan_api_key
```

## Deployment Addresses

After deployment, update contract addresses in:
- `lib/contracts.ts`
- `.env` file


