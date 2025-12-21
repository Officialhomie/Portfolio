// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import "./UserOperation.sol";

/**
 * @title IEntryPoint
 * @notice ERC-4337 EntryPoint interface
 * @dev Minimal interface for the EntryPoint contract
 */
interface IEntryPoint {
    /**
     * @notice Execute a batch of UserOperations
     * @param ops The operations to execute
     * @param beneficiary The address to receive the gas payment
     */
    function handleOps(
        UserOperation[] calldata ops,
        address payable beneficiary
    ) external;

    /**
     * @notice Execute a single UserOperation with aggregated signature
     * @param opsPerAggregator Aggregated operations
     * @param beneficiary The address to receive the gas payment
     */
    function handleAggregatedOps(
        UserOpsPerAggregator[] calldata opsPerAggregator,
        address payable beneficiary
    ) external;

    /**
     * @notice Get the deposit balance of an account
     * @param account The account address
     * @return The deposit balance
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @notice Deposit ETH for an account
     * @param account The account to deposit for
     */
    function depositTo(address account) external payable;

    /**
     * @notice Add stake for this entity
     * @param unstakeDelaySec The unstake delay in seconds
     */
    function addStake(uint32 unstakeDelaySec) external payable;

    /**
     * @notice Unlock the stake
     */
    function unlockStake() external;

    /**
     * @notice Withdraw stake
     * @param withdrawAddress The address to send the stake to
     */
    function withdrawStake(address payable withdrawAddress) external;

    /**
     * @notice Withdraw ETH from deposit
     * @param withdrawAddress The address to send the ETH to
     * @param withdrawAmount The amount to withdraw
     */
    function withdrawTo(
        address payable withdrawAddress,
        uint256 withdrawAmount
    ) external;

    /**
     * @notice Get the nonce for a sender
     * @param sender The account address
     * @param key The nonce key (usually 0)
     * @return The current nonce
     */
    function getNonce(address sender, uint192 key) external view returns (uint256);
}

/**
 * @dev Aggregated UserOperations struct
 */
struct UserOpsPerAggregator {
    UserOperation[] userOps;
    address aggregator;
    bytes signature;
}
