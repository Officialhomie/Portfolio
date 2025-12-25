// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/ProjectNFT.sol";
import "../contracts/Homie.sol";
import "../contracts/UserInteractionTracker.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title ProjectNFTTest
 * @notice Comprehensive tests for ProjectNFT contract
 * @dev Tests NFT minting, endorsements, interaction tracking, and security
 */
contract ProjectNFTTest is Test {
    ProjectNFT public nft;
    PortfolioToken public token;
    UserInteractionTracker public tracker;

    address public admin = makeAddr("admin");
    address public creator1 = makeAddr("creator1");
    address public creator2 = makeAddr("creator2");
    address public endorser1 = makeAddr("endorser1");
    address public endorser2 = makeAddr("endorser2");
    address public wallet1 = makeAddr("wallet1");

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ENDORSER_ROLE = keccak256("ENDORSER_ROLE");

    event ProjectMinted(uint256 indexed tokenId, string indexed projectId, address indexed creator, string ipfsMetadataURI);
    event ProjectEndorsed(uint256 indexed tokenId, address indexed endorser, uint256 newEndorsementCount);
    event ProjectUpdated(uint256 indexed tokenId, string newMetadataURI);

    function setUp() public {
        vm.startPrank(admin);

        // Deploy contracts
        token = new PortfolioToken();
        tracker = new UserInteractionTracker(address(token));
        nft = new ProjectNFT(address(tracker));

        // Grant roles
        nft.grantRole(MINTER_ROLE, admin);
        nft.grantRole(ENDORSER_ROLE, admin);

        // Give endorsers tokens for testing
        token.mint(endorser1, 1000 * 10**18);
        token.mint(endorser2, 1000 * 10**18);

        vm.stopPrank();

        // Grant tracker role to NFT contract
        vm.prank(admin);
        tracker.grantTrackerRole(address(nft));

        // Endorsers approve tracker to burn their tokens
        vm.prank(endorser1);
        token.approve(address(tracker), type(uint256).max);
        vm.prank(endorser2);
        token.approve(address(tracker), type(uint256).max);
    }

    /*//////////////////////////////////////////////////////////////
                            BASIC FUNCTIONALITY TESTS
    //////////////////////////////////////////////////////////////*/

    function testInitialSetup() public {
        assertEq(nft.name(), "ProjectNFT");
        assertEq(nft.symbol(), "PRJ");
        assertEq(nft.maxEndorsementsPerProject(), 1000);
        assertTrue(nft.hasRole(nft.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(nft.hasRole(MINTER_ROLE, admin));
    }

    function testMintProject() public {
        string memory projectId = "test-project-1";
        string memory projectName = "Test Project";
        string memory ipfsURI = "ipfs://QmTest123";

        vm.prank(admin);
        uint256 tokenId = nft.mintProject(creator1, projectId, projectName, ipfsURI);

        assertEq(tokenId, 1);
        assertEq(nft.totalSupply(), 1);
        assertEq(nft.ownerOf(tokenId), creator1);

        // Check project data
        (uint256 storedTokenId, string memory storedName, string memory storedURI, address storedCreator, uint256 createdAt, uint256 endorsementCount) = nft.projects(tokenId);
        assertEq(storedTokenId, tokenId);
        assertEq(storedName, projectName);
        assertEq(storedURI, ipfsURI);
        assertEq(storedCreator, creator1);
        assertEq(endorsementCount, 0);

        // Check mappings
        assertEq(nft.getTokenIdByProjectId(projectId), tokenId);
        assertEq(nft.tokenURI(tokenId), ipfsURI);
    }

    function testMintDuplicateProjectId() public {
        string memory projectId = "test-project-1";
        string memory projectName = "Test Project";
        string memory ipfsURI = "ipfs://QmTest123";

        vm.startPrank(admin);
        nft.mintProject(creator1, projectId, projectName, ipfsURI);

        vm.expectRevert("Project already minted");
        nft.mintProject(creator2, projectId, "Different Name", "different-uri");
        vm.stopPrank();
    }

    function testMintProjectUnauthorized() public {
        vm.prank(creator1);
        vm.expectRevert();
        nft.mintProject(creator1, "test-project", "Test Project", "ipfs://test");
    }

    function testMintProjectToZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert("Cannot mint to zero address");
        nft.mintProject(address(0), "test-project", "Test Project", "ipfs://test");
    }

    function testMintEmptyURI() public {
        vm.prank(admin);
        vm.expectRevert("Invalid metadata URI");
        nft.mintProject(creator1, "test-project", "Test Project", "");
    }

    /*//////////////////////////////////////////////////////////////
                            ENDORSEMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function testEndorseProject() public {
        // Setup: mint project
        vm.prank(admin);
        uint256 tokenId = nft.mintProject(creator1, "test-project", "Test Project", "ipfs://test");

        // Endorse project
        vm.prank(endorser1);
        vm.expectEmit(true, true, false, true);
        emit ProjectEndorsed(tokenId, endorser1, 1);

        nft.endorseProject(tokenId);

        // Check endorsement data
        assertTrue(nft.endorsements(tokenId, endorser1));
        (, , , , , uint256 endorsementCount) = nft.projects(tokenId);
        assertEq(endorsementCount, 1);

        // Check user endorsed projects
        uint256[] memory endorsedProjects = nft.getUserEndorsedProjects(endorser1);
        assertEq(endorsedProjects.length, 1);
        assertEq(endorsedProjects[0], tokenId);
    }

    function testEndorseProjectTwice() public {
        // Setup: mint project
        vm.prank(admin);
        uint256 tokenId = nft.mintProject(creator1, "test-project", "Test Project", "ipfs://test");

        // First endorsement
        vm.prank(endorser1);
        nft.endorseProject(tokenId);

        // Second endorsement should fail
        vm.prank(endorser1);
        vm.expectRevert("Already endorsed this project");
        nft.endorseProject(tokenId);
    }

    function testEndorseNonExistentProject() public {
        vm.prank(endorser1);
        vm.expectRevert("Token does not exist");
        nft.endorseProject(999);
    }

    function testEndorseProjectMaxReached() public {
        // Setup: mint project and set max endorsements to 1
        vm.prank(admin);
        uint256 tokenId = nft.mintProject(creator1, "test-project", "Test Project", "ipfs://test");

        vm.prank(admin);
        nft.setMaxEndorsements(1);

        // First endorsement
        vm.prank(endorser1);
        nft.endorseProject(tokenId);

        // Second endorsement should fail
        vm.prank(endorser2);
        vm.expectRevert("Max endorsements reached");
        nft.endorseProject(tokenId);
    }

    function testEndorseViaSmartWallet() public {
        // Setup: mint project and register wallet
        vm.prank(admin);
        uint256 tokenId = nft.mintProject(creator1, "test-project", "Test Project", "ipfs://test");

        vm.prank(endorser1);
        nft.registerWallet(wallet1, endorser1);

        // Endorse via wallet
        vm.prank(wallet1);
        nft.endorseProject(tokenId);

        assertTrue(nft.endorsements(tokenId, endorser1));
        (, , , , , uint256 endorsementCount) = nft.projects(tokenId);
        assertEq(endorsementCount, 1);
    }

    function testExecuteForEndorsement() public {
        // Setup: mint project and register wallet
        vm.prank(admin);
        uint256 tokenId = nft.mintProject(creator1, "test-project", "Test Project", "ipfs://test");

        vm.prank(endorser1);
        nft.registerWallet(wallet1, endorser1);

        // Execute endorsement for user via smart wallet
        vm.prank(wallet1);
        nft.executeFor(endorser1, tokenId);

        assertTrue(nft.endorsements(tokenId, endorser1));
        (, , , , , uint256 endorsementCount) = nft.projects(tokenId);
        assertEq(endorsementCount, 1);
    }

    /*//////////////////////////////////////////////////////////////
                            WALLET REGISTRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testWalletRegistration() public {
        vm.prank(endorser1);
        nft.registerWallet(wallet1, endorser1);

        assertEq(nft.walletToUser(wallet1), endorser1);
    }

    function testWalletRegistrationByWallet() public {
        vm.prank(wallet1);
        nft.registerWallet(wallet1, endorser1);

        assertEq(nft.walletToUser(wallet1), endorser1);
    }

    function testWalletRegistrationUnauthorized() public {
        vm.prank(endorser2);
        vm.expectRevert("Not authorized");
        nft.registerWallet(wallet1, endorser1);
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function testUpdateProjectMetadata() public {
        // Setup: mint project
        vm.prank(admin);
        uint256 tokenId = nft.mintProject(creator1, "test-project", "Test Project", "ipfs://old");

        // Update metadata
        string memory newURI = "ipfs://new-metadata";
        vm.prank(admin);
        vm.expectEmit(true, false, false, true);
        emit ProjectUpdated(tokenId, newURI);

        nft.updateProjectMetadata(tokenId, newURI);

        assertEq(nft.tokenURI(tokenId), newURI);
        (, , string memory storedURI, , , ) = nft.projects(tokenId);
        assertEq(storedURI, newURI);
    }

    function testUpdateProjectMetadataNonExistent() public {
        vm.prank(admin);
        vm.expectRevert("Token does not exist");
        nft.updateProjectMetadata(999, "ipfs://test");
    }

    function testUpdateProjectMetadataUnauthorized() public {
        vm.prank(endorser1);
        vm.expectRevert();
        nft.updateProjectMetadata(1, "ipfs://test");
    }

    function testSetMaxEndorsements() public {
        vm.prank(admin);
        nft.setMaxEndorsements(2000);

        assertEq(nft.maxEndorsementsPerProject(), 2000);
    }

    function testSetMaxEndorsementsUnauthorized() public {
        vm.prank(endorser1);
        vm.expectRevert();
        nft.setMaxEndorsements(2000);
    }

    /*//////////////////////////////////////////////////////////////
                            PAUSE FUNCTIONALITY TESTS
    //////////////////////////////////////////////////////////////*/

    function testPauseUnpause() public {
        // Pause contract
        vm.prank(admin);
        nft.pause();

        assertTrue(nft.paused());

        // Try to endorse while paused
        vm.prank(endorser1);
        vm.expectRevert(); // Modern OpenZeppelin uses EnforcedPause()
        nft.endorseProject(1);

        // Unpause
        vm.prank(admin);
        nft.unpause();

        assertFalse(nft.paused());
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function testGetProject() public {
        vm.prank(admin);
        uint256 tokenId = nft.mintProject(creator1, "test-project", "Test Project", "ipfs://test");

        ProjectNFT.Project memory project = nft.getProject(tokenId);
        assertEq(project.tokenId, tokenId);
        assertEq(project.name, "Test Project");
        assertEq(project.ipfsMetadataURI, "ipfs://test");
        assertEq(project.creator, creator1);
        assertEq(project.endorsementCount, 0);
    }

    function testGetProjectNonExistent() public {
        vm.expectRevert("Token does not exist");
        nft.getProject(999);
    }

    function testGetUserEndorsedProjects() public {
        // Mint two projects
        vm.startPrank(admin);
        uint256 tokenId1 = nft.mintProject(creator1, "project-1", "Project 1", "ipfs://1");
        uint256 tokenId2 = nft.mintProject(creator2, "project-2", "Project 2", "ipfs://2");
        vm.stopPrank();

        // Endorse both projects
        vm.prank(endorser1);
        nft.endorseProject(tokenId1);

        vm.prank(endorser1);
        nft.endorseProject(tokenId2);

        uint256[] memory endorsed = nft.getUserEndorsedProjects(endorser1);
        assertEq(endorsed.length, 2);
        // Note: order may vary due to iteration
        assertTrue(endorsed[0] == tokenId1 || endorsed[0] == tokenId2);
        assertTrue(endorsed[1] == tokenId1 || endorsed[1] == tokenId2);
    }

    function testGetUserCreatedProjects() public {
        vm.startPrank(admin);
        uint256 tokenId1 = nft.mintProject(creator1, "project-1", "Project 1", "ipfs://1");
        uint256 tokenId2 = nft.mintProject(creator1, "project-2", "Project 2", "ipfs://2");
        uint256 tokenId3 = nft.mintProject(creator2, "project-3", "Project 3", "ipfs://3");
        vm.stopPrank();

        ProjectNFT.Project[] memory created = nft.getUserCreatedProjects(creator1);
        assertEq(created.length, 2);

        // Check that both projects belong to creator1
        for (uint256 i = 0; i < created.length; i++) {
            assertEq(created[i].creator, creator1);
        }
    }

    function testGetUserEndorsementStats() public {
        // Mint two projects
        vm.startPrank(admin);
        uint256 tokenId1 = nft.mintProject(creator1, "project-1", "Project 1", "ipfs://1");
        uint256 tokenId2 = nft.mintProject(creator2, "project-2", "Project 2", "ipfs://2");
        vm.stopPrank();

        // Endorse projects
        vm.prank(endorser1);
        nft.endorseProject(tokenId1);

        vm.prank(endorser1);
        nft.endorseProject(tokenId2);

        (uint256 totalEndorsements, uint256 uniqueProjects) = nft.getUserEndorsementStats(endorser1);
        assertEq(totalEndorsements, 2);
        assertEq(uniqueProjects, 2);
    }

    /*//////////////////////////////////////////////////////////////
                            INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testCompleteProjectLifecycle() public {
        // 1. Mint project
        vm.prank(admin);
        uint256 tokenId = nft.mintProject(creator1, "lifecycle-project", "Lifecycle Project", "ipfs://initial");

        // 2. Register wallets
        vm.prank(endorser1);
        nft.registerWallet(wallet1, endorser1);

        vm.prank(endorser2);
        nft.registerWallet(makeAddr("wallet2"), endorser2);

        // 3. Multiple endorsements
        vm.prank(wallet1);
        nft.endorseProject(tokenId);

        vm.prank(endorser2);
        nft.endorseProject(tokenId);

        // 4. Check stats
        (, , , , , uint256 endorsementCount) = nft.projects(tokenId);
        assertEq(endorsementCount, 2);

        uint256[] memory endorsed = nft.getUserEndorsedProjects(endorser1);
        assertEq(endorsed.length, 1);
        assertEq(endorsed[0], tokenId);

        // 5. Update metadata
        vm.prank(admin);
        nft.updateProjectMetadata(tokenId, "ipfs://updated");

        assertEq(nft.tokenURI(tokenId), "ipfs://updated");
    }

    function testTokenBurningIntegration() public {
        // Setup: mint project
        vm.prank(admin);
        uint256 tokenId = nft.mintProject(creator1, "burn-test", "Burn Test", "ipfs://test");

        // Ensure endorser has enough tokens
        uint256 burnAmount = tracker.projectEndorseCost();
        if (burnAmount > 0) {
            vm.prank(admin);
            token.mint(endorser1, burnAmount);
        }

        // Endorse (should burn tokens)
        uint256 balanceBefore = token.balanceOf(endorser1);
        vm.prank(endorser1);
        nft.endorseProject(tokenId);

        if (burnAmount > 0) {
            assertEq(token.balanceOf(endorser1), balanceBefore - burnAmount);
        }
    }

    /*//////////////////////////////////////////////////////////////
                            FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzzMintProject(uint256 numProjects) public {
        numProjects = bound(numProjects, 1, 100);

        for (uint256 i = 0; i < numProjects; i++) {
            string memory projectId = string(abi.encodePacked("project-", i));
            string memory projectName = string(abi.encodePacked("Project ", i));
            string memory ipfsURI = string(abi.encodePacked("ipfs://", i));

            vm.prank(admin);
            uint256 tokenId = nft.mintProject(makeAddr(string(abi.encodePacked("creator-", i))), projectId, projectName, ipfsURI);

            assertEq(tokenId, i + 1);
            assertEq(nft.totalSupply(), i + 1);
        }
    }

    function testFuzzEndorsements(uint256 numEndorsers) public {
        numEndorsers = bound(numEndorsers, 1, 100);

        // Mint project
        vm.prank(admin);
        uint256 tokenId = nft.mintProject(creator1, "fuzz-project", "Fuzz Project", "ipfs://fuzz");

        // Set high max endorsements for fuzzing
        vm.prank(admin);
        nft.setMaxEndorsements(numEndorsers + 100);

        uint256 endorsementCount = 0;
        for (uint256 i = 0; i < numEndorsers; i++) {
            address endorser = makeAddr(string(abi.encodePacked("endorser-", i)));

            // Give tokens if needed
            uint256 burnAmount = tracker.projectEndorseCost();
            if (burnAmount > 0) {
                vm.prank(admin);
                token.mint(endorser, burnAmount);
            }

            vm.prank(endorser);
            nft.endorseProject(tokenId);

            endorsementCount++;
            (, , , , , uint256 currentCount) = nft.projects(tokenId);
            assertEq(currentCount, endorsementCount);
        }
    }
}
