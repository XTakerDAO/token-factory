// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/TokenFactory.sol";
import "../src/ERC20Template.sol";

/**
 * @title Contract Verification Script
 * @dev Script for verifying deployed contracts on block explorers
 * @notice Supports Etherscan, BSCScan, and custom explorers for XSC
 */
contract Verify is Script {

    struct DeploymentInfo {
        address factory;
        address factoryImplementation;
        address template;
        string network;
        uint256 blockNumber;
    }

    // Network configurations for verification
    mapping(string => string) private explorerUrls;
    mapping(string => string) private apiKeys;

    function setUp() public {
        // Set up explorer URLs
        explorerUrls["ethereum"] = "https://api.etherscan.io/api";
        explorerUrls["sepolia"] = "https://api-sepolia.etherscan.io/api";
        explorerUrls["bsc"] = "https://api.bscscan.com/api";
        explorerUrls["bsc_testnet"] = "https://api-testnet.bscscan.com/api";
        explorerUrls["xsc"] = "https://api.xsc.pub/api"; // Custom XSC explorer
        explorerUrls["xsc_testnet"] = "https://api-testnet.xsc.pub/api";

        // Load API keys from environment
        apiKeys["ethereum"] = vm.envOr("ETHERSCAN_API_KEY", string(""));
        apiKeys["sepolia"] = vm.envOr("ETHERSCAN_API_KEY", string(""));
        apiKeys["bsc"] = vm.envOr("BSCSCAN_API_KEY", string(""));
        apiKeys["bsc_testnet"] = vm.envOr("BSCSCAN_API_KEY", string(""));
        apiKeys["xsc"] = vm.envOr("XSC_API_KEY", string(""));
        apiKeys["xsc_testnet"] = vm.envOr("XSC_API_KEY", string(""));
    }

    function run() public {
        string memory network = vm.envOr("NETWORK", string("sepolia"));

        console.log("Starting verification for network:", network);
        console.log("Chain ID:", block.chainid);

        // Load deployment info
        DeploymentInfo memory deployment = loadDeploymentInfo(network);

        if (deployment.factory == address(0)) {
            console.log("No deployment info found for network:", network);
            console.log("Please deploy contracts first using Deploy.s.sol");
            return;
        }

        console.log("Found deployment info:");
        console.log("  Factory (Proxy):", deployment.factory);
        console.log("  Factory (Implementation):", deployment.factoryImplementation);
        console.log("  Template:", deployment.template);

        // Verify contracts
        verifyContracts(deployment, network);
    }

    function verifyContracts(DeploymentInfo memory deployment, string memory network) internal {
        console.log("\n=== CONTRACT VERIFICATION ===");

        // 1. Verify ERC20Template (no constructor args)
        console.log("\n1. Verifying ERC20Template...");
        verifyContract(
            deployment.template,
            "contracts/src/ERC20Template.sol:ERC20Template",
            "",
            network
        );

        // 2. Verify TokenFactory Implementation (no constructor args)
        console.log("\n2. Verifying TokenFactory Implementation...");
        verifyContract(
            deployment.factoryImplementation,
            "contracts/src/TokenFactory.sol:TokenFactory",
            "",
            network
        );

        // 3. Verify TokenFactory Proxy (with constructor args)
        console.log("\n3. Verifying TokenFactory Proxy...");
        bytes memory proxyConstructorArgs = abi.encode(
            deployment.factoryImplementation,
            getInitializationData(network)
        );
        verifyContract(
            deployment.factory,
            "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy",
            string(abi.encodePacked(proxyConstructorArgs)),
            network
        );

        console.log("\nVerification process completed!");
        console.log("Check the block explorer for verification status");
    }

    function verifyContract(
        address contractAddress,
        string memory contractPath,
        string memory constructorArgs,
        string memory network
    ) internal {
        // Build verification command
        string memory verifyCommand = buildVerifyCommand(
            contractAddress,
            contractPath,
            constructorArgs,
            network
        );

        console.log("Verification command:");
        console.log(verifyCommand);

        // Log verification URLs for manual verification
        logVerificationUrl(contractAddress, network);
    }

    function buildVerifyCommand(
        address contractAddress,
        string memory contractPath,
        string memory constructorArgs,
        string memory network
    ) internal view returns (string memory) {
        string memory baseCommand = "forge verify-contract";

        // Add contract address
        string memory command = string(abi.encodePacked(
            baseCommand,
            " ",
            vm.toString(contractAddress)
        ));

        // Add contract path
        command = string(abi.encodePacked(
            command,
            " ",
            contractPath
        ));

        // Add network/chain-id
        if (keccak256(abi.encodePacked(network)) == keccak256(abi.encodePacked("sepolia"))) {
            command = string(abi.encodePacked(command, " --chain-id 11155111"));
        } else if (keccak256(abi.encodePacked(network)) == keccak256(abi.encodePacked("bsc_testnet"))) {
            command = string(abi.encodePacked(command, " --chain-id 97"));
        } else if (keccak256(abi.encodePacked(network)) == keccak256(abi.encodePacked("xsc_testnet"))) {
            command = string(abi.encodePacked(command, " --chain-id 199291"));
        } else {
            command = string(abi.encodePacked(command, " --chain-id ", vm.toString(block.chainid)));
        }

        // Add constructor arguments if provided
        if (bytes(constructorArgs).length > 0) {
            command = string(abi.encodePacked(
                command,
                " --constructor-args ",
                constructorArgs
            ));
        }

        // Add API key if available
        string memory apiKey = apiKeys[network];
        if (bytes(apiKey).length > 0) {
            command = string(abi.encodePacked(
                command,
                " --etherscan-api-key ",
                apiKey
            ));
        }

        return command;
    }

    function logVerificationUrl(address contractAddress, string memory network) internal view {
        string memory explorerUrl;

        if (keccak256(abi.encodePacked(network)) == keccak256(abi.encodePacked("sepolia"))) {
            explorerUrl = "https://sepolia.etherscan.io/address/";
        } else if (keccak256(abi.encodePacked(network)) == keccak256(abi.encodePacked("bsc_testnet"))) {
            explorerUrl = "https://testnet.bscscan.com/address/";
        } else if (keccak256(abi.encodePacked(network)) == keccak256(abi.encodePacked("xsc_testnet"))) {
            explorerUrl = "https://testnet-explorer.xsc.pub/address/";
        } else if (keccak256(abi.encodePacked(network)) == keccak256(abi.encodePacked("ethereum"))) {
            explorerUrl = "https://etherscan.io/address/";
        } else if (keccak256(abi.encodePacked(network)) == keccak256(abi.encodePacked("bsc"))) {
            explorerUrl = "https://bscscan.com/address/";
        } else if (keccak256(abi.encodePacked(network)) == keccak256(abi.encodePacked("xsc"))) {
            explorerUrl = "https://explorer.xsc.pub/address/";
        }

        if (bytes(explorerUrl).length > 0) {
            console.log("Explorer URL:", string(abi.encodePacked(explorerUrl, vm.toString(contractAddress))));
        }
    }

    function loadDeploymentInfo(string memory network) internal view returns (DeploymentInfo memory) {
        string memory filename = string.concat("./deployments/", network, ".json");

        try vm.readFile(filename) returns (string memory json) {
            // Parse deployment JSON
            address factory = vm.parseJsonAddress(json, ".factory");
            address factoryImplementation = vm.parseJsonAddress(json, ".factoryImplementation");
            address template = vm.parseJsonAddress(json, ".template");
            uint256 blockNumber = vm.parseJsonUint(json, ".blockNumber");

            return DeploymentInfo({
                factory: factory,
                factoryImplementation: factoryImplementation,
                template: template,
                network: network,
                blockNumber: blockNumber
            });
        } catch {
            console.log("Could not load deployment info from:", filename);
            return DeploymentInfo({
                factory: address(0),
                factoryImplementation: address(0),
                template: address(0),
                network: network,
                blockNumber: 0
            });
        }
    }

    function getInitializationData(string memory network) internal view returns (bytes memory) {
        // This should match the initialization data used during deployment
        // For now, return empty data as the actual initialization depends on deployment config
        DeploymentInfo memory deployment = loadDeploymentInfo(network);

        // Default initialization for testing
        address defaultOwner = 0x742d35Cc6634C0532925a3b8D68aB32B8c1c9D1e; // Replace with actual owner
        address defaultFeeRecipient = defaultOwner;
        uint256 defaultServiceFee = 0.001 ether; // 0.001 ETH for testnets

        return abi.encodeWithSelector(
            TokenFactory.initialize.selector,
            defaultOwner,
            defaultFeeRecipient,
            defaultServiceFee
        );
    }

    // Utility functions for batch verification
    function verifyAllContracts() public {
        string[] memory networks = new string[](3);
        networks[0] = "sepolia";
        networks[1] = "bsc_testnet";
        networks[2] = "xsc_testnet";

        for (uint256 i = 0; i < networks.length; i++) {
            console.log("\n==========================================");
            console.log("Verifying contracts on:", networks[i]);
            console.log("==========================================");

            DeploymentInfo memory deployment = loadDeploymentInfo(networks[i]);
            if (deployment.factory != address(0)) {
                verifyContracts(deployment, networks[i]);
            } else {
                console.log("No deployment found for:", networks[i]);
            }
        }
    }

    // Manual verification helper - generates commands for copy-paste
    function generateVerificationCommands(string memory network) public view {
        DeploymentInfo memory deployment = loadDeploymentInfo(network);

        if (deployment.factory == address(0)) {
            console.log("No deployment info found for network:", network);
            return;
        }

        console.log("\n=== MANUAL VERIFICATION COMMANDS ===");
        console.log("Copy and paste these commands to verify contracts:\n");

        // ERC20Template
        string memory templateCmd = buildVerifyCommand(
            deployment.template,
            "contracts/src/ERC20Template.sol:ERC20Template",
            "",
            network
        );
        console.log("1. ERC20Template:");
        console.log(templateCmd);
        console.log("");

        // TokenFactory Implementation
        string memory factoryImplCmd = buildVerifyCommand(
            deployment.factoryImplementation,
            "contracts/src/TokenFactory.sol:TokenFactory",
            "",
            network
        );
        console.log("2. TokenFactory Implementation:");
        console.log(factoryImplCmd);
        console.log("");

        // TokenFactory Proxy
        bytes memory proxyArgs = abi.encode(
            deployment.factoryImplementation,
            getInitializationData(network)
        );
        string memory proxyCmd = buildVerifyCommand(
            deployment.factory,
            "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy",
            vm.toString(proxyArgs),
            network
        );
        console.log("3. TokenFactory Proxy:");
        console.log(proxyCmd);
        console.log("");
    }

    // Check verification status
    function checkVerificationStatus(string memory network) public view {
        DeploymentInfo memory deployment = loadDeploymentInfo(network);

        if (deployment.factory == address(0)) {
            console.log("No deployment info found for network:", network);
            return;
        }

        console.log("\n=== VERIFICATION STATUS CHECK ===");
        console.log("Network:", network);
        console.log("Check these URLs for verification status:\n");

        logVerificationUrl(deployment.template, network);
        console.log("^ ERC20Template\n");

        logVerificationUrl(deployment.factoryImplementation, network);
        console.log("^ TokenFactory Implementation\n");

        logVerificationUrl(deployment.factory, network);
        console.log("^ TokenFactory Proxy\n");
    }
}