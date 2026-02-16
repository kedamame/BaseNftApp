// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {CampaignNFT} from "./CampaignNFT.sol";

/// @title NftFactory
/// @notice Deploys CampaignNFT clones (minimal proxies) for each airdrop campaign
/// @dev Permissionless — anyone can create a campaign. The caller becomes the clone's admin.
contract NftFactory {
    using Clones for address;

    /// @notice Address of the CampaignNFT implementation contract
    address public immutable implementation;

    /// @notice Total number of campaigns created
    uint256 public campaignCount;

    /// @notice Mapping from campaign ID to clone address
    mapping(uint256 => address) public campaigns;

    // ─── Events ──────────────────────────────────────────────────────────
    event CampaignCreated(uint256 indexed campaignId, address indexed clone, address indexed creator);

    // ─── Errors ──────────────────────────────────────────────────────────
    error ZeroAddressImplementation();

    /// @param implementation_ Address of the deployed CampaignNFT implementation
    constructor(address implementation_) {
        if (implementation_ == address(0)) revert ZeroAddressImplementation();
        implementation = implementation_;
    }

    /// @notice Create a new campaign by cloning the CampaignNFT implementation
    /// @param uri_ Metadata URI for the campaign's NFT collection
    /// @return clone Address of the newly deployed CampaignNFT clone
    function createCampaign(string memory uri_) external returns (address clone) {
        clone = implementation.clone();
        CampaignNFT(clone).initialize(msg.sender, uri_);

        uint256 id = campaignCount;
        campaigns[id] = clone;
        campaignCount = id + 1;

        emit CampaignCreated(id, clone, msg.sender);
    }

    /// @notice Get the clone address for a given campaign ID
    /// @param campaignId The campaign ID
    /// @return The clone address (address(0) if not found)
    function getCampaign(uint256 campaignId) external view returns (address) {
        return campaigns[campaignId];
    }
}
