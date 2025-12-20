// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MessageHashHelper
 * @notice Helper contract for testing message hash consistency between frontend and contracts
 * @dev Used to verify that TypeScript message hash generation matches Solidity
 */
contract MessageHashHelper {
    /**
     * @notice Generate message hash for claimFaucet function
     * @dev Matches: keccak256(abi.encodePacked("claimFaucet", chainId, contractAddress, user))
     */
    function getClaimFaucetHash(
        uint256 chainId,
        address contractAddress,
        address user
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            "claimFaucet",
            chainId,
            contractAddress,
            user
        ));
    }

    /**
     * @notice Generate message hash for vote function
     * @dev Matches: keccak256(abi.encodePacked("vote", chainId, contractAddress, user, projectId))
     */
    function getVoteHash(
        uint256 chainId,
        address contractAddress,
        address user,
        string calldata projectId
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            "vote",
            chainId,
            contractAddress,
            user,
            projectId
        ));
    }

    /**
     * @notice Generate message hash for endorseProject function
     * @dev Matches: keccak256(abi.encodePacked("endorseProject", chainId, contractAddress, user, tokenId))
     */
    function getEndorseProjectHash(
        uint256 chainId,
        address contractAddress,
        address user,
        uint256 tokenId
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            "endorseProject",
            chainId,
            contractAddress,
            user,
            tokenId
        ));
    }

    /**
     * @notice Generate message hash for mintVisitNFT function
     * @dev Matches: keccak256(abi.encodePacked("mintVisitNFT", chainId, contractAddress, user))
     */
    function getMintVisitNFTHash(
        uint256 chainId,
        address contractAddress,
        address user
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            "mintVisitNFT",
            chainId,
            contractAddress,
            user
        ));
    }

    /**
     * @notice Generate message hash for signVisitorBook function
     * @dev Matches: keccak256(abi.encodePacked("signVisitorBook", chainId, contractAddress, user, message, timestamp))
     */
    function getSignVisitorBookHash(
        uint256 chainId,
        address contractAddress,
        address user,
        string calldata message,
        uint256 timestamp
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            "signVisitorBook",
            chainId,
            contractAddress,
            user,
            message,
            timestamp
        ));
    }

    /**
     * @notice Generic message hash generator for testing
     * @dev Allows testing arbitrary parameter combinations
     */
    function getGenericHash(
        string calldata functionName,
        uint256 chainId,
        address contractAddress,
        address user
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            functionName,
            chainId,
            contractAddress,
            user
        ));
    }

    /**
     * @notice Get hash with one string parameter
     */
    function getHashWithString(
        string calldata functionName,
        uint256 chainId,
        address contractAddress,
        address user,
        string calldata param
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            functionName,
            chainId,
            contractAddress,
            user,
            param
        ));
    }

    /**
     * @notice Get hash with one uint256 parameter
     */
    function getHashWithUint256(
        string calldata functionName,
        uint256 chainId,
        address contractAddress,
        address user,
        uint256 param
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            functionName,
            chainId,
            contractAddress,
            user,
            param
        ));
    }

    /**
     * @notice Get hash with two parameters (string, uint256)
     */
    function getHashWithStringAndUint256(
        string calldata functionName,
        uint256 chainId,
        address contractAddress,
        address user,
        string calldata param1,
        uint256 param2
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            functionName,
            chainId,
            contractAddress,
            user,
            param1,
            param2
        ));
    }
}
