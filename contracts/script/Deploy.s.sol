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
 * @title Deploy Script
 * @dev Deployment script for TokenFactory with UUPS proxy pattern
 * @notice Supports multi-chain deployment (ETH, BSC, XSC)
 */
contract Deploy is Script {
    // Deployment configuration
    struct DeployConfig {
        address owner;
        address feeRecipient;
        uint256 serviceFee;
        string network;
    }

    // Network-specific configurations
    mapping(string => DeployConfig) private configs;

    function setUp() public {
        // Ethereum Mainnet configuration
        configs["ethereum"] = DeployConfig({
            owner: vm.envOr("OWNER_ADDRESS", msg.sender),
            feeRecipient: vm.envOr("FEE_RECIPIENT", msg.sender),
            serviceFee: 0.01 ether, // 0.01 ETH
            network: "ethereum"
        });

        // BSC Mainnet configuration
        configs["bsc"] = DeployConfig({
            owner: vm.envOr("OWNER_ADDRESS", msg.sender),
            feeRecipient: vm.envOr("FEE_RECIPIENT", msg.sender),
            serviceFee: 0.1 ether, // 0.1 BNB
            network: "bsc"
        });

        // XSC Network configuration
        configs["xsc"] = DeployConfig({
            owner: vm.envOr("OWNER_ADDRESS", msg.sender),
            feeRecipient: vm.envOr("FEE_RECIPIENT", msg.sender),
            serviceFee: 0.01 ether, // 0.01 XSC
            network: "xsc"
        });

        // Testnet configurations
        configs["sepolia"] = DeployConfig({
            owner: msg.sender,
            feeRecipient: msg.sender,
            serviceFee: 0.001 ether,
            network: "sepolia"
        });

        configs["bsc_testnet"] = DeployConfig({
            owner: msg.sender,
            feeRecipient: msg.sender,
            serviceFee: 0.001 ether,
            network: "bsc_testnet"
        });

        configs["xsc_testnet"] = DeployConfig({
            owner: msg.sender,
            feeRecipient: msg.sender,
            serviceFee: 0.001 ether,
            network: "xsc_testnet"
        });

        // Local/Anvil configuration
        configs["localhost"] = DeployConfig({
            owner: msg.sender,
            feeRecipient: msg.sender,
            serviceFee: 0,
            network: "localhost"
        });

        configs["anvil"] = configs["localhost"];
    }

    function run() public {
        // Get network name from environment or default to localhost
        string memory network = vm.envOr("NETWORK", string("localhost"));

        // Use localhost config for unknown networks
        if (bytes(configs[network].network).length == 0) {
            network = "localhost";
        }

        console.log("Deploying to network:", network);
        console.log("Deployer address:", msg.sender);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast();

        // Deploy the contracts
        (address factory, address basicTemplate, address mintableTemplate, address fullTemplate) = deployContracts(network);

        vm.stopBroadcast();

        // Log deployment results
        logDeploymentResults(network, factory, basicTemplate, mintableTemplate, fullTemplate);

        // Save deployment info to file
        saveDeploymentInfo(network, factory, basicTemplate, mintableTemplate, fullTemplate);

        // Verify contracts if needed
        if (!isLocalNetwork(network)) {
            logVerificationInfo(factory, basicTemplate, mintableTemplate, fullTemplate);
        }
    }

    function deployContracts(string memory network) internal returns (address factory, address basicTemplate, address mintableTemplate, address fullTemplate) {
        DeployConfig memory config = configs[network];

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

    function logVerificationInfo(address factory, address basicTemplate, address mintableTemplate, address fullTemplate) internal view {
        console.log("\n=== VERIFICATION INFO ===");
        console.log("Please verify contracts on the block explorer:");
        console.log("1. TokenFactory Implementation:", getImplementationAddress(factory));
        console.log("2. TokenFactory Proxy:", factory);
        console.log("3. BasicERC20Template:", basicTemplate);
        console.log("4. MintableERC20Template:", mintableTemplate);
        console.log("5. ERC20Template (Full Featured):", fullTemplate);
        console.log("\nUsing Foundry:");
        console.log("forge verify-contract <address> <contract> --chain-id <chain_id>");
    }

    function getImplementationAddress(address proxy) internal view returns (address) {
        bytes32 implementationSlot = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
        return address(uint160(uint256(vm.load(proxy, implementationSlot))));
    }

    function isLocalNetwork(string memory network) internal pure returns (bool) {
        return keccak256(abi.encodePacked(network)) == keccak256(abi.encodePacked("localhost")) ||
               keccak256(abi.encodePacked(network)) == keccak256(abi.encodePacked("anvil"));
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
        // Note: vm.writeJson failure will be caught by the script runner
        console.log("\nAttempting to save deployment file...");
        vm.writeJson(finalJson, filename);
        console.log("Deployment info saved to:", filename);
    }

    // Utility functions for testing and custom deployments
    function deployLocal() public returns (address factory, address basicTemplate, address mintableTemplate, address fullTemplate) {
        vm.startBroadcast();
        (factory, basicTemplate, mintableTemplate, fullTemplate) = deployContracts("localhost");
        vm.stopBroadcast();
        return (factory, basicTemplate, mintableTemplate, fullTemplate);
    }

    function deployWithConfig(
        address owner,
        address feeRecipient,
        uint256 serviceFee
    ) public returns (address factory, address basicTemplate, address mintableTemplate, address fullTemplate) {
        configs["custom"] = DeployConfig({
            owner: owner,
            feeRecipient: feeRecipient,
            serviceFee: serviceFee,
            network: "custom"
        });

        vm.startBroadcast();
        (factory, basicTemplate, mintableTemplate, fullTemplate) = deployContracts("custom");
        vm.stopBroadcast();
        return (factory, basicTemplate, mintableTemplate, fullTemplate);
    }

    // XSC-specific deployment with pre-Shanghai EVM compatibility
    function deployForXsc() public returns (address factory, address basicTemplate, address mintableTemplate, address fullTemplate) {
        console.log("Deploying for XSC Network with pre-Shanghai EVM compatibility...");
        console.log("Using Solidity 0.8.19 compilation (configured in foundry.toml profile)");

        // Ensure gas limits are compatible with XSC
        require(gasleft() > 3000000, "Insufficient gas for XSC deployment");

        vm.startBroadcast();

        // Use XSC network configuration
        (factory, basicTemplate, mintableTemplate, fullTemplate) = deployContracts("xsc");

        vm.stopBroadcast();

        console.log("XSC deployment completed successfully!");
        return (factory, basicTemplate, mintableTemplate, fullTemplate);
    }

    // Deploy only ERC20Template (for testing)
    function deployTemplateOnly() public returns (address template) {
        vm.startBroadcast();
        template = address(new ERC20Template());
        vm.stopBroadcast();
        
        console.log("ERC20Template deployed at:", template);
        return template;
    }

    // Deploy with multiple templates
    function deployWithMultipleTemplates(
        address basicTemplate,
        address mintableTemplate,
        address fullTemplate
    ) public returns (address factory) {
        string memory network = vm.envOr("NETWORK", string("localhost"));
        DeployConfig memory config = configs[network];

        vm.startBroadcast();

        // Deploy factory implementation
        TokenFactory factoryImpl = new TokenFactory();

        // Initialize factory
        bytes memory initData = abi.encodeWithSelector(
            TokenFactory.initialize.selector,
            config.owner,
            config.feeRecipient,
            config.serviceFee
        );

        ERC1967Proxy proxy = new ERC1967Proxy(address(factoryImpl), initData);
        factory = address(proxy);

        // Add templates
        TokenFactory factoryContract = TokenFactory(factory);
        if (basicTemplate != address(0)) {
            factoryContract.addTemplate(factoryContract.BASIC_ERC20(), basicTemplate);
        }
        if (mintableTemplate != address(0)) {
            factoryContract.addTemplate(factoryContract.MINTABLE_ERC20(), mintableTemplate);
        }
        if (fullTemplate != address(0)) {
            factoryContract.addTemplate(factoryContract.FULL_FEATURED(), fullTemplate);
        }

        vm.stopBroadcast();

        console.log("Factory with multiple templates deployed at:", factory);
        return factory;
    }

    // Test deployment function
    function testDeployment(address factory, address template) external view returns (bool) {
        // Check if factory is a contract address
        if (factory.code.length == 0) {
            return false;
        }

        try TokenFactory(factory).getServiceFee() returns (uint256) {
            try TokenFactory(factory).getAllTemplates() returns (bytes32[] memory templates) {
                return templates.length > 0 && template != address(0);
            } catch {
                return false;
            }
        } catch {
            return false;
        }
    }

    // Get deployment configuration for a network
    function getNetworkConfig(string memory network) external view returns (DeployConfig memory) {
        return configs[network];
    }

    // Create deployment directory
    function createDeploymentDir() public {
        try vm.createDir("./deployments", true) {
            console.log("Created deployments directory");
        } catch {
            console.log("Deployments directory already exists or creation failed");
        }
    }
}