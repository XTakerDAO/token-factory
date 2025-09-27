// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/TokenFactory.sol";
import "../src/ERC20Template.sol";

/**
 * @title Simple Deploy Script (No File Write)
 * @dev Simplified deployment script without file write operations
 */
contract DeploySimple is Script {
    function run() public {
        string memory network = vm.envOr("NETWORK", string("localhost"));

        console.log("Starting Token Factory Deployment");
        console.log("Network:", network);
        console.log("Deployer:", msg.sender);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast();

        // 1. Deploy ERC20Template
        console.log("\n1. Deploying ERC20Template...");
        ERC20Template template = new ERC20Template();
        console.log("   ERC20Template:", address(template));

        // 2. Deploy TokenFactory implementation
        console.log("\n2. Deploying TokenFactory implementation...");
        TokenFactory factoryImpl = new TokenFactory();
        console.log("   TokenFactory implementation:", address(factoryImpl));

        // 3. Deploy UUPS proxy
        console.log("\n3. Deploying TokenFactory UUPS proxy...");
        bytes memory initData = abi.encodeWithSelector(
            TokenFactory.initialize.selector,
            msg.sender,
            msg.sender,
            0
        );

        ERC1967Proxy proxy = new ERC1967Proxy(address(factoryImpl), initData);
        address factory = address(proxy);
        console.log("   TokenFactory proxy:", factory);

        // 4. Setup templates
        console.log("\n4. Setting up templates...");
        TokenFactory factoryContract = TokenFactory(factory);

        factoryContract.addTemplate(factoryContract.BASIC_ERC20(), address(template));
        factoryContract.addTemplate(factoryContract.MINTABLE_ERC20(), address(template));
        factoryContract.addTemplate(factoryContract.FULL_FEATURED(), address(template));

        console.log("   Templates configured");

        // 5. Verify deployment
        console.log("\n5. Verifying deployment...");
        require(factoryContract.owner() == msg.sender, "Invalid owner");
        require(factoryContract.getServiceFee() == 0, "Invalid service fee");
        require(factoryContract.getAllTemplates().length == 3, "Invalid template count");
        console.log("   Verification passed");

        vm.stopBroadcast();

        // 6. Output deployment info
        console.log("\nDEPLOYMENT COMPLETE!");
        console.log("========================================");
        console.log("Network:", network);
        console.log("Chain ID:", block.chainid);
        console.log("TokenFactory (Proxy):", factory);
        console.log("TokenFactory (Implementation):", address(factoryImpl));
        console.log("ERC20Template:", address(template));
        console.log("Owner:", msg.sender);
        console.log("Service Fee:", factoryContract.getServiceFee());
        console.log("Total Templates:", factoryContract.getAllTemplates().length);

        // 7. JSON output for easy copying
        console.log("\nDEPLOYMENT JSON (copy to save):");
        console.log("========================================");

        string memory json = string(abi.encodePacked(
            "{",
            '"blockNumber":', vm.toString(block.number), ",",
            '"chainId":', vm.toString(block.chainid), ",",
            '"deployer":"', vm.toString(msg.sender), '",',
            '"factory":"', vm.toString(factory), '",',
            '"factoryImplementation":"', vm.toString(address(factoryImpl)), '",',
            '"network":"', network, '",',
            '"serviceFee":', vm.toString(factoryContract.getServiceFee()), ",",
            '"template":"', vm.toString(address(template)), '",',
            '"timestamp":', vm.toString(block.timestamp),
            "}"
        ));

        console.log(json);

        console.log("\nTo save deployment info, run:");
        string memory saveCommand = string(abi.encodePacked(
            "echo '", json, "' > contracts/deployments/", network, ".json"
        ));
        console.log(saveCommand);
    }
}