# Quick Deployment Commands

## One-Time Deployment (Replace YOUR_PRIVATE_KEY with your actual private key)

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://base-mainnet.g.alchemy.com/v2/f_SNCtMgIYAJswII3Y2BkjcSAWMpfNTh \
  --private-key YOUR_PRIVATE_KEY \
  --broadcast \
  --verify \
  -vvv
```

## Step-by-Step:

1. **Replace `YOUR_PRIVATE_KEY`** with your actual private key (should start with `0x`)

2. **Run the command** - it will:
   - Deploy all 5 contracts to Base Mainnet
   - Verify them on Basescan (if BASESCAN_API_KEY is set)
   - Show you all the deployed addresses

3. **After deployment**, copy the addresses from the output and update `src/lib/contracts/addresses.ts`

## Example Output:
```
PortfolioToken deployed at: 0x...
VisitorBook deployed at: 0x...
ProjectNFT deployed at: 0x...
ProjectVoting deployed at: 0x...
VisitNFT deployed at: 0x...
```

## Note:
- Make sure you have enough ETH on Base mainnet for gas fees
- The `--verify` flag will verify contracts if BASESCAN_API_KEY is set in your environment
- The private key is only used for this one command and not saved anywhere

