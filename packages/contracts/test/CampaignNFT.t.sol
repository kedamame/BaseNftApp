// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {CampaignNFT} from "../src/CampaignNFT.sol";

contract CampaignNFTTest is Test {
    CampaignNFT internal impl;
    CampaignNFT internal campaign;
    address internal admin = makeAddr("admin");
    address internal operator = makeAddr("operator");
    address internal user1 = makeAddr("user1");
    address internal user2 = makeAddr("user2");
    address internal user3 = makeAddr("user3");
    string internal constant TEST_URI = "https://example.com/{id}.json";
    uint256 internal constant TOKEN_ID = 1;

    function setUp() public {
        impl = new CampaignNFT();
        address clone = Clones.clone(address(impl));
        campaign = CampaignNFT(clone);
        campaign.initialize(admin, TEST_URI);

        bytes32 operatorRole = campaign.OPERATOR_ROLE();
        vm.prank(admin);
        campaign.grantRole(operatorRole, operator);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Initialization
    // ═══════════════════════════════════════════════════════════════════════

    function test_initialize_setsUri() public view {
        assertEq(campaign.uri(0), TEST_URI);
        assertEq(campaign.uri(TOKEN_ID), TEST_URI);
    }

    function test_initialize_setsAdminRole() public view {
        assertTrue(campaign.hasRole(campaign.DEFAULT_ADMIN_ROLE(), admin));
    }

    function test_initialize_setsOperatorRole() public view {
        assertTrue(campaign.hasRole(campaign.OPERATOR_ROLE(), admin));
    }

    function test_initialize_revertsOnDoubleInit() public {
        vm.expectRevert(Initializable.InvalidInitialization.selector);
        campaign.initialize(admin, "new-uri");
    }

    function test_implementation_cannotBeInitialized() public {
        vm.expectRevert(Initializable.InvalidInitialization.selector);
        impl.initialize(admin, TEST_URI);
    }

    function test_initialize_revertsOnZeroAdmin() public {
        address clone2 = Clones.clone(address(impl));
        CampaignNFT c2 = CampaignNFT(clone2);
        vm.expectRevert(CampaignNFT.ZeroAddress.selector);
        c2.initialize(address(0), TEST_URI);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Minting
    // ═══════════════════════════════════════════════════════════════════════

    function test_mint_operatorCanMint() public {
        vm.prank(operator);
        campaign.mint(user1, TOKEN_ID, 5);
        assertEq(campaign.balanceOf(user1, TOKEN_ID), 5);
    }

    function test_mint_emitsMintedEvent() public {
        vm.prank(operator);
        vm.expectEmit(true, true, false, true);
        emit CampaignNFT.Minted(user1, TOKEN_ID, 3);
        campaign.mint(user1, TOKEN_ID, 3);
    }

    function test_mint_updatesSupply() public {
        vm.prank(operator);
        campaign.mint(user1, TOKEN_ID, 10);
        assertEq(campaign.totalSupply(TOKEN_ID), 10);
    }

    function test_mint_revertsForNonOperator() public {
        bytes32 role = campaign.OPERATOR_ROLE();
        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, user1, role)
        );
        campaign.mint(user1, TOKEN_ID, 1);
    }

    function test_mint_revertsForZeroAddress() public {
        vm.prank(operator);
        vm.expectRevert(CampaignNFT.ZeroAddress.selector);
        campaign.mint(address(0), TOKEN_ID, 1);
    }

    function test_mint_revertsForZeroAmount() public {
        vm.prank(operator);
        vm.expectRevert(CampaignNFT.ZeroAmount.selector);
        campaign.mint(user1, TOKEN_ID, 0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Batch Minting
    // ═══════════════════════════════════════════════════════════════════════

    function test_mintBatch_mintsToMultipleRecipients() public {
        address[] memory tos = new address[](3);
        tos[0] = user1;
        tos[1] = user2;
        tos[2] = user3;
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 1;
        amounts[1] = 2;
        amounts[2] = 3;

        vm.prank(operator);
        campaign.mintBatch(tos, TOKEN_ID, amounts);

        assertEq(campaign.balanceOf(user1, TOKEN_ID), 1);
        assertEq(campaign.balanceOf(user2, TOKEN_ID), 2);
        assertEq(campaign.balanceOf(user3, TOKEN_ID), 3);
        assertEq(campaign.totalSupply(TOKEN_ID), 6);
    }

    function test_mintBatch_emitsBatchMintedEvent() public {
        address[] memory tos = new address[](2);
        tos[0] = user1;
        tos[1] = user2;
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1;
        amounts[1] = 1;

        vm.prank(operator);
        vm.expectEmit(false, true, false, true);
        emit CampaignNFT.BatchMinted(tos, TOKEN_ID, amounts);
        campaign.mintBatch(tos, TOKEN_ID, amounts);
    }

    function test_mintBatch_revertsForEmptyArray() public {
        address[] memory tos = new address[](0);
        uint256[] memory amounts = new uint256[](0);

        vm.prank(operator);
        vm.expectRevert(CampaignNFT.EmptyArray.selector);
        campaign.mintBatch(tos, TOKEN_ID, amounts);
    }

    function test_mintBatch_revertsForMismatchedArrays() public {
        address[] memory tos = new address[](2);
        tos[0] = user1;
        tos[1] = user2;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1;

        vm.prank(operator);
        vm.expectRevert(CampaignNFT.ArrayLengthMismatch.selector);
        campaign.mintBatch(tos, TOKEN_ID, amounts);
    }

    function test_mintBatch_revertsForNonOperator() public {
        address[] memory tos = new address[](1);
        tos[0] = user1;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1;

        bytes32 role = campaign.OPERATOR_ROLE();
        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, user1, role)
        );
        campaign.mintBatch(tos, TOKEN_ID, amounts);
    }

    function test_mintBatch_revertsIfAnyAddressZero() public {
        address[] memory tos = new address[](2);
        tos[0] = user1;
        tos[1] = address(0);
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1;
        amounts[1] = 1;

        vm.prank(operator);
        vm.expectRevert(CampaignNFT.ZeroAddress.selector);
        campaign.mintBatch(tos, TOKEN_ID, amounts);
    }

    function test_mintBatch_revertsIfAnyAmountZero() public {
        address[] memory tos = new address[](2);
        tos[0] = user1;
        tos[1] = user2;
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1;
        amounts[1] = 0;

        vm.prank(operator);
        vm.expectRevert(CampaignNFT.ZeroAmount.selector);
        campaign.mintBatch(tos, TOKEN_ID, amounts);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Pause
    // ═══════════════════════════════════════════════════════════════════════

    function test_pause_adminCanPause() public {
        vm.prank(admin);
        campaign.pause();
        assertTrue(campaign.paused());
    }

    function test_pause_mintRevertsWhenPaused() public {
        vm.prank(admin);
        campaign.pause();

        vm.prank(operator);
        vm.expectRevert();
        campaign.mint(user1, TOKEN_ID, 1);
    }

    function test_unpause_adminCanUnpause() public {
        vm.prank(admin);
        campaign.pause();

        vm.prank(admin);
        campaign.unpause();
        assertFalse(campaign.paused());

        // Can mint again
        vm.prank(operator);
        campaign.mint(user1, TOKEN_ID, 1);
        assertEq(campaign.balanceOf(user1, TOKEN_ID), 1);
    }

    function test_pause_revertsForNonAdmin() public {
        bytes32 role = campaign.DEFAULT_ADMIN_ROLE();
        vm.prank(operator);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, operator, role)
        );
        campaign.pause();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Metadata
    // ═══════════════════════════════════════════════════════════════════════

    function test_setURI_adminCanUpdate() public {
        string memory newUri = "https://new.example.com/{id}.json";
        vm.prank(admin);
        campaign.setURI(newUri);
        assertEq(campaign.uri(0), newUri);
    }

    function test_setURI_emitsURIUpdated() public {
        string memory newUri = "https://new.example.com/{id}.json";
        vm.prank(admin);
        vm.expectEmit(false, false, false, true);
        emit CampaignNFT.URIUpdated(newUri);
        campaign.setURI(newUri);
    }

    function test_setURI_revertsWhenFrozen() public {
        vm.startPrank(admin);
        campaign.freezeMetadata();
        vm.expectRevert(CampaignNFT.MetadataIsFrozen.selector);
        campaign.setURI("new");
        vm.stopPrank();
    }

    function test_freezeMetadata_emitsEvent() public {
        vm.prank(admin);
        vm.expectEmit(false, false, false, true);
        emit CampaignNFT.MetadataFrozen();
        campaign.freezeMetadata();
    }

    function test_freezeMetadata_revertsWhenAlreadyFrozen() public {
        vm.startPrank(admin);
        campaign.freezeMetadata();
        vm.expectRevert(CampaignNFT.MetadataIsFrozen.selector);
        campaign.freezeMetadata();
        vm.stopPrank();
    }

    function test_freezeMetadata_revertsForNonAdmin() public {
        bytes32 role = campaign.DEFAULT_ADMIN_ROLE();
        vm.prank(operator);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, operator, role)
        );
        campaign.freezeMetadata();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Interface
    // ═══════════════════════════════════════════════════════════════════════

    function test_supportsInterface_ERC1155() public view {
        // ERC1155 interface ID: 0xd9b67a26
        assertTrue(campaign.supportsInterface(0xd9b67a26));
    }

    function test_supportsInterface_AccessControl() public view {
        // IAccessControl interface ID: 0x7965db0b
        assertTrue(campaign.supportsInterface(0x7965db0b));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Fuzz
    // ═══════════════════════════════════════════════════════════════════════

    function testFuzz_mintBatch_varyingSizes(uint8 count) public {
        count = uint8(bound(count, 1, 50));
        address[] memory tos = new address[](count);
        uint256[] memory amounts = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            tos[i] = makeAddr(string(abi.encodePacked("recipient", i)));
            amounts[i] = 1;
        }

        vm.prank(operator);
        campaign.mintBatch(tos, TOKEN_ID, amounts);

        assertEq(campaign.totalSupply(TOKEN_ID), count);
        for (uint256 i = 0; i < count; i++) {
            assertEq(campaign.balanceOf(tos[i], TOKEN_ID), 1);
        }
    }

    function testFuzz_mint_anyTokenIdAndAmount(uint256 tokenId, uint256 amount) public {
        amount = bound(amount, 1, 1_000_000);

        vm.prank(operator);
        campaign.mint(user1, tokenId, amount);
        assertEq(campaign.balanceOf(user1, tokenId), amount);
        assertEq(campaign.totalSupply(tokenId), amount);
    }
}
