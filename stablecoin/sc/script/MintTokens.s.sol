// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EuroToken.sol";

contract MintTokens is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address euroTokenAddress = vm.envAddress("EUROTOKEN_ADDRESS");
        address recipient = vm.envAddress("RECIPIENT_ADDRESS");
        uint256 amount = vm.envUint("AMOUNT");

        vm.startBroadcast(deployerPrivateKey);

        EuroToken token = EuroToken(payable(euroTokenAddress));
        token.mint(recipient, amount);

        vm.stopBroadcast();

        console.log("Minted", amount, "EURT to", recipient);
    }
}
