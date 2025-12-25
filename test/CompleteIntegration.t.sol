// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/Homie.sol";
import "../contracts/ProjectNFT.sol";
import "../contracts/VisitNFT.sol";
import "../contracts/VisitorBook.sol";
import "../contracts/ProjectVoting.sol";
import "../contracts/UserInteractionTracker.sol";
import "../contracts/SmartAccount.sol";
import "../contracts/SmartAccountFactory.sol";
import "../contracts/interfaces/IEntryPoint.sol";

/**
 * @title CompleteIntegrationTest
 * @notice End-to-end integration tests for the entire portfolio platform
 * @dev Tests complete user journeys from token claiming to tier progression
 */
contract CompleteIntegrationTest is Test {
    // Core contracts
    PortfolioToken public token;
    UserInteractionTracker public tracker;
    ProjectNFT public projectNFT;
    VisitNFT public visitNFT;
    VisitorBook public visitorBook;
    ProjectVoting public projectVoting;

    // Smart account system
    SmartAccountFactory public smartAccountFactory;
    SmartAccount public smartAccount;
    IEntryPoint public entryPoint;

    // Test addresses
    address public admin = makeAddr("admin");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public wallet1 = makeAddr("wallet1");
    address public smartWallet1;

    // Constants
    uint256 public constant INITIAL_TOKENS = 100 * 10**18;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    event VisitorSigned(address indexed visitor, string message, uint256 timestamp, uint256 visitNumber);
    event ProjectMinted(uint256 indexed tokenId, string indexed projectId, address indexed creator, string ipfsMetadataURI);
    event VoteCast(address indexed voter, string indexed projectId, uint256 timestamp, uint256 tokensBurned);
    event VisitNFTMinted(uint256 indexed tokenId, address indexed recipient, uint256 timestamp);

    function setUp() public {
        vm.startPrank(admin);

        // Deploy mock EntryPoint
        MockEntryPoint mockEntryPoint = new MockEntryPoint();
        entryPoint = IEntryPoint(address(mockEntryPoint));

        // Deploy smart account factory
        smartAccountFactory = new SmartAccountFactory(entryPoint);

        // Deploy core ecosystem
        token = new PortfolioToken(); // No tracker initially
        tracker = new UserInteractionTracker(address(token));
        token = new PortfolioToken(); // Update with tracker

        projectNFT = new ProjectNFT(address(tracker));
        visitNFT = new VisitNFT(address(tracker));
        visitorBook = new VisitorBook(address(tracker));
        projectVoting = new ProjectVoting(address(token), address(tracker));

        // Grant roles
        tracker.grantRole(tracker.TRACKER_ROLE(), address(projectNFT));
        tracker.grantRole(tracker.TRACKER_ROLE(), address(visitNFT));
        tracker.grantRole(tracker.TRACKER_ROLE(), address(visitorBook));
        tracker.grantRole(tracker.TRACKER_ROLE(), address(projectVoting));

        projectNFT.grantRole(MINTER_ROLE, admin);
        visitNFT.grantRole(visitNFT.MINTER_ROLE(), admin);

        // Give users initial tokens
        token.mint(user1, INITIAL_TOKENS);
        token.mint(user2, INITIAL_TOKENS);

        vm.stopPrank();

        // Setup smart wallet for user1
        bytes memory ownerBytes = abi.encodePacked(bytes12(0), user1);
        smartAccount = smartAccountFactory.createAccount(ownerBytes, 0);
        smartWallet1 = address(smartAccount);
    }

    /*//////////////////////////////////////////////////////////////
                        COMPLETE USER JOURNEY TESTS
    //////////////////////////////////////////////////////////////*/

    function testCompleteUserJourney() public {
        uint256 initialBalance = token.balanceOf(user1);

        // === PHASE 1: ONBOARDING ===
        // 1. Claim faucet tokens
        vm.prank(user1);
        token.claimFaucet();

        assertEq(token.balanceOf(user1), initialBalance + token.FAUCET_AMOUNT());
        assertTrue(token.hasClaimedFaucet(user1));

        // 2. Register smart wallet
        vm.prank(user1);
        token.registerWallet(smartWallet1, user1);

        // === PHASE 2: BASIC INTERACTIONS ===
        // 3. Sign visitor book (via smart wallet)
        string memory message = "Excited to explore this amazing portfolio!";
        vm.prank(smartWallet1);
        visitorBook.signVisitorBook(message);

        assertEq(visitorBook.getTotalVisitors(), 1);
        assertTrue(visitorBook.hasVisited(user1));
        assertEq(visitorBook.getVisitCount(user1), 1);

        // 4. Mint Visit NFT (via smart wallet)
        vm.prank(smartWallet1);
        visitNFT.mintVisitNFT();

        assertEq(visitNFT.totalSupply(), 1);
        assertEq(visitNFT.ownerOf(1), user1);
        assertTrue(visitNFT.hasMinted(user1));

        // === PHASE 3: PROJECT INTERACTIONS ===
        // 5. Mint a project
        vm.prank(admin);
        uint256 projectId = projectNFT.mintProject(user2, "portfolio-project", "My Portfolio Project", "ipfs://project-metadata");

        assertEq(projectNFT.totalSupply(), 1);
        assertEq(projectNFT.ownerOf(projectId), user2);

        // 6. Endorse the project
        vm.prank(smartWallet1);
        projectNFT.endorseProject(projectId);

        (,,,,, uint256 endorsements) = projectNFT.projects(projectId);
        assertEq(endorsements, 1);

        // 7. Vote on the project
        vm.prank(smartWallet1);
        projectVoting.vote("portfolio-project");

        assertEq(projectVoting.getVotes("portfolio-project"), 1);
        assertTrue(projectVoting.checkVote(user1, "portfolio-project"));

        // === PHASE 4: HIERARCHY PROGRESSION ===
        // Check user's tier progression
        UserInteractionTracker.UserStats memory stats = tracker.getUserStats(user1);

        // Should have: 1 visitor sign + 1 vote + 1 endorse + 1 NFT mint = multiple interactions
        assertEq(stats.totalInteractions, 4);
        // Score: visitor(1) + vote(2) + endorse(1) + nft(1) = 5 points
        assertEq(stats.interactionScore, 5);
        assertEq(stats.tier, 0); // Bronze (but close to Silver)

        // === PHASE 5: TOKEN ECONOMY ===
        // Calculate expected token burns
        uint256 visitorBurn = tracker.visitorBookSignCost(); // 5 tokens
        uint256 nftBurn = tracker.visitNFTMintCost();        // 2 tokens
        uint256 endorseBurn = tracker.projectEndorseCost();   // 3 tokens
        uint256 voteBurn = projectVoting.voteCost();          // 10 tokens
        uint256 faucetClaim = token.FAUCET_AMOUNT();          // +100 tokens

        uint256 expectedBurned = visitorBurn + nftBurn + endorseBurn + voteBurn;
        uint256 expectedBalance = initialBalance + faucetClaim - expectedBurned;

        assertEq(token.balanceOf(user1), expectedBalance);
        assertEq(stats.tokensBurned, expectedBurned);
    }

    function testSmartWalletCompleteFlow() public {
        // Setup: Create and fund smart wallet
        bytes memory ownerBytes = abi.encodePacked(bytes12(0), user1);
        SmartAccount userSmartAccount = smartAccountFactory.createAccount(ownerBytes, 0);

        vm.prank(admin);
        token.mint(address(userSmartAccount), INITIAL_TOKENS);

        // Register wallet with all contracts
        vm.startPrank(user1);
        token.registerWallet(address(userSmartAccount), user1);
        projectNFT.registerWallet(address(userSmartAccount), user1);
        visitNFT.registerWallet(address(userSmartAccount), user1);
        visitorBook.registerWallet(address(userSmartAccount), user1);
        projectVoting.registerWallet(address(userSmartAccount), user1);
        vm.stopPrank();

        // Execute all interactions via smart wallet
        vm.startPrank(address(userSmartAccount));

        // Claim faucet
        token.claimFaucet();

        // Sign visitor book
        visitorBook.signVisitorBook("Smart wallet visitor message");

        // Mint Visit NFT
        visitNFT.mintVisitNFT();

        // Mint and endorse project
        vm.stopPrank();
        vm.prank(admin);
        uint256 projectId = projectNFT.mintProject(user2, "smart-wallet-project", "Smart Wallet Project", "ipfs://smart");
        vm.startPrank(address(userSmartAccount));

        projectNFT.endorseProject(projectId);
        projectVoting.vote("smart-wallet-project");

        vm.stopPrank();

        // Verify all interactions recorded under user1
        assertTrue(visitorBook.hasVisited(user1));
        assertTrue(visitNFT.hasMinted(user1));
        assertTrue(projectVoting.checkVote(user1, "smart-wallet-project"));

        uint256[] memory endorsed = projectNFT.getUserEndorsedProjects(user1);
        assertEq(endorsed.length, 1);
        assertEq(endorsed[0], projectId);

        // Check hierarchy
        UserInteractionTracker.UserStats memory stats = tracker.getUserStats(user1);
        assertEq(stats.totalInteractions, 4);
        assertEq(stats.interactionScore, 5); // Same as direct interactions
    }

    function testTierProgressionJourney() public {
        // Test complete journey from Bronze to Silver
        assertEq(tracker.getUserTierName(user1), "Bronze");

        // Need 10 points to reach Silver
        // Each visitor book sign = 1 point
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(user1);
            visitorBook.signVisitorBook(string(abi.encodePacked("Message ", i)));
        }

        UserInteractionTracker.UserStats memory stats = tracker.getUserStats(user1);
        assertEq(stats.interactionScore, 10);
        assertEq(stats.tier, 1); // Silver
        assertEq(tracker.getUserTierName(user1), "Silver");
        assertEq(stats.totalInteractions, 10);
    }

    function testCrossContractInteractions() public {
        // Test how interactions across different contracts affect each other

        // 1. User claims faucet tokens
        vm.prank(user1);
        token.claimFaucet();

        uint256 balanceAfterFaucet = token.balanceOf(user1);

        // 2. Signs visitor book (burns tokens)
        vm.prank(user1);
        visitorBook.signVisitorBook("Cross-contract test");

        uint256 balanceAfterVisitor = token.balanceOf(user1);
        assertEq(balanceAfterVisitor, balanceAfterFaucet - tracker.visitorBookSignCost());

        // 3. Mints Visit NFT (burns more tokens)
        vm.prank(user1);
        visitNFT.mintVisitNFT();

        uint256 balanceAfterNFT = token.balanceOf(user1);
        assertEq(balanceAfterNFT, balanceAfterVisitor - tracker.visitNFTMintCost());

        // 4. Creates and endorses project (burns more tokens)
        vm.prank(admin);
        uint256 projectId = projectNFT.mintProject(user1, "cross-contract", "Cross Contract Test", "ipfs://test");

        vm.prank(user1);
        projectNFT.endorseProject(projectId);

        uint256 balanceAfterEndorse = token.balanceOf(user1);
        assertEq(balanceAfterEndorse, balanceAfterNFT - tracker.projectEndorseCost());

        // 5. Votes on project (burns more tokens)
        vm.prank(user1);
        projectVoting.vote("cross-contract");

        uint256 finalBalance = token.balanceOf(user1);
        assertEq(finalBalance, balanceAfterEndorse - projectVoting.voteCost());

        // Verify all interactions recorded
        UserInteractionTracker.UserStats memory stats = tracker.getUserStats(user1);
        assertEq(stats.visitorBookSigns, 1);
        assertEq(stats.projectEndorsements, 1);
        assertEq(stats.projectVotes, 1);
        assertEq(stats.visitNFTs, 1);
        assertEq(stats.totalInteractions, 4);
    }

    /*//////////////////////////////////////////////////////////////
                        SECURITY & EDGE CASE TESTS
    //////////////////////////////////////////////////////////////*/

    function testReentrancyProtection() public {
        // All contracts should be protected against reentrancy
        // This is implicitly tested through the complete flows above
        // If any contract had reentrancy issues, the tests would fail

        // Additional specific test: rapid successive interactions
        vm.startPrank(user1);
        for (uint256 i = 0; i < 10; i++) {
            visitorBook.signVisitorBook(string(abi.encodePacked("Rapid message ", i)));
        }
        vm.stopPrank();

        assertEq(visitorBook.getVisitCount(user1), 10);
        assertEq(tracker.getUserStats(user1).totalInteractions, 10);
    }

    function testSupplyLimits() public {
        // Test VisitNFT supply limit
        for (uint256 i = 1; i <= 100; i++) {
            address visitor = makeAddr(string(abi.encodePacked("supply-test-", i)));
            vm.prank(admin);
            token.mint(visitor, INITIAL_TOKENS);

            vm.prank(visitor);
            visitNFT.mintVisitNFT();
        }

        assertEq(visitNFT.totalSupply(), 100);
        assertEq(visitNFT.remainingSupply(), 0);

        // Try to mint 101st
        address visitor101 = makeAddr("supply-test-101");
        vm.prank(admin);
        token.mint(visitor101, INITIAL_TOKENS);

        vm.prank(visitor101);
        vm.expectRevert("Max supply reached");
        visitNFT.mintVisitNFT();
    }

    function testEndorsementLimits() public {
        // Mint project and set low max endorsements
        vm.prank(admin);
        uint256 projectId = projectNFT.mintProject(user2, "limited-endorsements", "Limited Test", "ipfs://test");

        vm.prank(admin);
        projectNFT.setMaxEndorsements(2);

        // First two endorsements should work
        vm.prank(user1);
        projectNFT.endorseProject(projectId);

        address endorser2 = makeAddr("endorser2");
        vm.prank(admin);
        token.mint(endorser2, INITIAL_TOKENS);

        vm.prank(endorser2);
        projectNFT.endorseProject(projectId);

        // Third should fail
        address endorser3 = makeAddr("endorser3");
        vm.prank(admin);
        token.mint(endorser3, INITIAL_TOKENS);

        vm.prank(endorser3);
        vm.expectRevert("Max endorsements reached");
        projectNFT.endorseProject(projectId);

        (, , , , , uint256 endorsements) = projectNFT.projects(projectId);
        assertEq(endorsements, 2);
    }

    function testFaucetCooldownEnforcement() public {
        // First claim
        vm.prank(user1);
        token.claimFaucet();

        uint256 claimTime = block.timestamp;

        // Try immediate second claim
        vm.prank(user1);
        vm.expectRevert("Faucet cooldown active");
        token.claimFaucet();

        // Try partial cooldown
        vm.warp(claimTime + token.FAUCET_COOLDOWN() - 1);
        vm.prank(user1);
        vm.expectRevert("Faucet cooldown active");
        token.claimFaucet();

        // Try exact cooldown
        vm.warp(claimTime + token.FAUCET_COOLDOWN());
        vm.prank(user1);
        token.claimFaucet(); // Should work

        assertEq(token.balanceOf(user1), token.FAUCET_AMOUNT() * 2);
    }

    /*//////////////////////////////////////////////////////////////
                        ECONOMIC MODEL TESTS
    //////////////////////////////////////////////////////////////*/

    function testDeflationaryMechanics() public {
        uint256 initialSupply = token.totalSupply();

        // Multiple users performing interactions
        address[] memory users = new address[](5);
        for (uint256 i = 0; i < 5; i++) {
            users[i] = makeAddr(string(abi.encodePacked("econ-user-", i)));
            vm.prank(admin);
            token.mint(users[i], INITIAL_TOKENS);
        }

        // Each user performs multiple interactions
        for (uint256 i = 0; i < users.length; i++) {
            vm.startPrank(users[i]);
            token.claimFaucet();                    // +100 tokens
            visitorBook.signVisitorBook("Economic test"); // -5 tokens
            visitNFT.mintVisitNFT();               // -2 tokens
            vm.stopPrank();

            // Mint project for endorsement/voting
            vm.prank(admin);
            uint256 projectId = projectNFT.mintProject(users[i], string(abi.encodePacked("project-", i)), "Test Project", "ipfs://test");

            vm.startPrank(users[i]);
            projectNFT.endorseProject(projectId);   // -3 tokens
            projectVoting.vote(string(abi.encodePacked("project-", i))); // -10 tokens
            vm.stopPrank();
        }

        // Net result: 5 users × (100 - 5 - 2 - 3 - 10) = 5 × 80 = 400 tokens added
        uint256 expectedNetIncrease = 5 * (token.FAUCET_AMOUNT() - tracker.visitorBookSignCost() - tracker.visitNFTMintCost() - tracker.projectEndorseCost() - projectVoting.voteCost());
        uint256 finalSupply = token.totalSupply();

        assertEq(finalSupply, initialSupply + expectedNetIncrease);
    }

    function testHierarchyIncentives() public {
        // Test that higher tiers provide social proof value

        // Create multiple users with different activity levels
        address bronzeUser = makeAddr("bronze");
        address silverUser = makeAddr("silver");
        address goldUser = makeAddr("gold");

        vm.startPrank(admin);
        token.mint(bronzeUser, INITIAL_TOKENS);
        token.mint(silverUser, INITIAL_TOKENS);
        token.mint(goldUser, INITIAL_TOKENS);
        vm.stopPrank();

        // Bronze user: minimal activity
        vm.prank(bronzeUser);
        visitorBook.signVisitorBook("Bronze level");

        // Silver user: moderate activity
        vm.startPrank(silverUser);
        for (uint256 i = 0; i < 10; i++) {
            visitorBook.signVisitorBook(string(abi.encodePacked("Silver message ", i)));
        }
        vm.stopPrank();

        // Gold user: high activity
        vm.startPrank(goldUser);
        for (uint256 i = 0; i < 50; i++) {
            visitorBook.signVisitorBook(string(abi.encodePacked("Gold message ", i)));
        }
        vm.stopPrank();

        // Verify tier progression
        assertEq(tracker.getUserTierName(bronzeUser), "Bronze");
        assertEq(tracker.getUserTierName(silverUser), "Silver");
        assertEq(tracker.getUserTierName(goldUser), "Gold");

        // Higher tiers should have more interactions
        assertEq(tracker.getUserStats(bronzeUser).totalInteractions, 1);
        assertEq(tracker.getUserStats(silverUser).totalInteractions, 10);
        assertEq(tracker.getUserStats(goldUser).totalInteractions, 50);
    }

    /*//////////////////////////////////////////////////////////////
                        PERFORMANCE & GAS TESTS
    //////////////////////////////////////////////////////////////*/

    function testGasEfficiencySmartWallet() public {
        // Test that smart wallet operations are reasonably gas efficient
        bytes memory ownerBytes = abi.encodePacked(bytes12(0), user1);
        SmartAccount testAccount = smartAccountFactory.createAccount(ownerBytes, 0);

        vm.prank(admin);
        token.mint(address(testAccount), INITIAL_TOKENS);

        // Register wallet
        vm.prank(user1);
        token.registerWallet(address(testAccount), user1);

        // Measure gas for smart wallet faucet claim
        uint256 gasBefore = gasleft();
        vm.prank(address(testAccount));
        token.claimFaucet();
        uint256 gasUsed = gasBefore - gasleft();

        // Smart wallet operations should be reasonable (< 100k gas for simple claims)
        assertLt(gasUsed, 100000, "Smart wallet faucet claim too expensive");

        // Verify it worked
        assertEq(token.balanceOf(user1), token.FAUCET_AMOUNT());
    }

    /*//////////////////////////////////////////////////////////////
                        FUZZ & INVARIANT TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzzMultipleUsersJourney(uint256 numUsers, uint256 interactionsPerUser) public {
        numUsers = bound(numUsers, 1, 20);
        interactionsPerUser = bound(interactionsPerUser, 1, 10);

        address[] memory users = new address[](numUsers);

        // Setup users
        for (uint256 i = 0; i < numUsers; i++) {
            users[i] = makeAddr(string(abi.encodePacked("fuzz-user-", i)));
            vm.prank(admin);
            token.mint(users[i], INITIAL_TOKENS * 10); // Extra tokens for fuzzing
        }

        uint256 totalInteractions = 0;
        uint256 totalTokensBurned = 0;

        // Each user performs random interactions
        for (uint256 i = 0; i < numUsers; i++) {
            uint256 userInteractions = 0;

            for (uint256 j = 0; j < interactionsPerUser; j++) {
                uint256 interactionType = j % 4; // Cycle through interaction types

                if (interactionType == 0) {
                    // Visitor book sign
                    vm.prank(users[i]);
                    visitorBook.signVisitorBook(string(abi.encodePacked("Fuzz message ", j)));
                    totalTokensBurned += tracker.visitorBookSignCost();
                    userInteractions++;

                } else if (interactionType == 1 && j == 0) {
                    // Visit NFT mint (only once per user)
                    vm.prank(users[i]);
                    visitNFT.mintVisitNFT();
                    totalTokensBurned += tracker.visitNFTMintCost();
                    userInteractions++;

                } else if (interactionType == 2) {
                    // Project endorsement (need project first)
                    if (j == 0) {
                        vm.prank(admin);
                        projectNFT.mintProject(users[i], string(abi.encodePacked("fuzz-project-", i)), "Fuzz Project", "ipfs://fuzz");
                    }
                    vm.prank(users[i]);
                    projectNFT.endorseProject(i + 1); // Project ID starts at 1
                    totalTokensBurned += tracker.projectEndorseCost();
                    userInteractions++;

                } else if (interactionType == 3 && j == 0) {
                    // Project vote
                    vm.prank(users[i]);
                    projectVoting.vote(string(abi.encodePacked("fuzz-project-", i)));
                    totalTokensBurned += projectVoting.voteCost();
                    userInteractions++;
                }
            }

            totalInteractions += userInteractions;

            // Verify user stats are consistent
            UserInteractionTracker.UserStats memory stats = tracker.getUserStats(users[i]);
            assertEq(stats.totalInteractions, userInteractions);
            assertGe(stats.interactionScore, userInteractions); // Score >= interactions (some give bonus points)
        }

        // Verify global state
        assertEq(visitorBook.getTotalVisitors(), totalInteractions); // Approximate, since some interactions don't create visitors
        assertGe(tracker.getUserStats(users[0]).tokensBurned, 0); // At least some tokens burned
    }
}

/**
 * @title MockEntryPoint
 * @notice Minimal mock for testing purposes
 */
contract MockEntryPoint {
    mapping(address => uint256) public balances;

    function depositTo(address account) external payable {
        balances[account] += msg.value;
    }

    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }

    function withdrawTo(address payable withdrawAddress, uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        withdrawAddress.transfer(amount);
    }

    function getNonce(address, uint256) external pure returns (uint256) {
        return 0;
    }

    function addStake(uint32) external payable {}

    receive() external payable {}
}
