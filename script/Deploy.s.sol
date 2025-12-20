// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {VisitorBook} from "../contracts/VisitorBook.sol";
import {ProjectNFT} from "../contracts/ProjectNFT.sol";
import {ProjectVoting} from "../contracts/ProjectVoting.sol";
import {VisitNFT} from "../contracts/VisitNFT.sol";
import {PortfolioToken} from "../contracts/Homie.sol";
import {BiometricWalletFactory} from "../contracts/BiometricWalletFactory.sol";
import {DeploymentPaymaster} from "../contracts/DeploymentPaymaster.sol";

contract DeployScript is Script {
    function run() external {
        // Use cast account system via --account flag
        vm.startBroadcast();

        console.log("Deploying contracts to Base Mainnet...");

        // 1. Deploy Portfolio Token first (needed by ProjectVoting)
        PortfolioToken portfolioToken = new PortfolioToken();
        console.log("PortfolioToken deployed at:", address(portfolioToken));

        // 2. Deploy Visitor Book
        VisitorBook visitorBook = new VisitorBook();
        console.log("VisitorBook deployed at:", address(visitorBook));

        // 3. Deploy Project NFT
        ProjectNFT projectNFT = new ProjectNFT();
        console.log("ProjectNFT deployed at:", address(projectNFT));

        // 4. Deploy Project Voting (requires PortfolioToken address)
        ProjectVoting projectVoting = new ProjectVoting(address(portfolioToken));
        console.log("ProjectVoting deployed at:", address(projectVoting));

        // 5. Deploy Visit NFT
        VisitNFT visitNFT = new VisitNFT();
        console.log("VisitNFT deployed at:", address(visitNFT));

        // 6. Deploy Deployment Paymaster (for sponsoring wallet deployments)
        DeploymentPaymaster paymaster = new DeploymentPaymaster(msg.sender);
        console.log("DeploymentPaymaster deployed at:", address(paymaster));
        
        // Fund paymaster (optional - can be done later)
        // paymaster.fundPaymaster{value: 0.1 ether}();

        // 7. Deploy Biometric Wallet Factory (with paymaster address)
        BiometricWalletFactory walletFactory = new BiometricWalletFactory(address(paymaster));
        console.log("BiometricWalletFactory deployed at:", address(walletFactory));

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("PortfolioToken:", address(portfolioToken));
        console.log("VisitorBook:", address(visitorBook));
        console.log("ProjectNFT:", address(projectNFT));
        console.log("ProjectVoting:", address(projectVoting));
        console.log("VisitNFT:", address(visitNFT));
        console.log("DeploymentPaymaster:", address(paymaster));
        console.log("BiometricWalletFactory:", address(walletFactory));
        console.log("\nUpdate these addresses in:");
        console.log("- src/lib/contracts/addresses.ts");
        console.log("- .env file (if used)");
    }
}


