// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/VisitNFT.sol";
import "../contracts/Homie.sol";
import "../contracts/UserInteractionTracker.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title VisitNFTTest
 * @notice Comprehensive tests for VisitNFT contract
 * @dev Tests limited NFT minting, interaction tracking, and security
 */
contract VisitNFTTest is Test {
    VisitNFT public nft;
    PortfolioToken public token;
    UserInteractionTracker public tracker;

    address public admin = makeAddr("admin");
    address public visitor1 = makeAddr("visitor1");
    address public visitor2 = makeAddr("visitor2");
    address public wallet1 = makeAddr("wallet1");

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    event VisitNFTMinted(uint256 indexed tokenId, address indexed recipient, uint256 timestamp);

    function setUp() public {
        vm.startPrank(admin);

        // Deploy contracts
        token = new PortfolioToken();
        tracker = new UserInteractionTracker(address(token));
        nft = new VisitNFT(address(tracker));

        // Grant roles
        nft.grantRole(MINTER_ROLE, admin);

        // Give visitors tokens for testing
        token.mint(visitor1, 1000 * 10**18);
        token.mint(visitor2, 1000 * 10**18);

        vm.stopPrank();

        // Grant tracker role to NFT contract
        vm.prank(admin);
        tracker.grantTrackerRole(address(nft));

        // Visitors approve tracker to burn their tokens
        vm.prank(visitor1);
        token.approve(address(tracker), type(uint256).max);
        vm.prank(visitor2);
        token.approve(address(tracker), type(uint256).max);
    }

    /*//////////////////////////////////////////////////////////////
                            BASIC FUNCTIONALITY TESTS
    //////////////////////////////////////////////////////////////*/

    function testInitialSetup() public {
        assertEq(nft.name(), "Portfolio Visit NFT");
        assertEq(nft.symbol(), "VISIT");
        assertEq(nft.MAX_SUPPLY(), 100);
        assertEq(nft.remainingSupply(), 100);
        assertEq(nft.totalSupply(), 0);
        assertTrue(nft.hasRole(nft.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(nft.hasRole(MINTER_ROLE, admin));
    }

    function testMintVisitNFT() public {
        vm.prank(visitor1);
        vm.expectEmit(true, true, false, true);
        emit VisitNFTMinted(1, visitor1, block.timestamp);

        nft.mintVisitNFT();

        assertEq(nft.totalSupply(), 1);
        assertEq(nft.ownerOf(1), visitor1);
        assertTrue(nft.hasMinted(visitor1));
        assertEq(nft.remainingSupply(), 99);
        assertEq(nft.getMintTimestamp(1), block.timestamp);
    }

    function testMintVisitNFTTwice() public {
        vm.startPrank(visitor1);
        nft.mintVisitNFT();

        vm.expectRevert("Already minted");
        nft.mintVisitNFT();
        vm.stopPrank();
    }

    function testMintVisitNFTMaxSupply() public {
        // Mint all 100 NFTs
        for (uint256 i = 1; i <= 100; i++) {
            address visitor = makeAddr(string(abi.encodePacked("visitor", i)));
            vm.prank(visitor);
            nft.mintVisitNFT();
        }

        assertEq(nft.totalSupply(), 100);
        assertEq(nft.remainingSupply(), 0);

        // Try to mint one more
        address visitor101 = makeAddr("visitor101");
        vm.prank(visitor101);
        vm.expectRevert("Max supply reached");
        nft.mintVisitNFT();
    }

    function testMintVisitNFTViaSmartWallet() public {
        // Register wallet
        vm.prank(visitor1);
        nft.registerWallet(wallet1, visitor1);

        // Mint via wallet
        vm.prank(wallet1);
        nft.mintVisitNFT();

        assertEq(nft.totalSupply(), 1);
        assertEq(nft.ownerOf(1), visitor1);
        assertTrue(nft.hasMinted(visitor1));
    }

    function testExecuteForMint() public {
        // Register wallet
        vm.prank(visitor1);
        nft.registerWallet(wallet1, visitor1);

        // Execute mint for user via smart wallet
        vm.prank(wallet1);
        nft.executeFor(visitor1);

        assertEq(nft.totalSupply(), 1);
        assertEq(nft.ownerOf(1), visitor1);
        assertTrue(nft.hasMinted(visitor1));
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function testAdminMint() public {
        vm.prank(admin);
        vm.expectEmit(true, true, false, true);
        emit VisitNFTMinted(1, visitor1, block.timestamp);

        nft.adminMint(visitor1);

        assertEq(nft.totalSupply(), 1);
        assertEq(nft.ownerOf(1), visitor1);
        assertEq(nft.getMintTimestamp(1), block.timestamp);
    }

    function testAdminMintToZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert("Cannot mint to zero address");
        nft.adminMint(address(0));
    }

    function testAdminMintUnauthorized() public {
        vm.prank(visitor1);
        vm.expectRevert();
        nft.adminMint(visitor2);
    }

    function testAdminMintMaxSupply() public {
        // Mint 100 NFTs as admin
        for (uint256 i = 1; i <= 100; i++) {
            vm.prank(admin);
            nft.adminMint(makeAddr(string(abi.encodePacked("user", i))));
        }

        vm.prank(admin);
        vm.expectRevert("Max supply reached");
        nft.adminMint(makeAddr("user101"));
    }

    /*//////////////////////////////////////////////////////////////
                            WALLET REGISTRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testWalletRegistration() public {
        vm.prank(visitor1);
        nft.registerWallet(wallet1, visitor1);

        assertEq(nft.walletToUser(wallet1), visitor1);
    }

    function testWalletRegistrationByWallet() public {
        vm.prank(wallet1);
        nft.registerWallet(wallet1, visitor1);

        assertEq(nft.walletToUser(wallet1), visitor1);
    }

    function testWalletRegistrationUnauthorized() public {
        vm.prank(visitor2);
        vm.expectRevert("Not authorized");
        nft.registerWallet(wallet1, visitor1);
    }

    /*//////////////////////////////////////////////////////////////
                            BASE URI MANAGEMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function testSetBaseURI() public {
        string memory newBaseURI = "ipfs://new-base/";
        vm.prank(admin);
        nft.setBaseURI(newBaseURI);

        // Mint an NFT to check the URI
        vm.prank(visitor1);
        nft.mintVisitNFT();

        assertEq(nft.tokenURI(1), string(abi.encodePacked(newBaseURI, "1")));
    }

    function testSetBaseURIUnauthorized() public {
        vm.prank(visitor1);
        vm.expectRevert();
        nft.setBaseURI("ipfs://unauthorized/");
    }

    function testSetBaseURIEmpty() public {
        vm.prank(admin);
        vm.expectRevert("Invalid URI");
        nft.setBaseURI("");
    }

    /*//////////////////////////////////////////////////////////////
                            PAUSE FUNCTIONALITY TESTS
    //////////////////////////////////////////////////////////////*/

    function testPauseUnpause() public {
        // Pause contract
        vm.prank(admin);
        nft.pause();

        assertTrue(nft.paused());

        // Try to mint while paused
        vm.prank(visitor1);
        vm.expectRevert(); // Modern OpenZeppelin uses EnforcedPause()
        nft.mintVisitNFT();

        // Unpause
        vm.prank(admin);
        nft.unpause();

        assertFalse(nft.paused());

        // Should work now
        vm.prank(visitor1);
        nft.mintVisitNFT();
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function testGetMintTimestamp() public {
        vm.prank(visitor1);
        nft.mintVisitNFT();

        uint256 timestamp = nft.getMintTimestamp(1);
        assertEq(timestamp, block.timestamp);
    }

    function testGetMintTimestampNonExistent() public {
        vm.expectRevert(); // Modern OpenZeppelin uses ERC721NonexistentToken()
        nft.getMintTimestamp(999);
    }

    function testTokenURI() public {
        string memory expectedURI = string(abi.encodePacked(nft.baseURI(), "1"));

        vm.prank(visitor1);
        nft.mintVisitNFT();

        assertEq(nft.tokenURI(1), expectedURI);
    }

    function testTokenURINonExistent() public {
        vm.expectRevert(); // Modern OpenZeppelin uses ERC721NonexistentToken()
        nft.tokenURI(999);
    }

    function testGetUserVisitNFT() public {
        vm.prank(visitor1);
        nft.mintVisitNFT();

        (bool hasMinted, uint256 tokenId) = nft.getUserVisitNFT(visitor1);
        assertTrue(hasMinted);
        assertEq(tokenId, 1);
    }

    function testGetUserVisitNFTNotMinted() public {
        (bool hasMinted, uint256 tokenId) = nft.getUserVisitNFT(visitor1);
        assertFalse(hasMinted);
        assertEq(tokenId, 0);
    }

    /*//////////////////////////////////////////////////////////////
                            INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testCompleteVisitFlow() public {
        // 1. Register wallet
        vm.prank(visitor1);
        nft.registerWallet(wallet1, visitor1);

        // 2. Mint via wallet
        vm.prank(wallet1);
        nft.mintVisitNFT();

        assertEq(nft.totalSupply(), 1);
        assertTrue(nft.hasMinted(visitor1));
        assertEq(nft.ownerOf(1), visitor1);

        // 3. Check token URI
        string memory expectedURI = string(abi.encodePacked(nft.baseURI(), "1"));
        assertEq(nft.tokenURI(1), expectedURI);

        // 4. Check mint timestamp
        assertEq(nft.getMintTimestamp(1), block.timestamp);

        // 5. Check user visit NFT lookup
        (bool hasMinted, uint256 tokenId) = nft.getUserVisitNFT(visitor1);
        assertTrue(hasMinted);
        assertEq(tokenId, 1);
    }

    function testTokenBurningIntegration() public {
        // Ensure visitor has enough tokens
        uint256 burnAmount = tracker.visitNFTMintCost();
        if (burnAmount > 0) {
            vm.prank(admin);
            token.mint(visitor1, burnAmount);
        }

        // Mint NFT (should burn tokens)
        uint256 balanceBefore = token.balanceOf(visitor1);
        vm.prank(visitor1);
        nft.mintVisitNFT();

        if (burnAmount > 0) {
            assertEq(token.balanceOf(visitor1), balanceBefore - burnAmount);
        }
    }

    function testLimitedSupplyEnforcement() public {
        // Test that only 100 NFTs can be minted total
        address[] memory visitors = new address[](101);
        for (uint256 i = 0; i < 101; i++) {
            visitors[i] = makeAddr(string(abi.encodePacked("visitor", i)));
        }

        // Mint 100 NFTs
        for (uint256 i = 0; i < 100; i++) {
            vm.prank(visitors[i]);
            nft.mintVisitNFT();
        }

        assertEq(nft.totalSupply(), 100);
        assertEq(nft.remainingSupply(), 0);

        // 101st should fail
        vm.prank(visitors[100]);
        vm.expectRevert("Max supply reached");
        nft.mintVisitNFT();
    }

    /*//////////////////////////////////////////////////////////////
                            EDGE CASE TESTS
    //////////////////////////////////////////////////////////////*/

    function testMintAfterWalletRegistration() public {
        // Register wallet first
        vm.prank(visitor1);
        nft.registerWallet(wallet1, visitor1);

        // Mint via direct call
        vm.prank(visitor1);
        nft.mintVisitNFT();

        // Should not be able to mint again even via wallet
        vm.prank(wallet1);
        vm.expectRevert("Already minted");
        nft.mintVisitNFT();
    }

    function testAdminMintBypassesUserLimits() public {
        // User mints their free NFT
        vm.prank(visitor1);
        nft.mintVisitNFT();

        // Admin can still mint additional NFTs to the same user
        vm.prank(admin);
        nft.adminMint(visitor1);

        // User should still have both NFTs
        assertEq(nft.totalSupply(), 2);
        assertEq(nft.ownerOf(1), visitor1);
        assertEq(nft.ownerOf(2), visitor1);
    }

    function testBaseURITokenURIConcatenation() public {
        string memory customBaseURI = "https://api.example.com/metadata/";
        vm.prank(admin);
        nft.setBaseURI(customBaseURI);

        vm.prank(visitor1);
        nft.mintVisitNFT();

        assertEq(nft.tokenURI(1), "https://api.example.com/metadata/1");
    }

    /*//////////////////////////////////////////////////////////////
                            FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzzMintVisitNFT(uint256 numMints) public {
        numMints = bound(numMints, 1, 100);

        uint256 minted = 0;
        for (uint256 i = 0; i < numMints && minted < 100; i++) {
            address visitor = makeAddr(string(abi.encodePacked("fuzz-visitor-", i)));
            vm.prank(visitor);
            nft.mintVisitNFT();
            minted++;
        }

        assertEq(nft.totalSupply(), minted);
        assertEq(nft.remainingSupply(), 100 - minted);
    }

    function testFuzzAdminMint(uint256 numMints) public {
        numMints = bound(numMints, 1, 100);

        for (uint256 i = 0; i < numMints; i++) {
            address recipient = makeAddr(string(abi.encodePacked("admin-recipient-", i)));
            vm.prank(admin);
            nft.adminMint(recipient);
        }

        assertEq(nft.totalSupply(), numMints);
        assertEq(nft.remainingSupply(), 100 - numMints);
    }

    function testFuzzBaseURIChanges(uint256 tokenId) public {
        tokenId = bound(tokenId, 1, 100);

        // Mint NFT
        vm.prank(makeAddr("uri-test-user"));
        nft.mintVisitNFT();

        // Change base URI multiple times
        string[] memory baseURIs = new string[](3);
        baseURIs[0] = "ipfs://Qm123/";
        baseURIs[1] = "https://api.test.com/";
        baseURIs[2] = "ar://";

        for (uint256 i = 0; i < baseURIs.length; i++) {
            vm.prank(admin);
            nft.setBaseURI(baseURIs[i]);

            string memory expectedURI = string(abi.encodePacked(baseURIs[i], "1"));
            assertEq(nft.tokenURI(1), expectedURI);
        }
    }
}
