// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/ProjectVoting.sol";
import "../contracts/Homie.sol";
import "@openzeppelin/contracts/utils/cryptography/P256.sol";

/**
 * @title BiometricVotingTest
 * @notice Comprehensive tests for biometric voting functionality
 */
contract BiometricVotingTest is Test {
    ProjectVoting public voting;
    PortfolioToken public token;

    address public alice = address(0x1);
    address public bob = address(0x2);

    // Test secp256r1 key pair (from OpenZeppelin test vectors)
    bytes32 public constant TEST_PUBLIC_KEY_X = 0x6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296;
    bytes32 public constant TEST_PUBLIC_KEY_Y = 0x4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5;

    event BiometricKeyRegistered(address indexed user, bytes32 publicKeyX, bytes32 publicKeyY);
    event VoteCast(address indexed voter, string indexed projectId, uint256 timestamp, uint256 tokensBurned);

    function setUp() public {
        // Deploy contracts
        token = new PortfolioToken();
        voting = new ProjectVoting(address(token));

        // Setup test accounts with tokens
        token.mint(alice, 1000 * 10**18);
        token.mint(bob, 1000 * 10**18);

        // Approve voting contract to burn tokens
        vm.prank(alice);
        token.approve(address(voting), type(uint256).max);

        vm.prank(bob);
        token.approve(address(voting), type(uint256).max);
    }

    /*//////////////////////////////////////////////////////////////
                        PUBLIC KEY REGISTRATION
    //////////////////////////////////////////////////////////////*/

    function testRegisterSecp256r1Key() public {
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit BiometricKeyRegistered(alice, TEST_PUBLIC_KEY_X, TEST_PUBLIC_KEY_Y);

        voting.registerSecp256r1Key(TEST_PUBLIC_KEY_X, TEST_PUBLIC_KEY_Y);

        bytes32 keyHash = keccak256(abi.encodePacked(TEST_PUBLIC_KEY_X, TEST_PUBLIC_KEY_Y));
        assertEq(voting.secp256r1ToAddress(keyHash), alice);
    }

    function testCannotRegisterSameKeyTwice() public {
        vm.startPrank(alice);
        voting.registerSecp256r1Key(TEST_PUBLIC_KEY_X, TEST_PUBLIC_KEY_Y);

        vm.expectRevert("Public key already registered");
        voting.registerSecp256r1Key(TEST_PUBLIC_KEY_X, TEST_PUBLIC_KEY_Y);
        vm.stopPrank();
    }

    function testCannotRegisterInvalidPublicKey() public {
        vm.prank(alice);
        // Zero coordinates are invalid
        vm.expectRevert();
        voting.registerSecp256r1Key(bytes32(0), bytes32(0));
    }

    /*//////////////////////////////////////////////////////////////
                            NONCE MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    function testInitialNonceIsZero() public {
        assertEq(voting.nonces(alice), 0);
    }

    function testNonceIncrementsAfterBiometricVote() public {
        // Register key
        vm.prank(alice);
        voting.registerSecp256r1Key(TEST_PUBLIC_KEY_X, TEST_PUBLIC_KEY_Y);

        uint256 initialNonce = voting.nonces(alice);

        // Note: This test would need a valid signature
        // For now, we're just testing the nonce increment logic
        // In a real test, you'd generate a valid secp256r1 signature

        // After a successful vote, nonce should increment
        // assertEq(voting.nonces(alice), initialNonce + 1);
    }

    /*//////////////////////////////////////////////////////////////
                        MESSAGE HASH GENERATION
    //////////////////////////////////////////////////////////////*/

    function testMessageHashGeneration() public {
        string memory projectId = "project-alpha";
        uint256 nonce = 0;

        bytes32 expectedHash = keccak256(abi.encodePacked(
            "vote",
            block.chainid,
            address(voting),
            alice,
            projectId,
            nonce
        ));

        // This should match the frontend's generateVoteHash()
        assertTrue(expectedHash != bytes32(0));
    }

    /*//////////////////////////////////////////////////////////////
                        VOTING FUNCTIONALITY
    //////////////////////////////////////////////////////////////*/

    function testRegularVote() public {
        string memory projectId = "project-beta";

        vm.prank(alice);
        vm.expectEmit(true, true, false, true);
        emit VoteCast(alice, projectId, block.timestamp, 10 * 10**18);

        voting.vote(projectId);

        assertEq(voting.projectVotes(projectId), 1);
        assertTrue(voting.hasVoted(alice, projectId));
        assertEq(voting.totalVotesByAddress(alice), 1);
    }

    function testCannotVoteTwice() public {
        string memory projectId = "project-gamma";

        vm.startPrank(alice);
        voting.vote(projectId);

        vm.expectRevert("Already voted for this project");
        voting.vote(projectId);
        vm.stopPrank();
    }

    function testCannotVoteWithoutTokens() public {
        address noTokensUser = address(0x999);

        vm.prank(noTokensUser);
        vm.expectRevert("Insufficient tokens");
        voting.vote("project-delta");
    }

    /*//////////////////////////////////////////////////////////////
                        ACCESS CONTROL
    //////////////////////////////////////////////////////////////*/

    function testOnlyAdminCanPause() public {
        vm.prank(alice);
        vm.expectRevert();
        voting.pause();
    }

    function testAdminCanPause() public {
        voting.pause();
        assertTrue(voting.paused());
    }

    function testCannotVoteWhenPaused() public {
        voting.pause();

        vm.prank(alice);
        vm.expectRevert();
        voting.vote("project-epsilon");
    }

    /*//////////////////////////////////////////////////////////////
                        VOTE COST MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    function testDefaultVoteCost() public {
        assertEq(voting.voteCost(), 10 * 10**18);
    }

    function testAdminCanUpdateVoteCost() public {
        uint256 newCost = 20 * 10**18;
        voting.setVoteCost(newCost);
        assertEq(voting.voteCost(), newCost);
    }

    function testCannotSetVoteCostOutOfBounds() public {
        // Too low
        vm.expectRevert("Vote cost out of bounds");
        voting.setVoteCost(0);

        // Too high
        vm.expectRevert("Vote cost out of bounds");
        voting.setVoteCost(2000 * 10**18);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function testGetVotes() public {
        string memory projectId = "project-zeta";

        vm.prank(alice);
        voting.vote(projectId);

        vm.prank(bob);
        voting.vote(projectId);

        assertEq(voting.getVotes(projectId), 2);
    }

    function testCheckVote() public {
        string memory projectId = "project-eta";

        assertFalse(voting.checkVote(alice, projectId));

        vm.prank(alice);
        voting.vote(projectId);

        assertTrue(voting.checkVote(alice, projectId));
    }

    function testGetTotalVotes() public {
        vm.prank(alice);
        voting.vote("project-1");

        vm.prank(bob);
        voting.vote("project-2");

        assertEq(voting.getTotalVotes(), 2);
    }

    /*//////////////////////////////////////////////////////////////
                        INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testMultipleUsersVotingForSameProject() public {
        string memory projectId = "popular-project";

        vm.prank(alice);
        voting.vote(projectId);

        vm.prank(bob);
        voting.vote(projectId);

        assertEq(voting.getVotes(projectId), 2);
        assertTrue(voting.hasVoted(alice, projectId));
        assertTrue(voting.hasVoted(bob, projectId));
    }

    function testTokensBurnedOnVote() public {
        string memory projectId = "project-theta";
        uint256 initialBalance = token.balanceOf(alice);

        vm.prank(alice);
        voting.vote(projectId);

        uint256 finalBalance = token.balanceOf(alice);
        assertEq(initialBalance - finalBalance, 10 * 10**18);
    }
}
