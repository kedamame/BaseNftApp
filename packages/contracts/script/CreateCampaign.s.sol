// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {NftFactory} from "../src/NftFactory.sol";

/// @notice Create a campaign via NftFactory (for testing/verification)
/// @dev Usage: FACTORY_ADDRESS=0x... CAMPAIGN_URI=https://... forge script script/CreateCampaign.s.sol --rpc-url base --broadcast
contract CreateCampaign is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address factoryAddr = vm.envAddress("FACTORY_ADDRESS");
        string memory uri = vm.envString("CAMPAIGN_URI");

        require(factoryAddr != address(0), "FACTORY_ADDRESS must not be zero");
        require(factoryAddr.code.length > 0, "FACTORY_ADDRESS has no code");

        vm.startBroadcast(deployerPrivateKey);

        NftFactory factory = NftFactory(factoryAddr);
        address campaign = factory.createCampaign(uri);

        vm.stopBroadcast();

        console.log("Campaign clone:", campaign);
        console.log("Campaign ID:", factory.campaignCount() - 1);
    }
}
