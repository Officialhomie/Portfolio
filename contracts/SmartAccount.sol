// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IAccount.sol";
import "./interfaces/IEntryPoint.sol";
import "./interfaces/UserOperation.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title SmartAccount
 * @notice ERC-4337 compliant smart account for EOA owners
 * @dev Features:
 *      - EOA owner support (Ethereum addresses only)
 *      - ECDSA signature validation
 *      - Pimlico Paymaster compatible
 *      - Upgradeable via UUPS pattern
 *
 * Owner Format:
 *      Address Owner (32 bytes): [address owner] - Ethereum address (padded to 32 bytes)
 *
 * @author Web3 Portfolio Platform
 */
contract SmartAccount is IAccount, Initializable, UUPSUpgradeable {
    using ECDSA for bytes32;

    /*//////////////////////////////////////////////////////////////
                               STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice The ERC-4337 EntryPoint contract
    IEntryPoint public immutable entryPoint;

    /// @notice Array of owner data (bytes to support both passkeys and addresses)
    bytes[] private owners;

    /// @notice Mapping from owner hash to owner index (for O(1) lookups)
    mapping(bytes32 => uint256) private ownerIndexes;

    /// @notice Next owner index to use
    uint256 private nextOwnerIndex;

    /*//////////////////////////////////////////////////////////////
                               STRUCTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Signature wrapper structure
     * Contains the owner index and the actual signature data
     */
    struct SignatureWrapper {
        /// @dev Index of the owner who signed (0-based)
        uint256 ownerIndex;
        /// @dev Signature data (format depends on owner type)
        bytes signatureData;
    }

    /*//////////////////////////////////////////////////////////////
                               EVENTS
    //////////////////////////////////////////////////////////////*/

    event OwnerAdded(uint256 indexed ownerIndex, bytes owner);
    event OwnerRemoved(uint256 indexed ownerIndex, bytes32 ownerHash);
    event Executed(address indexed target, uint256 value, bytes data);
    event ExecutedBatch(address[] targets, uint256[] values, bytes[] data);

    /*//////////////////////////////////////////////////////////////
                               ERRORS
    //////////////////////////////////////////////////////////////*/

    error OnlyEntryPoint();
    error OnlyOwner();
    error InvalidOwner();
    error OwnerAlreadyExists();
    error OwnerNotFound();
    error InvalidOwnerBytesLength(bytes owner);
    error InvalidSignature();
    error InvalidNonce();
    error CallFailed();
    error CannotRemoveLastOwner();

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Constructor sets the EntryPoint
     * @param _entryPoint The ERC-4337 EntryPoint address
     */
    constructor(IEntryPoint _entryPoint) {
        entryPoint = _entryPoint;
        _disableInitializers();
    }

    /**
     * @notice Initialize the account with first owner
     * @dev Can only be called once. Called by the factory during deployment.
     * @param initialOwner The initial owner bytes (32 bytes: padded EOA address)
     */
    function initialize(bytes calldata initialOwner) external initializer {
        // Validate owner length (must be 32 bytes for EOA)
        if (initialOwner.length != 32) {
            revert InvalidOwnerBytesLength(initialOwner);
        }
        _addOwner(initialOwner);
    }

    /*//////////////////////////////////////////////////////////////
                          ERC-4337 INTERFACE
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Validate a user operation
     * @dev Called by EntryPoint to validate the signature and pay for gas
     *
     * Validation Steps:
     * 1. Decode SignatureWrapper from userOp.signature
     * 2. Get owner bytes at ownerIndex (must be 32 bytes for EOA)
     * 3. Verify ECDSA signature
     *
     * @param userOp The user operation to validate
     * @param userOpHash Hash of the user operation
     * @param missingAccountFunds Funds needed to pay for the operation
     * @return validationData 0 for valid signature, 1 for invalid
     */
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external override returns (uint256 validationData) {
        // Only EntryPoint can call this
        if (msg.sender != address(entryPoint)) {
            revert OnlyEntryPoint();
        }

        // Pay for the operation if needed
        if (missingAccountFunds > 0) {
            (bool success, ) = payable(msg.sender).call{value: missingAccountFunds}("");
            require(success, "Failed to pay for operation");
        }

        // Validate signature
        bool isValid = _validateSignature(userOpHash, userOp.signature);

        // Return 0 for valid, 1 for invalid
        return isValid ? 0 : 1;
    }

    /*//////////////////////////////////////////////////////////////
                          SIGNATURE VALIDATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Internal signature validation
     * @dev Supports EOA addresses only (32 bytes)
     *
     * @param hash The hash that was signed
     * @param signature The packed SignatureWrapper
     * @return True if signature is valid
     */
    function _validateSignature(
        bytes32 hash,
        bytes memory signature
    ) internal view returns (bool) {
        // Decode SignatureWrapper
        SignatureWrapper memory sigWrapper = abi.decode(signature, (SignatureWrapper));

        // Get owner bytes at index
        if (sigWrapper.ownerIndex >= nextOwnerIndex) {
            return false;
        }

        bytes memory ownerBytes = owners[sigWrapper.ownerIndex];

        // Check if owner exists and is correct length (must be 32 bytes for EOA)
        if (ownerBytes.length == 0 || ownerBytes.length != 32) {
            return false;
        }

        // Validate EOA signature
        return _validateAddressSignature(ownerBytes, hash, sigWrapper.signatureData);
    }

    /**
     * @notice Validate Ethereum address signature
     * @param ownerBytes The owner bytes (32 bytes containing address)
     * @param hash The message hash
     * @param signatureData The ECDSA signature
     * @return True if valid
     */
    function _validateAddressSignature(
        bytes memory ownerBytes,
        bytes32 hash,
        bytes memory signatureData
    ) internal pure returns (bool) {
        // Extract address from ownerBytes
        address owner;
        assembly {
            owner := mload(add(ownerBytes, 32))
        }

        // Verify ECDSA signature
        address recovered = MessageHashUtils.toEthSignedMessageHash(hash).recover(signatureData);
        return recovered == owner;
    }


    /*//////////////////////////////////////////////////////////////
                          EXECUTION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Execute a transaction
     * @dev Can only be called by EntryPoint or owner
     * @param target The target contract
     * @param value ETH value to send
     * @param data Calldata
     */
    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external {
        _requireFromEntryPointOrOwner();
        _call(target, value, data);
        emit Executed(target, value, data);
    }

    /**
     * @notice Execute a batch of transactions
     * @dev Can only be called by EntryPoint or owner
     * @param targets Array of target contracts
     * @param values Array of ETH values
     * @param data Array of calldatas
     */
    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata data
    ) external {
        _requireFromEntryPointOrOwner();

        require(
            targets.length == values.length && values.length == data.length,
            "Length mismatch"
        );

        for (uint256 i = 0; i < targets.length; i++) {
            _call(targets[i], values[i], data[i]);
        }

        emit ExecutedBatch(targets, values, data);
    }

    /**
     * @notice Internal call function
     * @param target The target address
     * @param value ETH value
     * @param data Calldata
     */
    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            // Bubble up revert reason
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                          OWNER MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Add a new owner
     * @dev Can only be called by this contract (via execute)
     * @param owner The owner bytes (32 bytes: padded EOA address)
     */
    function addOwner(bytes calldata owner) external {
        _requireFromEntryPointOrOwner();
        _addOwner(owner);
    }

    /**
     * @notice Internal add owner logic
     * @param owner The owner bytes (must be 32 bytes for EOA)
     */
    function _addOwner(bytes calldata owner) internal {
        // Validate owner length (must be 32 bytes for EOA only)
        if (owner.length != 32) {
            revert InvalidOwnerBytesLength(owner);
        }

        // Check for duplicates
        bytes32 ownerHash = keccak256(owner);
        if (ownerIndexes[ownerHash] != 0 || (nextOwnerIndex > 0 && keccak256(owners[0]) == ownerHash)) {
            revert OwnerAlreadyExists();
        }

        // Add owner
        uint256 index = nextOwnerIndex++;
        owners.push(owner);
        ownerIndexes[ownerHash] = index;

        emit OwnerAdded(index, owner);
    }

    /**
     * @notice Remove an owner
     * @dev Can only be called by this contract (via execute)
     * @param ownerIndex The index of the owner to remove
     */
    function removeOwner(uint256 ownerIndex) external {
        _requireFromEntryPointOrOwner();

        if (nextOwnerIndex <= 1) {
            revert CannotRemoveLastOwner();
        }

        if (ownerIndex >= nextOwnerIndex) {
            revert OwnerNotFound();
        }

        bytes memory owner = owners[ownerIndex];
        if (owner.length == 0) {
            revert OwnerNotFound();
        }

        // Remove from mapping
        bytes32 ownerHash = keccak256(owner);
        delete ownerIndexes[ownerHash];

        // Clear owner bytes
        delete owners[ownerIndex];

        emit OwnerRemoved(ownerIndex, ownerHash);
    }

    /**
     * @notice Get owner at index
     * @param index The owner index
     * @return The owner bytes
     */
    function ownerAtIndex(uint256 index) external view returns (bytes memory) {
        if (index >= nextOwnerIndex) {
            revert OwnerNotFound();
        }
        return owners[index];
    }

    /**
     * @notice Get owner count
     * @return The number of owners
     */
    function ownerCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < nextOwnerIndex; i++) {
            if (owners[i].length > 0) {
                count++;
            }
        }
        return count;
    }

    /**
     * @notice Check if bytes are an owner
     * @param owner The owner bytes to check
     * @return True if owner exists
     */
    function isOwner(bytes calldata owner) external view returns (bool) {
        bytes32 ownerHash = keccak256(owner);
        uint256 index = ownerIndexes[ownerHash];
        return index < nextOwnerIndex && keccak256(owners[index]) == ownerHash;
    }

    /*//////////////////////////////////////////////////////////////
                          ACCESS CONTROL
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Require caller is EntryPoint or owner
     */
    function _requireFromEntryPointOrOwner() internal view {
        if (msg.sender != address(entryPoint) && !_isOwnerAddress(msg.sender)) {
            revert OnlyOwner();
        }
    }

    /**
     * @notice Check if address is an owner
     * @param addr The address to check
     * @return True if address is owner
     */
    function _isOwnerAddress(address addr) internal view returns (bool) {
        bytes memory ownerBytes = abi.encode(addr);
        bytes32 ownerHash = keccak256(ownerBytes);
        uint256 index = ownerIndexes[ownerHash];
        return index < nextOwnerIndex && keccak256(owners[index]) == ownerHash;
    }

    /*//////////////////////////////////////////////////////////////
                             UPGRADEABILITY
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Authorize upgrade (UUPS pattern)
     * @dev Only owners can upgrade
     */
    function _authorizeUpgrade(address newImplementation) internal override {
        _requireFromEntryPointOrOwner();
    }

    /*//////////////////////////////////////////////////////////////
                          RECEIVE / FALLBACK
    //////////////////////////////////////////////////////////////*/

    /// @notice Accept ETH transfers
    receive() external payable {}

    /// @notice Fallback function
    fallback() external payable {}

    /*//////////////////////////////////////////////////////////////
                          ERC-1271 SUPPORT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice ERC-1271 signature validation
     * @param hash The message hash
     * @param signature The signature bytes
     * @return magicValue 0x1626ba7e if valid
     */
    function isValidSignature(
        bytes32 hash,
        bytes memory signature
    ) external view returns (bytes4 magicValue) {
        bool isValid = _validateSignature(hash, signature);
        return isValid ? bytes4(0x1626ba7e) : bytes4(0xffffffff);
    }

    /*//////////////////////////////////////////////////////////////
                          HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get the account nonce from EntryPoint
     * @dev Queries the canonical nonce from the EntryPoint contract
     * @return The current nonce for this account
     */
    function getNonce() external view returns (uint256) {
        return entryPoint.getNonce(address(this), 0);
    }

    /**
     * @notice Deposit ETH to EntryPoint
     */
    function addDeposit() external payable {
        entryPoint.depositTo{value: msg.value}(address(this));
    }

    /**
     * @notice Withdraw ETH from EntryPoint
     * @param withdrawAddress The address to receive ETH
     * @param amount The amount to withdraw
     */
    function withdrawDepositTo(
        address payable withdrawAddress,
        uint256 amount
    ) external {
        _requireFromEntryPointOrOwner();
        entryPoint.withdrawTo(withdrawAddress, amount);
    }

    /**
     * @notice Get deposit balance in EntryPoint
     * @return The deposit balance
     */
    function getDeposit() external view returns (uint256) {
        return entryPoint.balanceOf(address(this));
    }
}
