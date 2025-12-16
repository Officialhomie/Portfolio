# Biometric Signing Implementation Analysis

**Date**: December 2025  
**Status**: ⚠️ **PARTIALLY ALIGNED** - Implementation exists but does not fully align with EIP-7951/Fusaka upgrade

---

## Executive Summary

The codebase has implemented a biometric authentication layer using WebAuthn API, but it operates as a **pre-authentication step** rather than integrating biometric signing directly into blockchain transactions. The current implementation does **NOT** align with the EIP-7951/Fusaka upgrade design, which requires secp256r1 signatures to be verified on-chain.

---

## Current Implementation Analysis

### How It Currently Works

1. **Pre-Transaction Biometric Auth**:
   - User initiates transaction (vote, claim, endorse, etc.)
   - App checks if biometric is enabled (`isEnabled` flag)
   - If enabled, app calls `requestBiometricAuth()` which triggers WebAuthn API
   - User authenticates with fingerprint/Face ID via browser/device prompt
   - After successful auth, transaction proceeds to wallet signing
   - Wallet signs transaction with standard ECDSA (secp256k1)
   - Transaction is sent to blockchain

2. **Key Components**:
   - `src/lib/biometric/auth.ts` - WebAuthn API integration
   - `src/lib/biometric/signer.ts` - Transaction wrapper (NOT actually used)
   - `src/hooks/useBiometric.ts` - React hooks for biometric state
   - Contract hooks (`usePortfolioToken`, `useProjectVoting`, etc.) - Call `requestAuth()` before `writeContract()`

### Current Flow Diagram

```
User Action → Check Biometric Enabled → WebAuthn Prompt (Fingerprint/Face ID)
    ↓
Biometric Success → writeContract() → Wallet Prompt (May also have biometric)
    ↓
Wallet Signs (ECDSA secp256k1) → Transaction Sent → Blockchain
```

---

## Issues with Current Implementation

### ❌ **CRITICAL ISSUE #1: Not Using secp256r1 for Transaction Signing**

**Problem**: The biometric authentication generates a secp256r1 key pair in the secure enclave, but this key is **NEVER used** for actual transaction signing.

**Evidence**:
- `generateSecp256r1Key()` creates a WebAuthn credential with secp256r1 (ES256 = -7)
- `signWithBiometric()` can generate signatures, but it's **not called** in transaction flow
- All transactions still use `writeContract()` from wagmi, which uses wallet's ECDSA key
- The `biometricVerified` flag is just metadata, not verified on-chain

**Location**: 
- `src/lib/biometric/signer.ts:82-87` - Returns `biometricVerified: true` but doesn't actually sign
- `src/hooks/contracts/usePortfolioToken.ts:107-116` - Calls `requestAuth()` then `writeContract()` separately

### ❌ **CRITICAL ISSUE #2: No On-Chain Verification**

**Problem**: Contracts don't verify biometric signatures. They only see standard ECDSA signatures from the wallet.

**Evidence**:
- `PortfolioToken.sol` - No biometric signature verification
- `ProjectVoting.sol` - No biometric signature verification  
- `VisitorBook.sol` - Only verifies EIP-712 signatures (ECDSA), not secp256r1
- All contracts use standard `msg.sender` authentication

**What's Missing**:
- No EIP-7951 precompile calls in contracts
- No secp256r1 signature verification functions
- No mapping of secp256r1 public keys to Ethereum addresses

### ❌ **CRITICAL ISSUE #3: Double Biometric Prompts**

**Problem**: Users may be prompted twice for biometric authentication:
1. App-level biometric (WebAuthn)
2. Wallet-level biometric (if wallet has it enabled)

**Evidence**:
- App calls `requestBiometricAuth()` before transaction
- Wallet may also prompt for biometric when signing
- No integration between the two

### ⚠️ **ISSUE #4: Biometric Signer Not Actually Used**

**Problem**: The `createBiometricSigner()` and `executeWithBiometric()` functions exist but are **never called** in the actual transaction flow.

**Evidence**:
- `src/lib/biometric/signer.ts` - Complete implementation exists
- Contract hooks use `requestAuth()` directly, not `executeWithBiometric()`
- The signer wrapper is dead code

**Location**:
- `src/hooks/contracts/usePortfolioToken.ts` - Uses `requestAuth()` directly
- `src/hooks/contracts/useProjectVoting.ts` - Uses `requestAuth()` directly
- No imports of `executeWithBiometric()` anywhere

### ⚠️ **ISSUE #5: EIP-7951 Compatibility Check Doesn't Affect Behavior**

**Problem**: The code checks for EIP-7951 support but still uses hybrid approach regardless.

**Evidence**:
- `src/lib/biometric/compatibility.ts` - Checks for EIP-7951 precompile
- `src/lib/biometric/signer.ts:72-79` - Even if EIP-7951 is supported, still uses hybrid approach
- Comment says "For now, we'll use hybrid approach until EIP-7951 is fully supported"

---

## What EIP-7951/Fusaka Upgrade Should Do

### Correct Implementation Flow

```
User Action → Generate Transaction Hash
    ↓
Sign with secp256r1 key (requires biometric prompt)
    ↓
Transaction includes secp256r1 signature
    ↓
Contract verifies secp256r1 signature using EIP-7951 precompile
    ↓
If valid, execute transaction
```

### Key Requirements

1. **secp256r1 Signing**: Transactions must be signed with secp256r1 keys stored in secure enclave
2. **On-Chain Verification**: Contracts must verify secp256r1 signatures using EIP-7951 precompile
3. **Single Biometric Prompt**: Biometric should be part of signing process, not separate step
4. **Public Key Mapping**: Need to map secp256r1 public keys to Ethereum addresses

---

## Contract Analysis

### Current Contract State

**All contracts use standard authentication**:
- `PortfolioToken.sol` - Uses `msg.sender` only
- `ProjectVoting.sol` - Uses `msg.sender` only
- `ProjectNFT.sol` - Uses `msg.sender` only
- `VisitNFT.sol` - Uses `msg.sender` only
- `VisitorBook.sol` - Uses `msg.sender` + EIP-712 (still ECDSA)

**No contracts verify secp256r1 signatures**.

### What Contracts Need

1. **EIP-7951 Precompile Integration**:
   ```solidity
   // Pseudo-code
   function verifySecp256r1Signature(
       bytes32 messageHash,
       bytes32 r,
       bytes32 s,
       uint256 publicKeyX,
       uint256 publicKeyY
   ) internal view returns (bool) {
       // Call EIP-7951 precompile at 0x000...0100
       // Verify signature
   }
   ```

2. **Public Key to Address Mapping**:
   ```solidity
   mapping(bytes32 => address) public secp256r1ToAddress;
   ```

3. **Hybrid Authentication**:
   ```solidity
   function executeWithBiometric(
       bytes32 messageHash,
       bytes32 r,
       bytes32 s,
       uint256 publicKeyX,
       uint256 publicKeyY
   ) external {
       require(verifySecp256r1Signature(...), "Invalid signature");
       address user = secp256r1ToAddress[keccak256(abi.encodePacked(publicKeyX, publicKeyY))];
       // Execute transaction as user
   }
   ```

---

## Best Practices Analysis

### ✅ What's Done Well

1. **WebAuthn Integration**: Proper use of WebAuthn API for device biometrics
2. **Secure Enclave**: Keys stored in device hardware (iOS Secure Enclave, Android StrongBox)
3. **User Experience**: Clear prompts and error handling
4. **Fallback Support**: Graceful degradation for unsupported devices
5. **Type Safety**: Good TypeScript types for biometric operations

### ❌ What's Missing/Incorrect

1. **No Actual secp256r1 Signing**: Biometric signatures not used for transactions
2. **No On-Chain Verification**: Contracts don't verify biometric signatures
3. **Dead Code**: `createBiometricSigner()` exists but unused
4. **Double Prompts**: App and wallet may both prompt for biometric
5. **No Public Key Mapping**: No way to link secp256r1 keys to Ethereum addresses
6. **EIP-7951 Not Implemented**: Compatibility check exists but doesn't change behavior

---

## Recommendations

### High Priority Fixes

1. **Implement Actual secp256r1 Signing**:
   - Use `signWithBiometric()` to sign transaction hashes
   - Include secp256r1 signature in transaction data
   - Remove separate `requestAuth()` calls

2. **Add On-Chain Verification**:
   - Implement EIP-7951 precompile calls in contracts
   - Add secp256r1 signature verification functions
   - Map secp256r1 public keys to Ethereum addresses

3. **Integrate with Wallet Signing**:
   - Either use secp256r1 directly (if wallet supports)
   - Or use Account Abstraction (ERC-4337) with secp256r1 verification
   - Avoid double biometric prompts

### Medium Priority Improvements

4. **Use Biometric Signer Wrapper**:
   - Actually use `executeWithBiometric()` in contract hooks
   - Remove redundant `requestAuth()` calls
   - Centralize biometric logic

5. **Implement EIP-7951 Support**:
   - When Base L2 supports EIP-7951, use it directly
   - Remove hybrid approach fallback
   - Use precompile for verification

### Low Priority Enhancements

6. **Session Management**:
   - Cache biometric auth for short periods
   - Reduce prompt frequency
   - Better UX for multiple transactions

7. **Account Abstraction**:
   - Implement ERC-4337 for full secp256r1 support
   - Better compatibility across chains
   - More flexible authentication

---

## Code Examples

### Current (Incorrect) Flow

```typescript
// usePortfolioToken.ts
const claimFaucet = async () => {
  // Step 1: App-level biometric
  if (isEnabled) {
    const authenticated = await requestAuth('Please authenticate');
    if (!authenticated) throw new Error('Biometric required');
  }
  
  // Step 2: Wallet signs (may also prompt biometric)
  await writeContract({
    address: contractAddress,
    abi: PORTFOLIO_TOKEN_ABI,
    functionName: 'claimFaucet',
  });
};
```

### Correct Flow (EIP-7951)

```typescript
// Should be:
const claimFaucet = async () => {
  // Step 1: Generate transaction hash
  const txHash = keccak256(encodeFunctionData({
    abi: PORTFOLIO_TOKEN_ABI,
    functionName: 'claimFaucet',
  }));
  
  // Step 2: Sign with secp256r1 (biometric prompt happens here)
  const signature = await signWithBiometric(
    new Uint8Array(Buffer.from(txHash.slice(2), 'hex')),
    credentialId
  );
  
  // Step 3: Send transaction with secp256r1 signature
  await writeContract({
    address: contractAddress,
    abi: PORTFOLIO_TOKEN_ABI,
    functionName: 'claimFaucetWithBiometric',
    args: [signature.r, signature.s, signature.publicKey],
  });
};
```

### Contract Example (EIP-7951)

```solidity
// PortfolioToken.sol
import {P256} from "@openzeppelin/contracts/utils/cryptography/P256.sol";

mapping(bytes32 => address) public secp256r1ToAddress;

function claimFaucetWithBiometric(
    bytes32 r,
    bytes32 s,
    uint256 publicKeyX,
    uint256 publicKeyY
) external {
    bytes32 messageHash = keccak256(abi.encodePacked(
        "claimFaucet",
        block.chainid,
        address(this)
    ));
    
    // Verify secp256r1 signature
    bool isValid = P256.verify(
        messageHash,
        r,
        s,
        publicKeyX,
        publicKeyY
    );
    require(isValid, "Invalid biometric signature");
    
    // Get user address from public key
    bytes32 keyHash = keccak256(abi.encodePacked(publicKeyX, publicKeyY));
    address user = secp256r1ToAddress[keyHash];
    require(user != address(0), "Public key not registered");
    
    // Execute as user
    _mint(user, FAUCET_AMOUNT);
}
```

---

## Conclusion

### Current Status: ⚠️ **PARTIALLY IMPLEMENTED**

The biometric authentication infrastructure exists and works for **pre-authentication**, but it does **NOT** align with EIP-7951/Fusaka upgrade requirements because:

1. ❌ Transactions are not signed with secp256r1
2. ❌ Contracts don't verify biometric signatures
3. ❌ Biometric is a separate step, not integrated into signing
4. ❌ No mapping between secp256r1 keys and Ethereum addresses

### Alignment Score: **3/10**

- ✅ WebAuthn integration: **2/2**
- ✅ Secure enclave storage: **2/2**
- ❌ secp256r1 transaction signing: **0/2**
- ❌ On-chain verification: **0/2**
- ❌ EIP-7951 support: **0/2**

### Next Steps

1. **Immediate**: Document that current implementation is pre-auth only
2. **Short-term**: Implement actual secp256r1 signing in transaction flow
3. **Medium-term**: Add on-chain verification to contracts
4. **Long-term**: Full EIP-7951 support when Base L2 deploys it

---

## Files to Review

### Frontend
- `src/lib/biometric/auth.ts` - WebAuthn implementation (good)
- `src/lib/biometric/signer.ts` - Signer wrapper (not used)
- `src/lib/biometric/compatibility.ts` - EIP-7951 check (doesn't affect behavior)
- `src/hooks/useBiometric.ts` - React hooks (good)
- `src/hooks/contracts/*.ts` - All use `requestAuth()` before `writeContract()`

### Contracts
- `contracts/PortfolioToken.sol` - No biometric verification
- `contracts/ProjectVoting.sol` - No biometric verification
- `contracts/ProjectNFT.sol` - No biometric verification
- `contracts/VisitNFT.sol` - No biometric verification
- `contracts/VisitorBook.sol` - Only EIP-712 (ECDSA), not secp256r1

---

**Report Generated**: December 2025  
**Reviewed By**: AI Code Analysis

