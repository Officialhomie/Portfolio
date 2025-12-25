// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/Homie.sol";
import "../contracts/UserInteractionTracker.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title HomieTokenTest
 * @notice Comprehensive tests for Homie token contract
 * @dev Tests faucet claims, biometric authentication, smart wallet integration,
 *      token burning mechanics, and security features
 */
contract HomieTokenTest is Test {
    PortfolioToken public token;
    UserInteractionTracker public tracker;

    address public admin = makeAddr("admin");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public wallet1 = makeAddr("wallet1");
    address public wallet2 = makeAddr("wallet2");

    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18;
    uint256 public constant FAUCET_AMOUNT = 100 * 10**18;
    uint256 public constant FAUCET_COOLDOWN = 1 days;

    event FaucetClaimed(address indexed recipient, uint256 amount);
    event TokensMinted(address indexed to, uint256 amount);

    function setUp() public {
        vm.startPrank(admin);

        // Deploy token first
        token = new PortfolioToken();

        // Deploy tracker with token address
        tracker = new UserInteractionTracker(address(token));

        // Grant tracker role to tracker contract
        tracker.grantTrackerRole(address(tracker));

        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                            BASIC FUNCTIONALITY TESTS
    //////////////////////////////////////////////////////////////*/

    function testInitialSetup() public {
        // Check initial supply
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.balanceOf(admin), INITIAL_SUPPLY);

        // Check token metadata
        assertEq(token.name(), "Homie Token");
        assertEq(token.symbol(), "HOMIE");
        assertEq(token.decimals(), 18);

        // Check roles
        assertTrue(token.hasRole(token.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(token.hasRole(token.MINTER_ROLE(), admin));
        assertTrue(token.hasRole(token.FAUCET_ROLE(), admin));

        // Check constants
        assertEq(token.INITIAL_SUPPLY(), INITIAL_SUPPLY);
        assertEq(token.FAUCET_AMOUNT(), FAUCET_AMOUNT);
        assertEq(token.FAUCET_COOLDOWN(), FAUCET_COOLDOWN);
        assertEq(token.maxSupply(), 10_000_000 * 10**18);
    }

    function testFaucetClaim() public {
        vm.startPrank(user1);

        uint256 initialBalance = token.balanceOf(user1);
        uint256 initialSupply = token.totalSupply();

        vm.expectEmit(true, false, false, true);
        emit FaucetClaimed(user1, FAUCET_AMOUNT);

        token.claimFaucet();

        assertEq(token.balanceOf(user1), initialBalance + FAUCET_AMOUNT);
        assertEq(token.totalSupply(), initialSupply + FAUCET_AMOUNT);
        assertTrue(token.hasClaimedFaucet(user1));
        assertEq(token.lastFaucetClaim(user1), block.timestamp);

        vm.stopPrank();
    }

    function testFaucetCooldown() public {
        vm.startPrank(user1);

        // First claim
        token.claimFaucet();
        uint256 firstClaimTime = block.timestamp;

        // Try to claim again immediately - should fail
        vm.expectRevert("Faucet cooldown active");
        token.claimFaucet();

        // Warp time forward but not enough
        vm.warp(firstClaimTime + FAUCET_COOLDOWN - 1);
        vm.expectRevert("Faucet cooldown active");
        token.claimFaucet();

        // Warp to exact cooldown time
        vm.warp(firstClaimTime + FAUCET_COOLDOWN);
        token.claimFaucet(); // Should succeed

        vm.stopPrank();
    }

    function testFaucetMaxSupplyLimit() public {
        // Set max supply close to current supply
        uint256 currentSupply = token.totalSupply();
        vm.prank(admin);
        token.setMaxSupply(currentSupply + FAUCET_AMOUNT - 1);

        vm.prank(user1);
        vm.expectRevert("Max supply exceeded");
        token.claimFaucet();
    }

    function testBatchMint() public {
        address[] memory recipients = new address[](3);
        recipients[0] = user1;
        recipients[1] = user2;
        recipients[2] = wallet1;

        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 1000 * 10**18;
        amounts[1] = 2000 * 10**18;
        amounts[2] = 1500 * 10**18;

        uint256 initialSupply = token.totalSupply();

        vm.prank(admin);
        token.batchMint(recipients, amounts);

        assertEq(token.balanceOf(user1), amounts[0]);
        assertEq(token.balanceOf(user2), amounts[1]);
        assertEq(token.balanceOf(wallet1), amounts[2]);
        assertEq(token.totalSupply(), initialSupply + amounts[0] + amounts[1] + amounts[2]);
    }

    function testBatchMintArrayLengthMismatch() public {
        address[] memory recipients = new address[](2);
        uint256[] memory amounts = new uint256[](3);

        vm.prank(admin);
        vm.expectRevert("Arrays length mismatch");
        token.batchMint(recipients, amounts);
    }

    function testBatchMintZeroAddress() public {
        address[] memory recipients = new address[](2);
        recipients[0] = user1;
        recipients[1] = address(0);

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1000 * 10**18;
        amounts[1] = 2000 * 10**18;

        vm.prank(admin);
        vm.expectRevert("Zero address");
        token.batchMint(recipients, amounts);
    }

    /*//////////////////////////////////////////////////////////////
                        SMART WALLET INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testWalletRegistration() public {
        vm.prank(user1);
        token.registerWallet(wallet1, user1);

        assertEq(token.walletToUser(wallet1), user1);

        // Test reverse registration
        vm.prank(user2);
        token.registerWallet(wallet2, user2);
        assertEq(token.walletToUser(wallet2), user2);
    }

    function testWalletRegistrationByWallet() public {
        vm.prank(wallet1);
        token.registerWallet(wallet1, user1);

        assertEq(token.walletToUser(wallet1), user1);
    }

    function testWalletRegistrationUnauthorized() public {
        vm.prank(user2); // Wrong user
        vm.expectRevert("Not authorized");
        token.registerWallet(wallet1, user1);
    }

    function testWalletAlreadyRegistered() public {
        vm.prank(user1);
        token.registerWallet(wallet1, user1);

        vm.prank(user2);
        vm.expectRevert("Wallet already registered");
        token.registerWallet(wallet1, user2);
    }

    function testFaucetClaimViaWallet() public {
        // Register wallet
        vm.prank(user1);
        token.registerWallet(wallet1, user1);

        // Claim via wallet
        vm.prank(wallet1);
        token.claimFaucet();

        assertEq(token.balanceOf(user1), FAUCET_AMOUNT);
        assertTrue(token.hasClaimedFaucet(user1));
    }

    function testExecuteForFaucetClaim() public {
        // Register wallet
        vm.prank(user1);
        token.registerWallet(wallet1, user1);

        // Execute faucet claim for user via smart wallet
        vm.prank(wallet1);
        token.executeFor(user1);

        assertEq(token.balanceOf(user1), FAUCET_AMOUNT);
        assertTrue(token.hasClaimedFaucet(user1));
    }

    function testExecuteForUnauthorized() public {
        // Register wallet for user1
        vm.prank(user1);
        token.registerWallet(wallet1, user1);

        // Try to execute for user2 via user1's wallet
        vm.prank(wallet1);
        vm.expectRevert("Wallet not authorized for user");
        token.executeFor(user2);
    }

    /*//////////////////////////////////////////////////////////////
                            PAUSE FUNCTIONALITY TESTS
    //////////////////////////////////////////////////////////////*/

    function testPauseUnpause() public {
        // Pause contract
        vm.prank(admin);
        token.pause();

        assertTrue(token.paused());

        // Try to claim faucet while paused
        vm.prank(user1);
        vm.expectRevert(); // Modern OpenZeppelin uses EnforcedPause()
        token.claimFaucet();

        // Unpause
        vm.prank(admin);
        token.unpause();

        assertFalse(token.paused());

        // Should work now
        vm.prank(user1);
        token.claimFaucet();
    }

    function testPauseUnauthorized() public {
        vm.prank(user1);
        vm.expectRevert();
        token.pause();
    }

    /*//////////////////////////////////////////////////////////////
                            ACCESS CONTROL TESTS
    //////////////////////////////////////////////////////////////*/

    function testMintUnauthorized() public {
        vm.prank(user1);
        vm.expectRevert();
        token.mint(user1, 1000 * 10**18);
    }

    function testSetMaxSupplyUnauthorized() public {
        vm.prank(user1);
        vm.expectRevert();
        token.setMaxSupply(20_000_000 * 10**18);
    }

    function testSetMaxSupplyTooLow() public {
        uint256 currentSupply = token.totalSupply();
        vm.prank(admin);
        vm.expectRevert("Max supply too low");
        token.setMaxSupply(currentSupply - 1);
    }

    function testMintToZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert("Cannot mint to zero address");
        token.mint(address(0), 1000 * 10**18);
    }

    function testMintExceedsMaxSupply() public {
        uint256 maxSupply = token.maxSupply();
        uint256 currentSupply = token.totalSupply();
        vm.prank(admin);
        vm.expectRevert("Max supply exceeded");
        token.mint(user1, maxSupply - currentSupply + 1);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function testCanClaimFaucet() public {
        // New user should be able to claim
        (bool canClaim, uint256 timeUntilClaim) = token.canClaimFaucet(user1);
        assertTrue(canClaim);
        assertEq(timeUntilClaim, 0);

        // After claiming
        vm.prank(user1);
        token.claimFaucet();

        // Should not be able to claim again immediately
        (canClaim, timeUntilClaim) = token.canClaimFaucet(user1);
        assertFalse(canClaim);
        assertEq(timeUntilClaim, FAUCET_COOLDOWN);

        // After cooldown
        vm.warp(block.timestamp + FAUCET_COOLDOWN);
        (canClaim, timeUntilClaim) = token.canClaimFaucet(user1);
        assertTrue(canClaim);
        assertEq(timeUntilClaim, 0);
    }

    /*//////////////////////////////////////////////////////////////
                            INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testCompleteUserFlow() public {
        // 1. User registers wallet
        vm.prank(user1);
        token.registerWallet(wallet1, user1);

        // 2. Claims tokens via wallet
        vm.prank(wallet1);
        token.claimFaucet();
        assertEq(token.balanceOf(user1), FAUCET_AMOUNT);

        // 3. Admin mints additional tokens
        vm.prank(admin);
        token.mint(user1, 1000 * 10**18);
        assertEq(token.balanceOf(user1), FAUCET_AMOUNT + 1000 * 10**18);

        // 4. Test cooldown mechanics
        vm.warp(block.timestamp + FAUCET_COOLDOWN);
        vm.prank(wallet1);
        token.claimFaucet(); // Should work after cooldown
        assertEq(token.balanceOf(user1), FAUCET_AMOUNT + 1000 * 10**18 + FAUCET_AMOUNT);
    }

    function testTokenBurningIntegration() public {
        // Setup: give user tokens
        vm.prank(admin);
        token.mint(user1, 1000 * 10**18);

        // User must approve tracker to burn their tokens
        vm.prank(user1);
        token.approve(address(tracker), 100 * 10**18);

        // Grant tracker role to burn tokens
        vm.prank(admin);
        tracker.grantTrackerRole(address(tracker));

        // Simulate burning via tracker (this would normally happen through interaction)
        vm.prank(address(tracker));
        token.burnFrom(user1, 100 * 10**18);

        assertEq(token.balanceOf(user1), 900 * 10**18);
    }

    /*//////////////////////////////////////////////////////////////
                            FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzzBatchMint(uint256 numRecipients, uint256 amountPerRecipient) public {
        // Bound inputs to reasonable values
        numRecipients = bound(numRecipients, 1, 50);
        amountPerRecipient = bound(amountPerRecipient, 1, 10000 * 10**18);

        // Ensure we don't exceed max supply
        uint256 totalAmount = numRecipients * amountPerRecipient;
        vm.assume(totalAmount <= token.maxSupply() - token.totalSupply());

        address[] memory recipients = new address[](numRecipients);
        uint256[] memory amounts = new uint256[](numRecipients);

        for (uint256 i = 0; i < numRecipients; i++) {
            recipients[i] = makeAddr(string(abi.encodePacked("user", i)));
            amounts[i] = amountPerRecipient;
        }

        uint256 initialSupply = token.totalSupply();

        vm.prank(admin);
        token.batchMint(recipients, amounts);

        assertEq(token.totalSupply(), initialSupply + totalAmount);

        for (uint256 i = 0; i < numRecipients; i++) {
            assertEq(token.balanceOf(recipients[i]), amountPerRecipient);
        }
    }

    function testFuzzMintAmount(uint256 amount) public {
        amount = bound(amount, 1, token.maxSupply() - token.totalSupply());

        vm.prank(admin);
        token.mint(user1, amount);

        assertEq(token.balanceOf(user1), amount);
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
