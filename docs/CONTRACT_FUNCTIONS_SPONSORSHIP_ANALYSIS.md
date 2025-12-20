# Contract Functions & Gas Sponsorship Analysis

This document analyzes all contract functions and recommends which should be sponsored (gasless) vs. user-paid.

## Analysis Criteria

**Should Sponsor (Gasless):**
- User onboarding functions (faucet claims, first-time setup)
- High-frequency user engagement functions (voting, signing)
- Low-value transactions that improve UX
- One-time setup functions (biometric key registration)

**Should NOT Sponsor:**
- Admin/owner functions (pause, role management)
- High-value transactions (large transfers, mints)
- Configuration/settings changes
- Standard token/NFT transfers
- Functions that already cost tokens/value

---

## 1. PortfolioToken (0x19573561A147fdb6105762C965a66db6Cb2510F6)

### User Functions - **SPONSOR ✅**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `claimFaucet()` | - | **SPONSOR** - Onboarding function, free tokens, encourages user adoption |
| `claimFaucetWithBiometric()` | bytes32, bytes32, bytes32, bytes32 | **SPONSOR** - Same as above, biometric version |

### Biometric Registration - **SPONSOR ✅**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `registerSecp256r1Key()` | bytes32 publicKeyX, bytes32 publicKeyY | **SPONSOR** - One-time setup, critical for UX, enables biometric features |

### Token Transfers - **NO SPONSOR ❌**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `transfer()` | address to, uint256 amount | **NO SPONSOR** - Standard ERC20 transfer, user should pay |
| `transferFrom()` | address from, address to, uint256 amount | **NO SPONSOR** - Standard ERC20 transfer, user should pay |
| `approve()` | address spender, uint256 amount | **NO SPONSOR** - Standard ERC20 approval, user should pay |
| `permit()` | address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s | **NO SPONSOR** - EIP-2612 permit, user should pay |

### Token Burns - **NO SPONSOR ❌**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `burn()` | uint256 amount | **NO SPONSOR** - User-initiated burn, should pay gas |
| `burnFrom()` | address account, uint256 amount | **NO SPONSOR** - User-initiated burn, should pay gas |

### Admin Functions - **NO SPONSOR ❌**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `mint()` | address to, uint256 amount | **NO SPONSOR** - Admin mint, creates value |
| `batchMint()` | address[] recipients, uint256[] amounts | **NO SPONSOR** - Admin batch mint, creates significant value |
| `setMaxSupply()` | uint256 maxSupply | **NO SPONSOR** - Admin configuration |
| `pause()` | - | **NO SPONSOR** - Admin emergency function |
| `unpause()` | - | **NO SPONSOR** - Admin function |
| `grantRole()` | bytes32 role, address account | **NO SPONSOR** - Admin access control |
| `revokeRole()` | bytes32 role, address account | **NO SPONSOR** - Admin access control |
| `renounceRole()` | bytes32 role, address callerConfirmation | **NO SPONSOR** - Admin access control |

---

## 2. ProjectNFT (0xc0c257a95BbF359c8230b5A24Db96c422F24424C)

### User Content Creation - **SPONSOR ✅**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `mintProject()` | address to, string projectId, string projectName, string ipfsMetadataURI | **SPONSOR** - User creates content, encourages ecosystem growth |

### User Engagement - **SPONSOR ✅**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `endorseProject()` | uint256 tokenId | **SPONSOR** - User engagement, no value transfer |
| `endorseProjectWithBiometric()` | uint256 tokenId, bytes32 r, bytes32 s, bytes32 publicKeyX, bytes32 publicKeyY | **SPONSOR** - Same as above, biometric version |

### Biometric Registration - **SPONSOR ✅**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `registerSecp256r1Key()` | bytes32 publicKeyX, bytes32 publicKeyY | **SPONSOR** - One-time setup, critical for UX |

### NFT Transfers - **NO SPONSOR ❌**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `transferFrom()` | address from, address to, uint256 tokenId | **NO SPONSOR** - Standard NFT transfer |
| `safeTransferFrom()` | address from, address to, uint256 tokenId | **NO SPONSOR** - Standard NFT transfer |
| `safeTransferFrom()` | address from, address to, uint256 tokenId, bytes data | **NO SPONSOR** - Standard NFT transfer |
| `approve()` | address to, uint256 tokenId | **NO SPONSOR** - Standard NFT approval |
| `setApprovalForAll()` | address operator, bool approved | **NO SPONSOR** - Standard NFT approval |

### Admin Functions - **NO SPONSOR ❌**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `updateProjectMetadata()` | uint256 tokenId, string ipfsMetadataURI | **NO SPONSOR** - Admin/owner function, modifies content |
| `setMaxEndorsements()` | uint256 maxEndorsements | **NO SPONSOR** - Admin configuration |
| `pause()` | - | **NO SPONSOR** - Admin emergency function |
| `unpause()` | - | **NO SPONSOR** - Admin function |
| `grantRole()` | bytes32 role, address account | **NO SPONSOR** - Admin access control |
| `revokeRole()` | bytes32 role, address account | **NO SPONSOR** - Admin access control |
| `renounceRole()` | bytes32 role, address callerConfirmation | **NO SPONSOR** - Admin access control |

---

## 3. ProjectVoting (0x2304C17AD225bE17F968dE529CFd96A80D38f467)

### User Voting - **CONDITIONAL SPONSOR ⚠️**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `vote()` | string projectId | **CONDITIONAL** - Burns tokens, consider sponsoring to encourage participation, but users are already paying tokens |
| `voteWithBiometric()` | string projectId, bytes32 r, bytes32 s, bytes32 publicKeyX, bytes32 publicKeyY | **CONDITIONAL** - Same as above |

**Recommendation:** Since voting already costs tokens (burned), you could sponsor gas to reduce friction, but it's less critical than pure engagement functions.

### Biometric Registration - **SPONSOR ✅**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `registerSecp256r1Key()` | bytes32 publicKeyX, bytes32 publicKeyY | **SPONSOR** - One-time setup, critical for UX |

### Admin Functions - **NO SPONSOR ❌**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `setVoteCost()` | uint256 cost | **NO SPONSOR** - Admin configuration |
| `pause()` | - | **NO SPONSOR** - Admin emergency function |
| `unpause()` | - | **NO SPONSOR** - Admin function |
| `grantRole()` | bytes32 role, address account | **NO SPONSOR** - Admin access control |
| `revokeRole()` | bytes32 role, address account | **NO SPONSOR** - Admin access control |
| `renounceRole()` | bytes32 role, address callerConfirmation | **NO SPONSOR** - Admin access control |

---

## 4. VisitNFT (0xa9f173D7260788701C71427C9Ecc76d553d8ffA3)

### User Minting - **SPONSOR ✅**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `mintVisitNFT()` | - | **SPONSOR** - User onboarding, commemorative NFT, encourages engagement |
| `mintVisitNFTWithBiometric()` | bytes32 r, bytes32 s, bytes32 publicKeyX, bytes32 publicKeyY | **SPONSOR** - Same as above, biometric version |

### Biometric Registration - **SPONSOR ✅**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `registerSecp256r1Key()` | bytes32 publicKeyX, bytes32 publicKeyY | **SPONSOR** - One-time setup, critical for UX |

### NFT Transfers - **NO SPONSOR ❌**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `transferFrom()` | address from, address to, uint256 tokenId | **NO SPONSOR** - Standard NFT transfer |
| `safeTransferFrom()` | address from, address to, uint256 tokenId | **NO SPONSOR** - Standard NFT transfer |
| `safeTransferFrom()` | address from, address to, uint256 tokenId, bytes data | **NO SPONSOR** - Standard NFT transfer |
| `approve()` | address to, uint256 tokenId | **NO SPONSOR** - Standard NFT approval |
| `setApprovalForAll()` | address operator, bool approved | **NO SPONSOR** - Standard NFT approval |

### Admin Functions - **NO SPONSOR ❌**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `adminMint()` | address to | **NO SPONSOR** - Admin mint, creates value |
| `setBaseURI()` | string baseURI | **NO SPONSOR** - Admin configuration |
| `pause()` | - | **NO SPONSOR** - Admin emergency function |
| `unpause()` | - | **NO SPONSOR** - Admin function |
| `grantRole()` | bytes32 role, address account | **NO SPONSOR** - Admin access control |
| `revokeRole()` | bytes32 role, address account | **NO SPONSOR** - Admin access control |
| `renounceRole()` | bytes32 role, address callerConfirmation | **NO SPONSOR** - Admin access control |

---

## 5. VisitorBook (0xF61a59B7B383D46DEcD0Cc4ca7c239871A53686C)

### User Engagement - **SPONSOR ✅**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `signVisitorBook()` | string message | **SPONSOR** - User engagement, no value transfer, encourages interaction |
| `signVisitorBookWithBiometric()` | string message, bytes32 r, bytes32 s, bytes32 publicKeyX, bytes32 publicKeyY | **SPONSOR** - Same as above, biometric version |
| `signVisitorBookWithSignature()` | string message, bytes signature, uint256 timestamp | **SPONSOR** - EIP-712 signature version, same rationale |

### Biometric Registration - **SPONSOR ✅**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `registerSecp256r1Key()` | bytes32 publicKeyX, bytes32 publicKeyY | **SPONSOR** - One-time setup, critical for UX |

### Admin Functions - **NO SPONSOR ❌**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `removeVisitor()` | uint256 index | **NO SPONSOR** - Admin moderation function |
| `setMaxMessageLength()` | uint256 maxLength | **NO SPONSOR** - Admin configuration |
| `pause()` | - | **NO SPONSOR** - Admin emergency function |
| `unpause()` | - | **NO SPONSOR** - Admin function |
| `grantRole()` | bytes32 role, address account | **NO SPONSOR** - Admin access control |
| `revokeRole()` | bytes32 role, address account | **NO SPONSOR** - Admin access control |
| `renounceRole()` | bytes32 role, address callerConfirmation | **NO SPONSOR** - Admin access control |

---

## Summary: Functions to Sponsor

### High Priority (Must Sponsor) ✅

1. **PortfolioToken**
   - `claimFaucet()` / `claimFaucetWithBiometric()`
   - `registerSecp256r1Key()`

2. **ProjectNFT**
   - `mintProject()`
   - `endorseProject()` / `endorseProjectWithBiometric()`
   - `registerSecp256r1Key()`

3. **VisitNFT**
   - `mintVisitNFT()` / `mintVisitNFTWithBiometric()`
   - `registerSecp256r1Key()`

4. **VisitorBook**
   - `signVisitorBook()` / `signVisitorBookWithBiometric()` / `signVisitorBookWithSignature()`
   - `registerSecp256r1Key()`

5. **ProjectVoting**
   - `vote()` / `voteWithBiometric()` (conditional - already costs tokens)
   - `registerSecp256r1Key()`

### Never Sponsor ❌

- All admin functions (pause, unpause, grantRole, revokeRole, renounceRole)
- All configuration functions (setMaxSupply, setVoteCost, setMaxEndorsements, etc.)
- All standard token/NFT transfers (transfer, transferFrom, approve, etc.)
- All admin mints (mint, batchMint, adminMint)
- All burn functions

---

## CDP Paymaster Configuration Recommendation

When configuring your CDP Paymaster rules, you should:

1. **Whitelist specific functions** for sponsorship:
   ```
   - claimFaucet()
   - claimFaucetWithBiometric()
   - mintProject()
   - mintVisitNFT()
   - mintVisitNFTWithBiometric()
   - endorseProject()
   - endorseProjectWithBiometric()
   - signVisitorBook()
   - signVisitorBookWithBiometric()
   - signVisitorBookWithSignature()
   - registerSecp256r1Key() (on all contracts)
   - vote() / voteWithBiometric() (optional)
   ```

2. **Set spending limits** to prevent abuse:
   - Max gas per transaction: ~150,000 gas
   - Max transactions per user per day: Reasonable limits based on function
   - Max value transferred: 0 (for sponsored functions)

3. **Monitor and adjust** based on usage patterns

---

## Notes

- All `registerSecp256r1Key()` functions should be sponsored on all contracts for seamless UX
- Consider rate limiting on sponsored functions to prevent abuse
- Voting functions already cost tokens, so gas sponsorship is less critical but still recommended for UX
- All biometric variants should have the same sponsorship rules as their standard counterparts

