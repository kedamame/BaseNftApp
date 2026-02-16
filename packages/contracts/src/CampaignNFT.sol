// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {ERC1155Pausable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuardTransient} from "@openzeppelin/contracts/utils/ReentrancyGuardTransient.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/// @title CampaignNFT
/// @notice ERC-1155 NFT contract for airdrop campaigns, deployed as minimal proxy (clone)
/// @dev Uses OZ Initializable pattern for Clones compatibility. ReentrancyGuardTransient requires EIP-1153 (Base Mainnet).
contract CampaignNFT is Initializable, ERC1155, ERC1155Supply, ERC1155Pausable, AccessControl, ReentrancyGuardTransient {
    // ─── Roles ───────────────────────────────────────────────────────────
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // ─── State ───────────────────────────────────────────────────────────
    bool public metadataFrozen;

    // ─── Errors ──────────────────────────────────────────────────────────
    error ZeroAddress();
    error ZeroAmount();
    error EmptyArray();
    error ArrayLengthMismatch();
    error MetadataIsFrozen();

    // ─── Events ──────────────────────────────────────────────────────────
    event Minted(address indexed to, uint256 indexed tokenId, uint256 amount);
    event BatchMinted(address[] tos, uint256 indexed tokenId, uint256[] amounts);
    event MetadataFrozen();
    event URIUpdated(string newUri);

    // ─── Constructor (implementation only) ───────────────────────────────
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() ERC1155("") {
        _disableInitializers();
    }

    // ─── Initializer (called on each clone) ──────────────────────────────
    /// @notice Initialize the clone with admin and metadata URI
    /// @param admin Address that receives ADMIN and OPERATOR roles
    /// @param uri_ Metadata URI template (e.g. "https://example.com/{id}.json")
    function initialize(address admin, string memory uri_) external initializer {
        if (admin == address(0)) revert ZeroAddress();
        _setURI(uri_);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
    }

    // ─── Minting ─────────────────────────────────────────────────────────
    /// @notice Mint tokens to a single recipient
    /// @param to Recipient address
    /// @param tokenId Token ID to mint
    /// @param amount Number of tokens to mint
    function mint(address to, uint256 tokenId, uint256 amount)
        external
        onlyRole(OPERATOR_ROLE)
        whenNotPaused
        nonReentrant
    {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        _mint(to, tokenId, amount, "");
        emit Minted(to, tokenId, amount);
    }

    /// @notice Batch mint same tokenId to multiple recipients (airdrop)
    /// @param tos Array of recipient addresses
    /// @param tokenId Token ID to mint
    /// @param amounts Array of amounts corresponding to each recipient
    function mintBatch(address[] calldata tos, uint256 tokenId, uint256[] calldata amounts)
        external
        onlyRole(OPERATOR_ROLE)
        whenNotPaused
        nonReentrant
    {
        if (tos.length == 0) revert EmptyArray();
        if (tos.length != amounts.length) revert ArrayLengthMismatch();
        for (uint256 i = 0; i < tos.length;) {
            if (tos[i] == address(0)) revert ZeroAddress();
            if (amounts[i] == 0) revert ZeroAmount();
            _mint(tos[i], tokenId, amounts[i], "");
            unchecked {
                ++i;
            }
        }
        emit BatchMinted(tos, tokenId, amounts);
    }

    // ─── Admin ───────────────────────────────────────────────────────────
    /// @notice Pause all minting operations
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /// @notice Unpause minting operations
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /// @notice Update metadata URI (reverts if frozen)
    /// @param newUri New metadata URI template
    function setURI(string memory newUri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (metadataFrozen) revert MetadataIsFrozen();
        _setURI(newUri);
        emit URIUpdated(newUri);
    }

    /// @notice Permanently freeze metadata (irreversible)
    function freezeMetadata() external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (metadataFrozen) revert MetadataIsFrozen();
        metadataFrozen = true;
        emit MetadataFrozen();
    }

    // ─── Required Overrides ──────────────────────────────────────────────
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        virtual
        override(ERC1155, ERC1155Supply, ERC1155Pausable)
    {
        super._update(from, to, ids, values);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
