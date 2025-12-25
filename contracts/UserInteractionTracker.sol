// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Homie.sol";

/**
 * @title UserInteractionTracker
 * @notice Tracks user interactions across all portfolio contracts and calculates hierarchy/ranking
 * @dev Creates a deflationary mechanism and hierarchy system based on interactions
 */
contract UserInteractionTracker is AccessControl {
    bytes32 public constant TRACKER_ROLE = keccak256("TRACKER_ROLE");
    
    PortfolioToken public portfolioToken;
    
    // Interaction types
    enum InteractionType {
        VISITOR_BOOK_SIGN,  // 0
        PROJECT_VOTE,       // 1
        PROJECT_ENDORSE,    // 2
        VISIT_NFT_MINT      // 3
    }
    
    struct UserStats {
        uint256 visitorBookSigns;
        uint256 projectVotes;
        uint256 projectEndorsements;
        uint256 visitNFTs;
        uint256 totalInteractions;
        uint256 tokensBurned;
        uint256 interactionScore;
        uint256 tier; // 0-5 (Bronze, Silver, Gold, Platinum, Diamond, Legendary)
    }
    
    mapping(address => UserStats) public userStats;
    mapping(address => mapping(InteractionType => uint256)) public interactionCounts;
    
    // Tier thresholds (interaction scores)
    uint256[6] public tierThresholds = [
        0,      // Bronze (default)
        10,     // Silver
        50,     // Gold
        200,    // Platinum
        1000,   // Diamond
        5000    // Legendary
    ];
    
    // Token burn amounts per interaction
    uint256 public visitorBookSignCost = 5 * 10**18;  // 5 HOMIE
    uint256 public projectEndorseCost = 3 * 10**18;   // 3 HOMIE
    uint256 public visitNFTMintCost = 2 * 10**18;    // 2 HOMIE
    // Project vote cost is managed by ProjectVoting contract
    
    // Score multipliers per interaction type
    uint256 public visitorBookSignScore = 1;
    uint256 public projectVoteScore = 2;
    uint256 public projectEndorseScore = 1;
    uint256 public visitNFTScore = 1;
    
    event InteractionRecorded(
        address indexed user,
        InteractionType interactionType,
        uint256 tokensBurned,
        uint256 newScore,
        uint256 newTier
    );
    
    event TierUpgraded(address indexed user, uint256 oldTier, uint256 newTier);
    event TokenBurnCostUpdated(InteractionType interactionType, uint256 oldCost, uint256 newCost);
    
    constructor(address _portfolioToken) {
        portfolioToken = PortfolioToken(_portfolioToken);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TRACKER_ROLE, msg.sender);
    }
    
    /**
     * @notice Record an interaction and burn tokens (called by other contracts)
     * @param user Address of the user
     * @param interactionType Type of interaction
     * @param burnAmount Amount of tokens to burn (0 if no burn required)
     */
    function recordInteraction(
        address user,
        InteractionType interactionType,
        uint256 burnAmount
    ) external onlyRole(TRACKER_ROLE) {
        require(user != address(0), "Invalid user address");
        
        UserStats storage stats = userStats[user];
        uint256 oldTier = stats.tier;
        
        // Update interaction counts
        if (interactionType == InteractionType.VISITOR_BOOK_SIGN) {
            stats.visitorBookSigns++;
            stats.interactionScore += visitorBookSignScore;
        } else if (interactionType == InteractionType.PROJECT_VOTE) {
            stats.projectVotes++;
            stats.interactionScore += projectVoteScore;
        } else if (interactionType == InteractionType.PROJECT_ENDORSE) {
            stats.projectEndorsements++;
            stats.interactionScore += projectEndorseScore;
        } else if (interactionType == InteractionType.VISIT_NFT_MINT) {
            stats.visitNFTs++;
            stats.interactionScore += visitNFTScore;
        }
        
        stats.totalInteractions++;
        interactionCounts[user][interactionType]++;
        
        // Burn tokens if required
        if (burnAmount > 0) {
            require(
                portfolioToken.balanceOf(user) >= burnAmount,
                "Insufficient tokens for interaction"
            );
            portfolioToken.burnFrom(user, burnAmount);
            stats.tokensBurned += burnAmount;
        }
        
        // Calculate new tier
        uint256 newTier = calculateTier(stats.interactionScore);
        stats.tier = newTier;
        
        // Emit events
        emit InteractionRecorded(user, interactionType, burnAmount, stats.interactionScore, newTier);
        
        if (newTier > oldTier) {
            emit TierUpgraded(user, oldTier, newTier);
        }
    }
    
    /**
     * @notice Calculate tier based on interaction score
     * @param score User's interaction score
     * @return tier Tier level (0-5)
     */
    function calculateTier(uint256 score) public view returns (uint256) {
        for (uint256 i = tierThresholds.length - 1; i > 0; i--) {
            if (score >= tierThresholds[i]) {
                return i;
            }
        }
        return 0; // Bronze (default)
    }
    
    /**
     * @notice Get user statistics
     * @param user Address of the user
     * @return stats UserStats struct
     */
    function getUserStats(address user) external view returns (UserStats memory) {
        return userStats[user];
    }
    
    /**
     * @notice Get user's tier name
     * @param user Address of the user
     * @return tierName String representation of tier
     */
    function getUserTierName(address user) external view returns (string memory) {
        uint256 tier = userStats[user].tier;
        return getTierName(tier);
    }
    
    /**
     * @notice Get tier name by tier number
     * @param tier Tier number (0-5)
     * @return tierName String representation of tier
     */
    function getTierName(uint256 tier) public pure returns (string memory) {
        if (tier == 0) return "Bronze";
        if (tier == 1) return "Silver";
        if (tier == 2) return "Gold";
        if (tier == 3) return "Platinum";
        if (tier == 4) return "Diamond";
        if (tier == 5) return "Legendary";
        return "Unknown";
    }
    
    /**
     * @notice Get interaction count for a user
     * @param user Address of the user
     * @param interactionType Type of interaction
     * @return count Number of interactions of this type
     */
    function getInteractionCount(address user, InteractionType interactionType) 
        external 
        view 
        returns (uint256) 
    {
        return interactionCounts[user][interactionType];
    }
    
    /**
     * @notice Set token burn cost for an interaction type (admin only)
     * @param interactionType Type of interaction
     * @param newCost New burn cost in wei
     */
    function setTokenBurnCost(InteractionType interactionType, uint256 newCost) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        uint256 oldCost;
        if (interactionType == InteractionType.VISITOR_BOOK_SIGN) {
            oldCost = visitorBookSignCost;
            visitorBookSignCost = newCost;
        } else if (interactionType == InteractionType.PROJECT_ENDORSE) {
            oldCost = projectEndorseCost;
            projectEndorseCost = newCost;
        } else if (interactionType == InteractionType.VISIT_NFT_MINT) {
            oldCost = visitNFTMintCost;
            visitNFTMintCost = newCost;
        } else {
            revert("Cannot set vote cost here");
        }
        
        emit TokenBurnCostUpdated(interactionType, oldCost, newCost);
    }
    
    /**
     * @notice Set tier thresholds (admin only)
     * @param newThresholds Array of 6 threshold values
     */
    function setTierThresholds(uint256[6] memory newThresholds) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        tierThresholds = newThresholds;
    }
    
    /**
     * @notice Set score multipliers (admin only)
     * @param newVisitorBookSignScore Score for visitor book signs
     * @param newProjectVoteScore Score for project votes
     * @param newProjectEndorseScore Score for project endorsements
     * @param newVisitNFTScore Score for visit NFT mints
     */
    function setScoreMultipliers(
        uint256 newVisitorBookSignScore,
        uint256 newProjectVoteScore,
        uint256 newProjectEndorseScore,
        uint256 newVisitNFTScore
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        visitorBookSignScore = newVisitorBookSignScore;
        projectVoteScore = newProjectVoteScore;
        projectEndorseScore = newProjectEndorseScore;
        visitNFTScore = newVisitNFTScore;
    }
    
    /**
     * @notice Grant tracker role to a contract (admin only)
     * @param contractAddress Address of the contract that can record interactions
     */
    function grantTrackerRole(address contractAddress) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        _grantRole(TRACKER_ROLE, contractAddress);
    }
}

