// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

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

    constructor() 
        ERC721("ProjectNFT", "PRJ") 
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
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
     */
    function endorseProject(uint256 tokenId) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(
            !endorsements[tokenId][msg.sender],
            "Already endorsed this project"
        );
        require(
            projects[tokenId].endorsementCount < maxEndorsementsPerProject,
            "Max endorsements reached"
        );
        
        endorsements[tokenId][msg.sender] = true;
        projects[tokenId].endorsementCount++;
        
        emit ProjectEndorsed(tokenId, msg.sender, projects[tokenId].endorsementCount);
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
}

