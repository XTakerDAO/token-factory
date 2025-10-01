// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/TokenFactory.sol";
import "../src/BasicERC20Template.sol";
import "../src/MintableERC20Template.sol";
import "../src/ERC20Template.sol";

/**
 * @title Simple XSC Deploy Script
 * @dev Simplified deployment for XSC with minimal complexity
 */
contract DeploySimpleXSC is Script {

    function run() public {
        console.log("=== Simple XSC Deployment ===");
        console.log("Deployer:", msg.sender);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast();

        // Deploy templates
        console.log("Deploying BasicERC20Template...");
        BasicERC20Template basicTemplate = new BasicERC20Template();
        console.log("BasicERC20Template:", address(basicTemplate));

        console.log("Deploying MintableERC20Template...");
        MintableERC20Template mintableTemplate = new MintableERC20Template();
        console.log("MintableERC20Template:", address(mintableTemplate));

        console.log("Deploying ERC20Template...");
        ERC20Template fullTemplate = new ERC20Template();
        console.log("ERC20Template:", address(fullTemplate));

        // Deploy factory implementation
        console.log("Deploying TokenFactory implementation...");
        TokenFactory factoryImpl = new TokenFactory();
        console.log("TokenFactory implementation:", address(factoryImpl));

        // Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            TokenFactory.initialize.selector,
            msg.sender,  // owner
            msg.sender,  // feeRecipient
            0.01 ether   // serviceFee
        );

        // Deploy proxy
        console.log("Deploying proxy...");
        ERC1967Proxy proxy = new ERC1967Proxy(address(factoryImpl), initData);
        address factory = address(proxy);
        console.log("TokenFactory proxy:", factory);

        // Add templates
        TokenFactory factoryContract = TokenFactory(factory);

        console.log("Adding BasicERC20Template...");
        factoryContract.addTemplate(factoryContract.BASIC_ERC20(), address(basicTemplate));

        console.log("Adding MintableERC20Template...");
        factoryContract.addTemplate(factoryContract.MINTABLE_ERC20(), address(mintableTemplate));

        console.log("Adding ERC20Template...");
        factoryContract.addTemplate(factoryContract.FULL_FEATURED(), address(fullTemplate));

        vm.stopBroadcast();

        console.log("=== Deployment Complete ===");
        console.log("TokenFactory:", factory);
        console.log("BasicERC20Template:", address(basicTemplate));
        console.log("MintableERC20Template:", address(mintableTemplate));
        console.log("ERC20Template:", address(fullTemplate));
    }
}