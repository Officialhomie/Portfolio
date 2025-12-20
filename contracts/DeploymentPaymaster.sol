// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DeploymentPaymaster
 * @notice Simple paymaster for sponsoring BiometricWallet deployments
 * @dev Only sponsors wallet creation, not regular transactions
 */
contract DeploymentPaymaster is Ownable, ReentrancyGuard {
    // Mapping from user to eligibility status
    mapping(address => bool) public eligibleUsers;
    
    // Mapping from user to deployment count
    mapping(address => uint256) public deploymentCount;
    
    // Maximum deployments per user
    uint256 public maxDeploymentsPerUser = 1;
    
    // Total amount sponsored
    uint256 public totalSponsored;
    
    // Maximum amount to sponsor per deployment (in wei)
    uint256 public maxSponsorAmount = 0.001 ether;
    
    event UserEligibilityUpdated(address indexed user, bool eligible);
    event DeploymentSponsored(address indexed user, uint256 amount);
    event FundsDeposited(address indexed depositor, uint256 amount);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    event MaxDeploymentsUpdated(uint256 oldMax, uint256 newMax);
    event MaxSponsorAmountUpdated(uint256 oldMax, uint256 newMax);
    
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    /**
     * @notice Check if user is eligible for sponsorship
     * @param user User address
     * @return True if eligible
     */
    function isEligibleForSponsorship(address user) external view returns (bool) {
        if (!eligibleUsers[user]) {
            return false;
        }
        
        return deploymentCount[user] < maxDeploymentsPerUser;
    }
    
    /**
     * @notice Sponsor a wallet deployment
     * @param user User address
     */
    function sponsorDeployment(address user) external nonReentrant {
        require(eligibleUsers[user], "User not eligible");
        require(deploymentCount[user] < maxDeploymentsPerUser, "Deployment limit reached");
        
        // Calculate gas cost (approximate)
        uint256 gasPrice = tx.gasprice;
        uint256 gasUsed = 150000; // Approximate gas for wallet deployment
        uint256 cost = gasPrice * gasUsed;
        
        require(cost <= maxSponsorAmount, "Cost exceeds max sponsor amount");
        require(address(this).balance >= cost, "Insufficient funds");
        
        // Increment deployment count
        deploymentCount[user]++;
        totalSponsored += cost;
        
        // Transfer ETH to cover gas
        (bool success, ) = tx.origin.call{value: cost}("");
        require(success, "Transfer failed");
        
        emit DeploymentSponsored(user, cost);
    }
    
    /**
     * @notice Set user eligibility
     * @param user User address
     * @param eligible Eligibility status
     */
    function setUserEligibility(address user, bool eligible) external onlyOwner {
        eligibleUsers[user] = eligible;
        emit UserEligibilityUpdated(user, eligible);
    }
    
    /**
     * @notice Set eligibility for multiple users
     * @param users Array of user addresses
     * @param eligible Eligibility status for all
     */
    function setBatchEligibility(address[] calldata users, bool eligible) external onlyOwner {
        for (uint256 i = 0; i < users.length; i++) {
            eligibleUsers[users[i]] = eligible;
            emit UserEligibilityUpdated(users[i], eligible);
        }
    }
    
    /**
     * @notice Set maximum deployments per user
     * @param max Maximum deployments
     */
    function setMaxDeploymentsPerUser(uint256 max) external onlyOwner {
        uint256 oldMax = maxDeploymentsPerUser;
        maxDeploymentsPerUser = max;
        emit MaxDeploymentsUpdated(oldMax, max);
    }
    
    /**
     * @notice Set maximum sponsor amount per deployment
     * @param max Maximum amount in wei
     */
    function setMaxSponsorAmount(uint256 max) external onlyOwner {
        uint256 oldMax = maxSponsorAmount;
        maxSponsorAmount = max;
        emit MaxSponsorAmountUpdated(oldMax, max);
    }
    
    /**
     * @notice Deposit funds to paymaster
     */
    function fundPaymaster() external payable {
        require(msg.value > 0, "Must send ETH");
        emit FundsDeposited(msg.sender, msg.value);
    }
    
    /**
     * @notice Withdraw funds from paymaster
     * @param amount Amount to withdraw
     */
    function withdrawFunds(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Transfer failed");
        emit FundsWithdrawn(owner(), amount);
    }
    
    /**
     * @notice Get paymaster balance
     * @return Balance in wei
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @notice Get deployment count for user
     * @param user User address
     * @return Count of deployments
     */
    function getUserDeploymentCount(address user) external view returns (uint256) {
        return deploymentCount[user];
    }
    
    // Allow paymaster to receive ETH
    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }
}

