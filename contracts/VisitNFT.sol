// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VisitNFT
 * @notice Limited edition NFT for first-time portfolio visitors
 * @dev First 100 visitors can mint a free "Proof of Visit" NFT
 *      Uses ERC721Enumerable for better tracking, AccessControl for roles,
 *      Pausable for emergency stops, and ReentrancyGuard for security
 */
contract VisitNFT is 
    ERC721URIStorage, 
    ERC721Enumerable, 
    AccessControl, 
    Pausable, 
    ReentrancyGuard 
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 public constant MAX_SUPPLY = 100;
    string public baseURI = "ipfs://QmYourDefaultMetadataCID/"; // Update with actual IPFS CID
    
    uint256 private _tokenIds;
    mapping(address => bool) public hasMinted;
    mapping(uint256 => uint256) public mintTimestamps; // Track mint timestamps
    
    event VisitNFTMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 timestamp
    );
    
    event BaseURIUpdated(string newBaseURI);

    constructor() ERC721("Portfolio Visit NFT", "VISIT") {
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
     * @notice Mint a free Visit NFT (first-time visitors only)
     * @dev Can only mint once per address, limited to MAX_SUPPLY
     */
    function mintVisitNFT() 
        external 
        whenNotPaused 
        nonReentrant 
    {
        require(!hasMinted[msg.sender], "Already minted");
        require(_tokenIds < MAX_SUPPLY, "Max supply reached");
        
        hasMinted[msg.sender] = true;
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, string(abi.encodePacked(baseURI, _toString(newTokenId))));
        mintTimestamps[newTokenId] = block.timestamp;
        
        emit VisitNFTMinted(newTokenId, msg.sender, block.timestamp);
    }

    /**
     * @notice Admin mint (for special cases)
     * @param to Address to mint to
     */
    function adminMint(address to) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
        nonReentrant 
    {
        require(to != address(0), "Cannot mint to zero address");
        require(_tokenIds < MAX_SUPPLY, "Max supply reached");
        
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, string(abi.encodePacked(baseURI, _toString(newTokenId))));
        mintTimestamps[newTokenId] = block.timestamp;
        
        emit VisitNFTMinted(newTokenId, to, block.timestamp);
    }

    /**
     * @notice Get total supply
     * @return Current supply
     */
    function totalSupply() public view override returns (uint256) {
        return _tokenIds;
    }

    /**
     * @notice Get remaining supply
     * @return Remaining NFTs that can be minted
     */
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - _tokenIds;
    }

    /**
     * @notice Update base URI (admin only)
     * @param newBaseURI New base URI
     */
    function setBaseURI(string memory newBaseURI) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(bytes(newBaseURI).length > 0, "Invalid URI");
        baseURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
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
     * @notice Get mint timestamp for a token
     * @param tokenId Token ID
     * @return Mint timestamp
     */
    function getMintTimestamp(uint256 tokenId) 
        external 
        view 
        returns (uint256) 
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return mintTimestamps[tokenId];
    }

    /**
     * @notice Convert uint256 to string
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

