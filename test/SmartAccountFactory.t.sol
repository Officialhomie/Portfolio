// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/SmartAccount.sol";
import "../contracts/SmartAccountFactory.sol";
import "../contracts/interfaces/IEntryPoint.sol";
import "@openzeppelin/contracts/utils/Create2.sol";

/**
 * @title SmartAccountFactoryTest
 * @notice Comprehensive tests for SmartAccountFactory contract
 */
contract SmartAccountFactoryTest is Test {
    SmartAccountFactory public factory;
    IEntryPoint public entryPoint;
    MockEntryPoint public mockEntryPoint;
    
    address public owner;
    bytes public ownerBytes; // 32 bytes padded address

    function setUp() public {
        // Create mock EntryPoint
        mockEntryPoint = new MockEntryPoint();
        entryPoint = IEntryPoint(address(mockEntryPoint));
        
        // Deploy factory
        factory = new SmartAccountFactory(entryPoint);
        
        // Create test owner
        owner = address(0x1234567890123456789012345678901234567890);
        ownerBytes = abi.encodePacked(bytes12(0), owner);
        require(ownerBytes.length == 32, "Owner bytes must be 32 bytes");
    }

    // ============================================================================
    // Deployment Tests
    // ============================================================================

    function test_CreateAccount_DeploysNewAccount() public {
        // Deploy account
        SmartAccount account = factory.createAccount(ownerBytes, 0);
        
        // Verify account is deployed
        assertTrue(address(account) != address(0));
        assertTrue(address(account).code.length > 0);
        
        // Verify owner was initialized
        assertEq(account.ownerCount(), 1);
        assertTrue(account.isOwner(ownerBytes));
        assertEq(account.ownerAtIndex(0), ownerBytes);
    }

    function test_CreateAccount_DeterministicAddress() public {
        // Get expected address
        address expectedAddress = factory.getAddress(ownerBytes, 0);
        
        // Deploy account
        SmartAccount account = factory.createAccount(ownerBytes, 0);
        
        // Verify address matches
        assertEq(address(account), expectedAddress);
    }

    function test_CreateAccount_ReturnsExistingAccount() public {
        // Deploy account first time
        SmartAccount account1 = factory.createAccount(ownerBytes, 0);
        address accountAddress = address(account1);
        
        // Deploy again with same parameters
        SmartAccount account2 = factory.createAccount(ownerBytes, 0);
        
        // Should return the same account
        assertEq(address(account1), address(account2));
        assertEq(accountAddress, address(account2));
    }

    function test_CreateAccount_DifferentSalts_DifferentAddresses() public {
        // Deploy with salt 0
        SmartAccount account1 = factory.createAccount(ownerBytes, 0);
        
        // Deploy with salt 1
        SmartAccount account2 = factory.createAccount(ownerBytes, 1);
        
        // Addresses should be different
        assertTrue(address(account1) != address(account2));
    }

    function test_CreateAccount_DifferentOwners_DifferentAddresses() public {
        // Deploy with first owner
        SmartAccount account1 = factory.createAccount(ownerBytes, 0);
        
        // Deploy with different owner
        address owner2 = address(0x9876543210987654321098765432109876543210);
        bytes memory ownerBytes2 = abi.encodePacked(bytes12(0), owner2);
        SmartAccount account2 = factory.createAccount(ownerBytes2, 0);
        
        // Addresses should be different
        assertTrue(address(account1) != address(account2));
    }

    function test_CreateAccount_RevertsIfInvalidOwnerLength() public {
        // Try with invalid owner length (not 32 bytes)
        bytes memory invalidOwner = abi.encodePacked(bytes10(0), owner);
        
        vm.expectRevert("Invalid owner length: must be 32 bytes for EOA");
        factory.createAccount(invalidOwner, 0);
    }

    // ============================================================================
    // Address Computation Tests
    // ============================================================================

    function test_GetAddress_MatchesDeployedAddress() public {
        // Compute address before deployment
        address computedAddress = factory.getAddress(ownerBytes, 0);
        
        // Deploy account
        SmartAccount account = factory.createAccount(ownerBytes, 0);
        
        // Verify addresses match
        assertEq(address(account), computedAddress);
    }

    function test_GetAddress_ConsistentForSameInputs() public {
        // Compute address multiple times
        address addr1 = factory.getAddress(ownerBytes, 0);
        address addr2 = factory.getAddress(ownerBytes, 0);
        address addr3 = factory.getAddress(ownerBytes, 0);
        
        // All should be the same
        assertEq(addr1, addr2);
        assertEq(addr2, addr3);
    }

    function test_GetAddress_DifferentForDifferentSalts() public {
        address addr1 = factory.getAddress(ownerBytes, 0);
        address addr2 = factory.getAddress(ownerBytes, 1);
        address addr3 = factory.getAddress(ownerBytes, 2);
        
        // All should be different
        assertTrue(addr1 != addr2);
        assertTrue(addr2 != addr3);
        assertTrue(addr1 != addr3);
    }

    function test_GetAddress_RevertsIfInvalidOwnerLength() public {
        bytes memory invalidOwner = abi.encodePacked(bytes10(0), owner);
        
        vm.expectRevert("Invalid owner length: must be 32 bytes for EOA");
        factory.getAddress(invalidOwner, 0);
    }

    // ============================================================================
    // Event Tests
    // ============================================================================

    function test_CreateAccount_EmitsAccountCreated() public {
        // Deploy account and check event
        vm.recordLogs();
        SmartAccount account = factory.createAccount(ownerBytes, 0);
        Vm.Log[] memory logs = vm.getRecordedLogs();
        
        // Check that AccountCreated event was emitted
        assertGt(logs.length, 0);
        
        // Verify event data
        bytes32 accountCreatedTopic = keccak256("AccountCreated(address,bytes,uint256)");
        bool found = false;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == accountCreatedTopic) {
                found = true;
                // Verify account address is in topics
                assertEq(logs[i].topics[1], bytes32(uint256(uint160(address(account)))));
                break;
            }
        }
        assertTrue(found, "AccountCreated event should be emitted");
    }

    // ============================================================================
    // Implementation Tests
    // ============================================================================

    function test_AccountImplementation_IsSet() public {
        SmartAccount implementation = factory.accountImplementation();
        assertTrue(address(implementation) != address(0));
    }

    function test_EntryPoint_IsSet() public {
        IEntryPoint factoryEntryPoint = factory.entryPoint();
        assertEq(address(factoryEntryPoint), address(entryPoint));
    }

    // ============================================================================
    // Integration Tests
    // ============================================================================

    function test_FullFlow_DeployAndExecute() public {
        // Deploy account
        SmartAccount account = factory.createAccount(ownerBytes, 0);
        
        // Create mock target
        MockTarget target = new MockTarget();
        
        // Fund the account
        vm.deal(address(account), 1 ether);
        
        // Execute a call
        bytes memory callData = abi.encodeWithSelector(MockTarget.setValue.selector, 100);
        
        vm.prank(address(entryPoint));
        account.execute(payable(address(target)), 0, callData);
        
        // Verify execution
        assertEq(target.value(), 100);
    }

    function test_MultipleAccounts_SameFactory() public {
        // Deploy multiple accounts
        address owner1 = address(0x1111);
        address owner2 = address(0x2222);
        address owner3 = address(0x3333);
        
        bytes memory ownerBytes1 = abi.encodePacked(bytes12(0), owner1);
        bytes memory ownerBytes2 = abi.encodePacked(bytes12(0), owner2);
        bytes memory ownerBytes3 = abi.encodePacked(bytes12(0), owner3);
        
        SmartAccount account1 = factory.createAccount(ownerBytes1, 0);
        SmartAccount account2 = factory.createAccount(ownerBytes2, 0);
        SmartAccount account3 = factory.createAccount(ownerBytes3, 0);
        
        // All should be different addresses
        assertTrue(address(account1) != address(account2));
        assertTrue(address(account2) != address(account3));
        assertTrue(address(account1) != address(account3));
        
        // All should have correct owners
        assertTrue(account1.isOwner(ownerBytes1));
        assertTrue(account2.isOwner(ownerBytes2));
        assertTrue(account3.isOwner(ownerBytes3));
    }

    // ============================================================================
    // Factory Stake Tests
    // ============================================================================

    function test_AddStake() public {
        vm.deal(address(this), 1 ether);
        
        uint32 unstakeDelay = 86400; // 1 day
        uint256 stakeAmount = 0.5 ether;
        
        uint256 entryPointBalanceBefore = address(entryPoint).balance;
        
        factory.addStake{value: stakeAmount}(unstakeDelay);
        
        // Verify stake was added to EntryPoint
        assertEq(address(entryPoint).balance, entryPointBalanceBefore + stakeAmount);
    }

    function test_AddStake_ZeroAmount() public {
        uint32 unstakeDelay = 86400;
        
        // Should not revert, but EntryPoint balance should not change
        uint256 balanceBefore = address(entryPoint).balance;
        factory.addStake{value: 0}(unstakeDelay);
        assertEq(address(entryPoint).balance, balanceBefore);
    }

    // ============================================================================
    // Edge Cases
    // ============================================================================

    function test_GetAddress_VeryLargeSalt() public {
        uint256 largeSalt = type(uint256).max;
        address addr = factory.getAddress(ownerBytes, largeSalt);
        
        // Should still compute a valid address
        assertTrue(addr != address(0));
        
        // Should be deterministic
        address addr2 = factory.getAddress(ownerBytes, largeSalt);
        assertEq(addr, addr2);
    }

    function test_CreateAccount_VeryLargeSalt() public {
        uint256 largeSalt = type(uint256).max;
        
        SmartAccount account = factory.createAccount(ownerBytes, largeSalt);
        address expectedAddr = factory.getAddress(ownerBytes, largeSalt);
        
        assertEq(address(account), expectedAddr);
    }

    function test_CreateAccount_SameOwnerMultipleSalts() public {
        // Same owner, different salts should produce different addresses
        SmartAccount account1 = factory.createAccount(ownerBytes, 0);
        SmartAccount account2 = factory.createAccount(ownerBytes, 1);
        SmartAccount account3 = factory.createAccount(ownerBytes, 2);
        
        assertTrue(address(account1) != address(account2));
        assertTrue(address(account2) != address(account3));
        assertTrue(address(account1) != address(account3));
        
        // But all should have the same owner
        assertTrue(account1.isOwner(ownerBytes));
        assertTrue(account2.isOwner(ownerBytes));
        assertTrue(account3.isOwner(ownerBytes));
    }
}

/**
 * @title MockEntryPoint
 * @notice Mock EntryPoint for testing
 */
contract MockEntryPoint is IEntryPoint {
    receive() external payable {}
    
    function handleOps(UserOperation[] calldata, address payable) external pure override {}
    function handleAggregatedOps(UserOpsPerAggregator[] calldata, address payable) external pure override {}
    function balanceOf(address) external pure override returns (uint256) { return 0; }
    function depositTo(address) external payable override {}
    function addStake(uint32) external payable override {}
    function unlockStake() external pure override {}
    function withdrawStake(address payable) external pure override {}
    function withdrawTo(address payable, uint256) external pure override {}
    function getNonce(address, uint192) external pure override returns (uint256) { return 0; }
    function getUserOpHash(UserOperation calldata) external pure returns (bytes32) { return bytes32(0); }
}

/**
 * @title MockTarget
 * @notice Mock target contract for testing execution
 */
contract MockTarget {
    uint256 public value;
    
    function setValue(uint256 _value) external {
        value = _value;
    }
}

// Event definition for testing
event AccountCreated(address indexed account, bytes indexed owner, uint256 salt);

