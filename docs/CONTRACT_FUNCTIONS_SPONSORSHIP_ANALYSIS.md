# Contract Functions & Gas Sponsorship Analysis

This document analyzes all contract functions and recommends which should be sponsored (gasless) vs. user-paid.

## Deployed Contract Addresses (Base Mainnet)

```
Core Application Contracts:
- PortfolioToken: 0x99C3714abA7d1C095d1F4f55DBc0CcE94d4513e1
- VisitorBook: 0xA3a085364776a5DbB8ed34ef0B5e47BDf68F4285
- ProjectNFT: 0xBE830eB177Cd33e08712FA03043f9F8Adf98DC89
- ProjectVoting: 0x423aFC1a37315372921f194Da42F02bc8C1B117B
- VisitNFT: 0x3031Cd6Ff22B595AfB6C93BeBAB1587e8d566eF3

ERC-4337 Infrastructure:
- EntryPoint: 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
- BiometricSmartAccountFactory: 0x005F6A92EEe566fb8B09a2B9024DEF8D170B2300
- BiometricSmartAccount (Implementation): 0x5c87FE5f254e36BB6f024D8354Be9a77F1176428
```

## Analysis Criteria

**Should Sponsor (Gasless):**
- ✅ User onboarding functions (faucet claims, first-time setup)
- ✅ High-frequency user engagement functions (voting, signing, endorsing)
- ✅ Low-value transactions that improve UX
- ✅ One-time setup functions (biometric key registration)
- ✅ Social interactions that drive community engagement

**Should NOT Sponsor:**
- ❌ Admin/owner functions (pause, role management, configuration)
- ❌ High-value transactions (large transfers, unlimited mints)
- ❌ Functions that create significant economic value
- ❌ Standard token/NFT transfers (market transactions)
- ❌ Functions that already cost tokens/value
- ❌ Infrastructure/protocol functions (EntryPoint operations)

---
docs/CONTRACT_FUNCTIONS_SPONSORSHIP_ANALYSIS.md.
## 1. PortfolioToken (0x99C3714abA7d1C095d1F4f55DBc0CcE94d4513e1)

### 🔥 User Onboarding - **SPONSOR ✅** (HIGH PRIORITY)

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `claimFaucet()` | - | **SPONSOR** - First interaction, critical for onboarding, eliminates friction for new users |
| `claimFaucetWithBiometric()` | bytes32 r, bytes32 s, bytes32 publicKeyX, bytes32 publicKeyY | **SPONSOR** - Biometric version of onboarding flow |

### 🔐 Biometric Setup - **SPONSOR ✅**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `registerSecp256r1Key()` | bytes32 publicKeyX, bytes32 publicKeyY | **SPONSOR** - One-time setup, enables biometric features, critical for UX |

### 💰 Token Operations - **NO SPONSOR ❌**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `transfer()` | address to, uint256 amount | **NO SPONSOR** - Standard ERC20 transfer |
| `transferFrom()` | address from, address to, uint256 amount | **NO SPONSOR** - Standard ERC20 transfer |
| `approve()` | address spender, uint256 amount | **NO SPONSOR** - Standard ERC20 approval |
| `permit()` | address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s | **NO SPONSOR** - EIP-2612 permit |
| `burn()` | uint256 amount | **NO SPONSOR** - Token burn operation |
| `burnFrom()` | address account, uint256 amount | **NO SPONSOR** - Token burn operation |

### ⚙️ Admin Functions - **NO SPONSOR ❌**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `mint()` | address to, uint256 amount | **NO SPONSOR** - Creates token value |
| `batchMint()` | address[] recipients, uint256[] amounts | **NO SPONSOR** - Creates significant token value |
| `setMaxSupply()` | uint256 newMaxSupply | **NO SPONSOR** - Configuration change |
| `pause()` | - | **NO SPONSOR** - Emergency function |
| `unpause()` | - | **NO SPONSOR** - Admin function |
| `grantRole()` | bytes32 role, address account | **NO SPONSOR** - Access control |
| `revokeRole()` | bytes32 role, address account | **NO SPONSOR** - Access control |
| `renounceRole()` | bytes32 role, address callerConfirmation | **NO SPONSOR** - Access control |

---

## 2. ProjectNFT (0xBE830eB177Cd33e08712FA03043f9F8Adf98DC89)

### 🎨 Content Creation - **SPONSOR ✅** (HIGH PRIORITY)

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `mintProject()` | string projectId, string name, string ipfsUri | **SPONSOR** - Creative output, encourages ecosystem growth, user-generated content |

### 👍 Social Engagement - **SPONSOR ✅** (HIGH PRIORITY)

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `endorseProject()` | uint256 tokenId | **SPONSOR** - User engagement, project support, drives community interaction |
| `endorseProjectWithBiometric()` | uint256 tokenId, bytes32 r, bytes32 s, bytes32 publicKeyX, bytes32 publicKeyY | **SPONSOR** - Biometric version of engagement |

### 🔐 Biometric Setup - **SPONSOR ✅**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `registerSecp256r1Key()` | bytes32 publicKeyX, bytes32 publicKeyY | **SPONSOR** - One-time setup for biometric features |

### 📝 Content Updates - **CONDITIONAL SPONSOR ⚠️**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `updateProjectMetadata()` | uint256 tokenId, string ipfsUri | **CONDITIONAL** - Content updates (consider rate limits to prevent abuse) |

### 💰 NFT Operations - **NO SPONSOR ❌**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `transferFrom()` | address from, address to, uint256 tokenId | **NO SPONSOR** - Standard NFT transfer |
| `safeTransferFrom()` | address from, address to, uint256 tokenId | **NO SPONSOR** - Standard NFT transfer |
| `safeTransferFrom()` | address from, address to, uint256 tokenId, bytes data | **NO SPONSOR** - Standard NFT transfer |
| `approve()` | address to, uint256 tokenId | **NO SPONSOR** - Standard NFT approval |
| `setApprovalForAll()` | address operator, bool approved | **NO SPONSOR** - Standard NFT approval |

### ⚙️ Admin Functions - **NO SPONSOR ❌**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `setMaxEndorsements()` | uint256 newMax | **NO SPONSOR** - Configuration change |
| `pause()` | - | **NO SPONSOR** - Emergency function |
| `unpause()` | - | **NO SPONSOR** - Admin function |
| `grantRole()` | bytes32 role, address account | **NO SPONSOR** - Access control |
| `revokeRole()` | bytes32 role, address account | **NO SPONSOR** - Access control |
| `renounceRole()` | bytes32 role, address callerConfirmation | **NO SPONSOR** - Access control |

---

## 3. ProjectVoting (0x423aFC1a37315372921f194Da42F02bc8C1B117B)

### 🗳️ Democratic Participation - **SPONSOR ✅** (HIGH PRIORITY)

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `vote()` | string projectId | **SPONSOR** - Community governance, encourages participation, though burns tokens |
| `voteWithBiometric()` | string projectId, bytes32 r, bytes32 s, bytes32 publicKeyX, bytes32 publicKeyY | **SPONSOR** - Biometric version of democratic participation |

**Note:** While voting burns tokens (cost), sponsoring gas reduces friction and encourages civic engagement.

### 🔐 Biometric Setup - **SPONSOR ✅**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `registerSecp256r1Key()` | bytes32 publicKeyX, bytes32 publicKeyY | **SPONSOR** - One-time setup for biometric voting |

### ⚙️ Admin Functions - **NO SPONSOR ❌**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `setVoteCost()` | uint256 newCost | **NO SPONSOR** - Configuration change affects economics |
| `pause()` | - | **NO SPONSOR** - Emergency function |
| `unpause()` | - | **NO SPONSOR** - Admin function |
| `grantRole()` | bytes32 role, address account | **NO SPONSOR** - Access control |
| `revokeRole()` | bytes32 role, address account | **NO SPONSOR** - Access control |
| `renounceRole()` | bytes32 role, address callerConfirmation | **NO SPONSOR** - Access control |

---

## 4. VisitNFT (0x3031Cd6Ff22B595AfB6C93BeBAB1587e8d566eF3)

### 🎁 Welcome Gifts - **SPONSOR ✅** (HIGHEST PRIORITY)

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `mintVisitNFT()` | - | **SPONSOR** - Portfolio visitor onboarding, welcome gift, eliminates friction |
| `mintVisitNFTWithBiometric()` | bytes32 r, bytes32 s, bytes32 publicKeyX, bytes32 publicKeyY | **SPONSOR** - Biometric version of welcome flow |

### 🔐 Biometric Setup - **SPONSOR ✅**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `registerSecp256r1Key()` | bytes32 publicKeyX, bytes32 publicKeyY | **SPONSOR** - One-time setup for biometric features |

### 💰 NFT Operations - **NO SPONSOR ❌**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `transferFrom()` | address from, address to, uint256 tokenId | **NO SPONSOR** - Standard NFT transfer |
| `safeTransferFrom()` | address from, address to, uint256 tokenId | **NO SPONSOR** - Standard NFT transfer |
| `safeTransferFrom()` | address from, address to, uint256 tokenId, bytes data | **NO SPONSOR** - Standard NFT transfer |
| `approve()` | address to, uint256 tokenId | **NO SPONSOR** - Standard NFT approval |
| `setApprovalForAll()` | address operator, bool approved | **NO SPONSOR** - Standard NFT approval |

### ⚙️ Admin Functions - **NO SPONSOR ❌**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `adminMint()` | address to | **NO SPONSOR** - Creates NFT value |
| `setBaseURI()` | string newBaseURI | **NO SPONSOR** - Configuration change |
| `pause()` | - | **NO SPONSOR** - Emergency function |
| `unpause()` | - | **NO SPONSOR** - Admin function |
| `grantRole()` | bytes32 role, address account | **NO SPONSOR** - Access control |
| `revokeRole()` | bytes32 role, address account | **NO SPONSOR** - Access control |
| `renounceRole()` | bytes32 role, address callerConfirmation | **NO SPONSOR** - Access control |

---

## 5. VisitorBook (0xA3a085364776a5DbB8ed34ef0B5e47BDf68F4285)

### 💬 Social Interaction - **SPONSOR ✅** (HIGH PRIORITY)

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `signVisitorBook()` | string message | **SPONSOR** - Primary social engagement, community building, no cost |
| `signVisitorBookWithBiometric()` | string message, bytes32 r, bytes32 s, bytes32 publicKeyX, bytes32 publicKeyY | **SPONSOR** - Biometric version of social interaction |
| `signVisitorBookWithSignature()` | string message, bytes signature, uint256 timestamp | **SPONSOR** - EIP-712 signature version |

### 🔐 Biometric Setup - **SPONSOR ✅**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `registerSecp256r1Key()` | bytes32 publicKeyX, bytes32 publicKeyY | **SPONSOR** - One-time setup for biometric signing |

### ⚙️ Admin Functions - **NO SPONSOR ❌**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `removeVisitor()` | uint256 index | **NO SPONSOR** - Moderation function |
| `setMaxMessageLength()` | uint256 newLength | **NO SPONSOR** - Configuration change |
| `pause()` | - | **NO SPONSOR** - Emergency function |
| `unpause()` | - | **NO SPONSOR** - Admin function |
| `grantRole()` | bytes32 role, address account | **NO SPONSOR** - Access control |
| `revokeRole()` | bytes32 role, address account | **NO SPONSOR** - Access control |
| `renounceRole()` | bytes32 role, address callerConfirmation | **NO SPONSOR** - Access control |

---

## 6. BiometricSmartAccount (0x5c87FE5f254e36BB6f024D8354Be9a77F1176428)

### 🔑 Account Management - **NO SPONSOR ❌**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `initialize()` | bytes initialOwner | **NO SPONSOR** - Account setup (handled by factory) |
| `addOwner()` | bytes owner | **NO SPONSOR** - Multi-sig management |
| `removeOwner()` | uint256 ownerIndex | **NO SPONSOR** - Multi-sig management |
| `execute()` | address target, uint256 value, bytes data | **NO SPONSOR** - Direct execution (handled via UserOperations) |
| `executeBatch()` | address[] targets, uint256[] values, bytes[] data | **NO SPONSOR** - Direct execution (handled via UserOperations) |

### 💰 Deposit Management - **NO SPONSOR ❌**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `addDeposit()` | - | **NO SPONSOR** - User funds their account |
| `withdrawDepositTo()` | address payable to, uint256 amount | **NO SPONSOR** - User withdrawal |
| `getDeposit()` | - | **NO SPONSOR** - View function |

### 🔐 Signature Validation - **INFRASTRUCTURE ⚙️**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `validateUserOp()` | UserOperation userOp, bytes32 userOpHash, uint256 missingAccountFunds | **INFRASTRUCTURE** - ERC-4337 protocol function |
| `isValidSignature()` | bytes32 hash, bytes signature | **INFRASTRUCTURE** - ERC-1271 standard |

---

## 7. BiometricSmartAccountFactory (0x005F6A92EEe566fb8B09a2B9024DEF8D170B2300)

### 🏭 Account Creation - **CONDITIONAL SPONSOR ⚠️**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `createAccount()` | bytes owner, uint256 salt | **CONDITIONAL** - Could sponsor for first-time users to eliminate friction |

### ⚙️ Infrastructure - **NO SPONSOR ❌**

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `getAddress()` | bytes owner, uint256 salt | **NO SPONSOR** - View function for counterfactual address |
| `addStake()` | uint32 unstakeDelaySec | **NO SPONSOR** - Protocol staking |

---

## 8. EntryPoint (0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)

### 🔧 ERC-4337 Protocol - **INFRASTRUCTURE ⚙️** (NEVER SPONSOR)

| Function | Parameters | Rationale |
|----------|-----------|-----------|
| `handleOps()` | UserOperation[] ops, address payable beneficiary | **INFRASTRUCTURE** - Core protocol function |
| `handleAggregatedOps()` | UserOpsPerAggregator[] opsPerAggregator, address payable beneficiary | **INFRASTRUCTURE** - Core protocol function |
| `balanceOf()` | address account | **INFRASTRUCTURE** - Deposit balance view |
| `depositTo()` | address account | **INFRASTRUCTURE** - Deposit management |
| `addStake()` | uint32 unstakeDelaySec | **INFRASTRUCTURE** - Protocol staking |
| `unlockStake()` | - | **INFRASTRUCTURE** - Protocol unstaking |
| `withdrawStake()` | address payable to | **INFRASTRUCTURE** - Protocol withdrawal |
| `withdrawTo()` | address payable to, uint256 amount | **INFRASTRUCTURE** - Deposit withdrawal |
| `getNonce()` | address sender, uint192 key | **INFRASTRUCTURE** - Nonce management |

---

## Summary: Functions to Sponsor

### 🔥 HIGH PRIORITY - SHOULD BE SPONSORED ✅

**Core User Acquisition (Convert visitors to users):**
1. **VisitNFT** (Welcome gifts)
   - `mintVisitNFT()` / `mintVisitNFTWithBiometric()` - **HIGHEST PRIORITY**

2. **PortfolioToken** (First interaction)
   - `claimFaucet()` / `claimFaucetWithBiometric()`

**Social Engagement (Keep users active):**
3. **VisitorBook** (Community building)
   - `signVisitorBook()` / `signVisitorBookWithBiometric()` / `signVisitorBookWithSignature()`

4. **ProjectVoting** (Democratic participation)
   - `vote()` / `voteWithBiometric()`

5. **ProjectNFT** (Creative expression)
   - `endorseProject()` / `endorseProjectWithBiometric()`
   - `mintProject()` (creative output)

**Biometric Setup (Enable features):**
- `registerSecp256r1Key()` on **ALL contracts**

### ⚠️ MEDIUM PRIORITY - CONDITIONAL SPONSORSHIP

**Content Updates (With limits):**
- `ProjectNFT.updateProjectMetadata()` (consider daily limits)

**Account Creation:**
- `BiometricSmartAccountFactory.createAccount()` (for first-time users)

### ❌ SHOULD NEVER BE SPONSORED

**Administrative Functions:**
- All `pause()`/`unpause()` functions
- All `set*()` configuration functions
- All `grantRole()`/`revokeRole()`/`renounceRole()` functions
- All `adminMint()` functions
- All `removeVisitor()` moderation functions

**Financial/Critical Functions:**
- All standard token/NFT transfers (`transfer`, `transferFrom`, `approve`)
- All burn functions
- `BiometricSmartAccount.addDeposit()` / `withdrawDepositTo()`
- `BiometricSmartAccountFactory.addStake()`

**Infrastructure/Protocol Functions:**
- All EntryPoint functions (ERC-4337 protocol)
- Smart account management functions that could be abused
- Direct execution functions (use UserOperations instead)

---

## 💰 CDP Paymaster Configuration

### Whitelisted Functions for Gas Sponsorship:

**IMPORTANT:** CDP Paymaster uses Solidity function signatures (types only, NO parameter names).

**Format:** `functionName(type1,type2,type3)` - NOT `functionName(type1 param1, type2 param2)`

#### HIGH PRIORITY (Sponsor these):

**PortfolioToken (0x99C3714abA7d1C095d1F4f55DBc0CcE94d4513e1):**
```
claimFaucet()
claimFaucetWithBiometric(bytes32,bytes32,bytes32,bytes32)
registerSecp256r1Key(bytes32,bytes32)
```

**VisitNFT (0x3031Cd6Ff22B595AfB6C93BeBAB1587e8d566eF3):**
```
mintVisitNFT()
mintVisitNFTWithBiometric(bytes32,bytes32,bytes32,bytes32)
registerSecp256r1Key(bytes32,bytes32)
```

**VisitorBook (0xA3a085364776a5DbB8ed34ef0B5e47BDf68F4285):**
```
signVisitorBook(string)
signVisitorBookWithBiometric(string,bytes32,bytes32,bytes32,bytes32)
signVisitorBookWithSignature(string,bytes,uint256)
registerSecp256r1Key(bytes32,bytes32)
```

**ProjectNFT (0xBE830eB177Cd33e08712FA03043f9F8Adf98DC89):**
```
mintProject(address,string,string,string)
endorseProject(uint256)
endorseProjectWithBiometric(uint256,bytes32,bytes32,bytes32,bytes32)
registerSecp256r1Key(bytes32,bytes32)
```

**ProjectVoting (0x423aFC1a37315372921f194Da42F02bc8C1B117B):**
```
vote(string)
voteWithBiometric(string,bytes32,bytes32,bytes32,bytes32)
registerSecp256r1Key(bytes32,bytes32)
```

#### CONDITIONAL (Consider sponsoring):
```
ProjectNFT.updateProjectMetadata(uint256,string)
BiometricSmartAccountFactory.createAccount(bytes,uint256)
```

**Note:** All function signatures use **types only** (no parameter names) as required by Solidity function selector standard.

### Complete Allowlist Configuration (Copy-Paste Ready):

When configuring the CDP Paymaster in the portal, add these contract addresses and function selectors:

**Contract Addresses to Allowlist:**
```
0x99C3714abA7d1C095d1F4f55DBc0CcE94d4513e1  (PortfolioToken)
0x3031Cd6Ff22B595AfB6C93BeBAB1587e8d566eF3  (VisitNFT)
0xA3a085364776a5DbB8ed34ef0B5e47BDf68F4285  (VisitorBook)
0xBE830eB177Cd33e08712FA03043f9F8Adf98DC89  (ProjectNFT)
0x423aFC1a37315372921f194Da42F02bc8C1B117B  (ProjectVoting)
```

**Function Selectors to Allowlist (for each contract):**

For each contract address above, add these function signatures:

**PortfolioToken:**
- `claimFaucet()`
- `claimFaucetWithBiometric(bytes32,bytes32,bytes32,bytes32)`
- `registerSecp256r1Key(bytes32,bytes32)`

**VisitNFT:**
- `mintVisitNFT()`
- `mintVisitNFTWithBiometric(bytes32,bytes32,bytes32,bytes32)`
- `registerSecp256r1Key(bytes32,bytes32)`

**VisitorBook:**
- `signVisitorBook(string)`
- `signVisitorBookWithBiometric(string,bytes32,bytes32,bytes32,bytes32)`
- `signVisitorBookWithSignature(string,bytes,uint256)`
- `registerSecp256r1Key(bytes32,bytes32)`

**ProjectNFT:**
- `mintProject(address,string,string,string)`
- `endorseProject(uint256)`
- `endorseProjectWithBiometric(uint256,bytes32,bytes32,bytes32,bytes32)`
- `registerSecp256r1Key(bytes32,bytes32)`

**ProjectVoting:**
- `vote(string)`
- `voteWithBiometric(string,bytes32,bytes32,bytes32,bytes32)`
- `registerSecp256r1Key(bytes32,bytes32)`

**⚠️ CRITICAL:** The CDP Paymaster portal expects function signatures in the format:
- ✅ `functionName(type1,type2)` - Types only, no parameter names
- ❌ `functionName(type1 param1, type2 param2)` - Parameter names are NOT included

**Example:**
- ✅ Correct: `claimFaucetWithBiometric(bytes32,bytes32,bytes32,bytes32)`
- ❌ Wrong: `claimFaucetWithBiometric(bytes32 r, bytes32 s, bytes32 publicKeyX, bytes32 publicKeyY)`

### Spending Limits & Abuse Prevention:
- **Max gas per transaction**: ~200,000 gas
- **Max transactions per user per day**:
  - Social functions (signVisitorBook, endorseProject): 50/day
  - Content creation (mintProject): 5/day
  - Voting: 20/day
  - Biometric registration: 1 per contract lifetime
- **Max value transferred**: 0 ETH (sponsored functions should not move value)
- **Cooldown periods**: Prevent spam (e.g., 30 seconds between visitor book signs)

### Monitoring & Analytics:
- Track sponsorship costs per user cohort
- Monitor for abuse patterns
- A/B test sponsorship vs. non-sponsorship for conversion rates
- Adjust limits based on usage patterns

---

## 📊 Business Impact & ROI

### Why This Matters:
- **User Acquisition**: Gasless onboarding can increase conversion by 3-5x
- **Retention**: Seamless social features keep users engaged
- **Competitive Advantage**: Position as the most user-friendly Web3 platform
- **Network Effects**: Community features drive organic growth

### Estimated Costs:
- **Per Active User**: ~$2-5/month (very reasonable for user acquisition)
- **Break-even**: 1 sponsored user who engages socially = multiple organic referrals
- **ROI**: Strong positive - gas sponsorship pays for itself through increased engagement

### Implementation Priority:
1. **Phase 1**: Core onboarding (faucet claims, welcome NFTs)
2. **Phase 2**: Social features (visitor book, endorsements)
3. **Phase 3**: Advanced features (voting, content creation)
4. **Phase 4**: Optimization (rate limits, analytics, A/B testing)

---

## 🔧 Technical Implementation Notes

- **All biometric variants** should have identical sponsorship rules
- **Rate limiting** should be implemented at the paymaster level
- **Function signature matching** should be exact to prevent bypass attempts
- **Fallback handling** needed for when sponsorship fails
- **User education** about sponsored vs. paid transactions

---

## 📝 Final Recommendations

**SPONSOR THE FUN, SOCIAL FUNCTIONS** that drive engagement and community building. These create network effects and organic growth.

**NEVER SPONSOR** administrative, financial, or high-value functions that could be abused.

**START WITH CORE ONBOARDING** (faucet + welcome NFT) - this alone can dramatically improve user acquisition.

**MONITOR AND ITERATE** - use analytics to optimize sponsorship rules based on real user behavior.

