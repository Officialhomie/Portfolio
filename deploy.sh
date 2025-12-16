#!/bin/bash

# Deployment script for Base Mainnet with contract verification
# Usage: ./deploy.sh <private-key>

set -e

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

RPC_URL="https://base-mainnet.g.alchemy.com/v2/f_SNCtMgIYAJswII3Y2BkjcSAWMpfNTh"
SCRIPT="script/Deploy.s.sol:DeployScript"

if [ -z "$1" ]; then
    echo "Usage: $0 <private-key>"
    echo ""
    echo "Example:"
    echo "  ./deploy.sh 0xYourPrivateKeyHere"
    echo ""
    exit 1
fi

PRIVATE_KEY=$1

# Verify API key is set
if [ -z "$BASESCAN_API_KEY" ]; then
    echo "Warning: BASESCAN_API_KEY not set. Contracts will not be verified."
    echo "Set it in .env file or export it: export BASESCAN_API_KEY=your-key"
fi

echo "Deploying contracts to Base Mainnet..."
echo "RPC: $RPC_URL"
echo "Verification: ${BASESCAN_API_KEY:+Enabled}${BASESCAN_API_KEY:-Disabled}"
echo ""

forge script $SCRIPT \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  -vvv

echo ""
echo "Deployment complete! Check the output above for contract addresses."
echo "Update src/lib/contracts/addresses.ts with the new addresses."
