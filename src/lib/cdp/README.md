# CDP Smart Account Integration

**IMPORTANT:** The current version of `permissionless` (v0.3.2) is outdated and incompatible with modern CDP Paymaster integration.

## What Needs to be Done

To properly integrate CDP Paymaster, you need to:

1. **Upgrade permissionless.js** to the latest version (v0.2.x is outdated):
   ```bash
   npm install permissionless@latest viem@latest
   ```

2. **Use CDP RPC URL directly** - CDP provides a combined bundler + paymaster endpoint, so you don't need separate Pimlico clients.

3. **Implementation approach** - For now, we'll use a direct viem-based approach that doesn't require permissionless.js's advanced features.

## Current Status

- Biconomy has been **completely removed**
- CDP configuration is ready in `.env.local`
- Biometric signer (secp256r1) is available and working
- Smart wallet context is updated to use CDP

## Temporary Solution

Since upgrading permissionless.js might break other dependencies, I've created a **minimal CDP implementation** that:
- Uses your existing biometric authentication
- Works with current dependencies
- Can be upgraded later when you update packages

The implementation uses the CDP smart wallet approach but without the advanced permissionless.js abstractions.
