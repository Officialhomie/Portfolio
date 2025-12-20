// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/P256.sol";
import "./libraries/Secp256r1Verifier.sol";

/**
 * @title BiometricWallet
 * @notice Smart wallet that validates secp256r1 signatures for Fusaka-native biometric authentication
 * @dev Each wallet is owned by one or more R1 public keys stored in secure enclaves
 *      Transactions are signed with biometric authentication and verified on-chain
 */
contract BiometricWallet {
    // Mapping from public key hash to nonce for replay protection
    mapping(bytes32 => uint256) public nonces;
    
    // Mapping from public key hash to enabled status
    mapping(bytes32 => bool) public publicKeys;
    
    // Array of all registered public key hashes
    bytes32[] public publicKeyHashes;
    
    event PublicKeyRegistered(bytes32 indexed publicKeyHash, bytes32 publicKeyX, bytes32 publicKeyY);
    event PublicKeyRemoved(bytes32 indexed publicKeyHash);
    event TransactionExecuted(address indexed to, uint256 value, bytes data, bytes32 indexed publicKeyHash);
    
    /**
     * @notice Initialize wallet with first public key
     * @param publicKeyX X coordinate of initial public key
     * @param publicKeyY Y coordinate of initial public key
     */
    constructor(bytes32 publicKeyX, bytes32 publicKeyY) {
        require(P256.isValidPublicKey(publicKeyX, publicKeyY), "Invalid public key");
        
        bytes32 publicKeyHash = keccak256(abi.encodePacked(publicKeyX, publicKeyY));
        publicKeys[publicKeyHash] = true;
        publicKeyHashes.push(publicKeyHash);
        
        emit PublicKeyRegistered(publicKeyHash, publicKeyX, publicKeyY);
    }
    
    /**
     * @notice Register a new public key for this wallet
     * @param publicKeyX X coordinate of public key
     * @param publicKeyY Y coordinate of public key
     * @param r Signature r component (must be signed by existing key)
     * @param s Signature s component
     * @param signerKeyX X coordinate of signing key
     * @param signerKeyY Y coordinate of signing key
     * @param nonce Nonce for replay protection
     */
    function registerPublicKey(
        bytes32 publicKeyX,
        bytes32 publicKeyY,
        bytes32 r,
        bytes32 s,
        bytes32 signerKeyX,
        bytes32 signerKeyY,
        uint256 nonce
    ) external {
        require(P256.isValidPublicKey(publicKeyX, publicKeyY), "Invalid public key");
        
        bytes32 signerKeyHash = keccak256(abi.encodePacked(signerKeyX, signerKeyY));
        require(publicKeys[signerKeyHash], "Signer key not registered");
        
        // Verify nonce
        require(nonce == nonces[signerKeyHash], "Invalid nonce");
        nonces[signerKeyHash]++;
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            "registerPublicKey",
            block.chainid,
            address(this),
            publicKeyX,
            publicKeyY,
            nonce
        ));
        
        require(
            Secp256r1Verifier.verify(messageHash, r, s, signerKeyX, signerKeyY),
            "Invalid signature"
        );
        
        // Register new key
        bytes32 publicKeyHash = keccak256(abi.encodePacked(publicKeyX, publicKeyY));
        require(!publicKeys[publicKeyHash], "Public key already registered");
        
        publicKeys[publicKeyHash] = true;
        publicKeyHashes.push(publicKeyHash);
        
        emit PublicKeyRegistered(publicKeyHash, publicKeyX, publicKeyY);
    }
    
    /**
     * @notice Remove a public key from this wallet
     * @param publicKeyHash Hash of public key to remove
     * @param r Signature r component (must be signed by another key)
     * @param s Signature s component
     * @param signerKeyX X coordinate of signing key
     * @param signerKeyY Y coordinate of signing key
     * @param nonce Nonce for replay protection
     */
    function removePublicKey(
        bytes32 publicKeyHash,
        bytes32 r,
        bytes32 s,
        bytes32 signerKeyX,
        bytes32 signerKeyY,
        uint256 nonce
    ) external {
        require(publicKeys[publicKeyHash], "Public key not registered");
        require(publicKeyHashes.length > 1, "Cannot remove last key");
        
        bytes32 signerKeyHash = keccak256(abi.encodePacked(signerKeyX, signerKeyY));
        require(publicKeys[signerKeyHash], "Signer key not registered");
        require(signerKeyHash != publicKeyHash, "Cannot sign with key being removed");
        
        // Verify nonce
        require(nonce == nonces[signerKeyHash], "Invalid nonce");
        nonces[signerKeyHash]++;
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            "removePublicKey",
            block.chainid,
            address(this),
            publicKeyHash,
            nonce
        ));
        
        require(
            Secp256r1Verifier.verify(messageHash, r, s, signerKeyX, signerKeyY),
            "Invalid signature"
        );
        
        // Remove key
        publicKeys[publicKeyHash] = false;
        
        // Remove from array
        for (uint256 i = 0; i < publicKeyHashes.length; i++) {
            if (publicKeyHashes[i] == publicKeyHash) {
                publicKeyHashes[i] = publicKeyHashes[publicKeyHashes.length - 1];
                publicKeyHashes.pop();
                break;
            }
        }
        
        emit PublicKeyRemoved(publicKeyHash);
    }
    
    /**
     * @notice Execute a transaction signed with R1 signature
     * @param to Target address
     * @param value Amount of ETH to send
     * @param data Calldata for the transaction
     * @param r Signature r component
     * @param s Signature s component
     * @param publicKeyX X coordinate of signing public key
     * @param publicKeyY Y coordinate of signing public key
     * @param nonce Nonce for replay protection
     */
    function execute(
        address to,
        uint256 value,
        bytes calldata data,
        bytes32 r,
        bytes32 s,
        bytes32 publicKeyX,
        bytes32 publicKeyY,
        uint256 nonce
    ) external {
        bytes32 publicKeyHash = keccak256(abi.encodePacked(publicKeyX, publicKeyY));
        require(publicKeys[publicKeyHash], "Public key not registered");
        
        // Verify nonce
        require(nonce == nonces[publicKeyHash], "Invalid nonce");
        nonces[publicKeyHash]++;
        
        // Build message hash
        bytes32 messageHash = keccak256(abi.encodePacked(
            "execute",
            block.chainid,
            address(this),
            to,
            value,
            keccak256(data),
            nonce
        ));
        
        // Verify signature
        require(
            Secp256r1Verifier.verify(messageHash, r, s, publicKeyX, publicKeyY),
            "Invalid signature"
        );
        
        // Execute transaction
        (bool success, ) = to.call{value: value}(data);
        require(success, "Transaction failed");
        
        emit TransactionExecuted(to, value, data, publicKeyHash);
    }
    
    /**
     * @notice Validate a signature (ERC-1271 compatible)
     * @param hash Message hash
     * @param signature Signature (r, s, publicKeyX, publicKeyY concatenated)
     * @return magicValue 0x1626ba7e if valid, 0x00000000 otherwise
     */
    function isValidSignature(bytes32 hash, bytes memory signature) external view returns (bytes4 magicValue) {
        require(signature.length == 128, "Invalid signature length");
        
        bytes32 r;
        bytes32 s;
        bytes32 publicKeyX;
        bytes32 publicKeyY;
        
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            publicKeyX := mload(add(signature, 0x60))
            publicKeyY := mload(add(signature, 0x80))
        }
        
        bytes32 publicKeyHash = keccak256(abi.encodePacked(publicKeyX, publicKeyY));
        if (!publicKeys[publicKeyHash]) {
            return 0x00000000;
        }
        
        if (Secp256r1Verifier.verify(hash, r, s, publicKeyX, publicKeyY)) {
            return 0x1626ba7e; // ERC-1271 magic value
        }
        
        return 0x00000000;
    }
    
    /**
     * @notice Get nonce for a public key
     * @param publicKeyHash Hash of public key
     * @return Current nonce
     */
    function getNonce(bytes32 publicKeyHash) external view returns (uint256) {
        return nonces[publicKeyHash];
    }
    
    /**
     * @notice Check if a public key is registered
     * @param publicKeyHash Hash of public key
     * @return True if registered
     */
    function isPublicKeyRegistered(bytes32 publicKeyHash) external view returns (bool) {
        return publicKeys[publicKeyHash];
    }
    
    /**
     * @notice Get all registered public key hashes
     * @return Array of public key hashes
     */
    function getPublicKeyHashes() external view returns (bytes32[] memory) {
        return publicKeyHashes;
    }
    
    /**
     * @notice Get number of registered keys
     * @return Count of registered keys
     */
    function getPublicKeyCount() external view returns (uint256) {
        return publicKeyHashes.length;
    }
    
    // Allow wallet to receive ETH
    receive() external payable {}
}

