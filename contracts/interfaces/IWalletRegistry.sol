// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IWalletRegistry
 * @notice Interface for wallet registry to track smart wallet ownership
 */
interface IWalletRegistry {
    /**
     * @notice Register a wallet address for a user
     * @param walletAddress Address of the smart wallet
     * @param userAddress Address or identifier of the user
     */
    function registerWallet(address walletAddress, address userAddress) external;
    
    /**
     * @notice Check if a wallet is registered for a user
     * @param walletAddress Address of the smart wallet
     * @param userAddress Address or identifier of the user
     * @return True if wallet is registered for user
     */
    function isWalletForUser(address walletAddress, address userAddress) external view returns (bool);
    
    /**
     * @notice Get user address for a wallet
     * @param walletAddress Address of the smart wallet
     * @return userAddress User address associated with wallet
     */
    function getUserForWallet(address walletAddress) external view returns (address);
}



