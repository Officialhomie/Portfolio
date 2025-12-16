# Fix for "Failed to decode private key" Error

## Problem
The keystore files are encrypted and require a password. The `cast wallet address` command is failing because it can't decrypt the keystore without a password.

## Solutions

### Option 1: Decrypt Keystore and Use Private Key Directly (Recommended)

1. **Decrypt the keystore** (will prompt for password):
```bash
cast wallet decrypt-keystore ~/.foundry/keystores/deployer-onetruehomie
```

2. **Copy the private key** from the output (it will start with `0x`)

3. **Deploy using the private key directly**:
```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://base-mainnet.g.alchemy.com/v2/f_SNCtMgIYAJswII3Y2BkjcSAWMpfNTh \
  --private-key YOUR_PRIVATE_KEY_HERE \
  --broadcast \
  --verify \
  -vvv
```

### Option 2: Use Environment Variable for Password

If you want to use the account name, you can set the password as an environment variable:

```bash
# Set password (replace with actual password)
export FOUNDRY_ETH_KEYSTORE_PASSWORD="your-password-here"

# Then try deployment
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://base-mainnet.g.alchemy.com/v2/f_SNCtMgIYAJswII3Y2BkjcSAWMpfNTh \
  --account deployer-onetruehomie \
  --broadcast \
  --verify \
  -vvv
```

### Option 3: Use Interactive Password Prompt

Try running forge script with the account - it should prompt for password interactively:

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://base-mainnet.g.alchemy.com/v2/f_SNCtMgIYAJswII3Y2BkjcSAWMpfNTh \
  --account deployer-onetruehomie \
  --broadcast \
  --verify \
  --slow \
  -vvv
```

The `--slow` flag gives more time for password entry.

### Option 4: Create a New Unencrypted Account (For Testing)

If you need a quick solution for testing:

```bash
# Create new account without encryption
cast wallet new --unsafe

# This will output a private key - save it securely
# Then use it directly:
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://base-mainnet.g.alchemy.com/v2/f_SNCtMgIYAJswII3Y2BkjcSAWMpfNTh \
  --private-key YOUR_NEW_PRIVATE_KEY \
  --broadcast \
  --verify \
  -vvv
```

## Recommended Approach

**Use Option 1** - decrypt the keystore once, get the private key, and use it directly. This is the most reliable method.

## After Deployment

Once deployment succeeds, extract the addresses from the output and update `src/lib/contracts/addresses.ts`.

