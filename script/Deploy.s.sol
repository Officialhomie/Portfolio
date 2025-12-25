// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {VisitorBook} from "../contracts/VisitorBook.sol";
import {ProjectNFT} from "../contracts/ProjectNFT.sol";
import {ProjectVoting} from "../contracts/ProjectVoting.sol";
import {VisitNFT} from "../contracts/VisitNFT.sol";
import {PortfolioToken} from "../contracts/Homie.sol";
import {SmartAccountFactory} from "../contracts/SmartAccountFactory.sol";
import {IEntryPoint} from "../contracts/interfaces/IEntryPoint.sol";

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

        // 6. Deploy Smart Account Factory (ERC-4337 EntryPoint required)
        // EntryPoint address: 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789 (standard ERC-4337 EntryPoint)
        IEntryPoint entryPoint = IEntryPoint(0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789);
        SmartAccountFactory smartAccountFactory = new SmartAccountFactory(entryPoint);
        console.log("SmartAccountFactory deployed at:", address(smartAccountFactory));

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("PortfolioToken:", address(portfolioToken));
        console.log("VisitorBook:", address(visitorBook));
        console.log("ProjectNFT:", address(projectNFT));
        console.log("ProjectVoting:", address(projectVoting));
        console.log("VisitNFT:", address(visitNFT));
        console.log("SmartAccountFactory:", address(smartAccountFactory));
        console.log("\nUpdate these addresses in:");
        console.log("- src/lib/contracts/addresses.ts");
        console.log("- .env file (if used)");
    }
}


