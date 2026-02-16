// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, Vm} from "forge-std/Test.sol";
import {CampaignNFT} from "../src/CampaignNFT.sol";
import {NftFactory} from "../src/NftFactory.sol";

contract NftFactoryTest is Test {
    CampaignNFT internal impl;
    NftFactory internal factory;
    address internal creator = makeAddr("creator");
    string internal constant TEST_URI = "https://example.com/{id}.json";

    function setUp() public {
        impl = new CampaignNFT();
        factory = new NftFactory(address(impl));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Constructor
    // ═══════════════════════════════════════════════════════════════════════

    function test_constructor_setsImplementation() public view {
        assertEq(factory.implementation(), address(impl));
    }

    function test_constructor_revertsOnZeroAddress() public {
        vm.expectRevert(NftFactory.ZeroAddressImplementation.selector);
        new NftFactory(address(0));
    }

    function test_initialCampaignCountIsZero() public view {
        assertEq(factory.campaignCount(), 0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // createCampaign
    // ═══════════════════════════════════════════════════════════════════════

    function test_createCampaign_deploysClone() public {
        vm.prank(creator);
        address clone = factory.createCampaign(TEST_URI);
        assertTrue(clone != address(0));
        assertTrue(clone != address(impl));
    }

    function test_createCampaign_incrementsCount() public {
        vm.prank(creator);
        factory.createCampaign(TEST_URI);
        assertEq(factory.campaignCount(), 1);

        vm.prank(creator);
        factory.createCampaign(TEST_URI);
        assertEq(factory.campaignCount(), 2);
    }

    function test_createCampaign_initializesClone() public {
        vm.prank(creator);
        address clone = factory.createCampaign(TEST_URI);

        CampaignNFT campaign = CampaignNFT(clone);
        assertEq(campaign.uri(0), TEST_URI);
    }

    function test_createCampaign_creatorIsAdmin() public {
        vm.prank(creator);
        address clone = factory.createCampaign(TEST_URI);

        CampaignNFT campaign = CampaignNFT(clone);
        assertTrue(campaign.hasRole(campaign.DEFAULT_ADMIN_ROLE(), creator));
        assertTrue(campaign.hasRole(campaign.OPERATOR_ROLE(), creator));
    }

    function test_createCampaign_emitsCampaignCreated() public {
        vm.prank(creator);
        vm.recordLogs();
        address clone = factory.createCampaign(TEST_URI);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        // Find CampaignCreated event (last log from factory)
        bool found = false;
        for (uint256 i = 0; i < entries.length; i++) {
            if (entries[i].emitter == address(factory)) {
                // topic[0] = selector, topic[1] = campaignId, topic[2] = clone, topic[3] = creator
                assertEq(entries[i].topics[1], bytes32(uint256(0)));
                assertEq(entries[i].topics[2], bytes32(uint256(uint160(clone))));
                assertEq(entries[i].topics[3], bytes32(uint256(uint160(creator))));
                found = true;
                break;
            }
        }
        assertTrue(found, "CampaignCreated event not found");
    }

    function test_createCampaign_clonesAreUnique() public {
        vm.prank(creator);
        address clone1 = factory.createCampaign(TEST_URI);

        vm.prank(creator);
        address clone2 = factory.createCampaign("https://other.com/{id}.json");

        assertTrue(clone1 != clone2);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // getCampaign
    // ═══════════════════════════════════════════════════════════════════════

    function test_getCampaign_returnsCorrectAddress() public {
        vm.prank(creator);
        address clone = factory.createCampaign(TEST_URI);
        assertEq(factory.getCampaign(0), clone);
    }

    function test_getCampaign_returnsZeroForInvalidId() public view {
        assertEq(factory.getCampaign(999), address(0));
    }
}
