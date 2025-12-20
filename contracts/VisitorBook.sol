// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/P256.sol";
import "./libraries/Secp256r1Verifier.sol";

/**
 * @title VisitorBook
 * @notice Gas-optimized contract for storing visitor signatures on Base L2
 * @dev Stores visitor addresses and messages with timestamps
 *      Uses EIP-712 for structured data signing, AccessControl for permissions,
 *      Pausable for emergency stops, and ReentrancyGuard for security
 */
contract VisitorBook is AccessControl, Pausable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    
    // EIP-712 type hash for structured signing
    bytes32 private constant VISITOR_SIGNATURE_TYPEHASH = 
        keccak256("VisitorSignature(address visitor,string message,uint256 timestamp)");
    struct Visitor {
        address visitor;
        string message;
        uint256 timestamp;
    }

    Visitor[] public visitors;
    mapping(address => bool) public hasVisited;
    mapping(address => uint256) public visitCount;
    mapping(bytes32 => bool) public usedSignatures; // Prevent signature replay
    
    uint256 public maxMessageLength = 500;
    uint256 public minMessageLength = 1;
    
    // Biometric authentication support (EIP-7951)
    mapping(bytes32 => address) public secp256r1ToAddress;
    
    // Smart wallet registry: wallet address => user address
    mapping(address => address) public walletToUser;
    
    event VisitorSigned(
        address indexed visitor,
        string message,
        uint256 timestamp,
        uint256 visitNumber
    );

    event MessageLengthUpdated(uint256 oldLength, uint256 newLength);
    event VisitorRemoved(address indexed visitor, uint256 index);
    event BiometricKeyRegistered(address indexed user, bytes32 publicKeyX, bytes32 publicKeyY);
    event BiometricTransactionExecuted(address indexed user, string operation, uint256 gasUsed, bool usedPrecompile);

    constructor() EIP712("VisitorBook", "1") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MODERATOR_ROLE, msg.sender);
    }

    /**
     * @notice Sign the visitor book with a message
     * @param message The message left by the visitor
     * @dev Supports both direct calls and smart wallet calls
     */
    function signVisitorBook(string memory message) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        address user = walletToUser[msg.sender];
        if (user == address(0)) {
            user = msg.sender; // Direct call from user
        }
        
        uint256 messageLength = bytes(message).length;
        require(
            messageLength >= minMessageLength && messageLength <= maxMessageLength,
            "Message length invalid"
        );
        
        visitors.push(Visitor({
            visitor: user,
            message: message,
            timestamp: block.timestamp
        }));
        
        hasVisited[user] = true;
        visitCount[user]++;
        
        emit VisitorSigned(user, message, block.timestamp, visitCount[user]);
    }
    
    /**
     * @notice Register a smart wallet for a user
     * @param walletAddress Address of the smart wallet
     * @param userAddress Address of the user
     */
    function registerWallet(address walletAddress, address userAddress) external {
        require(walletAddress != address(0), "Invalid wallet address");
        require(userAddress != address(0), "Invalid user address");
        require(walletToUser[walletAddress] == address(0), "Wallet already registered");
        require(msg.sender == walletAddress || msg.sender == userAddress, "Not authorized");
        
        walletToUser[walletAddress] = userAddress;
    }
    
    /**
     * @notice Execute visitor book signing for a user via smart wallet
     * @param user Address of the user
     * @param message The message left by the visitor
     */
    function executeFor(address user, string memory message) external whenNotPaused nonReentrant {
        require(walletToUser[msg.sender] == user, "Wallet not authorized for user");
        
        uint256 messageLength = bytes(message).length;
        require(
            messageLength >= minMessageLength && messageLength <= maxMessageLength,
            "Message length invalid"
        );
        
        visitors.push(Visitor({
            visitor: user,
            message: message,
            timestamp: block.timestamp
        }));
        
        hasVisited[user] = true;
        visitCount[user]++;
        
        emit VisitorSigned(user, message, block.timestamp, visitCount[user]);
    }

    /**
     * @notice Sign visitor book with EIP-712 structured signature
     * @param message The message
     * @param signature EIP-712 signature
     * @param timestamp The timestamp used in the signature (must match signed timestamp)
     */
    function signVisitorBookWithSignature(
        string memory message,
        bytes memory signature,
        uint256 timestamp
    ) external whenNotPaused nonReentrant {
        uint256 messageLength = bytes(message).length;
        require(
            messageLength >= minMessageLength && messageLength <= maxMessageLength,
            "Message length invalid"
        );

        // Validate timestamp is within reasonable window (5 minutes) to prevent replay attacks
        require(
            timestamp >= block.timestamp - 300 && timestamp <= block.timestamp + 60,
            "Timestamp out of window"
        );

        bytes32 structHash = keccak256(abi.encode(
            VISITOR_SIGNATURE_TYPEHASH,
            msg.sender,
            keccak256(bytes(message)),
            timestamp
        ));
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        
        require(signer == msg.sender, "Invalid signature");
        require(!usedSignatures[hash], "Signature already used");
        
        usedSignatures[hash] = true;
        
        visitors.push(Visitor({
            visitor: msg.sender,
            message: message,
            timestamp: block.timestamp
        }));
        
        hasVisited[msg.sender] = true;
        visitCount[msg.sender]++;
        
        emit VisitorSigned(msg.sender, message, block.timestamp, visitCount[msg.sender]);
    }

    /**
     * @notice Remove a visitor entry (moderator only)
     * @param index Index of visitor to remove
     */
    function removeVisitor(uint256 index) 
        external 
        onlyRole(MODERATOR_ROLE) 
    {
        require(index < visitors.length, "Index out of bounds");
        
        address visitor = visitors[index].visitor;
        
        // Move last element to deleted position
        visitors[index] = visitors[visitors.length - 1];
        visitors.pop();
        
        emit VisitorRemoved(visitor, index);
    }

    /**
     * @notice Set maximum message length
     * @param newLength New maximum length
     */
    function setMaxMessageLength(uint256 newLength) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(newLength > 0, "Length must be > 0");
        uint256 oldLength = maxMessageLength;
        maxMessageLength = newLength;
        emit MessageLengthUpdated(oldLength, newLength);
    }

    /**
     * @notice Pause contract (admin only)
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause contract (admin only)
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Get visit count for an address
     * @param visitor Address to check
     * @return Number of visits
     */
    function getVisitCount(address visitor) external view returns (uint256) {
        return visitCount[visitor];
    }

    /**
     * @notice Get total number of visitors
     * @return Total visitor count
     */
    function getTotalVisitors() external view returns (uint256) {
        return visitors.length;
    }

    /**
     * @notice Get visitor at index
     * @param index Index of visitor
     * @return Visitor struct
     */
    function getVisitor(uint256 index) external view returns (Visitor memory) {
        require(index < visitors.length, "Index out of bounds");
        return visitors[index];
    }

    /**
     * @notice Get all visitors (for frontend pagination)
     * @param offset Starting index
     * @param limit Number of visitors to return
     * @return Array of Visitor structs
     */
    function getVisitors(uint256 offset, uint256 limit) 
        external 
        view 
        returns (Visitor[] memory) 
    {
        require(offset < visitors.length, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > visitors.length) {
            end = visitors.length;
        }
        
        uint256 length = end - offset;
        Visitor[] memory result = new Visitor[](length);
        
        for (uint256 i = 0; i < length; i++) {
            result[i] = visitors[offset + i];
        }
        
        return result;
    }

    /**
     * @notice Register secp256r1 public key for biometric authentication
     * @param publicKeyX X coordinate of public key
     * @param publicKeyY Y coordinate of public key
     */
    function registerSecp256r1Key(bytes32 publicKeyX, bytes32 publicKeyY) external {
        require(P256.isValidPublicKey(publicKeyX, publicKeyY), "Invalid public key");
        
        bytes32 publicKeyHash = keccak256(abi.encodePacked(publicKeyX, publicKeyY));
        require(secp256r1ToAddress[publicKeyHash] == address(0), "Public key already registered");
        
        secp256r1ToAddress[publicKeyHash] = msg.sender;
        emit BiometricKeyRegistered(msg.sender, publicKeyX, publicKeyY);
    }

    /**
     * @notice Sign visitor book using biometric signature (EIP-7951)
     * @dev DEPRECATED: Use smart wallet executeFor instead
     * @param message The message left by the visitor
     * @param r Signature r component
     * @param s Signature s component
     * @param publicKeyX Public key X coordinate
     * @param publicKeyY Public key Y coordinate
     */
    function signVisitorBookWithBiometric(
        string memory message,
        bytes32 r,
        bytes32 s,
        bytes32 publicKeyX,
        bytes32 publicKeyY
    ) external whenNotPaused nonReentrant {
        uint256 messageLength = bytes(message).length;
        require(
            messageLength >= minMessageLength && messageLength <= maxMessageLength,
            "Message length invalid"
        );
        
        bytes32 publicKeyHash = keccak256(abi.encodePacked(publicKeyX, publicKeyY));
        address user = secp256r1ToAddress[publicKeyHash];
        require(user != address(0), "Public key not registered");
        
        uint256 timestamp = block.timestamp;
        
        // Generate message hash
        bytes32 messageHash = keccak256(abi.encodePacked(
            "signVisitorBook",
            block.chainid,
            address(this),
            user,
            keccak256(bytes(message)),
            timestamp
        ));

        // Verify secp256r1 signature using hybrid verifier
        // Automatically uses EIP-7951 precompile (6.9k gas) if available, falls back to P256.sol (100k gas)
        uint256 gasBefore = gasleft();
        require(
            Secp256r1Verifier.verify(messageHash, r, s, publicKeyX, publicKeyY),
            "Invalid signature"
        );
        uint256 gasUsed = gasBefore - gasleft();
        
        visitors.push(Visitor({
            visitor: user,
            message: message,
            timestamp: timestamp
        }));
        
        hasVisited[user] = true;
        visitCount[user]++;

        emit VisitorSigned(user, message, timestamp, visitCount[user]);
        emit BiometricTransactionExecuted(user, "signVisitorBook", gasUsed, Secp256r1Verifier.isPrecompileAvailable());
    }

    /**
     * @notice Get current verification method and estimated gas cost
     * @dev Useful for frontend to display gas estimates to users
     * @return method "precompile" if EIP-7951 is available, "p256-library" otherwise
     * @return estimatedGas Approximate gas cost for biometric verification
     * @return gasSavings Percentage of gas saved with precompile (e.g., 93 = 93%)
     */
    function getBiometricVerificationInfo()
        external
        view
        returns (
            string memory method,
            uint256 estimatedGas,
            uint256 gasSavings
        )
    {
        (method, estimatedGas) = Secp256r1Verifier.getVerificationMethod();
        gasSavings = Secp256r1Verifier.getGasSavingsPercentage();
    }

    /**
     * @notice Check if EIP-7951 precompile is available on this chain
     * @dev Returns true on Fusaka-enabled chains (Base after Dec 3, 2024)
     * @return available True if precompile exists and works correctly
     */
    function isEIP7951Available() external view returns (bool available) {
        return Secp256r1Verifier.isPrecompileAvailable();
    }
}

