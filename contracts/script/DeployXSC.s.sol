// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/TokenFactory.sol";
import "../src/BasicERC20Template.sol";
import "../src/MintableERC20Template.sol";
import "../src/ERC20Template.sol";

/**
 * @title DeployXSC Script
 * @dev XSC Network specialized deployment script
 * @notice Optimized for XSC Network with legacy gas pricing and proper permissions
 */
contract DeployXSC is Script {

    // Deployment configuration
    struct DeployConfig {
        address owner;
        address feeRecipient;
        uint256 serviceFee;
        string network;
    }

    function run() public {
        // XSC Network specific configuration
        string memory network = "xsc";

        console.log("=== XSC Network Deployment ===");
        console.log("Deployer/Owner:", msg.sender);
        console.log("Chain ID:", block.chainid);
        console.log("Network:", network);

        // Configure XSC deployment with deployer as owner to avoid permission issues
        DeployConfig memory config = DeployConfig({
            owner: msg.sender,           // Use deployer as owner
            feeRecipient: msg.sender,    // Use deployer as fee recipient
            serviceFee: 0.01 ether,      // 0.01 XSC service fee
            network: network
        });

        console.log("\nDeployment Configuration:");
        console.log("  Owner:", msg.sender);
        console.log("  Fee Recipient:", msg.sender);
        console.log("  Service Fee: 0.01 XSC");

        vm.startBroadcast();

        // Deploy all contracts
        (address factory, address basicTemplate, address mintableTemplate, address fullTemplate) = deployContracts(config);

        vm.stopBroadcast();

        // Log deployment results
        logDeploymentResults(network, factory, basicTemplate, mintableTemplate, fullTemplate);

        // Save deployment info
        saveDeploymentInfo(network, factory, basicTemplate, mintableTemplate, fullTemplate);

        // Log XSC specific information
        logXSCSpecificInfo(factory);

        console.log("\n=== XSC Deployment Complete ===");
        console.log("All contracts deployed successfully on XSC Network!");
        console.log("Chain ID:", block.chainid);
        console.log("TokenFactory Address:", factory);
    }

    function deployContracts(DeployConfig memory config) internal returns (address factory, address basicTemplate, address mintableTemplate, address fullTemplate) {
        console.log("\nDeploying with configuration:");
        console.log("  Owner:", config.owner);
        console.log("  Fee Recipient:", config.feeRecipient);
        console.log("  Service Fee:", config.serviceFee);

        // 1. Deploy all ERC20 template implementations
        console.log("\n1. Deploying ERC20 Templates...");

        console.log("   Deploying BasicERC20Template...");
        basicTemplate = address(new BasicERC20Template());
        console.log("   BasicERC20Template deployed at:", basicTemplate);

        console.log("   Deploying MintableERC20Template...");
        mintableTemplate = address(new MintableERC20Template());
        console.log("   MintableERC20Template deployed at:", mintableTemplate);

        console.log("   Deploying ERC20Template (Full Featured)...");
        fullTemplate = address(new ERC20Template());
        console.log("   ERC20Template (Full Featured) deployed at:", fullTemplate);

        // 2. Deploy TokenFactory implementation
        console.log("\n2. Deploying TokenFactory implementation...");
        TokenFactory factoryImpl = new TokenFactory();
        address factoryImplAddr = address(factoryImpl);
        console.log("   TokenFactory implementation deployed at:", factoryImplAddr);

        // 3. Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            TokenFactory.initialize.selector,
            config.owner,
            config.feeRecipient,
            config.serviceFee
        );

        // 4. Deploy UUPS proxy
        console.log("\n3. Deploying TokenFactory UUPS proxy...");
        ERC1967Proxy proxy = new ERC1967Proxy(factoryImplAddr, initData);
        factory = address(proxy);
        console.log("   TokenFactory proxy deployed at:", factory);

        // 5. Set up templates in the factory
        console.log("\n4. Setting up templates...");
        TokenFactory factoryContract = TokenFactory(factory);

        // Add specialized templates
        factoryContract.addTemplate(factoryContract.BASIC_ERC20(), basicTemplate);
        factoryContract.addTemplate(factoryContract.MINTABLE_ERC20(), mintableTemplate);
        factoryContract.addTemplate(factoryContract.FULL_FEATURED(), fullTemplate);

        console.log("   Templates configured successfully");

        // 6. Verify deployment
        console.log("\n5. Verifying deployment...");
        verifyDeployment(factory, basicTemplate, mintableTemplate, fullTemplate, config);

        console.log("Deployment completed successfully!");
        return (factory, basicTemplate, mintableTemplate, fullTemplate);
    }

    function verifyDeployment(address factory, address basicTemplate, address mintableTemplate, address fullTemplate, DeployConfig memory config) internal view {
        TokenFactory factoryContract = TokenFactory(factory);

        // Verify basic configuration
        require(factoryContract.owner() == config.owner, "Invalid owner");
        require(factoryContract.getServiceFee() == config.serviceFee, "Invalid service fee");
        require(factoryContract.getFeeRecipient() == config.feeRecipient, "Invalid fee recipient");

        // Verify templates are correctly mapped
        require(factoryContract.getTemplate(factoryContract.BASIC_ERC20()) == basicTemplate, "Invalid basic template");
        require(factoryContract.getTemplate(factoryContract.MINTABLE_ERC20()) == mintableTemplate, "Invalid mintable template");
        require(factoryContract.getTemplate(factoryContract.FULL_FEATURED()) == fullTemplate, "Invalid full featured template");

        // Verify template count
        bytes32[] memory templates = factoryContract.getAllTemplates();
        require(templates.length == 3, "Invalid template count");

        // Verify templates are different contracts
        require(basicTemplate != mintableTemplate, "Basic and mintable templates should be different");
        require(basicTemplate != fullTemplate, "Basic and full templates should be different");
        require(mintableTemplate != fullTemplate, "Mintable and full templates should be different");

        console.log("   Deployment verification passed!");
    }

    function logDeploymentResults(string memory network, address factory, address basicTemplate, address mintableTemplate, address fullTemplate) internal view {
        TokenFactory factoryContract = TokenFactory(factory);

        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("Network:", network);
        console.log("Chain ID:", block.chainid);
        console.log("TokenFactory (Proxy):", factory);
        console.log("TokenFactory (Implementation):", getImplementationAddress(factory));
        console.log("BasicERC20Template:", basicTemplate);
        console.log("MintableERC20Template:", mintableTemplate);
        console.log("ERC20Template (Full Featured):", fullTemplate);
        console.log("Owner:", factoryContract.owner());
        console.log("Fee Recipient:", factoryContract.getFeeRecipient());
        console.log("Service Fee:", factoryContract.getServiceFee());
        console.log("Total Templates:", factoryContract.getAllTemplates().length);
    }

    function logXSCSpecificInfo(address factory) internal view {
        console.log("\n=== XSC Network Specific Info ===");
        console.log("Network: XSC Mainnet");
        console.log("Chain ID: 520");
        console.log("RPC URL: https://datarpc1.xsc.pub/");
        console.log("Block Explorer: https://explorer.xsc.pub/");
        console.log("");
        console.log("Contract verification may need to be done manually on XSC Explorer");
        console.log("TokenFactory:", factory);

        // Verify contract state
        TokenFactory factoryContract = TokenFactory(factory);
        console.log("\nContract Verification:");
        console.log("  Owner:", factoryContract.owner());
        console.log("  Service Fee:", factoryContract.getServiceFee());
        console.log("  Fee Recipient:", factoryContract.getFeeRecipient());
        console.log("  Templates Count:", factoryContract.getAllTemplates().length);
    }

    function getImplementationAddress(address proxy) internal view returns (address) {
        bytes32 implementationSlot = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
        return address(uint160(uint256(vm.load(proxy, implementationSlot))));
    }

    function saveDeploymentInfo(string memory network, address factory, address basicTemplate, address mintableTemplate, address fullTemplate) internal {
        string memory json = "deployment";

        vm.serializeString(json, "network", network);
        vm.serializeUint(json, "chainId", block.chainid);
        vm.serializeAddress(json, "factory", factory);
        vm.serializeAddress(json, "factoryImplementation", getImplementationAddress(factory));
        vm.serializeAddress(json, "basicTemplate", basicTemplate);
        vm.serializeAddress(json, "mintableTemplate", mintableTemplate);
        vm.serializeAddress(json, "fullTemplate", fullTemplate);
        vm.serializeAddress(json, "deployer", msg.sender);
        vm.serializeUint(json, "timestamp", block.timestamp);
        vm.serializeUint(json, "blockNumber", block.number);

        string memory finalJson = vm.serializeUint(json, "serviceFee", TokenFactory(factory).getServiceFee());

        // Always output the deployment info for manual saving
        string memory filename = string.concat("./deployments/", network, ".json");

        console.log("\n=== DEPLOYMENT INFO ===");
        console.log("File:", filename);
        console.log("Content:");
        console.log(finalJson);

        // Try to write to file (may fail due to permissions)
        console.log("\nAttempting to save deployment file...");
        try vm.writeJson(finalJson, filename) {
            console.log("Deployment info saved to:", filename);
        } catch {
            console.log("Failed to save deployment file - you may need to create it manually");
        }
    }

    // XSC specific deployment function for testing
    function deployForXSCTesting() public returns (address factory, address basicTemplate, address mintableTemplate, address fullTemplate) {
        // Test configuration with zero fees
        DeployConfig memory testConfig = DeployConfig({
            owner: msg.sender,
            feeRecipient: msg.sender,
            serviceFee: 0,  // No fees for testing
            network: "xsc_test"
        });

        console.log("XSC Testing Deployment");

        vm.startBroadcast();
        (factory, basicTemplate, mintableTemplate, fullTemplate) = deployContracts(testConfig);
        vm.stopBroadcast();

        return (factory, basicTemplate, mintableTemplate, fullTemplate);
    }

    // Verify XSC deployment
    function verifyXSCDeployment(address factory) public view returns (bool) {
        if (factory.code.length == 0) {
            console.log("ERROR: Factory address has no code");
            return false;
        }

        try TokenFactory(factory).owner() returns (address owner) {
            try TokenFactory(factory).getServiceFee() returns (uint256 fee) {
                try TokenFactory(factory).getAllTemplates() returns (bytes32[] memory templates) {
                    console.log("Verification Success:");
                    console.log("  Owner:", owner);
                    console.log("  Service Fee:", fee);
                    console.log("  Templates:", templates.length);
                    return templates.length >= 3;
                } catch {
                    console.log("ERROR: Failed to get templates");
                    return false;
                }
            } catch {
                console.log("ERROR: Failed to get service fee");
                return false;
            }
        } catch {
            console.log("ERROR: Failed to get owner");
            return false;
        }
    }

    // Get XSC network info
    function getXSCNetworkInfo() public view {
        console.log("XSC Network Information:");
        console.log("  Chain ID:", block.chainid);
        console.log("  Block Number:", block.number);
        console.log("  Block Timestamp:", block.timestamp);
        console.log("  Deployer:", msg.sender);
        console.log("  Deployer Balance:", msg.sender.balance);
    }
}