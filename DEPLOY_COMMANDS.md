# Deployment Commands for Base Mainnet

## Step 1: Get Deployer Address
```bash
cast wallet address deployer-onetruehomie
```

## Step 2: Check Account Balance (Optional)
```bash
cast balance $(cast wallet address deployer-onetruehomie) --rpc-url https://base-mainnet.g.alchemy.com/v2/f_SNCtMgIYAJswII3Y2BkjcSAWMpfNTh
```

## Step 3: Deploy Contracts
```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://base-mainnet.g.alchemy.com/v2/f_SNCtMgIYAJswII3Y2BkjcSAWMpfNTh \
  --account deployer-onetruehomie \
  --sender $(cast wallet address deployer-onetruehomie) \
  --broadcast \
  --verify \
  -vvv
```

## Alternative: If the above doesn't work, try with --legacy flag
```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://base-mainnet.g.alchemy.com/v2/f_SNCtMgIYAJswII3Y2BkjcSAWMpfNTh \
  --account deployer-onetruehomie \
  --sender $(cast wallet address deployer-onetruehomie) \
  --broadcast \
  --legacy \
  --verify \
  -vvv
```

## Step 4: After Deployment - Extract Addresses
The deployment output will show the deployed addresses. Extract them and update:

1. `src/lib/contracts/addresses.ts` - Update the Base mainnet addresses
2. Check deployment logs for verification status

## Step 5: Verify Contracts on Basescan (if --verify didn't work)
```bash
# For each contract, run:
forge verify-contract <CONTRACT_ADDRESS> \
  --chain-id 8453 \
  --num-of-optimizations 200 \
  --watch \
  --etherscan-api-key ${BASESCAN_API_KEY} \
  --constructor-args $(cast abi-encode "constructor()") \
  <CONTRACT_NAME>
```

## Notes:
- Make sure you have ETH on Base mainnet for gas fees
- The `--verify` flag will automatically verify contracts on Basescan if BASESCAN_API_KEY is set
- If account signing fails, you may need to enter the password when prompted
- The deployment will output all contract addresses in the console

