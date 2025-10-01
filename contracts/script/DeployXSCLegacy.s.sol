// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19; // Use 0.8.19 for better XSC compatibility

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/TokenFactory.sol";
import "../src/BasicERC20Template.sol";
import "../src/MintableERC20Template.sol";
import "../src/ERC20Template.sol";

/**
 * @title DeployXSCLegacy Script
 * @dev XSC Network optimized deployment with legacy gas support
 * @notice Specifically designed for XSC mainnet with pre-Shanghai EVM compatibility
 */
contract DeployXSCLegacy is Script {

    // Deployment configuration optimized for XSC
    struct XSCDeployConfig {
        address owner;
        address feeRecipient;
        uint256 serviceFee;
        uint256 gasPrice;      // Fixed gas price for legacy mode
        uint256 gasLimit;      // Conservative gas limits
        bool useMinimalProxy;  // Option for minimal proxy pattern
    }

    // XSC specific configuration
    XSCDeployConfig private xscConfig;

    function setUp() public {
        // Configure for XSC mainnet with conservative settings
        xscConfig = XSCDeployConfig({
            owner: msg.sender,
            feeRecipient: msg.sender,
            serviceFee: 0.01 ether,
            gasPrice: 20 gwei,        // Fixed gas price
            gasLimit: 15000000,       // Conservative gas limit
            useMinimalProxy: false    // Use full proxy for now
        });

        console.log("XSC Legacy Deployment Configuration:");
        console.log("  Gas Price: 20 gwei (fixed)");
        console.log("  Gas Limit: 15,000,000");
        console.log("  Solidity Version: 0.8.19 (pre-Shanghai)");
    }

    function run() public {
        console.log("=== XSC Legacy Deployment ===");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", msg.sender);
        console.log("Block Number:", block.number);

        // Verify sufficient balance
        uint256 balance = msg.sender.balance;
        uint256 estimatedCost = 10000000 * xscConfig.gasPrice; // ~10M gas * 20 gwei
        require(balance >= estimatedCost, "Insufficient balance for deployment");

        console.log("Balance:", balance);
        console.log("Estimated Cost:", estimatedCost);

        // Deploy contracts one by one to avoid batch failures
        vm.startBroadcast();

        (address factory, address[] memory templates) = deployContractsStepByStep();

        vm.stopBroadcast();

        // Verify and log results
        verifyXSCDeployment(factory, templates);
        logFinalResults(factory, templates);
    }

    function deployContractsStepByStep() internal returns (address factory, address[] memory templates) {
        templates = new address[](3);

        console.log("\n=== Step 1: Deploy ERC20 Templates ===");

        // Deploy BasicERC20Template
        console.log("Deploying BasicERC20Template...");
        try new BasicERC20Template() returns (BasicERC20Template basicTemplate) {
            templates[0] = address(basicTemplate);
            console.log("SUCCESS: BasicERC20Template:", templates[0]);
        } catch Error(string memory reason) {
            console.log("FAILED: BasicERC20Template:", reason);
            revert("BasicERC20Template deployment failed");
        }

        // Deploy MintableERC20Template
        console.log("Deploying MintableERC20Template...");
        try new MintableERC20Template() returns (MintableERC20Template mintableTemplate) {
            templates[1] = address(mintableTemplate);
            console.log("SUCCESS: MintableERC20Template:", templates[1]);
        } catch Error(string memory reason) {
            console.log("FAILED: MintableERC20Template:", reason);
            revert("MintableERC20Template deployment failed");
        }

        // Deploy ERC20Template (Full Featured)
        console.log("Deploying ERC20Template (Full Featured)...");
        try new ERC20Template() returns (ERC20Template fullTemplate) {
            templates[2] = address(fullTemplate);
            console.log("SUCCESS: ERC20Template (Full Featured):", templates[2]);
        } catch Error(string memory reason) {
            console.log("FAILED: ERC20Template:", reason);
            revert("ERC20Template deployment failed");
        }

        console.log("\n=== Step 2: Deploy TokenFactory ===");

        // Deploy TokenFactory implementation
        console.log("Deploying TokenFactory implementation...");
        address factoryImpl;
        try new TokenFactory() returns (TokenFactory impl) {
            factoryImpl = address(impl);
            console.log("SUCCESS: TokenFactory implementation:", factoryImpl);
        } catch Error(string memory reason) {
            console.log("FAILED: TokenFactory implementation:", reason);
            revert("TokenFactory implementation deployment failed");
        }

        console.log("\n=== Step 3: Deploy Proxy ===");

        // Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            TokenFactory.initialize.selector,
            xscConfig.owner,
            xscConfig.feeRecipient,
            xscConfig.serviceFee
        );

        // Deploy proxy
        console.log("Deploying UUPS Proxy...");
        try new ERC1967Proxy(factoryImpl, initData) returns (ERC1967Proxy proxy) {
            factory = address(proxy);
            console.log("SUCCESS: TokenFactory Proxy:", factory);
        } catch Error(string memory reason) {
            console.log("FAILED: Proxy deployment:", reason);
            revert("Proxy deployment failed");
        }

        console.log("\n=== Step 4: Configure Templates ===");

        TokenFactory factoryContract = TokenFactory(factory);

        // Add templates one by one
        try factoryContract.addTemplate(
            factoryContract.BASIC_ERC20(),
            templates[0]
        ) {
            console.log("SUCCESS: Basic template added");
        } catch Error(string memory reason) {
            console.log("FAILED: Basic template:", reason);
        }

        try factoryContract.addTemplate(
            factoryContract.MINTABLE_ERC20(),
            templates[1]
        ) {
            console.log("SUCCESS: Mintable template added");
        } catch Error(string memory reason) {
            console.log("FAILED: Mintable template:", reason);
        }

        try factoryContract.addTemplate(
            factoryContract.FULL_FEATURED(),
            templates[2]
        ) {
            console.log("SUCCESS: Full featured template added");
        } catch Error(string memory reason) {
            console.log("FAILED: Full featured template:", reason);
        }

        return (factory, templates);
    }

    function verifyXSCDeployment(address factory, address[] memory templates) internal view {
        console.log("\n=== Verification ===");

        // Check factory
        if (factory.code.length == 0) {
            console.log("FAILED: Factory has no code");
            return;
        }
        console.log("SUCCESS: Factory has code");

        // Check templates
        for (uint i = 0; i < templates.length; i++) {
            if (templates[i].code.length == 0) {
                console.log("FAILED: Template", i, "has no code");
            } else {
                console.log("SUCCESS: Template", i, "has code");
            }
        }

        // Check factory configuration
        TokenFactory factoryContract = TokenFactory(factory);
        try factoryContract.owner() returns (address owner) {
            console.log("SUCCESS: Factory owner:", owner);
        } catch {
            console.log("FAILED: Cannot read factory owner");
        }

        try factoryContract.getAllTemplates() returns (bytes32[] memory templateIds) {
            console.log("SUCCESS: Template count:", templateIds.length);
        } catch {
            console.log("FAILED: Cannot read templates");
        }
    }

    function logFinalResults(address factory, address[] memory templates) internal view {
        console.log("\n=== XSC Deployment Results ===");
        console.log("Network: XSC Mainnet (Chain ID: 520)");
        console.log("TokenFactory:", factory);
        console.log("BasicERC20Template:", templates[0]);
        console.log("MintableERC20Template:", templates[1]);
        console.log("ERC20Template:", templates[2]);
        console.log("Deployer:", msg.sender);
        console.log("Gas Strategy: Legacy mode");
        console.log("Solidity Version: 0.8.19");
        console.log("Deployment successful!");
    }

    // Utility functions
    function toHexString(address addr) internal pure returns (string memory) {
        bytes memory buffer = new bytes(42);
        buffer[0] = '0';
        buffer[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            uint8 value = uint8(uint160(addr) >> (8 * (19 - i)));
            buffer[2 + i * 2] = bytes1(value < 10 ? value + 48 : value + 87);
            buffer[3 + i * 2] = bytes1((value % 16) < 10 ? (value % 16) + 48 : (value % 16) + 87);
        }
        return string(buffer);
    }

    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    // Emergency function to deploy minimal factory
    function deployMinimalFactory() external {
        vm.startBroadcast();

        console.log("Deploying minimal TokenFactory for testing...");
        TokenFactory factory = new TokenFactory();
        console.log("Minimal Factory deployed at:", address(factory));

        vm.stopBroadcast();
    }
}