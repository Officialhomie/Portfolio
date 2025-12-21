# Web3 Portfolio - Decentralized Developer Portfolio Platform

A comprehensive Web3 portfolio platform built on Base L2 that combines traditional portfolio showcasing with blockchain-native features including NFTs, token-gated voting, and on-chain visitor interactions.

## 🎯 Project Overview

This is a decentralized portfolio platform where developers can showcase their projects as NFTs, engage with visitors through an on-chain guestbook, and allow community members to vote on favorite projects using a custom ERC-20 token. The platform leverages Base L2 for low-cost transactions and includes multiple interactive features that create a gamified, community-driven portfolio experience.

### Core Concept

The platform transforms a traditional developer portfolio into a Web3-native experience where:
- **Projects are NFTs**: Each project is minted as an ERC-721 NFT with IPFS metadata
- **Token-Gated Interactions**: Users need $HOMIE tokens to vote on projects
- **Visitor Engagement**: First-time visitors can mint a limited edition "Proof of Visit" NFT
- **On-Chain Guestbook**: Visitors can leave messages permanently stored on-chain
- **Community Voting**: Token holders can vote for their favorite projects (tokens are burned)

## 📋 Smart Contracts Architecture

### 1. PortfolioToken.sol (ERC-20 Token)
**Purpose**: Native utility token for platform interactions

**Key Features**:å
- **Token Details**: 
  - Name: "Homie Token"
  - Symbol: "HOMIE"
  - Decimals: 18
  - Initial Supply: 1,000,000 HOMIE (minted to deployer)
  - Max Supply: 10,000,000 HOMIE (configurable)

- **Faucet System**:
  - Users can claim 100 $HOMIE tokens from the faucet
  - One-time claim per address (with 24-hour cooldown for repeat claims)
  - Prevents max supply overflow

- **Token Standards**:
  - ERC-20 (standard fungible token)
  - ERC-20Permit (EIP-2612 for gasless approvals)
  - ERC-20Burnable (tokens can be burned)
  - ERC-20Pausable (can be paused by admin)

- **Roles**:
  - `DEFAULT_ADMIN_ROLE`: Full control, can pause/unpause, set max supply
  - `MINTER_ROLE`: Can mint new tokens (for distribution)
  - `FAUCET_ROLE`: Can manage faucet (currently same as admin)

- **Key Functions**:
  - `claimFaucet()`: Claim 100 $HOMIE tokens (one-time per address, 24h cooldown)
  - `mint(address to, uint256 amount)`: Admin minting
  - `batchMint()`: Mint to multiple addresses at once
  - `burn()` / `burnFrom()`: Burn tokens (inherited from ERC20Burnable)
  - `canClaimFaucet(address)`: Check if address can claim faucet

**Use Cases**:
- Users claim tokens from faucet to participate in voting
- Tokens are burned when voting for projects (creating deflationary mechanism)
- Can be used for future platform features (endorsements, premium features, etc.)

---

### 2. ProjectNFT.sol (ERC-721 NFT)
**Purpose**: Mint projects as NFTs with IPFS metadata

**Key Features**:
- **NFT Details**:
  - Name: "ProjectNFT"
  - Symbol: "PRJ"
  - Each project gets a unique token ID
  - Metadata stored on IPFS

- **Project Structure**:
  ```solidity
  struct Project {
      uint256 tokenId;
      string name;
      string ipfsMetadataURI;
      address creator;
      uint256 createdAt;
      uint256 endorsementCount;
  }
  ```

- **Endorsement System**:
  - Anyone can endorse a project (one endorsement per address per project)
  - Endorsement count is tracked on-chain
  - Max 1000 endorsements per project (configurable)

- **Roles**:
  - `DEFAULT_ADMIN_ROLE`: Can pause, update metadata, set max endorsements
  - `MINTER_ROLE`: Can mint new project NFTs
  - `ENDORSER_ROLE`: Reserved for future use

- **Key Functions**:
  - `mintProject(address to, string projectId, string projectName, string ipfsMetadataURI)`: Mint a new project NFT
  - `endorseProject(uint256 tokenId)`: Endorse a project (increment count)
  - `getProject(uint256 tokenId)`: Get full project details
  - `getTokenIdByProjectId(string projectId)`: Lookup token ID by project identifier
  - `totalSupply()`: Get total number of project NFTs minted

**Use Cases**:
- Portfolio owner mints their projects as NFTs
- Each project NFT contains metadata (name, description, tech stack, links, images)
- Community can endorse projects they like
- Projects can be displayed in galleries, marketplaces, etc.

**IPFS Metadata Format** (expected):
```json
{
  "name": "Project Name",
  "description": "Project description",
  "image": "ipfs://Qm...",
  "external_url": "https://github.com/...",
  "attributes": [
    {"trait_type": "Tech Stack", "value": "React, Solidity"},
    {"trait_type": "Category", "value": "DeFi"},
    {"trait_type": "Status", "value": "Live"}
  ]
}
```

---

### 3. ProjectVoting.sol (Token-Gated Voting)
**Purpose**: Allow users to vote for favorite projects by burning tokens

**Key Features**:
- **Voting Mechanism**:
  - Cost: 10 $HOMIE tokens per vote (configurable, min: 1 HOMIE, max: 1000 HOMIE)
  - Tokens are **burned** when voting (deflationary)
  - One vote per address per project
  - Votes are permanent and on-chain

- **Vote Structure**:
  ```solidity
  struct Vote {
      address voter;
      string projectId;
      uint256 timestamp;
      uint256 tokensBurned;
  }
  ```

- **Roles**:
  - `DEFAULT_ADMIN_ROLE`: Can pause voting
  - `ADMIN_ROLE`: Can set vote cost

- **Key Functions**:
  - `vote(string projectId)`: Vote for a project (burns tokens)
  - `getVotes(string projectId)`: Get vote count for a project
  - `checkVote(address voter, string projectId)`: Check if address voted
  - `getTotalVotesByAddress(address voter)`: Get user's total votes
  - `getTotalVotes()`: Get total votes across all projects
  - `getVote(uint256 index)`: Get vote details by index

**Use Cases**:
- Users vote for their favorite projects
- Voting costs tokens (creating engagement cost)
- Vote counts displayed on project cards
- Leaderboards based on vote counts

---

### 4. VisitNFT.sol (Limited Edition NFT)
**Purpose**: Reward first-time visitors with a commemorative NFT

**Key Features**:
- **NFT Details**:
  - Name: "Portfolio Visit NFT"
  - Symbol: "VISIT"
  - **Limited Supply**: Only 100 NFTs total (first 100 visitors)
  - Free to mint (gas costs only)

- **Minting Rules**:
  - One NFT per address (can only mint once)
  - First 100 visitors get an NFT
  - After 100 NFTs minted, no more can be minted

- **Metadata**:
  - Base URI stored on IPFS
  - Each NFT has unique token ID
  - Mint timestamp tracked

- **Roles**:
  - `DEFAULT_ADMIN_ROLE`: Can pause, update base URI
  - `MINTER_ROLE`: Can admin mint (for special cases)

- **Key Functions**:
  - `mintVisitNFT()`: Mint a free Visit NFT (one per address)
  - `totalSupply()`: Current number minted
  - `remainingSupply()`: How many left (100 - totalSupply)
  - `hasMinted(address)`: Check if address already minted
  - `getMintTimestamp(uint256 tokenId)`: Get when NFT was minted

**Use Cases**:
- First-time visitors get a commemorative NFT
- Creates exclusivity (only 100 exist)
- Can be displayed in wallets, galleries
- Proof of early adoption

---

### 5. VisitorBook.sol (On-Chain Guestbook)
**Purpose**: Allow visitors to leave messages permanently stored on-chain

**Key Features**:
- **Message System**:
  - Visitors can leave messages (1-500 characters)
  - Messages stored permanently on-chain
  - Each visitor can sign multiple times
  - Visit count tracked per address

- **Visitor Structure**:
  ```solidity
  struct Visitor {
      address visitor;
      string message;
      uint256 timestamp;
  }
  ```

- **EIP-712 Signing**:
  - Supports gasless signing via EIP-712 structured data
  - Prevents signature replay attacks
  - Enables meta-transactions (future)

- **Roles**:
  - `DEFAULT_ADMIN_ROLE`: Can pause, set message length limits
  - `MODERATOR_ROLE`: Can remove inappropriate messages

- **Key Functions**:
  - `signVisitorBook(string message)`: Leave a message
  - `signVisitorBookWithSignature(string message, bytes signature)`: Sign with EIP-712
  - `getVisitor(uint256 index)`: Get visitor by index
  - `getVisitors(uint256 offset, uint256 limit)`: Paginated visitor list
  - `getTotalVisitors()`: Total number of signatures
  - `getVisitCount(address visitor)`: How many times address signed
  - `hasVisited(address)`: Check if address has signed before

**Use Cases**:
- Visitors leave feedback/comments
- Creates community engagement
- Messages are permanent (immutable)
- Can display recent visitors, visitor count
- Moderator can remove spam/inappropriate content

---

## 🔗 Contract Interactions & User Flows

### Flow 1: First-Time Visitor Experience
1. User visits portfolio website
2. Connects wallet (Web3 wallet like MetaMask, Coinbase Wallet, etc.)
3. **Optional**: Claim 100 $HOMIE tokens from PortfolioToken faucet
4. **Optional**: Mint free VisitNFT (if under 100 minted)
5. **Optional**: Sign visitor book with a message
6. Browse projects displayed as NFTs

### Flow 2: Project Voting Flow
1. User browses projects (displayed as NFTs)
2. User selects a project they like
3. Check if user has enough $HOMIE tokens (need 10 HOMIE minimum)
4. If insufficient, claim from faucet
5. User votes for project → 10 $HOMIE tokens burned
6. Vote count updated on-chain
7. Project ranking updated

### Flow 3: Project Endorsement Flow
1. User views a project NFT
2. User clicks "Endorse" button
3. Transaction sent to `endorseProject(tokenId)`
4. Endorsement count incremented
5. User cannot endorse same project twice

### Flow 4: Portfolio Owner Minting Projects
1. Portfolio owner prepares project metadata (JSON)
2. Upload metadata to IPFS (get CID)
3. Call `mintProject()` with:
   - Owner address
   - Unique project ID
   - Project name
   - IPFS metadata URI
4. NFT minted to owner's address
5. Project appears in portfolio

---

## 🛠 Technical Stack

### Smart Contracts
- **Solidity**: ^0.8.24
- **OpenZeppelin Contracts**: Latest (ERC-20, ERC-721, AccessControl, Pausable, ReentrancyGuard)
- **Foundry**: Development framework
- **Base L2**: Deployment target (low gas costs)

### Frontend (To Be Built)
- **Framework**: Next.js 16+ (React 19)
- **Web3 Integration**: 
  - Wallet connection (WalletConnect, MetaMask, Coinbase Wallet)
  - Contract interaction (viem/wagmi or ethers.js)
- **Styling**: Tailwind CSS (or preferred framework)
- **IPFS**: For metadata storage (Pinata, Infura IPFS, or Web3.Storage)
- **State Management**: React Query for contract data fetching

### Infrastructure
- **Blockchain**: Base Mainnet (or Base Sepolia for testing)
- **IPFS**: Decentralized storage for NFT metadata and images
- **RPC**: Base RPC endpoints

---

## 📍 Contract Addresses

**Note**: Contracts need to be deployed. After deployment, update addresses here:

```
PortfolioToken:     [TO BE DEPLOYED]
ProjectNFT:         [TO BE DEPLOYED]
ProjectVoting:      [TO BE DEPLOYED]
VisitNFT:           [TO BE DEPLOYED]
VisitorBook:        [TO BE DEPLOYED]
```

### Deployment Order
1. PortfolioToken (needed by ProjectVoting)
2. VisitorBook
3. ProjectNFT
4. ProjectVoting (requires PortfolioToken address)
5. VisitNFT

---

## 🎨 Frontend Requirements

### Core Pages Needed

#### 1. **Home/Landing Page**
- Hero section with portfolio owner info
- Connect wallet button
- Quick stats (total projects, total visitors, total votes)
- Featured projects showcase
- Call-to-action for first-time visitors (mint VisitNFT)

#### 2. **Projects Gallery Page**
- Grid/list view of all project NFTs
- Filter by category, tech stack, etc.
- Search functionality
- Each project card shows:
  - Project image (from IPFS)
  - Project name
  - Description
  - Tech stack tags
  - Vote count
  - Endorsement count
  - Links (GitHub, demo, etc.)
  - Vote button (if user has tokens)
  - Endorse button

#### 3. **Project Detail Page**
- Full project information
- Large project image
- Full description
- Tech stack details
- Links and resources
- Vote button with token cost display
- Endorse button
- Vote history/leaderboard
- Endorsement list

#### 4. **Visitor Book Page**
- List of all visitor messages
- Pagination (use `getVisitors(offset, limit)`)
- Sign visitor book form
- Character counter (1-500 chars)
- Recent visitors display
- Total visitor count

#### 5. **Token Faucet Page**
- Display current $HOMIE balance
- Claim faucet button
- Cooldown timer (if applicable)
- Token usage explanation
- Link to voting page

#### 6. **Voting Page**
- List of projects with vote counts
- Sort by votes (most voted)
- Vote button for each project
- User's voting history
- Total tokens burned display

#### 7. **NFT Gallery Page**
- Display user's owned NFTs:
  - ProjectNFTs (if portfolio owner)
  - VisitNFT (if user minted one)
- NFT metadata display
- Links to view on marketplaces (OpenSea, etc.)

### Key Components Needed

1. **WalletConnection Component**
   - Connect/disconnect wallet
   - Display connected address
   - Network switcher (Base Mainnet/Sepolia)
   - Balance display

2. **ProjectCard Component**
   - Project image
   - Name and description
   - Vote/endorsement counts
   - Action buttons
   - Links

3. **VoteButton Component**
   - Check token balance
   - Display vote cost
   - Handle voting transaction
   - Success/error handling

4. **EndorseButton Component**
   - Check if already endorsed
   - Handle endorsement transaction
   - Update endorsement count

5. **VisitorBookForm Component**
   - Message input
   - Character counter
   - Submit button
   - EIP-712 signing option

6. **FaucetClaim Component**
   - Check eligibility
   - Display cooldown timer
   - Claim button
   - Success message

7. **NFTMint Component** (for VisitNFT)
   - Check if user can mint
   - Display remaining supply
   - Mint button
   - Success display

8. **StatsDisplay Component**
   - Total projects
   - Total visitors
   - Total votes
   - Total tokens in circulation
   - Recent activity

### User Experience Features

- **Responsive Design**: Mobile-first, works on all devices
- **Loading States**: Show loading during transactions
- **Transaction Feedback**: Success/error notifications
- **Gas Estimation**: Show estimated gas before transactions
- **IPFS Integration**: Upload and retrieve metadata/images
- **Real-time Updates**: Refresh data after transactions
- **Error Handling**: User-friendly error messages
- **Wallet Integration**: Support multiple wallets
- **Network Detection**: Auto-detect Base network

### Design Considerations

- **Modern UI**: Clean, professional portfolio aesthetic
- **Web3 Theme**: Incorporate blockchain/Web3 visual elements
- **Dark/Light Mode**: Theme switcher
- **Animations**: Smooth transitions and interactions
- **Accessibility**: WCAG compliant
- **Performance**: Optimized loading, lazy loading images

---

## 🔐 Security Features

All contracts include:
- **AccessControl**: Role-based permissions
- **Pausable**: Emergency stop mechanism
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Input Validation**: All user inputs validated
- **Supply Limits**: Max supply caps prevent inflation
- **Cooldown Periods**: Prevent spam/abuse

---

## 📊 Tokenomics

### PortfolioToken ($HOMIE)
- **Initial Supply**: 1,000,000 HOMIE
- **Max Supply**: 10,000,000 HOMIE
- **Faucet Amount**: 100 $HOMIE per claim
- **Faucet Cooldown**: 24 hours
- **Vote Cost**: 10 $HOMIE (burned)
- **Deflationary**: Tokens burned on vote (reduces supply)

### Token Distribution
- Initial supply minted to deployer
- Distributed via faucet to users
- Additional minting via MINTER_ROLE (for special events, airdrops, etc.)

---

## 🚀 Deployment Instructions

### Prerequisites
- Foundry installed
- Base network RPC endpoint
- Private key with Base ETH for gas

### Deploy Commands
```bash
# Install dependencies
forge install

# Build contracts
forge build

# Deploy to Base Mainnet
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url base \
  --broadcast \
  --verify \
  --account <your-account-name>

# Or deploy to Base Sepolia (testnet)
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url base_sepolia \
  --broadcast \
  --verify \
  --account <your-account-name>
```

### Post-Deployment
1. Update contract addresses in frontend config
2. Grant MINTER_ROLE to portfolio owner address
3. Set IPFS base URIs for NFTs
4. Configure vote cost if needed
5. Test all contract functions

---

## 📝 IPFS Metadata Standards

### ProjectNFT Metadata Format
```json
{
  "name": "Project Name",
  "description": "Detailed project description",
  "image": "ipfs://Qm...",
  "external_url": "https://github.com/user/project",
  "attributes": [
    {
      "trait_type": "Tech Stack",
      "value": "React, Solidity, IPFS"
    },
    {
      "trait_type": "Category",
      "value": "DeFi"
    },
    {
      "trait_type": "Status",
      "value": "Live"
    },
    {
      "trait_type": "Year",
      "value": 2024
    }
  ]
}
```

### VisitNFT Metadata Format
```json
{
  "name": "Portfolio Visit #1",
  "description": "Proof of visit to the portfolio",
  "image": "ipfs://Qm...",
  "attributes": [
    {
      "trait_type": "Visit Number",
      "value": 1
    },
    {
      "trait_type": "Mint Date",
      "value": "2024-01-01"
    }
  ]
}
```

---

## 🧪 Testing

```bash
# Run tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test
forge test --match-test testVote
```

---

## 📚 Additional Resources

- [Base Documentation](https://docs.base.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Foundry Book](https://book.getfoundry.sh/)
- [IPFS Documentation](https://docs.ipfs.tech/)
- [EIP-2612 Permit](https://eips.ethereum.org/EIPS/eip-2612)
- [EIP-712 Structured Data](https://eips.ethereum.org/EIPS/eip-712)

---

## 🎯 Future Enhancements

Potential features to add:
- Project categories and tags
- Advanced filtering and search
- Project analytics dashboard
- Social sharing features
- Multi-chain support
- Project staking/rewards
- Governance token integration
- Project milestones/updates
- Comment system on projects
- Project collaboration features

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👤 Portfolio Owner

[Add your information here]

---

**Note**: This README provides comprehensive context for building a new frontend. All smart contract functionality, user flows, and requirements are documented above. Use this information to generate prompts for frontend development.
