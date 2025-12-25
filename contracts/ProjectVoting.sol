// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Homie.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./UserInteractionTracker.sol";

/**
 * @title ProjectVoting
 * @notice Token-gated voting contract for favorite projects
 * @dev Requires PortfolioToken payment to vote (consumes tokens)
 *      Uses AccessControl for permissions, Pausable for emergency stops,
 *      and ReentrancyGuard for security
 */
contract ProjectVoting is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    PortfolioToken public portfolioToken;
    uint256 public voteCost = 10 * 10**18; // 10 HOMIE tokens per vote (configurable)
    
    struct Vote {
        address voter;
        string projectId;
        uint256 timestamp;
        uint256 tokensBurned;
    }
    
    mapping(string => uint256) public projectVotes;
    mapping(address => mapping(string => bool)) public hasVoted;
    mapping(address => uint256) public totalVotesByAddress;
    Vote[] public votes;
    
    uint256 public minVoteCost = 1 * 10**18; // Minimum 1 token
    uint256 public maxVoteCost = 1000 * 10**18; // Maximum 1000 tokens

    // Smart wallet registry: wallet address => user address
    mapping(address => address) public walletToUser;
    
    // User interaction tracker for hierarchy system
    UserInteractionTracker public interactionTracker;

    event VoteCast(
        address indexed voter,
        string indexed projectId,
        uint256 timestamp,
        uint256 tokensBurned
    );

    event VoteCostUpdated(uint256 oldCost, uint256 newCost);

    constructor(address _portfolioToken, address _interactionTracker) {
        portfolioToken = PortfolioToken(_portfolioToken);
        if (_interactionTracker != address(0)) {
            interactionTracker = UserInteractionTracker(_interactionTracker);
        }
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @notice Set interaction tracker address (admin only)
     * @param _interactionTracker Address of the UserInteractionTracker contract
     */
    function setInteractionTracker(address _interactionTracker) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(_interactionTracker != address(0), "Invalid tracker address");
        interactionTracker = UserInteractionTracker(_interactionTracker);
    }

    /**
     * @notice Vote for a project (requires token payment)
     * @param projectId The project identifier to vote for
     * @dev Supports both direct calls and smart wallet calls
     */
    function vote(string memory projectId) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        address user = walletToUser[msg.sender];
        if (user == address(0)) {
            user = msg.sender; // Direct call from user
        }
        
        require(bytes(projectId).length > 0, "Project ID cannot be empty");
        require(!hasVoted[user][projectId], "Already voted for this project");
        require(
            portfolioToken.balanceOf(user) >= voteCost,
            "Insufficient tokens"
        );
        
        // Burn tokens for voting
        portfolioToken.burnFrom(user, voteCost);
        
        projectVotes[projectId]++;
        hasVoted[user][projectId] = true;
        totalVotesByAddress[user]++;
        
        votes.push(Vote({
            voter: user,
            projectId: projectId,
            timestamp: block.timestamp,
            tokensBurned: voteCost
        }));
        
        emit VoteCast(user, projectId, block.timestamp, voteCost);
    }
    
    /**
     * @notice Register a smart wallet for a user
     * @param walletAddress Address of the smart wallet
     * @param userAddress Address of the user
     */
    function registerWallet(address walletAddress, address userAddress) external {
        require(walletAddress != address(0), "Invalid wallet address");
        require(userAddress != address(0), "Invalid user address");
        require(walletToUser[walletAddress] == address(0), "Wallet already registered");
        require(msg.sender == walletAddress || msg.sender == userAddress, "Not authorized");
        
        walletToUser[walletAddress] = userAddress;
    }
    
    /**
     * @notice Execute vote for a user via smart wallet
     * @param user Address of the user
     * @param projectId The project identifier to vote for
     */
    function executeFor(address user, string memory projectId) external whenNotPaused nonReentrant {
        require(walletToUser[msg.sender] == user, "Wallet not authorized for user");
        
        require(bytes(projectId).length > 0, "Project ID cannot be empty");
        require(!hasVoted[user][projectId], "Already voted for this project");
        require(
            portfolioToken.balanceOf(user) >= voteCost,
            "Insufficient tokens"
        );
        
        // Burn tokens for voting
        portfolioToken.burnFrom(user, voteCost);
        
        projectVotes[projectId]++;
        hasVoted[user][projectId] = true;
        totalVotesByAddress[user]++;
        
        votes.push(Vote({
            voter: user,
            projectId: projectId,
            timestamp: block.timestamp,
            tokensBurned: voteCost
        }));
        
        // Record interaction in tracker (vote cost already burned above)
        if (address(interactionTracker) != address(0)) {
            interactionTracker.recordInteraction(
                user,
                UserInteractionTracker.InteractionType.PROJECT_VOTE,
                voteCost
            );
        }
        
        emit VoteCast(user, projectId, block.timestamp, voteCost);
    }

    /**
     * @notice Set vote cost (admin only)
     * @param newCost New vote cost in wei
     */
    function setVoteCost(uint256 newCost) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(
            newCost >= minVoteCost && newCost <= maxVoteCost,
            "Vote cost out of bounds"
        );
        uint256 oldCost = voteCost;
        voteCost = newCost;
        emit VoteCostUpdated(oldCost, newCost);
    }

    /**
     * @notice Pause voting (admin only)
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause voting (admin only)
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Get total votes by an address
     * @param voter Address to check
     * @return Total votes cast by address
     */
    function getTotalVotesByAddress(address voter) 
        external 
        view 
        returns (uint256) 
    {
        return totalVotesByAddress[voter];
    }

    /**
     * @notice Get vote count for a project
     * @param projectId The project identifier
     * @return Vote count
     */
    function getVotes(string memory projectId) external view returns (uint256) {
        return projectVotes[projectId];
    }

    /**
     * @notice Check if address has voted for a project
     * @param voter The voter address
     * @param projectId The project identifier
     * @return Whether the address has voted
     */
    function checkVote(address voter, string memory projectId) 
        external 
        view 
        returns (bool) 
    {
        return hasVoted[voter][projectId];
    }

    /**
     * @notice Get total number of votes cast
     * @return Total vote count
     */
    function getTotalVotes() external view returns (uint256) {
        return votes.length;
    }

    /**
     * @notice Get vote at index
     * @param index Index of vote
     * @return Vote struct
     */
    function getVote(uint256 index) external view returns (Vote memory) {
        require(index < votes.length, "Index out of bounds");
        return votes[index];
    }

    /**
     * @notice Get all votes cast by a user
     * @param voter Address of the voter
     * @return Array of Vote structs
     */
    function getUserVotes(address voter) external view returns (Vote[] memory) {
        uint256 userVoteCount = totalVotesByAddress[voter];
        if (userVoteCount == 0) {
            return new Vote[](0);
        }
        
        Vote[] memory userVotes = new Vote[](userVoteCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < votes.length; i++) {
            if (votes[i].voter == voter) {
                userVotes[index] = votes[i];
                index++;
            }
        }
        
        return userVotes;
    }
    
    /**
     * @notice Get all projects a user has voted for
     * @param voter Address of the voter
     * @return Array of project IDs
     */
    function getUserVotedProjects(address voter) external view returns (string[] memory) {
        // First pass: count projects voted for
        uint256 count = 0;
        for (uint256 i = 0; i < votes.length; i++) {
            if (votes[i].voter == voter) {
                count++;
            }
        }
        
        if (count == 0) {
            return new string[](0);
        }
        
        // Second pass: collect project IDs
        string[] memory projectIds = new string[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < votes.length; i++) {
            if (votes[i].voter == voter) {
                projectIds[index] = votes[i].projectId;
                index++;
            }
        }
        
        return projectIds;
    }
    
    /**
     * @notice Get user's voting statistics
     * @param voter Address of the voter
     * @return totalVotes Total votes cast
     * @return totalTokensBurned Total tokens burned
     * @return uniqueProjects Number of unique projects voted for
     */
    function getUserVotingStats(address voter) 
        external 
        view 
        returns (
            uint256 totalVotes,
            uint256 totalTokensBurned,
            uint256 uniqueProjects
        ) 
    {
        totalVotes = totalVotesByAddress[voter];
        totalTokensBurned = 0;
        uniqueProjects = 0;
        
        // Use a simple approach: iterate and count unique projects
        // Note: This is O(n) but works without storage mappings
        string[] memory seenProjects = new string[](totalVotes);
        uint256 seenCount = 0;
        
        for (uint256 i = 0; i < votes.length; i++) {
            if (votes[i].voter == voter) {
                totalTokensBurned += votes[i].tokensBurned;
                
                // Check if project ID already seen
                bool seen = false;
                for (uint256 j = 0; j < seenCount; j++) {
                    if (keccak256(bytes(seenProjects[j])) == keccak256(bytes(votes[i].projectId))) {
                        seen = true;
                        break;
                    }
                }
                
                if (!seen) {
                    seenProjects[seenCount] = votes[i].projectId;
                    seenCount++;
                    uniqueProjects++;
                }
            }
        }
    }
}
