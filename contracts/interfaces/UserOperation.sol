// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

/**
 * @title UserOperation
 * @notice User Operation struct for ERC-4337
 * @dev Represents a transaction that a user wants to execute via their smart account
 */
struct UserOperation {
    address sender;              // The account making the operation
    uint256 nonce;               // Anti-replay parameter
    bytes initCode;              // If set, the account contract will be created by this constructor
    bytes callData;              // The data to pass to the sender during the main execution call
    uint256 callGasLimit;        // The amount of gas to allocate the main execution call
    uint256 verificationGasLimit; // The amount of gas to allocate for the verification step
    uint256 preVerificationGas;  // The amount of gas to pay for to compensate the bundler for pre-verification execution and calldata
    uint256 maxFeePerGas;        // Maximum fee per gas (similar to EIP-1559 max_fee_per_gas)
    uint256 maxPriorityFeePerGas; // Maximum priority fee per gas (similar to EIP-1559 max_priority_fee_per_gas)
    bytes paymasterAndData;      // If set, this field holds the paymaster address and paymaster-specific data
    bytes signature;             // Data passed into the account along with the nonce during the verification step
}
