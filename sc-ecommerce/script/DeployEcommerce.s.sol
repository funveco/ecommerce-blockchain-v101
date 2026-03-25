// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {Ecommerce} from "../src/Ecommerce.sol";

contract DeployEcommerce is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        address euroTokenAddress = vm.envAddress("EURO_TOKEN_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        Ecommerce ecommerce = new Ecommerce(euroTokenAddress);
        
        vm.stopBroadcast();
        
        console.log("Ecommerce deployed at:", address(ecommerce));
        console.log("EuroToken address:", euroTokenAddress);
    }
}
