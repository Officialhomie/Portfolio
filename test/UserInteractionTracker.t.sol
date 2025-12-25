// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/UserInteractionTracker.sol";
import "../contracts/Homie.sol";

/**
 * @title UserInteractionTrackerTest
 * @notice Comprehensive tests for UserInteractionTracker contract
 * @dev Tests hierarchy system, token burning, scoring, and tier calculations
 */
contract UserInteractionTrackerTest is Test {
    UserInteractionTracker public tracker;
    PortfolioToken public token;

    address public admin = makeAddr("admin");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public authorizedContract = makeAddr("authorized-contract");

    bytes32 public constant TRACKER_ROLE = keccak256("TRACKER_ROLE");

    event InteractionRecorded(address indexed user, UserInteractionTracker.InteractionType interactionType, uint256 tokensBurned, uint256 newScore, uint256 newTier);
    event TierUpgraded(address indexed user, uint256 oldTier, uint256 newTier);

    function setUp() public {
        vm.startPrank(admin);

        // Deploy contracts
        token = new PortfolioToken();
        tracker = new UserInteractionTracker(address(token));

        // Grant tracker role to authorized contract
        tracker.grantTrackerRole(authorizedContract);
        tracker.grantRole(TRACKER_ROLE, authorizedContract);

        // Give users tokens for testing
        token.mint(user1, 10000 * 10**18);
        token.mint(user2, 10000 * 10**18);

        vm.stopPrank();

        // Users approve tracker to burn their tokens
        vm.prank(user1);
        token.approve(address(tracker), type(uint256).max);
        vm.prank(user2);
        token.approve(address(tracker), type(uint256).max);
    }

    /*//////////////////////////////////////////////////////////////
                            BASIC FUNCTIONALITY TESTS
    //////////////////////////////////////////////////////////////*/

    function testInitialSetup() public {
        assertEq(address(tracker.portfolioToken()), address(token));
        assertEq(tracker.visitorBookSignCost(), 5 * 10**18);
        assertEq(tracker.projectEndorseCost(), 3 * 10**18);
        assertEq(tracker.visitNFTMintCost(), 2 * 10**18);

        // Check tier thresholds
        assertEq(tracker.tierThresholds(0), 0);    // Bronze
        assertEq(tracker.tierThresholds(1), 10);   // Silver
        assertEq(tracker.tierThresholds(2), 50);   // Gold
        assertEq(tracker.tierThresholds(3), 200);  // Platinum
        assertEq(tracker.tierThresholds(4), 1000); // Diamond
        assertEq(tracker.tierThresholds(5), 5000); // Legendary

        // Check score multipliers
        assertEq(tracker.visitorBookSignScore(), 1);
        assertEq(tracker.projectVoteScore(), 2);
        assertEq(tracker.projectEndorseScore(), 1);
        assertEq(tracker.visitNFTScore(), 1);
    }

    function testRecordInteractionVisitorBookSign() public {
        uint256 burnAmount = tracker.visitorBookSignCost();

        vm.prank(authorizedContract);
        vm.expectEmit(true, false, false, true);
        emit InteractionRecorded(user1, UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, burnAmount, 1, 0);

        tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, burnAmount);

        UserInteractionTracker.UserStats memory stats = tracker.getUserStats(user1);
        assertEq(stats.visitorBookSigns, 1);
        assertEq(stats.totalInteractions, 1);
        assertEq(stats.interactionScore, 1);
        assertEq(stats.tier, 0); // Still Bronze
        assertEq(stats.tokensBurned, burnAmount);
    }

    function testRecordInteractionProjectEndorse() public {
        uint256 burnAmount = tracker.projectEndorseCost();

        vm.prank(authorizedContract);
        tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.PROJECT_ENDORSE, burnAmount);

        UserInteractionTracker.UserStats memory stats = tracker.getUserStats(user1);
        assertEq(stats.projectEndorsements, 1);
        assertEq(stats.totalInteractions, 1);
        assertEq(stats.interactionScore, 1);
        assertEq(stats.tokensBurned, burnAmount);
    }

    function testRecordInteractionVisitNFTMint() public {
        uint256 burnAmount = tracker.visitNFTMintCost();

        vm.prank(authorizedContract);
        tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.VISIT_NFT_MINT, burnAmount);

        UserInteractionTracker.UserStats memory stats = tracker.getUserStats(user1);
        assertEq(stats.visitNFTs, 1);
        assertEq(stats.totalInteractions, 1);
        assertEq(stats.interactionScore, 1);
        assertEq(stats.tokensBurned, burnAmount);
    }

    function testRecordInteractionProjectVote() public {
        uint256 burnAmount = 10 * 10**18; // Custom vote cost

        vm.prank(authorizedContract);
        tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.PROJECT_VOTE, burnAmount);

        UserInteractionTracker.UserStats memory stats = tracker.getUserStats(user1);
        assertEq(stats.projectVotes, 1);
        assertEq(stats.totalInteractions, 1);
        assertEq(stats.interactionScore, 2); // Vote gives 2 points
        assertEq(stats.tokensBurned, burnAmount);
    }

    function testRecordInteractionUnauthorized() public {
        vm.prank(user1); // Not authorized
        vm.expectRevert();
        tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, 0);
    }

    function testRecordInteractionInvalidUser() public {
        vm.prank(authorizedContract);
        vm.expectRevert("Invalid user address");
        tracker.recordInteraction(address(0), UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, 0);
    }

    /*//////////////////////////////////////////////////////////////
                            TIER CALCULATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testTierCalculation() public {
        // Test Bronze (0 points)
        assertEq(tracker.calculateTier(0), 0);

        // Test Silver (10+ points)
        assertEq(tracker.calculateTier(10), 1);
        assertEq(tracker.calculateTier(49), 1);

        // Test Gold (50+ points)
        assertEq(tracker.calculateTier(50), 2);
        assertEq(tracker.calculateTier(199), 2);

        // Test Platinum (200+ points)
        assertEq(tracker.calculateTier(200), 3);
        assertEq(tracker.calculateTier(999), 3);

        // Test Diamond (1000+ points)
        assertEq(tracker.calculateTier(1000), 4);
        assertEq(tracker.calculateTier(4999), 4);

        // Test Legendary (5000+ points)
        assertEq(tracker.calculateTier(5000), 5);
        assertEq(tracker.calculateTier(10000), 5);
    }

    function testTierUpgrade() public {
        // Start at Bronze
        UserInteractionTracker.UserStats memory stats = tracker.getUserStats(user1);
        assertEq(stats.tier, 0);

        // Add interactions to reach Silver (10 points)
        vm.startPrank(authorizedContract);
        for (uint256 i = 0; i < 10; i++) {
            tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, 0);
        }
        vm.stopPrank();

        stats = tracker.getUserStats(user1);
        assertEq(stats.interactionScore, 10);
        assertEq(stats.tier, 1); // Silver

        // Continue to Gold (50 points total)
        vm.startPrank(authorizedContract);
        for (uint256 i = 0; i < 40; i++) {
            tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, 0);
        }
        vm.stopPrank();

        stats = tracker.getUserStats(user1);
        assertEq(stats.interactionScore, 50);
        assertEq(stats.tier, 2); // Gold
    }

    function testTierUpgradeEvent() public {
        vm.expectEmit(true, false, false, false);
        emit TierUpgraded(user1, 0, 1);

        // Add 10 interactions to reach Silver
        vm.startPrank(authorizedContract);
        for (uint256 i = 0; i < 10; i++) {
            tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, 0);
        }
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                            TOKEN BURNING TESTS
    //////////////////////////////////////////////////////////////*/

    function testTokenBurning() public {
        uint256 burnAmount = tracker.visitorBookSignCost();
        uint256 initialBalance = token.balanceOf(user1);

        vm.prank(authorizedContract);
        tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, burnAmount);

        assertEq(token.balanceOf(user1), initialBalance - burnAmount);
        UserInteractionTracker.UserStats memory stats = tracker.getUserStats(user1);
        assertEq(stats.tokensBurned, burnAmount);
    }

    function testTokenBurningInsufficientBalance() public {
        // Burn all tokens first
        uint256 balance = token.balanceOf(user1);
        vm.prank(user1);
        token.transfer(address(1), balance); // Send to dead address

        // Try to record interaction requiring token burn
        uint256 cost = tracker.visitorBookSignCost();
        vm.prank(authorizedContract);
        vm.expectRevert("Insufficient tokens for interaction");
        tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, cost);
    }

    function testNoTokenBurning() public {
        uint256 initialBalance = token.balanceOf(user1);

        // Record interaction with 0 burn amount
        vm.prank(authorizedContract);
        tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, 0);

        assertEq(token.balanceOf(user1), initialBalance);
        UserInteractionTracker.UserStats memory stats = tracker.getUserStats(user1);
        assertEq(stats.tokensBurned, 0);
    }

    /*//////////////////////////////////////////////////////////////
                            COST MANAGEMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function testSetTokenBurnCost() public {
        uint256 newCost = 10 * 10**18;

        vm.prank(admin);
        vm.expectEmit(false, false, false, true);
        emit UserInteractionTracker.TokenBurnCostUpdated(UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, 5 * 10**18, newCost);

        tracker.setTokenBurnCost(UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, newCost);

        assertEq(tracker.visitorBookSignCost(), newCost);
    }

    function testSetTokenBurnCostUnauthorized() public {
        vm.prank(user1);
        vm.expectRevert();
        tracker.setTokenBurnCost(UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, 10 * 10**18);
    }

    function testSetTokenBurnCostInvalidType() public {
        vm.prank(admin);
        vm.expectRevert("Cannot set vote cost here");
        tracker.setTokenBurnCost(UserInteractionTracker.InteractionType.PROJECT_VOTE, 10 * 10**18);
    }

    /*//////////////////////////////////////////////////////////////
                            SCORE MULTIPLIER TESTS
    //////////////////////////////////////////////////////////////*/

    function testSetScoreMultipliers() public {
        vm.prank(admin);
        tracker.setScoreMultipliers(2, 3, 1, 2); // visitor, vote, endorse, nft

        assertEq(tracker.visitorBookSignScore(), 2);
        assertEq(tracker.projectVoteScore(), 3);
        assertEq(tracker.projectEndorseScore(), 1);
        assertEq(tracker.visitNFTScore(), 2);
    }

    function testSetScoreMultipliersUnauthorized() public {
        vm.prank(user1);
        vm.expectRevert();
        tracker.setScoreMultipliers(2, 3, 1, 2);
    }

    function testScoreCalculationWithMultipliers() public {
        // Set custom multipliers
        vm.prank(admin);
        tracker.setScoreMultipliers(2, 4, 3, 5); // Higher scores

        // Record interactions
        vm.startPrank(authorizedContract);
        tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, 0); // 2 points
        tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.PROJECT_VOTE, 0);      // 4 points
        tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.PROJECT_ENDORSE, 0);   // 3 points
        tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.VISIT_NFT_MINT, 0);    // 5 points
        vm.stopPrank();

        UserInteractionTracker.UserStats memory stats = tracker.getUserStats(user1);
        assertEq(stats.interactionScore, 2 + 4 + 3 + 5); // 14 points
        assertEq(stats.totalInteractions, 4);
    }

    /*//////////////////////////////////////////////////////////////
                            TIER THRESHOLD TESTS
    //////////////////////////////////////////////////////////////*/

    function testSetTierThresholds() public {
        uint256[6] memory newThresholds = [uint256(0), 20, 100, 500, 2000, 10000];

        vm.prank(admin);
        tracker.setTierThresholds(newThresholds);

        for (uint256 i = 0; i < 6; i++) {
            assertEq(tracker.tierThresholds(i), newThresholds[i]);
        }
    }

    function testSetTierThresholdsUnauthorized() public {
        uint256[6] memory newThresholds = [uint256(0), 20, 100, 500, 2000, 10000];

        vm.prank(user1);
        vm.expectRevert();
        tracker.setTierThresholds(newThresholds);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function testGetUserStats() public {
        vm.startPrank(authorizedContract);
        tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, 0);
        tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.PROJECT_VOTE, 0);
        vm.stopPrank();

        UserInteractionTracker.UserStats memory stats = tracker.getUserStats(user1);
        assertEq(stats.visitorBookSigns, 1);
        assertEq(stats.projectVotes, 1);
        assertEq(stats.projectEndorsements, 0);
        assertEq(stats.visitNFTs, 0);
        assertEq(stats.totalInteractions, 2);
        assertEq(stats.interactionScore, 1 + 2); // 1 + 2 = 3
        assertEq(stats.tier, 0); // Bronze
        assertEq(stats.tokensBurned, 0);
    }

    function testGetUserTierName() public {
        assertEq(tracker.getUserTierName(user1), "Bronze");

        // Reach Silver tier
        vm.startPrank(authorizedContract);
        for (uint256 i = 0; i < 10; i++) {
            tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, 0);
        }
        vm.stopPrank();

        assertEq(tracker.getUserTierName(user1), "Silver");
    }

    function testGetTierName() public {
        assertEq(tracker.getTierName(0), "Bronze");
        assertEq(tracker.getTierName(1), "Silver");
        assertEq(tracker.getTierName(2), "Gold");
        assertEq(tracker.getTierName(3), "Platinum");
        assertEq(tracker.getTierName(4), "Diamond");
        assertEq(tracker.getTierName(5), "Legendary");
        assertEq(tracker.getTierName(6), "Unknown");
    }

    function testGetInteractionCount() public {
        vm.startPrank(authorizedContract);
        tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, 0);
        tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, 0);
        tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.PROJECT_VOTE, 0);
        vm.stopPrank();

        assertEq(tracker.getInteractionCount(user1, UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN), 2);
        assertEq(tracker.getInteractionCount(user1, UserInteractionTracker.InteractionType.PROJECT_VOTE), 1);
        assertEq(tracker.getInteractionCount(user1, UserInteractionTracker.InteractionType.PROJECT_ENDORSE), 0);
    }

    /*//////////////////////////////////////////////////////////////
                            ROLE MANAGEMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function testGrantTrackerRole() public {
        address newContract = makeAddr("new-contract");

        vm.prank(admin);
        tracker.grantTrackerRole(newContract);

        assertTrue(tracker.hasRole(TRACKER_ROLE, newContract));

        // Test that new contract can record interactions
        vm.prank(newContract);
        tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, 0);

        UserInteractionTracker.UserStats memory stats = tracker.getUserStats(user1);
        assertEq(stats.totalInteractions, 1);
    }

    /*//////////////////////////////////////////////////////////////
                            INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testCompleteUserJourney() public {
        uint256 initialBalance = token.balanceOf(user1);

        // User starts at Bronze
        assertEq(tracker.getUserTierName(user1), "Bronze");

        // Various interactions over time
        vm.startPrank(authorizedContract);

        // 5 visitor book signs (5 points, costs 5*5 = 25 tokens)
        for (uint256 i = 0; i < 5; i++) {
            tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, tracker.visitorBookSignCost());
        }

        // 3 project endorsements (3 points, costs 3*3 = 9 tokens)
        for (uint256 i = 0; i < 3; i++) {
            tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.PROJECT_ENDORSE, tracker.projectEndorseCost());
        }

        // 2 project votes (4 points, costs 2*10 = 20 tokens)
        for (uint256 i = 0; i < 2; i++) {
            tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.PROJECT_VOTE, 10 * 10**18);
        }

        // 1 visit NFT mint (1 point, costs 2 tokens)
        tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.VISIT_NFT_MINT, tracker.visitNFTMintCost());

        vm.stopPrank();

        // Check final stats
        UserInteractionTracker.UserStats memory stats = tracker.getUserStats(user1);
        assertEq(stats.visitorBookSigns, 5);
        assertEq(stats.projectEndorsements, 3);
        assertEq(stats.projectVotes, 2);
        assertEq(stats.visitNFTs, 1);
        assertEq(stats.totalInteractions, 11);
        assertEq(stats.interactionScore, 5 + 3 + 4 + 1); // 13 points
        assertEq(stats.tier, 1); // Silver tier

        // Check token balance (25 + 9 + 20 + 2 = 56 tokens burned)
        uint256 expectedBurned = (5 * tracker.visitorBookSignCost()) + (3 * tracker.projectEndorseCost()) + (2 * 10 * 10**18) + tracker.visitNFTMintCost();
        assertEq(stats.tokensBurned, expectedBurned);
        assertEq(token.balanceOf(user1), initialBalance - expectedBurned);
    }

    function testTierProgression() public {
        // Test progression through all tiers
        uint256[6] memory targetScores = [uint256(0), 10, 50, 200, 1000, 5000];
        string[6] memory tierNames = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Legendary"];

        for (uint256 tier = 0; tier < 6; tier++) {
            // Reset user stats for clean test
            address testUser = makeAddr(string(abi.encodePacked("tier-user-", tier)));
            vm.prank(admin);
            token.mint(testUser, 10000 * 10**18);

            // Add enough interactions to reach this tier
            uint256 interactionsNeeded = targetScores[tier];
            vm.startPrank(authorizedContract);
            for (uint256 i = 0; i < interactionsNeeded; i++) {
                tracker.recordInteraction(testUser, UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, 0);
            }
            vm.stopPrank();

            assertEq(tracker.getUserTierName(testUser), tierNames[tier]);
        }
    }

    /*//////////////////////////////////////////////////////////////
                            FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzzInteractionRecording(uint256 numInteractions, uint256 burnAmount) public {
        numInteractions = bound(numInteractions, 1, 100);
        burnAmount = bound(burnAmount, 0, 100 * 10**18);

        // Ensure user has enough tokens
        if (burnAmount > 0) {
            vm.prank(admin);
            token.mint(user1, burnAmount * numInteractions);
        }

        uint256 totalBurned = 0;
        uint256 totalScore = 0;

        vm.startPrank(authorizedContract);
        for (uint256 i = 0; i < numInteractions; i++) {
            tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, burnAmount);
            totalBurned += burnAmount;
            totalScore += 1; // visitor book sign score
        }
        vm.stopPrank();

        UserInteractionTracker.UserStats memory stats = tracker.getUserStats(user1);
        assertEq(stats.totalInteractions, numInteractions);
        assertEq(stats.interactionScore, totalScore);
        assertEq(stats.tokensBurned, totalBurned);
    }

    function testFuzzTierCalculation(uint256 score) public {
        score = bound(score, 0, 10000);

        // Add interactions to reach the score
        vm.startPrank(authorizedContract);
        for (uint256 i = 0; i < score; i++) {
            tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, 0);
        }
        vm.stopPrank();

        UserInteractionTracker.UserStats memory stats = tracker.getUserStats(user1);
        assertEq(stats.interactionScore, score);

        uint256 expectedTier = tracker.calculateTier(score);
        assertEq(stats.tier, expectedTier);
    }

    function testFuzzCostSettings(uint256 newVisitorCost, uint256 newEndorseCost, uint256 newNftCost) public {
        newVisitorCost = bound(newVisitorCost, 0, 1000 * 10**18);
        newEndorseCost = bound(newEndorseCost, 0, 1000 * 10**18);
        newNftCost = bound(newNftCost, 0, 1000 * 10**18);

        vm.startPrank(admin);
        tracker.setTokenBurnCost(UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, newVisitorCost);
        tracker.setTokenBurnCost(UserInteractionTracker.InteractionType.PROJECT_ENDORSE, newEndorseCost);
        tracker.setTokenBurnCost(UserInteractionTracker.InteractionType.VISIT_NFT_MINT, newNftCost);
        vm.stopPrank();

        assertEq(tracker.visitorBookSignCost(), newVisitorCost);
        assertEq(tracker.projectEndorseCost(), newEndorseCost);
        assertEq(tracker.visitNFTMintCost(), newNftCost);
    }

    function testFuzzScoreMultipliers(uint256 visitorScore, uint256 voteScore, uint256 endorseScore, uint256 nftScore) public {
        visitorScore = bound(visitorScore, 1, 100);
        voteScore = bound(voteScore, 1, 100);
        endorseScore = bound(endorseScore, 1, 100);
        nftScore = bound(nftScore, 1, 100);

        vm.prank(admin);
        tracker.setScoreMultipliers(visitorScore, voteScore, endorseScore, nftScore);

        assertEq(tracker.visitorBookSignScore(), visitorScore);
        assertEq(tracker.projectVoteScore(), voteScore);
        assertEq(tracker.projectEndorseScore(), endorseScore);
        assertEq(tracker.visitNFTScore(), nftScore);

        // Test actual scoring
        vm.startPrank(authorizedContract);
        tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN, 0);
        tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.PROJECT_VOTE, 0);
        tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.PROJECT_ENDORSE, 0);
        tracker.recordInteraction(user1, UserInteractionTracker.InteractionType.VISIT_NFT_MINT, 0);
        vm.stopPrank();

        UserInteractionTracker.UserStats memory stats = tracker.getUserStats(user1);
        assertEq(stats.interactionScore, visitorScore + voteScore + endorseScore + nftScore);
    }
}
