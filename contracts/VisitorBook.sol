// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./UserInteractionTracker.sol";

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
    bytes32 public constant VISITOR_SIGNATURE_TYPEHASH =
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

    // Smart wallet registry: wallet address => user address
    mapping(address => address) public walletToUser;
    
    // User interaction tracker for hierarchy system
    UserInteractionTracker public interactionTracker;
    
    event VisitorSigned(
        address indexed visitor,
        string message,
        uint256 timestamp,
        uint256 visitNumber
    );

    event MessageLengthUpdated(uint256 oldLength, uint256 newLength);
    event VisitorRemoved(address indexed visitor, uint256 index);

    constructor(address _interactionTracker) EIP712("VisitorBook", "1") {
        if (_interactionTracker != address(0)) {
            interactionTracker = UserInteractionTracker(_interactionTracker);
        }
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MODERATOR_ROLE, msg.sender);
    }
    
    /**
     * @notice Set interaction tracker address (admin only)
     * @param _interactionTracker Address of the UserInteractionTracker contract
     */
    function setInteractionTracker(address _interactionTracker) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(_interactionTracker != address(0), "Invalid tracker address");
        interactionTracker = UserInteractionTracker(_interactionTracker);
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
        
        // Record interaction and burn tokens if tracker is set
        if (address(interactionTracker) != address(0)) {
            uint256 burnAmount = interactionTracker.visitorBookSignCost();
            if (burnAmount > 0) {
                interactionTracker.recordInteraction(
                    user,
                    UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN,
                    burnAmount
                );
            } else {
                interactionTracker.recordInteraction(
                    user,
                    UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN,
                    0
                );
            }
        }
        
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
        
        // Record interaction and burn tokens if tracker is set
        if (address(interactionTracker) != address(0)) {
            uint256 burnAmount = interactionTracker.visitorBookSignCost();
            if (burnAmount > 0) {
                interactionTracker.recordInteraction(
                    user,
                    UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN,
                    burnAmount
                );
            } else {
                interactionTracker.recordInteraction(
                    user,
                    UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN,
                    0
                );
            }
        }
        
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
            (block.timestamp >= 300 ? timestamp >= block.timestamp - 300 : timestamp >= 0) &&
            timestamp <= block.timestamp + 60,
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
        
        address user = msg.sender;
        
        visitors.push(Visitor({
            visitor: user,
            message: message,
            timestamp: block.timestamp
        }));
        
        hasVisited[user] = true;
        visitCount[user]++;
        
        // Record interaction and burn tokens if tracker is set
        if (address(interactionTracker) != address(0)) {
            uint256 burnAmount = interactionTracker.visitorBookSignCost();
            if (burnAmount > 0) {
                interactionTracker.recordInteraction(
                    user,
                    UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN,
                    burnAmount
                );
            } else {
                interactionTracker.recordInteraction(
                    user,
                    UserInteractionTracker.InteractionType.VISITOR_BOOK_SIGN,
                    0
                );
            }
        }
        
        emit VisitorSigned(user, message, block.timestamp, visitCount[user]);
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
     * @notice Get all messages for a specific user
     * @param user Address of the user
     * @return Array of Visitor structs for that user
     */
    function getUserMessages(address user) external view returns (Visitor[] memory) {
        uint256 userVisitCount = visitCount[user];
        if (userVisitCount == 0) {
            return new Visitor[](0);
        }
        
        Visitor[] memory userVisitors = new Visitor[](userVisitCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < visitors.length; i++) {
            if (visitors[i].visitor == user) {
                userVisitors[index] = visitors[i];
                index++;
            }
        }
        
        return userVisitors;
    }

    /**
     * @notice Get user's latest message
     * @param user Address of the user
     * @return Latest Visitor struct, or empty struct if user hasn't visited
     */
    function getUserLatestMessage(address user) external view returns (Visitor memory) {
        if (visitCount[user] == 0) {
            return Visitor({
                visitor: address(0),
                message: "",
                timestamp: 0
            });
        }
        
        // Find the most recent message
        Visitor memory latest;
        uint256 latestTimestamp = 0;
        
        for (uint256 i = 0; i < visitors.length; i++) {
            if (visitors[i].visitor == user && visitors[i].timestamp > latestTimestamp) {
                latest = visitors[i];
                latestTimestamp = visitors[i].timestamp;
            }
        }
        
        return latest;
    }
}

