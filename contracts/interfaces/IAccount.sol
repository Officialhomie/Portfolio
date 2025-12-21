// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import "./UserOperation.sol";

/**
 * @title IAccount
 * @notice ERC-4337 Account interface
 * @dev Account contracts must implement this interface to be compatible with EntryPoint
 */
interface IAccount {
    /**
     * @notice Validate user's signature and nonce
     * @dev Must validate caller is the entryPoint.
     *      Must validate the signature and nonce
     *
     * @param userOp The operation that is about to be executed.
     * @param userOpHash Hash of the user's request data. Can be used as the basis for signature.
     * @param missingAccountFunds Missing funds on the account's deposit in the entrypoint.
     *        This is the minimum amount to transfer to the sender(entryPoint) to be able to make the call.
     *        The excess is left as a deposit in the entrypoint, for future calls.
     *        Can be withdrawn anytime using "entryPoint.withdrawTo()".
     *        In case there is a paymaster in the request (or the current deposit is high enough), this value will be zero.
     * @return validationData Packaged ValidationData structure. use `_packValidationData` to create it.
     *        <20-byte> sigAuthorizer - 0 for valid signature, 1 to mark signature failure,
     *           otherwise, an address of an "authorizer" contract.
     *        <6-byte> validUntil - Last timestamp this operation is valid. 0 for "indefinite"
     *        <6-byte> validAfter - First timestamp this operation is valid
     *        If an account doesn't use time-range, it is enough to return SIG_VALIDATION_FAILED value (1) for signature failure.
     *        Note that the validation code cannot use block.timestamp (or block.number) directly.
     */
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData);
}
