// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PortfolioToken
 * @notice ERC-20 token for portfolio interactions with EIP-2612 permit
 * @dev 1:1 value token that can be used for voting, endorsements, and other interactions
 *      Faucet provides tokens to visitors for portfolio interactions
 *      Uses EIP-2612 permit for gasless approvals, AccessControl for roles,
 *      Pausable for emergency stops, and ReentrancyGuard for security
 */
contract PortfolioToken is 
    ERC20, 
    ERC20Permit, 
    ERC20Burnable, 
    ERC20Pausable,
    AccessControl, 
    ReentrancyGuard 
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant FAUCET_ROLE = keccak256("FAUCET_ROLE");
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18; // 1M tokens
    uint256 public constant FAUCET_AMOUNT = 100 * 10**18; // 100 tokens per faucet claim
    
    mapping(address => bool) public hasClaimedFaucet;
    mapping(address => uint256) public lastFaucetClaim;
    uint256 public constant FAUCET_COOLDOWN = 1 days;
    
    uint256 public maxSupply = 10_000_000 * 10**18; // 10M max supply

    // Smart wallet registry: wallet address => user address
    mapping(address => address) public walletToUser;

    event FaucetClaimed(address indexed recipient, uint256 amount);
    event TokensMinted(address indexed to, uint256 amount);
    event MaxSupplyUpdated(uint256 oldMax, uint256 newMax);

    constructor() 
        ERC20("Homie Token", "HOMIE") 
        ERC20Permit("Homie Token")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(FAUCET_ROLE, msg.sender);
        
        // Mint initial supply to deployer for distribution
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @notice Claim tokens from faucet (one-time per address)
     * @dev Can claim once per address, with optional cooldown for repeat claims
     *      Supports both direct calls and smart wallet calls
     */
    function claimFaucet() 
        external 
        whenNotPaused 
        nonReentrant 
    {
        address user = walletToUser[msg.sender];
        if (user == address(0)) {
            user = msg.sender; // Direct call from user
        }
        
        require(
            !hasClaimedFaucet[user] || 
            block.timestamp >= lastFaucetClaim[user] + FAUCET_COOLDOWN,
            "Faucet cooldown active"
        );
        require(
            totalSupply() + FAUCET_AMOUNT <= maxSupply,
            "Max supply exceeded"
        );
        
        hasClaimedFaucet[user] = true;
        lastFaucetClaim[user] = block.timestamp;
        
        _mint(user, FAUCET_AMOUNT);
        
        emit FaucetClaimed(user, FAUCET_AMOUNT);
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
     * @notice Mint tokens (minter role only, for additional distribution)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
    {
        require(to != address(0), "Cannot mint to zero address");
        require(
            totalSupply() + amount <= maxSupply,
            "Max supply exceeded"
        );
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @notice Batch mint tokens to multiple addresses
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to mint
     */
    function batchMint(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
    {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(
            totalSupply() + totalAmount <= maxSupply,
            "Max supply exceeded"
        );
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Zero address");
            _mint(recipients[i], amounts[i]);
            emit TokensMinted(recipients[i], amounts[i]);
        }
    }

    /**
     * @notice Set max supply (admin only)
     * @param newMaxSupply New maximum supply
     */
    function setMaxSupply(uint256 newMaxSupply) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(newMaxSupply >= totalSupply(), "Max supply too low");
        uint256 oldMax = maxSupply;
        maxSupply = newMaxSupply;
        emit MaxSupplyUpdated(oldMax, newMaxSupply);
    }

    /**
     * @notice Pause contract (admin only)
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause contract (admin only)
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // Override required functions
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }

    /**
     * @notice Check if address can claim from faucet
     * @param account Address to check
     * @return canClaim Whether address can claim
     * @return timeUntilClaim Seconds until next claim available
     */
    function canClaimFaucet(address account) 
        external 
        view 
        returns (bool canClaim, uint256 timeUntilClaim) 
    {
        if (!hasClaimedFaucet[account]) {
            return (true, 0);
        }
        
        uint256 nextClaimTime = lastFaucetClaim[account] + FAUCET_COOLDOWN;
        if (block.timestamp >= nextClaimTime) {
            return (true, 0);
        }
        
        return (false, nextClaimTime - block.timestamp);
    }

    /**
     * @notice Execute faucet claim for a user via smart wallet
     * @param user Address of the user
     */
    function executeFor(address user) external whenNotPaused nonReentrant {
        require(walletToUser[msg.sender] == user, "Wallet not authorized for user");
        
        require(
            !hasClaimedFaucet[user] || 
            block.timestamp >= lastFaucetClaim[user] + FAUCET_COOLDOWN,
            "Faucet cooldown active"
        );
        require(
            totalSupply() + FAUCET_AMOUNT <= maxSupply,
            "Max supply exceeded"
        );
        
        hasClaimedFaucet[user] = true;
        lastFaucetClaim[user] = block.timestamp;
        
        _mint(user, FAUCET_AMOUNT);
        
        emit FaucetClaimed(user, FAUCET_AMOUNT);
    }

    // burn() and burnFrom() are inherited from ERC20Burnable
}

