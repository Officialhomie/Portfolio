// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./BiometricWallet.sol";

/**
 * @title BiometricWalletFactory
 * @notice Factory for deploying BiometricWallet contracts with CREATE2 for deterministic addresses
 * @dev Allows pre-computation of wallet addresses before deployment
 */
contract BiometricWalletFactory {
    // Mapping from wallet address to deployment status
    mapping(address => bool) public isWalletDeployed;
    
    // Array of all deployed wallets
    address[] public deployedWallets;
    
    // Optional paymaster for sponsored deployments
    address public paymaster;
    
    event WalletDeployed(address indexed wallet, address indexed owner, bytes32 publicKeyX, bytes32 publicKeyY, bytes32 salt);
    event PaymasterUpdated(address indexed oldPaymaster, address indexed newPaymaster);
    
    constructor(address _paymaster) {
        paymaster = _paymaster;
    }
    
    /**
     * @notice Compute the address where a wallet would be deployed
     * @param publicKeyX X coordinate of public key
     * @param publicKeyY Y coordinate of public key
     * @param salt Salt for CREATE2
     * @return walletAddress Computed wallet address
     */
    function getWalletAddress(
        bytes32 publicKeyX,
        bytes32 publicKeyY,
        bytes32 salt
    ) external view returns (address walletAddress) {
        bytes memory bytecode = abi.encodePacked(
            type(BiometricWallet).creationCode,
            abi.encode(publicKeyX, publicKeyY)
        );
        
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(bytecode)
            )
        );
        
        walletAddress = address(uint160(uint256(hash)));
    }
    
    /**
     * @notice Deploy a new BiometricWallet
     * @param publicKeyX X coordinate of public key
     * @param publicKeyY Y coordinate of public key
     * @param salt Salt for CREATE2 (can be zero)
     * @return walletAddress Address of deployed wallet
     */
    function createWallet(
        bytes32 publicKeyX,
        bytes32 publicKeyY,
        bytes32 salt
    ) external returns (address walletAddress) {
        // Compute wallet address
        walletAddress = this.getWalletAddress(publicKeyX, publicKeyY, salt);
        
        // Check if already deployed
        require(!isWalletDeployed[walletAddress], "Wallet already deployed");
        
        // Deploy wallet using CREATE2
        bytes memory bytecode = abi.encodePacked(
            type(BiometricWallet).creationCode,
            abi.encode(publicKeyX, publicKeyY)
        );
        
        assembly {
            walletAddress := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
            if iszero(walletAddress) {
                revert(0, 0)
            }
        }
        
        // Mark as deployed
        isWalletDeployed[walletAddress] = true;
        deployedWallets.push(walletAddress);
        
        emit WalletDeployed(walletAddress, msg.sender, publicKeyX, publicKeyY, salt);
    }
    
    /**
     * @notice Deploy wallet with paymaster sponsorship
     * @param publicKeyX X coordinate of public key
     * @param publicKeyY Y coordinate of public key
     * @param salt Salt for CREATE2
     * @return walletAddress Address of deployed wallet
     */
    function createWalletSponsored(
        bytes32 publicKeyX,
        bytes32 publicKeyY,
        bytes32 salt
    ) external returns (address walletAddress) {
        require(paymaster != address(0), "Paymaster not set");
        require(
            IDeploymentPaymaster(paymaster).isEligibleForSponsorship(msg.sender),
            "Not eligible for sponsorship"
        );
        
        // Sponsor gas for this transaction
        IDeploymentPaymaster(paymaster).sponsorDeployment(msg.sender);
        
        // Compute wallet address
        walletAddress = this.getWalletAddress(publicKeyX, publicKeyY, salt);
        
        // Check if already deployed
        require(!isWalletDeployed[walletAddress], "Wallet already deployed");
        
        // Deploy wallet using CREATE2
        bytes memory bytecode = abi.encodePacked(
            type(BiometricWallet).creationCode,
            abi.encode(publicKeyX, publicKeyY)
        );
        
        assembly {
            walletAddress := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
            if iszero(walletAddress) {
                revert(0, 0)
            }
        }
        
        // Mark as deployed
        isWalletDeployed[walletAddress] = true;
        deployedWallets.push(walletAddress);
        
        emit WalletDeployed(walletAddress, msg.sender, publicKeyX, publicKeyY, salt);
    }
    
    /**
     * @notice Update paymaster address
     * @param _paymaster New paymaster address
     */
    function setPaymaster(address _paymaster) external {
        require(msg.sender == address(this) || msg.sender == owner(), "Not authorized");
        address oldPaymaster = paymaster;
        paymaster = _paymaster;
        emit PaymasterUpdated(oldPaymaster, _paymaster);
    }
    
    /**
     * @notice Get owner (for factory upgrades)
     * @dev Can be overridden in derived contracts
     */
    function owner() public view virtual returns (address) {
        return address(0); // No owner by default
    }
    
    /**
     * @notice Get count of deployed wallets
     * @return Count of deployed wallets
     */
    function getDeployedWalletCount() external view returns (uint256) {
        return deployedWallets.length;
    }
    
    /**
     * @notice Get deployed wallets
     * @param offset Starting index
     * @param limit Maximum number to return
     * @return wallets Array of wallet addresses
     */
    function getDeployedWallets(uint256 offset, uint256 limit) external view returns (address[] memory wallets) {
        uint256 length = deployedWallets.length;
        if (offset >= length) {
            return new address[](0);
        }
        
        uint256 end = offset + limit;
        if (end > length) {
            end = length;
        }
        
        wallets = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            wallets[i - offset] = deployedWallets[i];
        }
    }
}

/**
 * @title IDeploymentPaymaster
 * @notice Interface for deployment paymaster
 */
interface IDeploymentPaymaster {
    function isEligibleForSponsorship(address user) external view returns (bool);
    function sponsorDeployment(address user) external;
}

