// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./BiometricSmartAccount.sol";
import "./interfaces/IEntryPoint.sol";
import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title PasskeyAccountFactory
 * @notice Factory for deploying PasskeyAccount contracts with CREATE2
 * @dev Uses CREATE2 for deterministic addresses (counterfactual deployment)
 *
 * Key Features:
 * - Deterministic account addresses
 * - Users get their address before deployment
 * - Accounts only deployed on first transaction
 * - Compatible with CDP Paymaster
 *
 * @author Web3 Portfolio Platform
 */
contract PasskeyAccountFactory {
    /*//////////////////////////////////////////////////////////////
                               STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice The PasskeyAccount implementation contract
    PasskeyAccount public immutable accountImplementation;

    /// @notice The ERC-4337 EntryPoint
    IEntryPoint public immutable entryPoint;

    /*//////////////////////////////////////////////////////////////
                               EVENTS
    //////////////////////////////////////////////////////////////*/

    event AccountCreated(
        address indexed account,
        bytes indexed owner,
        uint256 salt
    );

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Constructor deploys the implementation contract
     * @param _entryPoint The ERC-4337 EntryPoint address
     */
    constructor(IEntryPoint _entryPoint) {
        entryPoint = _entryPoint;
        accountImplementation = new PasskeyAccount(_entryPoint);
    }

    /*//////////////////////////////////////////////////////////////
                          ACCOUNT CREATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Create a new PasskeyAccount
     * @dev Uses CREATE2 for deterministic addresses
     *
     * The account will be deployed as an ERC1967 proxy pointing to the implementation.
     * This allows for upgradeable accounts while keeping deployment costs low.
     *
     * @param owner The initial owner bytes (passkey public key or Ethereum address)
     * @param salt The salt for CREATE2 (use 0 for first account per owner)
     * @return account The deployed account address
     */
    function createAccount(
        bytes calldata owner,
        uint256 salt
    ) external returns (PasskeyAccount account) {
        address addr = getAddress(owner, salt);

        // Check if already deployed
        uint256 codeSize = addr.code.length;
        if (codeSize > 0) {
            return PasskeyAccount(payable(addr));
        }

        // Encode initialization call
        bytes memory initializeCall = abi.encodeWithSelector(
            PasskeyAccount.initialize.selector,
            owner
        );

        // Deploy proxy with CREATE2
        bytes32 salt2 = _getSalt(owner, salt);

        account = PasskeyAccount(payable(
            new ERC1967Proxy{salt: salt2}(
                address(accountImplementation),
                initializeCall
            )
        ));

        emit AccountCreated(address(account), owner, salt);
    }

    /**
     * @notice Get the counterfactual address of an account
     * @dev Computes the CREATE2 address without deploying
     *
     * This allows users to know their account address before deployment,
     * which is essential for receiving funds before first transaction.
     *
     * @param owner The owner bytes
     * @param salt The salt value
     * @return The deterministic account address
     */
    function getAddress(
        bytes calldata owner,
        uint256 salt
    ) public view returns (address) {
        bytes memory initializeCall = abi.encodeWithSelector(
            PasskeyAccount.initialize.selector,
            owner
        );

        bytes32 salt2 = _getSalt(owner, salt);

        return Create2.computeAddress(
            salt2,
            keccak256(abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(
                    address(accountImplementation),
                    initializeCall
                )
            ))
        );
    }

    /**
     * @notice Internal function to compute CREATE2 salt
     * @dev Combines owner and salt for unique deterministic addresses
     * @param owner The owner bytes
     * @param salt The user-provided salt
     * @return The computed salt for CREATE2
     */
    function _getSalt(
        bytes calldata owner,
        uint256 salt
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(owner, salt));
    }

    /*//////////////////////////////////////////////////////////////
                          HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Add stake to EntryPoint for this factory
     * @dev Required if factory wants to create accounts during UserOp validation
     * @param unstakeDelaySec The unstake delay in seconds
     */
    function addStake(uint32 unstakeDelaySec) external payable {
        entryPoint.addStake{value: msg.value}(unstakeDelaySec);
    }
}
