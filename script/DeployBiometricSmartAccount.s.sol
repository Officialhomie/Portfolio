// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {PasskeyAccountFactory} from "../contracts/BiometricSmartAccountFactory.sol";
import {PasskeyAccount} from "../contracts/BiometricSmartAccount.sol";
import {IEntryPoint} from "../contracts/interfaces/IEntryPoint.sol";

/**
 * @title DeployBiometricSmartAccount
 * @notice Foundry deployment script for ERC-4337 BiometricSmartAccount system
 * @dev Deploys the factory and implementation contracts for CDP Paymaster integration
 *
 * Usage:
 *   forge script script/DeployBiometricSmartAccount.s.sol:DeployBiometricSmartAccount \
 *     --rpc-url $BASE_RPC_URL \
 *     --account deployer \
 *     --broadcast \
 *     --verify
 *
 * Networks:
 *   - Base Mainnet: --rpc-url https://mainnet.base.org
 *   - Base Sepolia: --rpc-url https://sepolia.base.org
 */
contract DeployBiometricSmartAccount is Script {
    // ERC-4337 EntryPoint (v0.6.0) - Same address on all chains
    address constant ENTRYPOINT_ADDRESS = 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789;

    function run() external {
        // Use cast account system via --account flag
        vm.startBroadcast();

        console.log("\n===========================================");
        console.log("Deploying BiometricSmartAccount System");
        console.log("===========================================\n");

        console.log("Deployer:", msg.sender);
        console.log("Chain ID:", block.chainid);
        console.log("EntryPoint:", ENTRYPOINT_ADDRESS);
        console.log("");

        // Deploy Factory (which auto-deploys implementation)
        console.log("Deploying BiometricSmartAccountFactory...");
        PasskeyAccountFactory factory = new PasskeyAccountFactory(
            IEntryPoint(ENTRYPOINT_ADDRESS)
        );
        console.log("Factory deployed at:", address(factory));

        // Get implementation address
        address implementation = address(factory.accountImplementation());
        console.log("Implementation deployed at:", implementation);

        vm.stopBroadcast();

        // Print deployment summary
        console.log("\n===========================================");
        console.log("DEPLOYMENT SUMMARY");
        console.log("===========================================");
        console.log("Network Chain ID:", block.chainid);
        console.log("EntryPoint:", ENTRYPOINT_ADDRESS);
        console.log("Factory:", address(factory));
        console.log("Implementation:", implementation);
        console.log("===========================================\n");

        // Frontend environment variables
        console.log("Add to .env.local:\n");
        console.log("NEXT_PUBLIC_ENTRYPOINT_ADDRESS=%s", ENTRYPOINT_ADDRESS);

        if (block.chainid == 8453) {
            // Base Mainnet
            console.log("NEXT_PUBLIC_BIOMETRIC_ACCOUNT_FACTORY_BASE=%s", address(factory));
            console.log("NEXT_PUBLIC_BIOMETRIC_ACCOUNT_IMPLEMENTATION_BASE=%s\n", implementation);
        } else if (block.chainid == 84532) {
            // Base Sepolia
            console.log("NEXT_PUBLIC_BIOMETRIC_ACCOUNT_FACTORY_BASE_SEPOLIA=%s", address(factory));
            console.log("NEXT_PUBLIC_BIOMETRIC_ACCOUNT_IMPLEMENTATION_BASE_SEPOLIA=%s\n", implementation);
        } else {
            console.log("NEXT_PUBLIC_BIOMETRIC_ACCOUNT_FACTORY=%s", address(factory));
            console.log("NEXT_PUBLIC_BIOMETRIC_ACCOUNT_IMPLEMENTATION=%s\n", implementation);
        }

        // CDP Paymaster configuration instructions
        console.log("===========================================");
        console.log("CDP PAYMASTER CONFIGURATION");
        console.log("===========================================");
        console.log("1. Go to: https://portal.cdp.coinbase.com/products/paymaster/configuration");
        console.log("2. Select network: Base %s", block.chainid == 8453 ? "Mainnet" : "Sepolia");
        console.log("3. Enable Paymaster toggle");
        console.log("4. Add these contracts to allowlist:\n");
        console.log("   Factory (CRITICAL):");
        console.log("   %s\n", address(factory));
        console.log("   Your existing contracts:");
        console.log("   0x19573561A147fdb6105762C965a66db6Cb2510F6  (PortfolioToken)");
        console.log("   0xF61a59B7B383D46DEcD0Cc4ca7c239871A53686C  (VisitorBook)");
        console.log("   0x2304C17AD225bE17F968dE529CFd96A80D38f467  (ProjectVoting)");
        console.log("   0xc0c257a95BbF359c8230b5A24Db96c422F24424C  (ProjectNFT)");
        console.log("   0xa9f173D7260788701C71427C9Ecc76d553d8ffA3  (VisitNFT)");
        console.log("===========================================\n");

        // Verification command
        console.log("To verify contracts:");
        console.log("forge verify-contract %s \\", address(factory));
        console.log("  contracts/BiometricSmartAccountFactory.sol:PasskeyAccountFactory \\");
        console.log("  --chain-id %s \\", block.chainid);
        console.log("  --constructor-args $(cast abi-encode 'constructor(address)' %s)\n", ENTRYPOINT_ADDRESS);

        console.log("forge verify-contract %s \\", implementation);
        console.log("  contracts/BiometricSmartAccount.sol:PasskeyAccount \\");
        console.log("  --chain-id %s \\", block.chainid);
        console.log("  --constructor-args $(cast abi-encode 'constructor(address)' %s)\n", ENTRYPOINT_ADDRESS);

        console.log("Deployment complete!\n");
    }
}
