// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/VisitorBook.sol";
import "../contracts/Homie.sol";
import "../contracts/UserInteractionTracker.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title VisitorBookTest
 * @notice Comprehensive tests for VisitorBook contract
 * @dev Tests visitor signing, biometric authentication, message validation, and security
 */
contract VisitorBookTest is Test {
    using ECDSA for bytes32;

    VisitorBook public visitorBook;
    PortfolioToken public token;
    UserInteractionTracker public tracker;

    address public admin = makeAddr("admin");
    address public visitor1 = makeAddr("visitor1");
    address public visitor2 = makeAddr("visitor2");
    address public wallet1 = makeAddr("wallet1");
    address public moderator = makeAddr("moderator");

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    event VisitorSigned(address indexed visitor, string message, uint256 timestamp, uint256 visitNumber);

    function setUp() public {
        vm.startPrank(admin);

        // Deploy contracts
        token = new PortfolioToken();
        tracker = new UserInteractionTracker(address(token));
        visitorBook = new VisitorBook(address(tracker));

        // Grant roles
        visitorBook.grantRole(MODERATOR_ROLE, moderator);

        // Give visitors tokens for testing
        token.mint(visitor1, 1000 * 10**18);
        token.mint(visitor2, 1000 * 10**18);

        vm.stopPrank();

        // Grant tracker role to visitor book
        vm.prank(admin);
        tracker.grantTrackerRole(address(visitorBook));

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
        assertEq(visitorBook.maxMessageLength(), 500);
        assertEq(visitorBook.minMessageLength(), 1);
        assertEq(visitorBook.getTotalVisitors(), 0);
        assertTrue(visitorBook.hasRole(visitorBook.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(visitorBook.hasRole(MODERATOR_ROLE, moderator));
    }

    function testSignVisitorBook() public {
        string memory message = "Great portfolio! Love your work on DeFi protocols.";

        vm.prank(visitor1);
        vm.expectEmit(true, false, false, true);
        emit VisitorSigned(visitor1, message, block.timestamp, 1);

        visitorBook.signVisitorBook(message);

        // Check visitor data
        VisitorBook.Visitor memory visitor = visitorBook.getVisitor(0);
        assertEq(visitor.visitor, visitor1);
        assertEq(visitor.message, message);
        assertEq(visitor.timestamp, block.timestamp);

        // Check mappings
        assertTrue(visitorBook.hasVisited(visitor1));
        assertEq(visitorBook.getVisitCount(visitor1), 1);
        assertEq(visitorBook.getTotalVisitors(), 1);
    }

    function testSignVisitorBookViaSmartWallet() public {
        string memory message = "Signing via smart wallet!";

        // Register wallet
        vm.prank(visitor1);
        visitorBook.registerWallet(wallet1, visitor1);

        // Sign via wallet
        vm.prank(wallet1);
        visitorBook.signVisitorBook(message);

        VisitorBook.Visitor memory visitor = visitorBook.getVisitor(0);
        assertEq(visitor.visitor, visitor1);
        assertEq(visitor.message, message);
        assertTrue(visitorBook.hasVisited(visitor1));
    }

    function testExecuteForSigning() public {
        string memory message = "Executed via smart wallet for user!";

        // Register wallet
        vm.prank(visitor1);
        visitorBook.registerWallet(wallet1, visitor1);

        // Execute signing for user via smart wallet
        vm.prank(wallet1);
        visitorBook.executeFor(visitor1, message);

        VisitorBook.Visitor memory visitor = visitorBook.getVisitor(0);
        assertEq(visitor.visitor, visitor1);
        assertEq(visitor.message, message);
        assertTrue(visitorBook.hasVisited(visitor1));
    }

    function testMessageLengthValidation() public {
        // Test minimum length
        vm.prank(visitor1);
        vm.expectRevert("Message length invalid");
        visitorBook.signVisitorBook("");

        // Test maximum length
        string memory longMessage = "";
        for (uint256 i = 0; i < 501; i++) {
            longMessage = string(abi.encodePacked(longMessage, "a"));
        }
        vm.prank(visitor1);
        vm.expectRevert("Message length invalid");
        visitorBook.signVisitorBook(longMessage);

        // Test valid lengths
        vm.prank(visitor1);
        visitorBook.signVisitorBook("a"); // Min length

        vm.prank(visitor2);
        string memory maxMessage = "";
        for (uint256 i = 0; i < 500; i++) {
            maxMessage = string(abi.encodePacked(maxMessage, "a"));
        }
        visitorBook.signVisitorBook(maxMessage); // Max length
    }

    function testMultipleVisitsBySameUser() public {
        string memory message1 = "First visit!";
        string memory message2 = "Second visit!";

        vm.startPrank(visitor1);
        visitorBook.signVisitorBook(message1);
        visitorBook.signVisitorBook(message2);
        vm.stopPrank();

        assertEq(visitorBook.getVisitCount(visitor1), 2);
        assertEq(visitorBook.getTotalVisitors(), 2);

        // Check both messages
        VisitorBook.Visitor[] memory userMessages = visitorBook.getUserMessages(visitor1);
        assertEq(userMessages.length, 2);
        assertEq(userMessages[0].message, message1);
        assertEq(userMessages[1].message, message2);
    }

    /*//////////////////////////////////////////////////////////////
                            WALLET REGISTRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testWalletRegistration() public {
        vm.prank(visitor1);
        visitorBook.registerWallet(wallet1, visitor1);

        assertEq(visitorBook.walletToUser(wallet1), visitor1);
    }

    function testWalletRegistrationByWallet() public {
        vm.prank(wallet1);
        visitorBook.registerWallet(wallet1, visitor1);

        assertEq(visitorBook.walletToUser(wallet1), visitor1);
    }

    function testWalletRegistrationUnauthorized() public {
        vm.prank(visitor2);
        vm.expectRevert("Not authorized");
        visitorBook.registerWallet(wallet1, visitor1);
    }

    /*//////////////////////////////////////////////////////////////
                        EIP-712 SIGNATURE TESTS
    //////////////////////////////////////////////////////////////*/

    function testSignWithSignature() public {
        string memory message = "EIP-712 signed message";
        uint256 timestamp = block.timestamp;
        uint256 privateKey = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef;
        address signer = vm.addr(privateKey);

        // Give signer tokens
        vm.prank(admin);
        token.mint(signer, 1000 * 10**18);

        // Signer approves tracker to burn tokens
        vm.prank(signer);
        token.approve(address(tracker), type(uint256).max);

        // Create EIP-712 signature
        bytes32 structHash = keccak256(abi.encode(
            visitorBook.VISITOR_SIGNATURE_TYPEHASH(),
            signer,
            keccak256(bytes(message)),
            timestamp
        ));

        bytes32 digest = hashTypedDataV4(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(signer);
        visitorBook.signVisitorBookWithSignature(message, signature, timestamp);

        VisitorBook.Visitor memory visitor = visitorBook.getVisitor(0);
        assertEq(visitor.visitor, signer);
        assertEq(visitor.message, message);
    }

    function testSignWithSignatureReplayProtection() public {
        string memory message = "Replay protection test";
        uint256 timestamp = block.timestamp;
        uint256 privateKey = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef;
        address signer = vm.addr(privateKey);

        // Give signer tokens
        vm.prank(admin);
        token.mint(signer, 1000 * 10**18);

        // Signer approves tracker to burn tokens
        vm.prank(signer);
        token.approve(address(tracker), type(uint256).max);

        // Create signature
        bytes32 structHash = keccak256(abi.encode(
            visitorBook.VISITOR_SIGNATURE_TYPEHASH(),
            signer,
            keccak256(bytes(message)),
            timestamp
        ));

        bytes32 digest = hashTypedDataV4(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        // First signature should work
        vm.prank(signer);
        visitorBook.signVisitorBookWithSignature(message, signature, timestamp);

        // Second signature should fail (replay)
        vm.prank(signer);
        vm.expectRevert("Signature already used");
        visitorBook.signVisitorBookWithSignature(message, signature, timestamp);
    }

    function testSignWithSignatureTimestampValidation() public {
        string memory message = "Timestamp validation test";
        uint256 privateKey = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef;
        address signer = vm.addr(privateKey);

        // Give signer tokens
        vm.prank(admin);
        token.mint(signer, 1000 * 10**18);

        // Test timestamp too old
        uint256 oldTimestamp = block.timestamp - 301; // 5 minutes + 1 second ago
        bytes32 structHash = keccak256(abi.encode(
            visitorBook.VISITOR_SIGNATURE_TYPEHASH(),
            signer,
            keccak256(bytes(message)),
            oldTimestamp
        ));

        bytes32 digest = hashTypedDataV4(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(signer);
        vm.expectRevert("Timestamp out of window");
        visitorBook.signVisitorBookWithSignature(message, signature, oldTimestamp);

        // Test timestamp too far in future
        uint256 futureTimestamp = block.timestamp + 61; // 1 minute + 1 second in future
        structHash = keccak256(abi.encode(
            visitorBook.VISITOR_SIGNATURE_TYPEHASH(),
            signer,
            keccak256(bytes(message)),
            futureTimestamp
        ));

        digest = hashTypedDataV4(structHash);
        (v, r, s) = vm.sign(privateKey, digest);
        signature = abi.encodePacked(r, s, v);

        vm.prank(signer);
        vm.expectRevert("Timestamp out of window");
        visitorBook.signVisitorBookWithSignature(message, signature, futureTimestamp);
    }

    /*//////////////////////////////////////////////////////////////
                            MODERATOR FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function testRemoveVisitor() public {
        // Add two visitors
        vm.prank(visitor1);
        visitorBook.signVisitorBook("Message 1");

        vm.prank(visitor2);
        visitorBook.signVisitorBook("Message 2");

        assertEq(visitorBook.getTotalVisitors(), 2);

        // Remove first visitor
        vm.prank(moderator);
        visitorBook.removeVisitor(0);

        // Should now have 1 visitor (second one moved to index 0)
        assertEq(visitorBook.getTotalVisitors(), 1);
        VisitorBook.Visitor memory remainingVisitor = visitorBook.getVisitor(0);
        assertEq(remainingVisitor.visitor, visitor2);
        assertEq(remainingVisitor.message, "Message 2");
    }

    function testRemoveVisitorUnauthorized() public {
        vm.prank(visitor1);
        visitorBook.signVisitorBook("Test message");

        vm.prank(visitor2);
        vm.expectRevert();
        visitorBook.removeVisitor(0);
    }

    function testRemoveVisitorInvalidIndex() public {
        vm.prank(moderator);
        vm.expectRevert("Index out of bounds");
        visitorBook.removeVisitor(0); // No visitors yet

        vm.prank(visitor1);
        visitorBook.signVisitorBook("Test message");

        vm.prank(moderator);
        vm.expectRevert("Index out of bounds");
        visitorBook.removeVisitor(1); // Only index 0 exists
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function testSetMaxMessageLength() public {
        vm.prank(admin);
        visitorBook.setMaxMessageLength(1000);

        assertEq(visitorBook.maxMessageLength(), 1000);

        // Test that new limit works
        string memory longMessage = "";
        for (uint256 i = 0; i < 1000; i++) {
            longMessage = string(abi.encodePacked(longMessage, "a"));
        }

        vm.prank(visitor1);
        visitorBook.signVisitorBook(longMessage); // Should work

        // Test that 1001 characters fails
        string memory tooLongMessage = string(abi.encodePacked(longMessage, "a"));
        vm.prank(visitor2);
        vm.expectRevert("Message length invalid");
        visitorBook.signVisitorBook(tooLongMessage);
    }

    function testSetMaxMessageLengthUnauthorized() public {
        vm.prank(visitor1);
        vm.expectRevert();
        visitorBook.setMaxMessageLength(1000);
    }

    function testSetMaxMessageLengthInvalidLength() public {
        vm.prank(admin);
        vm.expectRevert("Length must be > 0");
        visitorBook.setMaxMessageLength(0);
    }

    /*//////////////////////////////////////////////////////////////
                            PAUSE FUNCTIONALITY TESTS
    //////////////////////////////////////////////////////////////*/

    function testPauseUnpause() public {
        // Pause contract
        vm.prank(admin);
        visitorBook.pause();

        assertTrue(visitorBook.paused());

        // Try to sign while paused
        vm.prank(visitor1);
        vm.expectRevert(); // Modern OpenZeppelin uses EnforcedPause()
        visitorBook.signVisitorBook("Test message");

        // Unpause
        vm.prank(admin);
        visitorBook.unpause();

        assertFalse(visitorBook.paused());

        // Should work now
        vm.prank(visitor1);
        visitorBook.signVisitorBook("Test message");
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function testGetVisitor() public {
        vm.prank(visitor1);
        visitorBook.signVisitorBook("Test message");

        VisitorBook.Visitor memory visitor = visitorBook.getVisitor(0);
        assertEq(visitor.visitor, visitor1);
        assertEq(visitor.message, "Test message");
        assertEq(visitor.timestamp, block.timestamp);
    }

    function testGetVisitorInvalidIndex() public {
        vm.expectRevert("Index out of bounds");
        visitorBook.getVisitor(0);
    }

    function testGetVisitorsPagination() public {
        // Add multiple visitors
        for (uint256 i = 0; i < 5; i++) {
            address visitor = makeAddr(string(abi.encodePacked("visitor", i)));
            vm.prank(visitor);
            visitorBook.signVisitorBook(string(abi.encodePacked("Message ", i)));
        }

        // Test pagination
        VisitorBook.Visitor[] memory page1 = visitorBook.getVisitors(0, 2);
        assertEq(page1.length, 2);
        assertEq(page1[0].message, "Message 0");
        assertEq(page1[1].message, "Message 1");

        VisitorBook.Visitor[] memory page2 = visitorBook.getVisitors(2, 2);
        assertEq(page2.length, 2);
        assertEq(page2[0].message, "Message 2");
        assertEq(page2[1].message, "Message 3");

        VisitorBook.Visitor[] memory page3 = visitorBook.getVisitors(4, 2);
        assertEq(page3.length, 1);
        assertEq(page3[0].message, "Message 4");
    }

    function testGetVisitorsOffsetOutOfBounds() public {
        vm.expectRevert("Offset out of bounds");
        visitorBook.getVisitors(1, 1); // No visitors yet
    }

    function testGetUserMessages() public {
        vm.startPrank(visitor1);
        visitorBook.signVisitorBook("Message 1");
        visitorBook.signVisitorBook("Message 2");
        visitorBook.signVisitorBook("Message 3");
        vm.stopPrank();

        VisitorBook.Visitor[] memory messages = visitorBook.getUserMessages(visitor1);
        assertEq(messages.length, 3);
        assertEq(messages[0].message, "Message 1");
        assertEq(messages[1].message, "Message 2");
        assertEq(messages[2].message, "Message 3");
    }

    function testGetUserLatestMessage() public {
        vm.prank(visitor1);
        visitorBook.signVisitorBook("First message");

        vm.warp(block.timestamp + 100);

        vm.prank(visitor1);
        visitorBook.signVisitorBook("Latest message");

        VisitorBook.Visitor memory latest = visitorBook.getUserLatestMessage(visitor1);
        assertEq(latest.message, "Latest message");
        assertEq(latest.timestamp, block.timestamp);
    }

    function testGetUserLatestMessageNoVisits() public {
        VisitorBook.Visitor memory empty = visitorBook.getUserLatestMessage(visitor1);
        assertEq(empty.visitor, address(0));
        assertEq(empty.message, "");
        assertEq(empty.timestamp, 0);
    }

    /*//////////////////////////////////////////////////////////////
                            INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testCompleteVisitorFlow() public {
        // 1. Register wallet
        vm.prank(visitor1);
        visitorBook.registerWallet(wallet1, visitor1);

        // 2. Sign via wallet
        string memory message = "Complete visitor flow test!";
        vm.prank(wallet1);
        visitorBook.signVisitorBook(message);

        // 3. Verify data
        assertEq(visitorBook.getTotalVisitors(), 1);
        assertTrue(visitorBook.hasVisited(visitor1));
        assertEq(visitorBook.getVisitCount(visitor1), 1);

        VisitorBook.Visitor memory visitor = visitorBook.getVisitor(0);
        assertEq(visitor.visitor, visitor1);
        assertEq(visitor.message, message);

        // 4. Check user messages
        VisitorBook.Visitor[] memory userMessages = visitorBook.getUserMessages(visitor1);
        assertEq(userMessages.length, 1);
        assertEq(userMessages[0].message, message);
    }

    function testTokenBurningIntegration() public {
        // Ensure visitor has enough tokens
        uint256 burnAmount = tracker.visitorBookSignCost();
        if (burnAmount > 0) {
            vm.prank(admin);
            token.mint(visitor1, burnAmount);
        }

        // Sign visitor book (should burn tokens)
        uint256 balanceBefore = token.balanceOf(visitor1);
        vm.prank(visitor1);
        visitorBook.signVisitorBook("Integration test message");

        if (burnAmount > 0) {
            assertEq(token.balanceOf(visitor1), balanceBefore - burnAmount);
        }
    }

    function testModerationWorkflow() public {
        // Add visitors
        vm.prank(visitor1);
        visitorBook.signVisitorBook("Good message");

        vm.prank(visitor2);
        visitorBook.signVisitorBook("Inappropriate message");

        assertEq(visitorBook.getTotalVisitors(), 2);

        // Moderator removes inappropriate message
        vm.prank(moderator);
        visitorBook.removeVisitor(1); // Remove second visitor

        assertEq(visitorBook.getTotalVisitors(), 1);
        VisitorBook.Visitor memory remaining = visitorBook.getVisitor(0);
        assertEq(remaining.message, "Good message");
    }

    /*//////////////////////////////////////////////////////////////
                            FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzzSignVisitorBook(uint256 numVisitors, string memory message) public {
        numVisitors = bound(numVisitors, 1, 50);
        message = boundStringLength(message, 1, 500);

        uint256 totalVisitors = 0;

        for (uint256 i = 0; i < numVisitors; i++) {
            address visitor = makeAddr(string(abi.encodePacked("fuzz-visitor-", i)));

            // Give tokens if needed
            uint256 burnAmount = tracker.visitorBookSignCost();
            if (burnAmount > 0) {
                vm.prank(admin);
                token.mint(visitor, burnAmount);
            }

            vm.prank(visitor);
            visitorBook.signVisitorBook(message);

            totalVisitors++;
            assertEq(visitorBook.getTotalVisitors(), totalVisitors);
            assertTrue(visitorBook.hasVisited(visitor));
        }
    }

    function testFuzzMessageLengths(uint256 length) public {
        length = bound(length, 1, 500);
        string memory message = generateString(length);

        vm.prank(visitor1);
        visitorBook.signVisitorBook(message);

        VisitorBook.Visitor memory visitor = visitorBook.getVisitor(0);
        assertEq(visitor.message, message);
    }

    function testFuzzPagination(uint256 totalVisitors, uint256 offset, uint256 limit) public {
        totalVisitors = bound(totalVisitors, 1, 100);
        limit = bound(limit, 1, 50);

        // Add visitors
        for (uint256 i = 0; i < totalVisitors; i++) {
            address visitor = makeAddr(string(abi.encodePacked("page-visitor-", i)));
            vm.prank(visitor);
            visitorBook.signVisitorBook(string(abi.encodePacked("Message ", i)));
        }

        // Test pagination
        if (offset < totalVisitors) {
            VisitorBook.Visitor[] memory page = visitorBook.getVisitors(offset, limit);
            uint256 expectedLength = limit < totalVisitors - offset ? limit : totalVisitors - offset;
            assertEq(page.length, expectedLength);
        } else {
            vm.expectRevert("Offset out of bounds");
            visitorBook.getVisitors(offset, limit);
        }
    }

    /*//////////////////////////////////////////////////////////////
                            HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function boundStringLength(string memory str, uint256 minLen, uint256 maxLen) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        uint256 len = strBytes.length;

        if (len < minLen) {
            // Pad with 'a's
            bytes memory padding = new bytes(minLen - len);
            for (uint256 i = 0; i < padding.length; i++) {
                padding[i] = 'a';
            }
            return string(abi.encodePacked(str, padding));
        } else if (len > maxLen) {
            // Truncate
            bytes memory truncated = new bytes(maxLen);
            for (uint256 i = 0; i < maxLen; i++) {
                truncated[i] = strBytes[i];
            }
            return string(truncated);
        }

        return str;
    }

    function generateString(uint256 length) internal pure returns (string memory) {
        bytes memory result = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = bytes1(uint8(97 + (i % 26))); // a-z repeating
        }
        return string(result);
    }

    // Helper to compute EIP-712 hash (since _hashTypedDataV4 is internal)
    function hashTypedDataV4(bytes32 structHash) internal view returns (bytes32) {
        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("VisitorBook")),
                keccak256(bytes("1")),
                block.chainid,
                address(visitorBook)
            )
        );
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
    }
}
