// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EuroToken.sol";

contract DeployEuroToken is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        EuroToken token = new EuroToken(deployer);

        // Mint initial supply: 1,000,000 EURT
        uint256 initialSupply = 1_000_000 * 10 ** 6;
        token.mint(deployer, initialSupply);

        vm.stopBroadcast();

        console.log("EuroToken deployed at:", address(token));
        console.log("Initial supply minted:", initialSupply);
    }
}
