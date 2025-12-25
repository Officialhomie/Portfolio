// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {VisitorBook} from "../contracts/VisitorBook.sol";

/**
 * @title DeployVisitorBookScript
 * @notice Deploy only the VisitorBook contract with EIP-712 timestamp fix
 * @dev Run with: forge script script/DeployVisitorBook.s.sol:DeployVisitorBookScript --rpc-url $BASE_RPC_URL --account deployer-onetruehomie --broadcast --verify -vvvv
 */
contract DeployVisitorBookScript is Script {
    function run() external {
        // Use cast account system via --account flag
        // Account will be passed via --account deployer-onetruehomie flag
        vm.startBroadcast();

        console.log("Deploying VisitorBook contract to Base Mainnet...");
        console.log("This deployment includes:");
        console.log("- EIP-712 signature support with timestamp parameter");
        console.log("- Biometric authentication support (EIP-7951)");
        console.log("- secp256r1 curve verification");

        // Deploy Visitor Book
        VisitorBook visitorBook = new VisitorBook(address(0));
        console.log("VisitorBook deployed at:", address(visitorBook));

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("VisitorBook:", address(visitorBook));
        console.log("\nUpdate the contract address in:");
        console.log("- src/lib/contracts/addresses.ts");
        console.log("- .env file (if used)");
        console.log("\nAfter deployment, update the ABI in:");
        console.log("- src/lib/contracts/abis/VisitorBook.json");
    }
}

