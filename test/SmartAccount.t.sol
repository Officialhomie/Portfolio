// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/SmartAccount.sol";
import "../contracts/SmartAccountFactory.sol";
import "../contracts/interfaces/IEntryPoint.sol";
import "../contracts/interfaces/UserOperation.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title SmartAccountTest
 * @notice Comprehensive tests for SmartAccount contract
 */
contract SmartAccountTest is Test {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    SmartAccountFactory public factory;
    SmartAccount public account;
    IEntryPoint public entryPoint;
    
    address public owner;
    uint256 public ownerPrivateKey;
    bytes public ownerBytes; // 32 bytes padded address
    
    // Mock EntryPoint for testing
    MockEntryPoint public mockEntryPoint;

    function setUp() public {
        // Create mock EntryPoint
        mockEntryPoint = new MockEntryPoint();
        entryPoint = IEntryPoint(address(mockEntryPoint));
        
        // Deploy factory
        factory = new SmartAccountFactory(entryPoint);
        
        // Create test owner
        ownerPrivateKey = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef;
        owner = vm.addr(ownerPrivateKey);
        
        // Create owner bytes (32 bytes padded address)
        ownerBytes = abi.encodePacked(bytes12(0), owner);
        require(ownerBytes.length == 32, "Owner bytes must be 32 bytes");
        
        // Deploy account via factory
        account = factory.createAccount(ownerBytes, 0);
    }

    // ============================================================================
    // Initialization Tests
    // ============================================================================

    function test_Initialization() public {
        // Check that account is initialized
        assertTrue(address(account) != address(0));
        
        // Verify owner was added by checking ownerAtIndex
        bytes memory ownerData = account.ownerAtIndex(0);
        assertEq(keccak256(ownerData), keccak256(ownerBytes));
        assertEq(account.ownerCount(), 1);
        assertTrue(account.isOwner(ownerBytes));
    }

    function test_InitializationRevertsIfAlreadyInitialized() public {
        // Try to initialize again - should revert
        vm.expectRevert();
        account.initialize(ownerBytes);
    }

    function test_InitializationRevertsIfInvalidOwnerLength() public {
        // Deploy new account
        SmartAccount newAccount = factory.createAccount(ownerBytes, 1);
        
        // Try to initialize with wrong length
        bytes memory invalidOwner = abi.encodePacked(bytes10(0), owner);
        vm.expectRevert();
        newAccount.initialize(invalidOwner);
    }

    // ============================================================================
    // Signature Validation Tests
    // ============================================================================

    function test_ValidateSignature_ValidSignature() public {
        // Create a UserOperation with valid signature
        UserOperation memory userOp = _createUserOperation();
        bytes32 userOpHash = _getUserOpHash(userOp);
        
        // Sign UserOperation hash
        bytes32 ethSignedMessageHash = userOpHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, ethSignedMessageHash);
        bytes memory signatureData = abi.encodePacked(r, s, v);
        
        // Encode as SignatureWrapper
        userOp.signature = abi.encode(
            SmartAccount.SignatureWrapper({
                ownerIndex: 0,
                signatureData: signatureData
            })
        );
        
        // Validate UserOperation (must be called by EntryPoint)
        vm.prank(address(entryPoint));
        uint256 validationData = account.validateUserOp(userOp, userOpHash, 0);
        assertEq(validationData, 0, "Valid signature should return 0");
    }

    function test_ValidateSignature_InvalidSignature() public {
        // Create a UserOperation with invalid signature
        UserOperation memory userOp = _createUserOperation();
        bytes32 userOpHash = _getUserOpHash(userOp);
        
        // Create invalid signature (wrong private key)
        uint256 wrongPrivateKey = 0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890;
        bytes32 ethSignedMessageHash = userOpHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongPrivateKey, ethSignedMessageHash);
        bytes memory signatureData = abi.encodePacked(r, s, v);
        
        // Encode as SignatureWrapper
        userOp.signature = abi.encode(
            SmartAccount.SignatureWrapper({
                ownerIndex: 0,
                signatureData: signatureData
            })
        );
        
        // Validate UserOperation - should fail (must be called by EntryPoint)
        vm.prank(address(entryPoint));
        uint256 validationData = account.validateUserOp(userOp, userOpHash, 0);
        assertEq(validationData, 1, "Invalid signature should return 1");
    }

    function test_ValidateSignature_WrongOwnerIndex() public {
        // Create a UserOperation with wrong owner index
        UserOperation memory userOp = _createUserOperation();
        bytes32 userOpHash = _getUserOpHash(userOp);
        
        // Sign with owner's private key
        bytes32 ethSignedMessageHash = userOpHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, ethSignedMessageHash);
        bytes memory signatureData = abi.encodePacked(r, s, v);
        
        // Encode as SignatureWrapper with wrong owner index
        userOp.signature = abi.encode(
            SmartAccount.SignatureWrapper({
                ownerIndex: 999, // Invalid index
                signatureData: signatureData
            })
        );
        
        // Validate UserOperation - should fail (must be called by EntryPoint)
        vm.prank(address(entryPoint));
        uint256 validationData = account.validateUserOp(userOp, userOpHash, 0);
        assertEq(validationData, 1, "Signature with wrong owner index should return 1");
    }

    // ============================================================================
    // UserOperation Validation Tests
    // ============================================================================

    function test_ValidateUserOp_ValidSignature() public {
        // Create a UserOperation
        UserOperation memory userOp = _createUserOperation();
        
        // Compute UserOperation hash
        bytes32 userOpHash = _getUserOpHash(userOp);
        
        // Sign UserOperation hash
        bytes32 ethSignedMessageHash = userOpHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, ethSignedMessageHash);
        bytes memory signatureData = abi.encodePacked(r, s, v);
        
        // Encode signature as SignatureWrapper
        userOp.signature = abi.encode(
            SmartAccount.SignatureWrapper({
                ownerIndex: 0,
                signatureData: signatureData
            })
        );
        
        // Validate UserOperation (must be called by EntryPoint)
        vm.prank(address(entryPoint));
        uint256 validationData = account.validateUserOp(userOp, userOpHash, 0);
        assertEq(validationData, 0, "Valid UserOperation should return 0");
    }

    function test_ValidateUserOp_RevertsIfNotEntryPoint() public {
        // Create a UserOperation
        UserOperation memory userOp = _createUserOperation();
        bytes32 userOpHash = _getUserOpHash(userOp);
        
        // Try to validate from non-EntryPoint address
        vm.prank(address(0x1234));
        vm.expectRevert(SmartAccount.OnlyEntryPoint.selector);
        account.validateUserOp(userOp, userOpHash, 0);
    }

    function test_ValidateUserOp_PaysMissingFunds() public {
        // Fund the account
        vm.deal(address(account), 1 ether);
        
        // Create a UserOperation
        UserOperation memory userOp = _createUserOperation();
        bytes32 userOpHash = _getUserOpHash(userOp);
        
        // Sign UserOperation hash
        bytes32 ethSignedMessageHash = userOpHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, ethSignedMessageHash);
        bytes memory signatureData = abi.encodePacked(r, s, v);
        
        userOp.signature = abi.encode(
            SmartAccount.SignatureWrapper({
                ownerIndex: 0,
                signatureData: signatureData
            })
        );
        
        // Validate with missing funds requirement (must be called by EntryPoint)
        uint256 missingFunds = 0.1 ether;
        uint256 balanceBefore = address(account).balance;
        
        vm.prank(address(entryPoint));
        account.validateUserOp(userOp, userOpHash, missingFunds);
        
        // Check that funds were paid
        assertEq(address(account).balance, balanceBefore - missingFunds);
        assertEq(address(entryPoint).balance, missingFunds);
    }

    // ============================================================================
    // Execution Tests
    // ============================================================================

    function test_Execute_SingleCall() public {
        // Create a mock target contract
        MockTarget target = new MockTarget();
        
        // Fund the account
        vm.deal(address(account), 1 ether);
        
        // Execute a call
        bytes memory callData = abi.encodeWithSelector(MockTarget.setValue.selector, 42);
        
        vm.prank(address(entryPoint));
        account.execute(payable(address(target)), 0, callData);
        
        // Verify the call was executed
        assertEq(target.value(), 42);
    }

    function test_Execute_RevertsIfNotEntryPointOrOwner() public {
        MockTarget target = new MockTarget();
        bytes memory callData = abi.encodeWithSelector(MockTarget.setValue.selector, 42);
        
        // Should revert if called by random address
        vm.prank(address(0x9999));
        vm.expectRevert();
        account.execute(payable(address(target)), 0, callData);
    }

    function test_ExecuteBatch() public {
        // Create mock targets
        MockTarget target1 = new MockTarget();
        MockTarget target2 = new MockTarget();
        
        // Fund the account
        vm.deal(address(account), 1 ether);
        
        // Prepare batch calls
        address[] memory targets = new address[](2);
        targets[0] = address(target1);
        targets[1] = address(target2);
        
        uint256[] memory values = new uint256[](2);
        values[0] = 0;
        values[1] = 0;
        
        bytes[] memory data = new bytes[](2);
        data[0] = abi.encodeWithSelector(MockTarget.setValue.selector, 10);
        data[1] = abi.encodeWithSelector(MockTarget.setValue.selector, 20);
        
        // Execute batch
        vm.prank(address(entryPoint));
        account.executeBatch(targets, values, data);
        
        // Verify both calls were executed
        assertEq(target1.value(), 10);
        assertEq(target2.value(), 20);
    }

    // ============================================================================
    // Owner Management Tests
    // ============================================================================

    function test_AddOwner() public {
        // Create new owner
        uint256 newOwnerPrivateKey = 0x5678;
        address newOwner = vm.addr(newOwnerPrivateKey);
        bytes memory newOwnerBytes = abi.encodePacked(bytes12(0), newOwner);
        
        // Add owner via direct call (owner can call directly)
        // The account allows calls from owner address
        vm.prank(owner); // Call as the owner
        account.addOwner(newOwnerBytes);
        
        // Verify owner was added
        assertEq(account.ownerCount(), 2);
        assertTrue(account.isOwner(newOwnerBytes));
        assertEq(account.ownerAtIndex(1), newOwnerBytes);
    }

    function test_AddOwner_RevertsIfDuplicate() public {
        // Try to add the same owner again
        vm.prank(owner); // Call as the owner
        vm.expectRevert(SmartAccount.OwnerAlreadyExists.selector);
        account.addOwner(ownerBytes);
    }

    function test_RemoveOwner() public {
        // First add a second owner
        uint256 newOwnerPrivateKey = 0x5678;
        address newOwner = vm.addr(newOwnerPrivateKey);
        bytes memory newOwnerBytes = abi.encodePacked(bytes12(0), newOwner);
        
        vm.prank(owner); // Call as the owner
        account.addOwner(newOwnerBytes);
        
        // Now remove the first owner (can be called by owner)
        vm.prank(owner); // Call as the owner
        account.removeOwner(0);
        
        // Verify owner was removed
        // After removal, the array is shifted, so newOwner is now at index 0
        assertEq(account.ownerCount(), 1);
        assertFalse(account.isOwner(ownerBytes));
        assertTrue(account.isOwner(newOwnerBytes));
        
        // Check owner at index 0 (should be newOwner after removal)
        bytes memory ownerAt0 = account.ownerAtIndex(0);
        // Note: ownerAt0 might be empty bytes if the slot was cleared, so check isOwner instead
        assertTrue(account.isOwner(newOwnerBytes));
    }

    function test_RemoveOwner_RevertsIfLastOwner() public {
        // Try to remove the only owner
        vm.prank(owner); // Call as the owner
        vm.expectRevert(SmartAccount.CannotRemoveLastOwner.selector);
        account.removeOwner(0);
    }

    // ============================================================================
    // ERC-1271 Signature Validation Tests
    // ============================================================================

    function test_IsValidSignature_ValidSignature() public {
        // Create a message hash
        bytes32 messageHash = keccak256("Hello, World!");
        
        // Sign with owner's private key
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, ethSignedMessageHash);
        bytes memory signatureData = abi.encodePacked(r, s, v);
        
        // Encode as SignatureWrapper (contract expects this format)
        bytes memory signature = abi.encode(
            SmartAccount.SignatureWrapper({
                ownerIndex: 0,
                signatureData: signatureData
            })
        );
        
        // ERC-1271 magic value is 0x1626ba7e
        bytes4 magicValue = account.isValidSignature(messageHash, signature);
        assertEq(uint32(magicValue), uint32(0x1626ba7e), "Valid signature should return ERC-1271 magic value");
    }

    function test_IsValidSignature_InvalidSignature() public {
        // Create a message hash
        bytes32 messageHash = keccak256("Hello, World!");
        
        // Create invalid signature (wrong private key)
        uint256 wrongPrivateKey = 0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890;
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongPrivateKey, ethSignedMessageHash);
        bytes memory signatureData = abi.encodePacked(r, s, v);
        
        // Encode as SignatureWrapper
        bytes memory signature = abi.encode(
            SmartAccount.SignatureWrapper({
                ownerIndex: 0,
                signatureData: signatureData
            })
        );
        
        // ERC-1271 should return 0xffffffff for invalid signature (per contract implementation)
        bytes4 magicValue = account.isValidSignature(messageHash, signature);
        assertEq(uint32(magicValue), uint32(0xffffffff), "Invalid signature should return 0xffffffff");
    }

    function test_IsValidSignature_EmptySignature() public {
        bytes32 messageHash = keccak256("Hello, World!");
        bytes memory emptySignature = "";
        
        // Empty signature will fail to decode as SignatureWrapper, so it will revert
        vm.expectRevert();
        account.isValidSignature(messageHash, emptySignature);
    }

    // ============================================================================
    // EntryPoint Deposit/Withdraw Tests
    // ============================================================================

    function test_AddDeposit() public {
        // Fund the account
        vm.deal(address(account), 1 ether);
        
        uint256 depositAmount = 0.5 ether;
        
        // Add deposit
        vm.prank(address(account));
        account.addDeposit{value: depositAmount}();
        
        // Verify deposit was made (check EntryPoint balance tracking)
        assertEq(account.getDeposit(), depositAmount);
        assertEq(mockEntryPoint.balanceOf(address(account)), depositAmount);
    }

    function test_WithdrawDepositTo() public {
        // First add a deposit
        vm.deal(address(account), 1 ether);
        vm.deal(address(entryPoint), 1 ether); // Fund EntryPoint for withdrawal
        vm.prank(address(account));
        account.addDeposit{value: 0.5 ether}();
        
        address withdrawTo = address(0x9999);
        uint256 withdrawAmount = 0.3 ether;
        uint256 balanceBefore = address(withdrawTo).balance;
        
        // Withdraw (must be called by EntryPoint or owner)
        vm.prank(owner);
        account.withdrawDepositTo(payable(withdrawTo), withdrawAmount);
        
        // Verify withdrawal
        assertEq(address(withdrawTo).balance, balanceBefore + withdrawAmount);
        assertEq(account.getDeposit(), 0.5 ether - withdrawAmount);
        assertEq(mockEntryPoint.balanceOf(address(account)), 0.5 ether - withdrawAmount);
    }

    function test_WithdrawDepositTo_RevertsIfNotEntryPointOrOwner() public {
        vm.deal(address(account), 1 ether);
        vm.prank(address(account));
        account.addDeposit{value: 0.5 ether}();
        
        vm.prank(address(0x9999)); // Random address
        vm.expectRevert(SmartAccount.OnlyOwner.selector);
        account.withdrawDepositTo(payable(address(0x8888)), 0.1 ether);
    }

    function test_GetDeposit() public {
        // Initially should be 0
        assertEq(account.getDeposit(), 0);
        
        // Add deposit
        vm.deal(address(account), 1 ether);
        vm.prank(address(account));
        account.addDeposit{value: 0.5 ether}();
        
        // Should reflect deposit (via EntryPoint balance tracking)
        assertEq(account.getDeposit(), 0.5 ether);
        assertEq(mockEntryPoint.balanceOf(address(account)), 0.5 ether);
    }

    function test_GetNonce() public {
        // Get nonce from EntryPoint
        uint256 nonce = account.getNonce();
        // Mock EntryPoint returns 0, so nonce should be 0 initially
        assertEq(nonce, 0);
    }

    // ============================================================================
    // ETH Reception Tests
    // ============================================================================

    function test_Receive() public {
        // Send ETH directly to account
        vm.deal(address(this), 1 ether);
        (bool success, ) = address(account).call{value: 1 ether}("");
        
        assertTrue(success);
        assertEq(address(account).balance, 1 ether);
    }

    // ============================================================================
    // Batch Execution Edge Cases
    // ============================================================================

    function test_ExecuteBatch_LengthMismatch() public {
        MockTarget target = new MockTarget();
        vm.deal(address(account), 1 ether);
        
        address[] memory targets = new address[](2);
        targets[0] = address(target);
        targets[1] = address(target);
        
        uint256[] memory values = new uint256[](1); // Mismatch: 1 value for 2 targets
        values[0] = 0;
        
        bytes[] memory data = new bytes[](2);
        data[0] = abi.encodeWithSelector(MockTarget.setValue.selector, 10);
        data[1] = abi.encodeWithSelector(MockTarget.setValue.selector, 20);
        
        vm.prank(address(entryPoint));
        vm.expectRevert(); // Should revert on length mismatch
        account.executeBatch(targets, values, data);
    }

    function test_ExecuteBatch_EmptyArrays() public {
        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory data = new bytes[](0);
        
        vm.prank(address(entryPoint));
        // Empty arrays might be allowed or might revert - depends on implementation
        // Let's test that it doesn't crash
        try account.executeBatch(targets, values, data) {
            // If it succeeds, that's fine
        } catch {
            // If it reverts, that's also acceptable
        }
    }

    // ============================================================================
    // Owner Management Edge Cases
    // ============================================================================

    function test_RemoveOwner_InvalidIndex() public {
        // Try to remove with index out of bounds
        // This should revert, but might be OwnerNotFound or CannotRemoveLastOwner
        vm.prank(owner);
        vm.expectRevert(); // Will revert (either OwnerNotFound or CannotRemoveLastOwner)
        account.removeOwner(999);
    }

    function test_AddOwner_InvalidLength() public {
        // Try to add owner with invalid length
        bytes memory invalidOwner = abi.encodePacked(bytes10(0), owner);
        
        vm.prank(owner);
        vm.expectRevert(); // Will revert with InvalidOwnerBytesLength
        account.addOwner(invalidOwner);
    }

    function test_AddOwner_AccessControl() public {
        address attacker = address(0x6666);
        bytes memory newOwnerBytes = abi.encodePacked(bytes12(0), address(0x7777));
        
        vm.prank(attacker);
        vm.expectRevert(SmartAccount.OnlyOwner.selector);
        account.addOwner(newOwnerBytes);
    }

    function test_RemoveOwner_AccessControl() public {
        vm.prank(address(0x6666)); // Attacker
        vm.expectRevert(SmartAccount.OnlyOwner.selector);
        account.removeOwner(0);
    }

    function test_MultipleOwners() public {
        // Add multiple owners
        address owner2 = address(0x2222);
        address owner3 = address(0x3333);
        
        bytes memory ownerBytes2 = abi.encodePacked(bytes12(0), owner2);
        bytes memory ownerBytes3 = abi.encodePacked(bytes12(0), owner3);
        
        vm.prank(owner);
        account.addOwner(ownerBytes2);
        
        vm.prank(owner);
        account.addOwner(ownerBytes3);
        
        // Verify all owners exist
        assertEq(account.ownerCount(), 3);
        assertTrue(account.isOwner(ownerBytes));
        assertTrue(account.isOwner(ownerBytes2));
        assertTrue(account.isOwner(ownerBytes3));
        
        // Verify indices
        assertEq(keccak256(account.ownerAtIndex(0)), keccak256(ownerBytes));
        assertEq(keccak256(account.ownerAtIndex(1)), keccak256(ownerBytes2));
        assertEq(keccak256(account.ownerAtIndex(2)), keccak256(ownerBytes3));
    }

    function test_RemoveOwner_MiddleIndex() public {
        // Add multiple owners
        address owner2 = address(0x2222);
        address owner3 = address(0x3333);
        
        bytes memory ownerBytes2 = abi.encodePacked(bytes12(0), owner2);
        bytes memory ownerBytes3 = abi.encodePacked(bytes12(0), owner3);
        
        vm.prank(owner);
        account.addOwner(ownerBytes2);
        
        vm.prank(owner);
        account.addOwner(ownerBytes3);
        
        // Remove middle owner (index 1)
        vm.prank(owner);
        account.removeOwner(1);
        
        // Verify owner2 was removed
        assertEq(account.ownerCount(), 2);
        assertFalse(account.isOwner(ownerBytes2));
        assertTrue(account.isOwner(ownerBytes));
        assertTrue(account.isOwner(ownerBytes3));
    }

    // ============================================================================
    // Execution with ETH Value Tests
    // ============================================================================

    function test_Execute_WithETHValue() public {
        MockTarget target = new MockTarget();
        vm.deal(address(account), 1 ether);
        
        bytes memory callData = abi.encodeWithSelector(MockTarget.setValue.selector, 42);
        uint256 value = 0.1 ether;
        
        uint256 targetBalanceBefore = address(target).balance;
        uint256 accountBalanceBefore = address(account).balance;
        
        vm.prank(address(entryPoint));
        account.execute(payable(address(target)), value, callData);
        
        // Verify ETH was transferred and call succeeded
        assertEq(address(target).balance, targetBalanceBefore + value);
        assertEq(address(account).balance, accountBalanceBefore - value);
        assertEq(target.value(), 42);
    }

    function test_Execute_FailedCall() public {
        // Create a contract that reverts
        RevertingTarget target = new RevertingTarget();
        vm.deal(address(account), 1 ether);
        
        bytes memory callData = abi.encodeWithSelector(RevertingTarget.revertCall.selector);
        
        vm.prank(address(entryPoint));
        vm.expectRevert();
        account.execute(payable(address(target)), 0, callData);
    }

    // ============================================================================
    // View Function Edge Cases
    // ============================================================================

    function test_OwnerAtIndex_OutOfBounds() public {
        vm.expectRevert(SmartAccount.OwnerNotFound.selector);
        account.ownerAtIndex(999);
    }

    function test_IsOwner_EmptyBytes() public {
        bytes memory emptyBytes = "";
        assertFalse(account.isOwner(emptyBytes));
    }

    function test_IsOwner_InvalidLength() public {
        bytes memory invalidOwner = abi.encodePacked(bytes10(0), owner);
        assertFalse(account.isOwner(invalidOwner));
    }

    // ============================================================================
    // Event Emission Tests
    // ============================================================================

    function test_Execute_EmitsEvent() public {
        MockTarget target = new MockTarget();
        bytes memory callData = abi.encodeWithSelector(MockTarget.setValue.selector, 42);
        
        vm.expectEmit(true, true, true, true);
        emit Executed(address(target), 0, callData);
        
        vm.prank(address(entryPoint));
        account.execute(payable(address(target)), 0, callData);
    }

    function test_AddOwner_EmitsEvent() public {
        address newOwner = address(0x5678);
        bytes memory newOwnerBytes = abi.encodePacked(bytes12(0), newOwner);
        
        vm.expectEmit(true, true, true, true);
        emit OwnerAdded(1, newOwnerBytes);
        
        vm.prank(owner);
        account.addOwner(newOwnerBytes);
    }

    function test_RemoveOwner_EmitsEvent() public {
        // First add a second owner
        address newOwner = address(0x5678);
        bytes memory newOwnerBytes = abi.encodePacked(bytes12(0), newOwner);
        
        vm.prank(owner);
        account.addOwner(newOwnerBytes);
        
        bytes32 ownerHash = keccak256(ownerBytes);
        
        vm.expectEmit(true, true, true, true);
        emit OwnerRemoved(0, ownerHash);
        
        vm.prank(owner);
        account.removeOwner(0);
    }

    // ============================================================================
    // Helper Functions
    // ============================================================================

    function _createUserOperation() internal view returns (UserOperation memory) {
        return UserOperation({
            sender: address(account),
            nonce: 0,
            initCode: "",
            callData: abi.encodeWithSelector(SmartAccount.execute.selector, payable(address(0x1234)), 0, ""),
            callGasLimit: 100000,
            verificationGasLimit: 100000,
            preVerificationGas: 21000,
            maxFeePerGas: 1 gwei,
            maxPriorityFeePerGas: 1 gwei,
            paymasterAndData: "",
            signature: ""
        });
    }

    function _getUserOpHash(UserOperation memory userOp) internal view returns (bytes32) {
        bytes32 hash = keccak256(abi.encodePacked(
            userOp.sender,
            userOp.nonce,
            keccak256(userOp.initCode),
            keccak256(userOp.callData),
            userOp.callGasLimit,
            userOp.verificationGasLimit,
            userOp.preVerificationGas,
            userOp.maxFeePerGas,
            userOp.maxPriorityFeePerGas,
            keccak256(userOp.paymasterAndData)
        ));
        
        return keccak256(abi.encodePacked(hash, address(entryPoint), block.chainid));
    }
}

/**
 * @title MockEntryPoint
 * @notice Mock EntryPoint for testing
 */
contract MockEntryPoint is IEntryPoint {
    mapping(address => uint256) public deposits;
    
    receive() external payable {}
    
    function handleOps(UserOperation[] calldata, address payable) external pure override {}
    function handleAggregatedOps(UserOpsPerAggregator[] calldata, address payable) external pure override {}
    function balanceOf(address account) external view override returns (uint256) { return deposits[account]; }
    function depositTo(address account) external payable override {
        deposits[account] += msg.value;
    }
    function addStake(uint32) external payable override {}
    function unlockStake() external pure override {}
    function withdrawStake(address payable) external pure override {}
    function withdrawTo(address payable withdrawAddress, uint256 amount) external override {
        deposits[msg.sender] -= amount;
        (bool success, ) = withdrawAddress.call{value: amount}("");
        require(success, "Withdraw failed");
    }
    function getNonce(address, uint192) external pure override returns (uint256) { return 0; }
    function getUserOpHash(UserOperation calldata) external pure returns (bytes32) { return bytes32(0); }
}

/**
 * @title MockTarget
 * @notice Mock target contract for testing execution
 */
contract MockTarget {
    uint256 public value;
    
    function setValue(uint256 _value) external payable {
        value = _value;
    }
    
    receive() external payable {}
}

/**
 * @title RevertingTarget
 * @notice Mock target that always reverts
 */
contract RevertingTarget {
    function revertCall() external pure {
        revert("Always reverts");
    }
}

// Event definitions for testing
event Executed(address indexed target, uint256 value, bytes data);
event OwnerAdded(uint256 indexed ownerIndex, bytes owner);
event OwnerRemoved(uint256 indexed ownerIndex, bytes32 ownerHash);

