// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/TokenFactory.sol";
import "../src/ERC20Template.sol";

/**
 * @title Hardware Wallet Deploy Script
 * @dev Secure deployment script for TokenFactory using hardware wallets
 * @notice Supports Ledger, Trezor, and multi-sig wallets
 */
contract DeployHardware is Script {
    // Deployment configuration
    struct DeployConfig {
        address owner;
        address feeRecipient;
        uint256 serviceFee;
        string network;
        bool useMultiSig;
        address[] multiSigOwners;
        uint256 multiSigThreshold;
    }

    // Network-specific configurations
    mapping(string => DeployConfig) private configs;

    function setUp() public {
        // Ethereum Mainnet - Hardware Wallet Configuration
        configs["ethereum"] = DeployConfig({
            owner: address(0), // Will be set to msg.sender (hardware wallet)
            feeRecipient: vm.envOr("FEE_RECIPIENT", address(0)),
            serviceFee: vm.envOr("INITIAL_SERVICE_FEE", uint256(0.01 ether)),
            network: "ethereum",
            useMultiSig: vm.envOr("USE_MULTISIG", false),
            multiSigOwners: new address[](0), // Will be populated if needed
            multiSigThreshold: vm.envOr("MULTISIG_THRESHOLD", uint256(2))
        });

        // BSC Mainnet Configuration
        configs["bsc"] = DeployConfig({
            owner: address(0),
            feeRecipient: vm.envOr("FEE_RECIPIENT", address(0)),
            serviceFee: vm.envOr("INITIAL_SERVICE_FEE", uint256(0.01 ether)),
            network: "bsc",
            useMultiSig: vm.envOr("USE_MULTISIG", false),
            multiSigOwners: new address[](0),
            multiSigThreshold: vm.envOr("MULTISIG_THRESHOLD", uint256(2))
        });

        // XSC Network Configuration
        configs["xsc"] = DeployConfig({
            owner: address(0),
            feeRecipient: vm.envOr("FEE_RECIPIENT", address(0)),
            serviceFee: vm.envOr("INITIAL_SERVICE_FEE", uint256(0.01 ether)),
            network: "xsc",
            useMultiSig: vm.envOr("USE_MULTISIG", false),
            multiSigOwners: new address[](0),
            multiSigThreshold: vm.envOr("MULTISIG_THRESHOLD", uint256(2))
        });
    }

    function run() public {
        string memory network = vm.envOr("NETWORK", string("ethereum"));
        DeployConfig memory config = configs[network];

        // Set owner to hardware wallet address (msg.sender)
        config.owner = msg.sender;

        console.log("=== Hardware Wallet Deployment ===");
        console.log("Network:", network);
        console.log("Deployer (Hardware Wallet):", msg.sender);
        console.log("Owner:", config.owner);
        console.log("Fee Recipient:", config.feeRecipient);
        console.log("Service Fee:", config.serviceFee);
        console.log("Use MultiSig:", config.useMultiSig);

        // Verify hardware wallet has sufficient balance
        uint256 balance = msg.sender.balance;
        console.log("Hardware Wallet Balance:", balance);
        require(balance > 0.1 ether, "Insufficient balance for deployment");

        // Deploy with hardware wallet confirmation
        deployWithHardwareWallet(config);
    }

    function deployWithHardwareWallet(DeployConfig memory config) internal {
        vm.startBroadcast(); // Hardware wallet will prompt for confirmation

        // 1. Deploy TokenFactory implementation
        console.log("\n1. Deploying TokenFactory implementation...");
        TokenFactory implementation = new TokenFactory();
        console.log("TokenFactory implementation:", address(implementation));

        // 2. Deploy ERC20Template
        console.log("\n2. Deploying ERC20Template...");
        ERC20Template template = new ERC20Template();
        console.log("ERC20Template:", address(template));

        // 3. Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            TokenFactory.initialize.selector,
            config.owner,
            config.feeRecipient != address(0) ? config.feeRecipient : config.owner,
            config.serviceFee
        );

        // 4. Deploy proxy
        console.log("\n3. Deploying UUPS Proxy...");
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initData
        );
        console.log("Proxy deployed at:", address(proxy));

        // 5. Get factory instance through proxy
        TokenFactory factory = TokenFactory(address(proxy));

        // 6. Add ERC20Template to factory
        console.log("\n4. Adding ERC20Template to factory...");
        factory.addTemplate(
            keccak256("ERC20_BASIC"),
            address(template)
        );

        // 7. Verify template was added
        address templateAddr = factory.getTemplate(keccak256("ERC20_BASIC"));
        console.log("Template verification:", templateAddr == address(template));

        vm.stopBroadcast();

        // 8. Save deployment info
        saveDeploymentInfo(config.network, address(factory), address(template));

        console.log("\n=== Deployment Complete ===");
        console.log("TokenFactory Proxy:", address(factory));
        console.log("ERC20Template:", address(template));
        console.log("Owner:", factory.owner());
        console.log("Service Fee:", factory.getServiceFee());

        // 9. Security recommendations
        printSecurityRecommendations(address(factory));
    }

    function saveDeploymentInfo(
        string memory network,
        address factory,
        address template
    ) internal {
        string memory json = "deploymentJson";

        vm.serializeAddress(json, "tokenFactory", factory);
        vm.serializeAddress(json, "erc20Template", template);
        vm.serializeAddress(json, "owner", msg.sender);
        vm.serializeUint(json, "blockNumber", block.number);
        vm.serializeUint(json, "timestamp", block.timestamp);
        vm.serializeString(json, "network", network);
        string memory finalJson = vm.serializeString(json, "deployer", "Hardware Wallet");

        string memory fileName = string.concat("deployments/", network, "_hardware.json");
        vm.writeJson(finalJson, fileName);

        console.log("Deployment info saved to:", fileName);
    }

    function printSecurityRecommendations(address factory) internal view {
        console.log("\n=== Security Recommendations ===");
        console.log("1. Verify contract on block explorer");
        console.log("2. Test all functions on testnet first");
        console.log("3. Consider setting up monitoring");
        console.log("4. Keep hardware wallet firmware updated");
        console.log("5. Consider multi-sig for critical operations");
        console.log("Factory Address:", factory);
    }

    // Helper function for multi-sig deployment (future enhancement)
    function deployWithMultiSig(DeployConfig memory config) internal {
        // Implementation for multi-sig wallet integration
        // This would integrate with Gnosis Safe or similar multi-sig solutions
        revert("Multi-sig deployment not implemented yet");
    }
}