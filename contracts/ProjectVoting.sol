// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PortfolioToken.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

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
    uint256 public voteCost = 10 * 10**18; // 10 PPT tokens per vote (configurable)
    
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
    
    event VoteCast(
        address indexed voter,
        string indexed projectId,
        uint256 timestamp,
        uint256 tokensBurned
    );
    
    event VoteCostUpdated(uint256 oldCost, uint256 newCost);

    constructor(address _portfolioToken) {
        portfolioToken = PortfolioToken(_portfolioToken);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Vote for a project (requires token payment)
     * @param projectId The project identifier to vote for
     */
    function vote(string memory projectId) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        require(bytes(projectId).length > 0, "Project ID cannot be empty");
        require(!hasVoted[msg.sender][projectId], "Already voted for this project");
        require(
            portfolioToken.balanceOf(msg.sender) >= voteCost,
            "Insufficient tokens"
        );
        
        // Burn tokens for voting
        portfolioToken.burnFrom(msg.sender, voteCost);
        
        projectVotes[projectId]++;
        hasVoted[msg.sender][projectId] = true;
        totalVotesByAddress[msg.sender]++;
        
        votes.push(Vote({
            voter: msg.sender,
            projectId: projectId,
            timestamp: block.timestamp,
            tokensBurned: voteCost
        }));
        
        emit VoteCast(msg.sender, projectId, block.timestamp, voteCost);
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
}
