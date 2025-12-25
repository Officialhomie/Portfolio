// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/ProjectVoting.sol";
import "../contracts/Homie.sol";

/**
 * @title ProjectVotingBalanceTest
 * @notice Comprehensive tests for ProjectVoting balance checks and vote status
 * Tests voting with registered/unregistered wallets and vote status consistency
 */
contract ProjectVotingBalanceTest is Test {
    ProjectVoting public voting;
    PortfolioToken public token;

    address public alice = address(0x1);
    address public bob = address(0x2);
    address public smartWalletAlice = address(0x1001);
    address public smartWalletBob = address(0x1002);

    string public constant PROJECT_ID = "test-project";

    event VoteCast(address indexed voter, string indexed projectId, uint256 timestamp, uint256 tokensBurned);
    event WalletRegistered(address indexed walletAddress, address indexed userAddress);

    function setUp() public {
        token = new PortfolioToken();
        voting = new ProjectVoting(address(token), address(0));

        // Mint tokens to EOAs (this contract is the deployer and has MINTER_ROLE)
        token.mint(alice, 1000 * 10**18);
        token.mint(bob, 1000 * 10**18);

        // Users approve voting contract to burn their tokens
        vm.prank(alice);
        token.approve(address(voting), type(uint256).max);
        vm.prank(bob);
        token.approve(address(voting), type(uint256).max);
    }

    /*//////////////////////////////////////////////////////////////
            VOTING WITH REGISTERED WALLET TESTS
    //////////////////////////////////////////////////////////////*/

    function testVotingWithRegisteredWallet() public {
        // Register wallet in both contracts
        vm.prank(smartWalletAlice);
        token.registerWallet(smartWalletAlice, alice);
        vm.prank(smartWalletAlice);
        voting.registerWallet(smartWalletAlice, alice);

        // Mint tokens to EOA via registered wallet
        vm.prank(smartWalletAlice);
        token.claimFaucet();

        uint256 aliceBalanceBefore = token.balanceOf(alice);
        assertEq(aliceBalanceBefore, 1100 * 10**18, "Alice should have 1000 (from setUp) + 100 (from claim)");

        // Alice approves voting contract to burn her tokens
        token.approve(address(voting), type(uint256).max);

        // Vote via smart wallet
        vm.prank(smartWalletAlice);
        voting.vote(PROJECT_ID);

        uint256 aliceBalanceAfter = token.balanceOf(alice);
        uint256 smartWalletBalance = token.balanceOf(smartWalletAlice);

        // Tokens burned from EOA
        assertEq(aliceBalanceBefore - aliceBalanceAfter, 10 * 10**18, "10 tokens should be burned from EOA");
        assertEq(smartWalletBalance, 0, "Smart wallet should have 0 tokens");

        // Vote status stored by EOA
        assertTrue(voting.hasVoted(alice, PROJECT_ID), "Vote should be recorded for EOA");
        assertFalse(voting.hasVoted(smartWalletAlice, PROJECT_ID), "Vote should not be recorded for smart wallet");
    }

    function testVoteStatusConsistencyWithRegisteredWallet() public {
        // Register and setup
        vm.prank(smartWalletAlice);
        token.registerWallet(smartWalletAlice, alice);
        vm.prank(smartWalletAlice);
        voting.registerWallet(smartWalletAlice, alice);
        vm.prank(smartWalletAlice);
        token.claimFaucet();

        // Vote
        vm.prank(alice);
        token.approve(address(voting), type(uint256).max);

        vm.prank(smartWalletAlice);
        voting.vote(PROJECT_ID);

        // Check vote status - should be stored by EOA
        assertTrue(voting.checkVote(alice, PROJECT_ID), "checkVote should return true for EOA");
        assertFalse(voting.checkVote(smartWalletAlice, PROJECT_ID), "checkVote should return false for smart wallet");
        assertTrue(voting.hasVoted(alice, PROJECT_ID), "hasVoted should return true for EOA");
        assertFalse(voting.hasVoted(smartWalletAlice, PROJECT_ID), "hasVoted should return false for smart wallet");
    }

    /*//////////////////////////////////////////////////////////////
          VOTING WITH UNREGISTERED WALLET TESTS
    //////////////////////////////////////////////////////////////*/

    function testVotingWithUnregisteredWalletFails() public {
        // Mint tokens to EOA (not via smart wallet)
        vm.prank(alice);
        token.claimFaucet();

        uint256 aliceBalance = token.balanceOf(alice);
        assertEq(aliceBalance, 1100 * 10**18, "Alice should have 1000 (from setUp) + 100 (from claim)");

        // Try to vote via unregistered smart wallet
        // Should fail because voting contract checks smart wallet balance (0)
        vm.prank(smartWalletAlice);
        token.approve(address(voting), type(uint256).max);

        vm.prank(smartWalletAlice);
        vm.expectRevert("Insufficient tokens");
        voting.vote(PROJECT_ID);
    }

    function testVotingWithPartialRegistration() public {
        // Register only in PortfolioToken
        vm.prank(smartWalletAlice);
        token.registerWallet(smartWalletAlice, alice);

        // Mint tokens to EOA
        vm.prank(smartWalletAlice);
        token.claimFaucet();

        uint256 aliceBalance = token.balanceOf(alice);
        assertEq(aliceBalance, 1100 * 10**18, "Alice should have 1000 (from setUp) + 100 (from claim)");

        // Try to vote - should fail (not registered in ProjectVoting)
        vm.prank(alice);
        token.approve(address(voting), type(uint256).max);

        vm.prank(smartWalletAlice);
        vm.expectRevert("Insufficient tokens");
        voting.vote(PROJECT_ID);

        // Register in ProjectVoting
        vm.prank(smartWalletAlice);
        voting.registerWallet(smartWalletAlice, alice);

        // Now vote should succeed
        vm.prank(alice);
        token.approve(address(voting), type(uint256).max);

        vm.prank(smartWalletAlice);
        voting.vote(PROJECT_ID);

        uint256 aliceBalanceAfter = token.balanceOf(alice);
        assertEq(aliceBalance - aliceBalanceAfter, 10 * 10**18, "10 tokens should be burned");
    }

    /*//////////////////////////////////////////////////////////////
                    VOTE STATUS CONSISTENCY TESTS
    //////////////////////////////////////////////////////////////*/

    function testVoteStatusStoredByEOAWhenRegistered() public {
        // Register in both contracts
        vm.prank(smartWalletAlice);
        token.registerWallet(smartWalletAlice, alice);
        vm.prank(smartWalletAlice);
        voting.registerWallet(smartWalletAlice, alice);
        vm.prank(smartWalletAlice);
        token.claimFaucet();

        // Vote via smart wallet
        vm.prank(alice);
        token.approve(address(voting), type(uint256).max);

        vm.prank(smartWalletAlice);
        voting.vote(PROJECT_ID);

        // Verify vote status is stored by EOA address
        assertTrue(voting.hasVoted(alice, PROJECT_ID), "Vote stored by EOA");
        assertFalse(voting.hasVoted(smartWalletAlice, PROJECT_ID), "Vote not stored by smart wallet");
        assertEq(voting.totalVotesByAddress(alice), 1, "Total votes for EOA should be 1");
        assertEq(voting.totalVotesByAddress(smartWalletAlice), 0, "Total votes for smart wallet should be 0");
    }

    function testVoteStatusStoredBySmartWalletWhenUnregistered() public {
        // Mint tokens directly to smart wallet (unregistered)
        vm.prank(smartWalletAlice);
        token.claimFaucet();

        uint256 smartWalletBalance = token.balanceOf(smartWalletAlice);
        assertEq(smartWalletBalance, 100 * 10**18, "Smart wallet should have tokens");

        // Vote via unregistered smart wallet - approve from smart wallet itself
        vm.prank(smartWalletAlice);
        token.approve(address(voting), type(uint256).max);

        vm.prank(smartWalletAlice);
        voting.vote(PROJECT_ID);

        // Vote status stored by smart wallet address (not EOA)
        assertFalse(voting.hasVoted(alice, PROJECT_ID), "Vote not stored by EOA");
        assertTrue(voting.hasVoted(smartWalletAlice, PROJECT_ID), "Vote stored by smart wallet");
    }

    /*//////////////////////////////////////////////////////////////
            CROSS-CONTRACT REGISTRATION INDEPENDENCE TESTS
    //////////////////////////////////////////////////////////////*/

    function testCrossContractRegistrationIndependence() public {
        // Register in PortfolioToken only
        vm.prank(smartWalletAlice);
        token.registerWallet(smartWalletAlice, alice);

        // Check ProjectVoting registration is still empty
        address votingRegistered = voting.walletToUser(smartWalletAlice);
        assertEq(votingRegistered, address(0), "ProjectVoting should not have registration");

        // Register in ProjectVoting
        vm.prank(smartWalletAlice);
        voting.registerWallet(smartWalletAlice, alice);

        // Both should now be registered
        address tokenRegistered = token.walletToUser(smartWalletAlice);
        votingRegistered = voting.walletToUser(smartWalletAlice);
        assertEq(tokenRegistered, alice, "PortfolioToken should be registered");
        assertEq(votingRegistered, alice, "ProjectVoting should be registered");
    }

    function testDifferentRegistrationsInDifferentContracts() public {
        // Register smart wallet to Alice in PortfolioToken
        vm.prank(smartWalletAlice);
        token.registerWallet(smartWalletAlice, alice);

        // Register same smart wallet to Bob in ProjectVoting (should fail - already registered)
        // Actually, let's test with a different smart wallet
        vm.prank(smartWalletBob);
        token.registerWallet(smartWalletBob, bob);
        vm.prank(smartWalletBob);
        voting.registerWallet(smartWalletBob, bob);

        // Verify independent registrations
        assertEq(token.walletToUser(smartWalletAlice), alice, "Alice registered in PortfolioToken");
        assertEq(token.walletToUser(smartWalletBob), bob, "Bob registered in PortfolioToken");
        assertEq(voting.walletToUser(smartWalletBob), bob, "Bob registered in ProjectVoting");
    }

    /*//////////////////////////////////////////////////////////////
                    BALANCE CHECK ACCURACY TESTS
    //////////////////////////////////////////////////////////////*/

    function testBalanceCheckUsesEOAWhenRegistered() public {
        // Register wallet
        vm.prank(smartWalletAlice);
        token.registerWallet(smartWalletAlice, alice);
        vm.prank(smartWalletAlice);
        voting.registerWallet(smartWalletAlice, alice);

        // Mint tokens to EOA
        vm.prank(smartWalletAlice);
        token.claimFaucet();

        uint256 eoaBalance = token.balanceOf(alice);
        uint256 smartWalletBalance = token.balanceOf(smartWalletAlice);

        assertEq(eoaBalance, 1100 * 10**18, "EOA should have 1000 (from setUp) + 100 (from claim)");
        assertEq(smartWalletBalance, 0, "Smart wallet should have 0 tokens");

        // Vote should succeed (checks EOA balance)
        vm.prank(alice);
        token.approve(address(voting), type(uint256).max);

        vm.prank(smartWalletAlice);
        voting.vote(PROJECT_ID);

        // Verify tokens burned from EOA
        uint256 eoaBalanceAfter = token.balanceOf(alice);
        assertEq(eoaBalance - eoaBalanceAfter, 10 * 10**18, "Tokens burned from EOA");
    }

    function testBalanceCheckUsesSmartWalletWhenUnregistered() public {
        // Mint tokens to smart wallet (unregistered)
        vm.prank(smartWalletAlice);
        token.claimFaucet();

        uint256 smartWalletBalance = token.balanceOf(smartWalletAlice);
        assertEq(smartWalletBalance, 100 * 10**18, "Smart wallet should have tokens");

        // Vote should succeed (checks smart wallet balance) - approve from smart wallet
        vm.prank(smartWalletAlice);
        token.approve(address(voting), type(uint256).max);

        vm.prank(smartWalletAlice);
        voting.vote(PROJECT_ID);

        // Verify tokens burned from smart wallet
        uint256 smartWalletBalanceAfter = token.balanceOf(smartWalletAlice);
        assertEq(smartWalletBalance - smartWalletBalanceAfter, 10 * 10**18, "Tokens burned from smart wallet");
    }
}


