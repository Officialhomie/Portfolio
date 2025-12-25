// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/ProjectVoting.sol";
import "../contracts/Homie.sol";

/**
 * @title BalanceIntegrationTest
 * @notice Integration tests for full balance flow with smart wallets
 * Tests end-to-end scenarios including registration, minting, and voting
 */
contract BalanceIntegrationTest is Test {
    ProjectVoting public voting;
    PortfolioToken public token;

    address public alice = address(0x1);
    address public bob = address(0x2);
    address public smartWalletAlice = address(0x1001);
    address public smartWalletBob = address(0x1002);

    string public constant PROJECT_1 = "project-1";
    string public constant PROJECT_2 = "project-2";

    function setUp() public {
        token = new PortfolioToken();
        voting = new ProjectVoting(address(token), address(0));
    }

    /*//////////////////////////////////////////////////////////////
                FULL FLOW WITH REGISTERED WALLET
    //////////////////////////////////////////////////////////////*/

    function testFullFlowRegisteredWallet() public {
        // Step 1: Register wallet in both contracts
        vm.prank(smartWalletAlice);
        token.registerWallet(smartWalletAlice, alice);
        vm.prank(smartWalletAlice);
        voting.registerWallet(smartWalletAlice, alice);

        // Step 2: Claim faucet via smart wallet
        vm.prank(smartWalletAlice);
        token.claimFaucet();

        // Verify tokens in EOA
        uint256 aliceBalance1 = token.balanceOf(alice);
        assertEq(aliceBalance1, 100 * 10**18, "Alice should have 100 tokens");

        // Step 2.5: Alice approves voting contract to burn her tokens
        vm.prank(alice);
        token.approve(address(voting), type(uint256).max);

        // Step 3: Vote for project 1
        vm.prank(smartWalletAlice);
        voting.vote(PROJECT_1);

        uint256 aliceBalance2 = token.balanceOf(alice);
        assertEq(aliceBalance1 - aliceBalance2, 10 * 10**18, "10 tokens burned");
        assertTrue(voting.hasVoted(alice, PROJECT_1), "Vote recorded for EOA");

        // Step 4: Vote for project 2
        vm.prank(smartWalletAlice);
        voting.vote(PROJECT_2);

        uint256 aliceBalance3 = token.balanceOf(alice);
        assertEq(aliceBalance2 - aliceBalance3, 10 * 10**18, "Another 10 tokens burned");
        assertTrue(voting.hasVoted(alice, PROJECT_2), "Second vote recorded");

        // Step 5: Verify consistency
        assertEq(voting.totalVotesByAddress(alice), 2, "Alice should have 2 votes");
        assertEq(voting.getVotes(PROJECT_1), 1, "Project 1 should have 1 vote");
        assertEq(voting.getVotes(PROJECT_2), 1, "Project 2 should have 1 vote");
    }

    /*//////////////////////////////////////////////////////////////
              FULL FLOW WITH UNREGISTERED WALLET
    //////////////////////////////////////////////////////////////*/

    function testFullFlowUnregisteredWallet() public {
        // Step 1: Claim faucet via unregistered smart wallet
        vm.prank(smartWalletAlice);
        token.claimFaucet();

        // Tokens go to smart wallet
        uint256 smartWalletBalance1 = token.balanceOf(smartWalletAlice);
        assertEq(smartWalletBalance1, 100 * 10**18, "Tokens in smart wallet");

        // Step 1.5: Smart wallet approves voting contract
        vm.prank(smartWalletAlice);
        token.approve(address(voting), type(uint256).max);

        // Step 2: Try to vote - should fail (no tokens in smart wallet for voting check)
        // Actually, tokens ARE in smart wallet, so vote should succeed
        // But vote status will be stored by smart wallet address
        vm.prank(smartWalletAlice);
        voting.vote(PROJECT_1);

        uint256 smartWalletBalance2 = token.balanceOf(smartWalletAlice);
        assertEq(smartWalletBalance1 - smartWalletBalance2, 10 * 10**18, "10 tokens burned from smart wallet");

        // Vote status stored by smart wallet
        assertTrue(voting.hasVoted(smartWalletAlice, PROJECT_1), "Vote stored by smart wallet");
        assertFalse(voting.hasVoted(alice, PROJECT_1), "Vote not stored by EOA");

        // Step 3: Register wallet
        vm.prank(smartWalletAlice);
        token.registerWallet(smartWalletAlice, alice);
        vm.prank(smartWalletAlice);
        voting.registerWallet(smartWalletAlice, alice);

        // Step 4: Wait for cooldown and claim again
        vm.warp(block.timestamp + 1 days);
        vm.prank(smartWalletAlice);
        token.claimFaucet();

        // New tokens go to EOA
        uint256 aliceBalance = token.balanceOf(alice);
        assertEq(aliceBalance, 100 * 10**18, "New tokens in EOA");

        // Step 4.5: Alice approves voting contract
        vm.prank(alice);
        token.approve(address(voting), type(uint256).max);

        // Step 5: Vote for project 2 - should succeed and use EOA balance
        vm.prank(smartWalletAlice);
        voting.vote(PROJECT_2);

        uint256 aliceBalanceAfter = token.balanceOf(alice);
        assertEq(aliceBalance - aliceBalanceAfter, 10 * 10**18, "Tokens burned from EOA");
        assertTrue(voting.hasVoted(alice, PROJECT_2), "Vote stored by EOA");
    }

    /*//////////////////////////////////////////////////////////////
            EDGE CASE: TOKENS IN WRONG LOCATION
    //////////////////////////////////////////////////////////////*/

    function testEdgeCaseTokensInWrongLocation() public {
        // Step 1: Mint tokens to smart wallet (unregistered)
        vm.prank(smartWalletAlice);
        token.claimFaucet();

        uint256 smartWalletBalance = token.balanceOf(smartWalletAlice);
        assertEq(smartWalletBalance, 100 * 10**18, "Tokens in smart wallet");

        // Step 2: Register wallet
        vm.prank(smartWalletAlice);
        token.registerWallet(smartWalletAlice, alice);
        vm.prank(smartWalletAlice);
        voting.registerWallet(smartWalletAlice, alice);

        // Tokens still in smart wallet (registration doesn't move them)
        uint256 smartWalletBalanceAfter = token.balanceOf(smartWalletAlice);
        assertEq(smartWalletBalanceAfter, 100 * 10**18, "Tokens still in smart wallet");

        // Step 3: Try to vote - should fail (voting checks EOA balance, which is 0)
        vm.prank(smartWalletAlice);
        vm.expectRevert("Insufficient tokens");
        voting.vote(PROJECT_1);

        // Step 4: Transfer tokens from smart wallet to EOA
        vm.prank(smartWalletAlice);
        token.transfer(alice, 100 * 10**18);

        uint256 aliceBalance = token.balanceOf(alice);
        assertEq(aliceBalance, 100 * 10**18, "Tokens now in EOA");

        // Step 4.5: Alice approves voting contract
        vm.prank(alice);
        token.approve(address(voting), type(uint256).max);

        // Step 5: Now vote should succeed
        vm.prank(smartWalletAlice);
        voting.vote(PROJECT_1);

        uint256 aliceBalanceAfter = token.balanceOf(alice);
        assertEq(aliceBalance - aliceBalanceAfter, 10 * 10**18, "Tokens burned from EOA");
        assertTrue(voting.hasVoted(alice, PROJECT_1), "Vote recorded for EOA");
    }

    /*//////////////////////////////////////////////////////////////
            MULTIPLE OPERATIONS CONSISTENCY
    //////////////////////////////////////////////////////////////*/

    function testMultipleOperationsConsistency() public {
        // Register both wallets
        vm.prank(smartWalletAlice);
        token.registerWallet(smartWalletAlice, alice);
        vm.prank(smartWalletAlice);
        voting.registerWallet(smartWalletAlice, alice);

        vm.prank(smartWalletBob);
        token.registerWallet(smartWalletBob, bob);
        vm.prank(smartWalletBob);
        voting.registerWallet(smartWalletBob, bob);

        // Alice claims faucet multiple times
        vm.prank(smartWalletAlice);
        token.claimFaucet();
        vm.warp(block.timestamp + 1 days);
        vm.prank(smartWalletAlice);
        token.claimFaucet();

        uint256 aliceBalance = token.balanceOf(alice);
        assertEq(aliceBalance, 200 * 10**18, "Alice should have 200 tokens");

        // Approve voting contract for both
        vm.prank(alice);
        token.approve(address(voting), type(uint256).max);
        vm.prank(bob);
        token.approve(address(voting), type(uint256).max);

        // Alice votes multiple times
        vm.prank(smartWalletAlice);
        voting.vote(PROJECT_1);
        vm.prank(smartWalletAlice);
        voting.vote(PROJECT_2);

        uint256 aliceBalanceAfter = token.balanceOf(alice);
        assertEq(aliceBalance - aliceBalanceAfter, 20 * 10**18, "20 tokens burned");

        // Bob claims and votes
        vm.prank(smartWalletBob);
        token.claimFaucet();
        vm.prank(smartWalletBob);
        voting.vote(PROJECT_1);

        // Verify all states consistent
        assertEq(voting.totalVotesByAddress(alice), 2, "Alice has 2 votes");
        assertEq(voting.totalVotesByAddress(bob), 1, "Bob has 1 vote");
        assertEq(voting.getVotes(PROJECT_1), 2, "Project 1 has 2 votes");
        assertEq(voting.getVotes(PROJECT_2), 1, "Project 2 has 1 vote");

        // Verify balances
        uint256 totalSupply = token.totalSupply();
        uint256 aliceFinal = token.balanceOf(alice);
        uint256 bobFinal = token.balanceOf(bob);
        uint256 totalBurned = 30 * 10**18; // 3 votes * 10 tokens

        // Initial supply (1M) + 3 claims (300) - 3 votes (30) = 1,000,270
        assertEq(totalSupply, 1_000_000 * 10**18 + 300 * 10**18 - totalBurned, "Total supply should be correct");
        assertEq(aliceFinal + bobFinal, 270 * 10**18, "Sum of balances should be correct");
    }
}


