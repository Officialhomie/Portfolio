// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/P256.sol";
import "./UserInteractionTracker.sol";

/**
 * @title ProjectNFT
 * @notice ERC-721 NFT contract for minting projects as NFTs
 * @dev Each project is minted as an NFT with IPFS metadata
 *      Uses ERC721Enumerable for better tracking, AccessControl for roles,
 *      Pausable for emergency stops, and ReentrancyGuard for security
 */
contract ProjectNFT is 
    ERC721URIStorage, 
    ERC721Enumerable, 
    AccessControl, 
    Pausable, 
    ReentrancyGuard 
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ENDORSER_ROLE = keccak256("ENDORSER_ROLE");
    
    uint256 private _tokenIds;
    
    struct Project {
        uint256 tokenId;
        string name;
        string ipfsMetadataURI;
        address creator;
        uint256 createdAt;
        uint256 endorsementCount;
    }
    
    mapping(uint256 => Project) public projects;
    mapping(string => uint256) public projectIdToTokenId;
    mapping(uint256 => mapping(address => bool)) public endorsements; // Track who endorsed
    
    uint256 public maxEndorsementsPerProject = 1000;
    
    // Biometric authentication support (EIP-7951)
    mapping(bytes32 => address) public secp256r1ToAddress;
    
    // Smart wallet registry: wallet address => user address
    mapping(address => address) public walletToUser;
    
    // User interaction tracker for hierarchy system
    UserInteractionTracker public interactionTracker;
    
    event ProjectMinted(
        uint256 indexed tokenId,
        string indexed projectId,
        address indexed creator,
        string ipfsMetadataURI
    );
    
    event ProjectEndorsed(
        uint256 indexed tokenId,
        address indexed endorser,
        uint256 newEndorsementCount
    );
    
    event ProjectUpdated(
        uint256 indexed tokenId,
        string newMetadataURI
    );
    
    event BiometricKeyRegistered(address indexed user, bytes32 publicKeyX, bytes32 publicKeyY);

    constructor(address _interactionTracker) 
        ERC721("ProjectNFT", "PRJ") 
    {
        if (_interactionTracker != address(0)) {
            interactionTracker = UserInteractionTracker(_interactionTracker);
        }
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
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

    // Required overrides for multiple inheritance
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @notice Mint a new project NFT
     * @param to Address to mint the NFT to
     * @param projectId Unique project identifier
     * @param projectName Name of the project
     * @param ipfsMetadataURI IPFS URI for project metadata
     * @return tokenId The minted token ID
     */
    function mintProject(
        address to,
        string memory projectId,
        string memory projectName,
        string memory ipfsMetadataURI
    ) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
        nonReentrant 
        returns (uint256) 
    {
        require(
            projectIdToTokenId[projectId] == 0,
            "Project already minted"
        );
        require(bytes(ipfsMetadataURI).length > 0, "Invalid metadata URI");
        require(to != address(0), "Cannot mint to zero address");
        
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, ipfsMetadataURI);
        
        projects[newTokenId] = Project({
            tokenId: newTokenId,
            name: projectName,
            ipfsMetadataURI: ipfsMetadataURI,
            creator: to,
            createdAt: block.timestamp,
            endorsementCount: 0
        });
        
        projectIdToTokenId[projectId] = newTokenId;
        
        emit ProjectMinted(newTokenId, projectId, to, ipfsMetadataURI);
        
        return newTokenId;
    }

    /**
     * @notice Endorse a project (increment endorsement count)
     * @param tokenId The token ID of the project to endorse
     * @dev Supports both direct calls and smart wallet calls
     */
    function endorseProject(uint256 tokenId) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        address user = walletToUser[msg.sender];
        if (user == address(0)) {
            user = msg.sender; // Direct call from user
        }
        
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(
            !endorsements[tokenId][user],
            "Already endorsed this project"
        );
        require(
            projects[tokenId].endorsementCount < maxEndorsementsPerProject,
            "Max endorsements reached"
        );
        
        endorsements[tokenId][user] = true;
        projects[tokenId].endorsementCount++;
        
        // Record interaction and burn tokens if tracker is set
        if (address(interactionTracker) != address(0)) {
            uint256 burnAmount = interactionTracker.projectEndorseCost();
            if (burnAmount > 0) {
                interactionTracker.recordInteraction(
                    user,
                    UserInteractionTracker.InteractionType.PROJECT_ENDORSE,
                    burnAmount
                );
            } else {
                interactionTracker.recordInteraction(
                    user,
                    UserInteractionTracker.InteractionType.PROJECT_ENDORSE,
                    0
                );
            }
        }
        
        emit ProjectEndorsed(tokenId, user, projects[tokenId].endorsementCount);
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
     * @notice Execute project endorsement for a user via smart wallet
     * @param user Address of the user
     * @param tokenId The token ID of the project to endorse
     */
    function executeFor(address user, uint256 tokenId) external whenNotPaused nonReentrant {
        require(walletToUser[msg.sender] == user, "Wallet not authorized for user");
        
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(
            !endorsements[tokenId][user],
            "Already endorsed this project"
        );
        require(
            projects[tokenId].endorsementCount < maxEndorsementsPerProject,
            "Max endorsements reached"
        );
        
        endorsements[tokenId][user] = true;
        projects[tokenId].endorsementCount++;
        
        // Record interaction and burn tokens if tracker is set
        if (address(interactionTracker) != address(0)) {
            uint256 burnAmount = interactionTracker.projectEndorseCost();
            if (burnAmount > 0) {
                interactionTracker.recordInteraction(
                    user,
                    UserInteractionTracker.InteractionType.PROJECT_ENDORSE,
                    burnAmount
                );
            } else {
                interactionTracker.recordInteraction(
                    user,
                    UserInteractionTracker.InteractionType.PROJECT_ENDORSE,
                    0
                );
            }
        }
        
        emit ProjectEndorsed(tokenId, user, projects[tokenId].endorsementCount);
    }

    /**
     * @notice Update project metadata URI (admin only)
     * @param tokenId Token ID
     * @param newMetadataURI New IPFS metadata URI
     */
    function updateProjectMetadata(
        uint256 tokenId,
        string memory newMetadataURI
    ) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(bytes(newMetadataURI).length > 0, "Invalid metadata URI");
        
        _setTokenURI(tokenId, newMetadataURI);
        projects[tokenId].ipfsMetadataURI = newMetadataURI;
        
        emit ProjectUpdated(tokenId, newMetadataURI);
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
     * @notice Set max endorsements per project
     * @param newMax New maximum
     */
    function setMaxEndorsements(uint256 newMax) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        maxEndorsementsPerProject = newMax;
    }

    /**
     * @notice Get project details by token ID
     * @param tokenId The token ID
     * @return Project struct
     */
    function getProject(uint256 tokenId) external view returns (Project memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return projects[tokenId];
    }

    /**
     * @notice Get project token ID by project ID
     * @param projectId The project identifier
     * @return tokenId The token ID
     */
    function getTokenIdByProjectId(string memory projectId) 
        external 
        view 
        returns (uint256) 
    {
        return projectIdToTokenId[projectId];
    }

    /**
     * @notice Get total supply
     * @return Total number of minted NFTs
     */
    function totalSupply() public view override returns (uint256) {
        return _tokenIds;
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
     * @notice Endorse a project using biometric signature (EIP-7951)
     * @param tokenId The token ID of the project to endorse
     * @param r Signature r component
     * @param s Signature s component
     * @param publicKeyX Public key X coordinate
     * @param publicKeyY Public key Y coordinate
     */
    function endorseProjectWithBiometric(
        uint256 tokenId,
        bytes32 r,
        bytes32 s,
        bytes32 publicKeyX,
        bytes32 publicKeyY
    ) external whenNotPaused nonReentrant {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        bytes32 publicKeyHash = keccak256(abi.encodePacked(publicKeyX, publicKeyY));
        address user = secp256r1ToAddress[publicKeyHash];
        require(user != address(0), "Public key not registered");
        
        // Generate message hash
        bytes32 messageHash = keccak256(abi.encodePacked(
            "endorseProject",
            block.chainid,
            address(this),
            user,
            tokenId
        ));
        
        // Verify secp256r1 signature
        require(P256.verify(messageHash, r, s, publicKeyX, publicKeyY), "Invalid signature");
        
        require(
            !endorsements[tokenId][user],
            "Already endorsed this project"
        );
        require(
            projects[tokenId].endorsementCount < maxEndorsementsPerProject,
            "Max endorsements reached"
        );
        
        endorsements[tokenId][user] = true;
        projects[tokenId].endorsementCount++;
        
        // Record interaction and burn tokens if tracker is set
        if (address(interactionTracker) != address(0)) {
            uint256 burnAmount = interactionTracker.projectEndorseCost();
            if (burnAmount > 0) {
                interactionTracker.recordInteraction(
                    user,
                    UserInteractionTracker.InteractionType.PROJECT_ENDORSE,
                    burnAmount
                );
            } else {
                interactionTracker.recordInteraction(
                    user,
                    UserInteractionTracker.InteractionType.PROJECT_ENDORSE,
                    0
                );
            }
        }
        
        emit ProjectEndorsed(tokenId, user, projects[tokenId].endorsementCount);
    }
    
    /**
     * @notice Get all projects endorsed by a user
     * @param endorser Address of the endorser
     * @return Array of token IDs
     */
    function getUserEndorsedProjects(address endorser) external view returns (uint256[] memory) {
        uint256 totalProjects = totalSupply();
        uint256[] memory temp = new uint256[](totalProjects);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= totalProjects; i++) {
            if (endorsements[i][endorser]) {
                temp[count] = i;
                count++;
            }
        }
        
        // Create properly sized array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }
        
        return result;
    }
    
    /**
     * @notice Get user's endorsement statistics
     * @param endorser Address of the endorser
     * @return totalEndorsements Total number of endorsements
     * @return uniqueProjects Number of unique projects endorsed
     */
    function getUserEndorsementStats(address endorser) 
        external 
        view 
        returns (
            uint256 totalEndorsements,
            uint256 uniqueProjects
        ) 
    {
        uint256 totalProjects = totalSupply();
        uniqueProjects = 0;
        
        for (uint256 i = 1; i <= totalProjects; i++) {
            if (endorsements[i][endorser]) {
                uniqueProjects++;
            }
        }
        
        totalEndorsements = uniqueProjects; // One endorsement per project
    }
    
    /**
     * @notice Get all projects created by a user
     * @param creator Address of the creator
     * @return Array of Project structs
     */
    function getUserCreatedProjects(address creator) external view returns (Project[] memory) {
        uint256 totalProjects = totalSupply();
        Project[] memory temp = new Project[](totalProjects);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= totalProjects; i++) {
            if (projects[i].creator == creator) {
                temp[count] = projects[i];
                count++;
            }
        }
        
        // Create properly sized array
        Project[] memory result = new Project[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }
        
        return result;
    }
}

