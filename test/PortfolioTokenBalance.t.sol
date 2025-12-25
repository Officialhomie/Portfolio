// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/PortfolioToken.sol";

/**
 * @title PortfolioTokenBalanceTest
 * @notice Comprehensive tests for PortfolioToken balance reading and minting logic
 * Tests balance consistency with registered and unregistered smart wallets
 */
contract PortfolioTokenBalanceTest is Test {
    PortfolioToken public token;
    
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public smartWalletAlice = address(0x1001);
    address public smartWalletBob = address(0x1002);

    event FaucetClaimed(address indexed recipient, uint256 amount);
    event WalletRegistered(address indexed walletAddress, address indexed userAddress);

    function setUp() public {
        token = new PortfolioToken();
    }

    /*//////////////////////////////////////////////////////////////
                    DIRECT EOA MINTING TESTS
    //////////////////////////////////////////////////////////////*/

    function testDirectEOAClaimFaucet() public {
        vm.prank(alice);
        token.claimFaucet();

        uint256 aliceBalance = token.balanceOf(alice);
        uint256 smartWalletBalance = token.balanceOf(smartWalletAlice);

        assertEq(aliceBalance, 100 * 10**18, "Alice should have 100 tokens");
        assertEq(smartWalletBalance, 0, "Smart wallet should have 0 tokens");
    }

    function testDirectEOABalanceConsistency() public {
        vm.prank(alice);
        token.claimFaucet();

        vm.prank(bob);
        token.claimFaucet();

        uint256 aliceBalance = token.balanceOf(alice);
        uint256 bobBalance = token.balanceOf(bob);
        uint256 totalSupply = token.totalSupply();

        // Initial supply (1M) + 2 faucet claims (200)
        assertEq(totalSupply, 1_000_000 * 10**18 + 200 * 10**18, "Total supply should be correct");
        assertEq(aliceBalance + bobBalance, 200 * 10**18, "Sum of balances should equal minted amount");
    }

    /*//////////////////////////////////////////////////////////////
                REGISTERED SMART WALLET MINTING TESTS
    //////////////////////////////////////////////////////////////*/

    function testRegisteredSmartWalletMinting() public {
        // Register smart wallet for Alice
        vm.prank(smartWalletAlice);
        token.registerWallet(smartWalletAlice, alice);

        // Claim faucet via smart wallet
        vm.prank(smartWalletAlice);
        token.claimFaucet();

        uint256 aliceBalance = token.balanceOf(alice);
        uint256 smartWalletBalance = token.balanceOf(smartWalletAlice);

        assertEq(aliceBalance, 100 * 10**18, "Tokens should be minted to EOA");
        assertEq(smartWalletBalance, 0, "Smart wallet should have 0 tokens");
    }

    function testRegisteredSmartWalletMultipleClaims() public {
        // Register smart wallet
        vm.prank(smartWalletAlice);
        token.registerWallet(smartWalletAlice, alice);

        // First claim
        vm.prank(smartWalletAlice);
        token.claimFaucet();

        // Wait for cooldown
        vm.warp(block.timestamp + 1 days);

        // Second claim
        vm.prank(smartWalletAlice);
        token.claimFaucet();

        uint256 aliceBalance = token.balanceOf(alice);
        assertEq(aliceBalance, 200 * 10**18, "Alice should have 200 tokens after two claims");
    }

    /*//////////////////////////////////////////////////////////////
              UNREGISTERED SMART WALLET MINTING TESTS
    //////////////////////////////////////////////////////////////*/

    function testUnregisteredSmartWalletMinting() public {
        // Claim faucet via unregistered smart wallet
        vm.prank(smartWalletAlice);
        token.claimFaucet();

        uint256 aliceBalance = token.balanceOf(alice);
        uint256 smartWalletBalance = token.balanceOf(smartWalletAlice);

        assertEq(aliceBalance, 0, "EOA should have 0 tokens");
        assertEq(smartWalletBalance, 100 * 10**18, "Tokens should be minted to smart wallet");
    }

    function testUnregisteredThenRegisteredMinting() public {
        // First claim: unregistered
        vm.prank(smartWalletAlice);
        token.claimFaucet();

        uint256 smartWalletBalance1 = token.balanceOf(smartWalletAlice);
        assertEq(smartWalletBalance1, 100 * 10**18, "First claim goes to smart wallet");

        // Register wallet
        vm.prank(smartWalletAlice);
        token.registerWallet(smartWalletAlice, alice);

        // Wait for cooldown
        vm.warp(block.timestamp + 1 days);

        // Second claim: registered
        vm.prank(smartWalletAlice);
        token.claimFaucet();

        uint256 aliceBalance = token.balanceOf(alice);
        uint256 smartWalletBalance2 = token.balanceOf(smartWalletAlice);

        // Tokens from first claim remain in smart wallet
        assertEq(smartWalletBalance2, 100 * 10**18, "Smart wallet keeps first claim tokens");
        // Second claim goes to EOA
        assertEq(aliceBalance, 100 * 10**18, "Second claim goes to EOA");
    }

    /*//////////////////////////////////////////////////////////////
                        REGISTRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testRegisterWallet() public {
        vm.prank(smartWalletAlice);
        token.registerWallet(smartWalletAlice, alice);

        address registeredUser = token.walletToUser(smartWalletAlice);
        assertEq(registeredUser, alice, "Wallet should be registered to Alice");
    }

    function testCannotRegisterTwice() public {
        vm.prank(smartWalletAlice);
        token.registerWallet(smartWalletAlice, alice);

        vm.prank(smartWalletAlice);
        vm.expectRevert("Wallet already registered");
        token.registerWallet(smartWalletAlice, bob);
    }

    function testCannotRegisterZeroAddress() public {
        vm.prank(smartWalletAlice);
        vm.expectRevert("Invalid user address");
        token.registerWallet(smartWalletAlice, address(0));
    }

    function testCannotRegisterZeroWallet() public {
        vm.prank(alice);
        vm.expectRevert("Invalid wallet address");
        token.registerWallet(address(0), alice);
    }

    function testRegistrationAuthorization() public {
        // Smart wallet can register itself
        vm.prank(smartWalletAlice);
        token.registerWallet(smartWalletAlice, alice);

        // EOA can also register
        vm.prank(bob);
        token.registerWallet(smartWalletBob, bob);
    }

    /*//////////////////////////////////////////////////////////////
                    BALANCE CONSISTENCY TESTS
    //////////////////////////////////////////////////////////////*/

    function testBalanceConsistencyAfterRegistration() public {
        // Mint to smart wallet (unregistered)
        vm.prank(smartWalletAlice);
        token.claimFaucet();

        uint256 beforeBalance = token.balanceOf(smartWalletAlice);

        // Register wallet
        vm.prank(smartWalletAlice);
        token.registerWallet(smartWalletAlice, alice);

        // Registration doesn't move existing tokens
        uint256 afterBalance = token.balanceOf(smartWalletAlice);
        assertEq(beforeBalance, afterBalance, "Registration shouldn't move existing tokens");
    }

    function testTotalSupplyConsistency() public {
        vm.prank(alice);
        token.claimFaucet();

        vm.prank(smartWalletBob);
        token.registerWallet(smartWalletBob, bob);
        vm.prank(smartWalletBob);
        token.claimFaucet();

        uint256 totalSupply = token.totalSupply();
        uint256 aliceBalance = token.balanceOf(alice);
        uint256 bobBalance = token.balanceOf(bob);
        uint256 smartWalletBalance = token.balanceOf(smartWalletBob);

        // Initial supply (1M) + 2 claims (200)
        assertEq(totalSupply, 1_000_000 * 10**18 + 200 * 10**18, "Total supply should match");
        assertEq(aliceBalance + bobBalance + smartWalletBalance, 200 * 10**18, "Sum should equal minted");
    }

    function testBalanceReadingAccuracy() public {
        // Register and claim
        vm.prank(smartWalletAlice);
        token.registerWallet(smartWalletAlice, alice);
        vm.prank(smartWalletAlice);
        token.claimFaucet();

        // Balance should be readable from EOA
        uint256 eoaBalance = token.balanceOf(alice);
        uint256 smartWalletBalance = token.balanceOf(smartWalletAlice);

        assertEq(eoaBalance, 100 * 10**18, "EOA balance should be correct");
        assertEq(smartWalletBalance, 0, "Smart wallet balance should be 0");
    }
}


