// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CampaignNFT} from "../src/CampaignNFT.sol";
import {NftFactory} from "../src/NftFactory.sol";

/// @notice Deploy CampaignNFT implementation + NftFactory
/// @dev Usage: forge script script/DeployFactory.s.sol --rpc-url base --broadcast --verify
contract DeployFactory is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        CampaignNFT implementation = new CampaignNFT();
        NftFactory factory = new NftFactory(address(implementation));

        vm.stopBroadcast();

        console.log("Implementation:", address(implementation));
        console.log("Factory:", address(factory));
    }
}
