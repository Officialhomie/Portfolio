// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";

// Existing Contracts (Already Deployed - Reference Only)
import {VisitorBook} from "../contracts/VisitorBook.sol";
import {ProjectNFT} from "../contracts/ProjectNFT.sol";
import {ProjectVoting} from "../contracts/ProjectVoting.sol";
import {VisitNFT} from "../contracts/VisitNFT.sol";
import {PortfolioToken} from "../contracts/Homie.sol";

// NEW: ERC-4337 Smart Account Contracts
import {SmartAccountFactory} from "../contracts/SmartAccountFactory.sol";
import {SmartAccount} from "../contracts/SmartAccount.sol";
import {IEntryPoint} from "../contracts/interfaces/IEntryPoint.sol";

/**
 * @title DeployAll
 * @notice Unified deployment script for entire Web3 Portfolio system
 * @dev Deploys both legacy and ERC-4337 infrastructure
 *
 * Usage:
 *   forge script script/DeployAll.s.sol:DeployAll \
 *     --rpc-url $BASE_RPC_URL \
 *     --account deployer \
 *     --broadcast \
 *     --verify
 */
contract DeployAll is Script {
    // ERC-4337 EntryPoint (standard across all chains)
    address constant ENTRYPOINT_ADDRESS = 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789;

    function run() external {
        vm.startBroadcast();

        console.log("\n=================================================================================");
        console.log("DEPLOYING WEB3 PORTFOLIO - COMPLETE SYSTEM");
        console.log("=================================================================================");
        console.log("Deployer:", msg.sender);
        console.log("Chain ID:", block.chainid);
        console.log("Balance:", msg.sender.balance);
        console.log("=================================================================================\n");

        // ========================================================================
        // PART 1: CORE APPLICATION CONTRACTS
        // ========================================================================

        console.log("PART 1: Core Application Contracts");
        console.log("---------------------------------------------------------------------------------");

        // 1. Portfolio Token (HOMIE)
        console.log("Deploying PortfolioToken (HOMIE)...");
        PortfolioToken portfolioToken = new PortfolioToken();
        console.log("  PortfolioToken:", address(portfolioToken));

        // 2. Visitor Book
        console.log("Deploying VisitorBook...");
        VisitorBook visitorBook = new VisitorBook();
        console.log("  VisitorBook:", address(visitorBook));

        // 3. Project NFT
        console.log("Deploying ProjectNFT...");
        ProjectNFT projectNFT = new ProjectNFT();
        console.log("  ProjectNFT:", address(projectNFT));

        // 4. Project Voting (requires PortfolioToken)
        console.log("Deploying ProjectVoting...");
        ProjectVoting projectVoting = new ProjectVoting(address(portfolioToken));
        console.log("  ProjectVoting:", address(projectVoting));

        // 5. Visit NFT
        console.log("Deploying VisitNFT...");
        VisitNFT visitNFT = new VisitNFT();
        console.log("  VisitNFT:", address(visitNFT));

        console.log("");

        // ========================================================================
        // PART 2: ERC-4337 + FUSAKA R1 INFRASTRUCTURE
        // ========================================================================

        console.log("PART 2: ERC-4337 + Fusaka R1 Smart Account System");
        console.log("---------------------------------------------------------------------------------");
        console.log("EntryPoint:", ENTRYPOINT_ADDRESS);

        // 6. SmartAccount Factory (deploys implementation automatically)
        console.log("Deploying SmartAccountFactory...");
        SmartAccountFactory accountFactory = new SmartAccountFactory(
            IEntryPoint(ENTRYPOINT_ADDRESS)
        );
        console.log("  Factory:", address(accountFactory));

        // Get implementation address
        address accountImplementation = address(accountFactory.accountImplementation());
        console.log("  Implementation:", accountImplementation);

        console.log("");

        vm.stopBroadcast();

        // ========================================================================
        // DEPLOYMENT SUMMARY
        // ========================================================================

        console.log("=================================================================================");
        console.log("DEPLOYMENT SUMMARY");
        console.log("=================================================================================");

        console.log("\nCORE CONTRACTS:");
        console.log("  PortfolioToken:", address(portfolioToken));
        console.log("  VisitorBook:", address(visitorBook));
        console.log("  ProjectNFT:", address(projectNFT));
        console.log("  ProjectVoting:", address(projectVoting));
        console.log("  VisitNFT:", address(visitNFT));

        console.log("\nERC-4337 INFRASTRUCTURE:");
        console.log("  EntryPoint:", ENTRYPOINT_ADDRESS);
        console.log("  Account Factory:", address(accountFactory));
        console.log("  Account Implementation:", accountImplementation);

        console.log("\n=================================================================================");

        // ========================================================================
        // ENVIRONMENT VARIABLES
        // ========================================================================

        console.log("\nADD TO .env.local:");
        console.log("---------------------------------------------------------------------------------");

        string memory network = block.chainid == 8453 ? "BASE" : block.chainid == 84532 ? "BASE_SEPOLIA" : "UNKNOWN";

        console.log("\n# Core Contracts");
        console.log("NEXT_PUBLIC_PORTFOLIO_TOKEN_%s=%s", network, address(portfolioToken));
        console.log("NEXT_PUBLIC_VISITOR_BOOK_%s=%s", network, address(visitorBook));
        console.log("NEXT_PUBLIC_PROJECT_NFT_%s=%s", network, address(projectNFT));
        console.log("NEXT_PUBLIC_PROJECT_VOTING_%s=%s", network, address(projectVoting));
        console.log("NEXT_PUBLIC_VISIT_NFT_%s=%s", network, address(visitNFT));

        console.log("\n# ERC-4337 Infrastructure");
        console.log("NEXT_PUBLIC_ENTRYPOINT_ADDRESS=%s", ENTRYPOINT_ADDRESS);
        console.log("NEXT_PUBLIC_PASSKEY_ACCOUNT_FACTORY_%s=%s", network, address(accountFactory));
        console.log("NEXT_PUBLIC_PASSKEY_ACCOUNT_IMPLEMENTATION_%s=%s", network, accountImplementation);

        // ========================================================================
        // CDP PAYMASTER CONFIGURATION
        // ========================================================================

        console.log("\n=================================================================================");
        console.log("CDP PAYMASTER ALLOWLIST CONFIGURATION");
        console.log("=================================================================================");
        console.log("\n1. Visit: https://portal.cdp.coinbase.com/products/paymaster/configuration");
        console.log("2. Select Network: %s", block.chainid == 8453 ? "Base Mainnet" : "Base Sepolia");
        console.log("3. Enable Paymaster Toggle");
        console.log("4. Add ALL these contracts to allowlist:\n");

        console.log("CRITICAL - Account Factory (MUST be first):");
        console.log("  %s\n", address(accountFactory));

        console.log("Application Contracts:");
        console.log("  %s  (PortfolioToken)", address(portfolioToken));
        console.log("  %s  (VisitorBook)", address(visitorBook));
        console.log("  %s  (ProjectVoting)", address(projectVoting));
        console.log("  %s  (ProjectNFT)", address(projectNFT));
        console.log("  %s  (VisitNFT)", address(visitNFT));

        console.log("\n=================================================================================");

        // ========================================================================
        // VERIFICATION COMMANDS
        // ========================================================================

        if (block.chainid != 31337) { // Not local
            console.log("\nVERIFICATION COMMANDS:");
            console.log("---------------------------------------------------------------------------------");

            console.log("\n# Core Contracts");
            console.log("forge verify-contract %s contracts/Homie.sol:PortfolioToken --chain-id %s", address(portfolioToken), block.chainid);
            console.log("forge verify-contract %s contracts/VisitorBook.sol:VisitorBook --chain-id %s", address(visitorBook), block.chainid);
            console.log("forge verify-contract %s contracts/ProjectNFT.sol:ProjectNFT --chain-id %s", address(projectNFT), block.chainid);
            console.log("forge verify-contract %s contracts/ProjectVoting.sol:ProjectVoting --chain-id %s --constructor-args $(cast abi-encode 'constructor(address)' %s)", address(projectVoting), block.chainid, address(portfolioToken));
            console.log("forge verify-contract %s contracts/VisitNFT.sol:VisitNFT --chain-id %s", address(visitNFT), block.chainid);

            console.log("\n# ERC-4337 Contracts");
            console.log("forge verify-contract %s contracts/SmartAccountFactory.sol:SmartAccountFactory --chain-id %s --constructor-args $(cast abi-encode 'constructor(address)' %s)", address(accountFactory), block.chainid, ENTRYPOINT_ADDRESS);
            console.log("forge verify-contract %s contracts/SmartAccount.sol:SmartAccount --chain-id %s --constructor-args $(cast abi-encode 'constructor(address)' %s)", accountImplementation, block.chainid, ENTRYPOINT_ADDRESS);

            console.log("\n=================================================================================");
        }

        console.log("\nDEPLOYMENT COMPLETE!");
        console.log("=================================================================================\n");
    }
}
