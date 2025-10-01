// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/TokenFactory.sol";
import "../src/ERC20Template.sol";
import "../src/BasicERC20Template.sol";
import "../src/MintableERC20Template.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title AddressPredictionTest
 * @dev Test contract to verify that address prediction works correctly
 */
contract AddressPredictionTest is Test {
    TokenFactory public factory;
    ERC20Template public fullTemplate;
    BasicERC20Template public basicTemplate;
    MintableERC20Template public mintableTemplate;

    address public owner = address(this);
    address public feeRecipient = address(0x1234);
    uint256 public serviceFee = 0.01 ether;

    function setUp() public {
        // Deploy templates
        fullTemplate = new ERC20Template();
        basicTemplate = new BasicERC20Template();
        mintableTemplate = new MintableERC20Template();

        // Deploy factory implementation
        TokenFactory implementation = new TokenFactory();

        // Deploy proxy and initialize
        bytes memory initData = abi.encodeWithSelector(
            TokenFactory.initialize.selector,
            owner,
            feeRecipient,
            serviceFee
        );

        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        factory = TokenFactory(address(proxy));

        // Add all templates
        factory.addTemplate(factory.FULL_FEATURED(), address(fullTemplate));
        factory.addTemplate(factory.BASIC_ERC20(), address(basicTemplate));
        factory.addTemplate(factory.MINTABLE_ERC20(), address(mintableTemplate));
    }

    function testAddressPredictionBasic() public {
        // Create token config
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Test Token",
            symbol: "TEST",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: true,
            burnable: true,
            pausable: true,
            capped: false,
            maxSupply: 0,
            initialOwner: address(this)
        });

        // Predict address
        address predictedAddress = factory.predictTokenAddress(config, address(this));
        console.log("Predicted address:", predictedAddress);

        // Create token
        vm.deal(address(this), 1 ether);
        address actualAddress = factory.createToken{value: serviceFee}(config);
        console.log("Actual address:   ", actualAddress);

        // Verify they match
        assertEq(predictedAddress, actualAddress, "Predicted address should match actual address");
    }

    function testAddressPredictionWithDifferentCreators() public {
        address creator1 = address(0xABCD);
        address creator2 = address(0x1234);

        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Test Token",
            symbol: "TEST",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: creator1
        });

        // Predict addresses for different creators
        address predicted1 = factory.predictTokenAddress(config, creator1);
        address predicted2 = factory.predictTokenAddress(config, creator2);

        console.log("Creator1 predicted:", predicted1);
        console.log("Creator2 predicted:", predicted2);

        // They should be different
        assertTrue(predicted1 != predicted2, "Different creators should get different addresses");

        // Create token with creator1
        vm.deal(creator1, 1 ether);
        vm.prank(creator1);
        address actual1 = factory.createToken{value: serviceFee}(config);

        assertEq(predicted1, actual1, "Creator1 prediction should match");
    }

    function testAddressPredictionWithDifferentConfigs() public {
        address creator = address(this);

        ITokenFactory.TokenConfig memory config1 = ITokenFactory.TokenConfig({
            name: "Token One",
            symbol: "ONE",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: creator
        });

        ITokenFactory.TokenConfig memory config2 = ITokenFactory.TokenConfig({
            name: "Token Two",
            symbol: "TWO",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: creator
        });

        // Predict addresses
        address predicted1 = factory.predictTokenAddress(config1, creator);
        address predicted2 = factory.predictTokenAddress(config2, creator);

        console.log("Config1 predicted:", predicted1);
        console.log("Config2 predicted:", predicted2);

        // They should be different
        assertTrue(predicted1 != predicted2, "Different configs should get different addresses");
    }

    function testAddressPredictionConsistency() public {
        ITokenFactory.TokenConfig memory config = ITokenFactory.TokenConfig({
            name: "Consistency Test",
            symbol: "CONS",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: true,
            burnable: false,
            pausable: false,
            capped: true,
            maxSupply: 2000000 * 10**18,
            initialOwner: address(this)
        });

        // Predict multiple times - should always be the same
        address predicted1 = factory.predictTokenAddress(config, address(this));
        address predicted2 = factory.predictTokenAddress(config, address(this));
        address predicted3 = factory.predictTokenAddress(config, address(this));

        assertEq(predicted1, predicted2, "Multiple predictions should be identical");
        assertEq(predicted2, predicted3, "Multiple predictions should be identical");

        // Now create the token
        vm.deal(address(this), 1 ether);
        address actualAddress = factory.createToken{value: serviceFee}(config);

        assertEq(predicted1, actualAddress, "Prediction should match actual creation");
    }

    function testAddressPredictionAfterNonceIncrement() public {
        // First, create a token to increment the nonce
        ITokenFactory.TokenConfig memory config1 = ITokenFactory.TokenConfig({
            name: "First Token",
            symbol: "FIRST",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: address(this)
        });

        vm.deal(address(this), 2 ether);
        factory.createToken{value: serviceFee}(config1);

        // Now predict and create a second token
        ITokenFactory.TokenConfig memory config2 = ITokenFactory.TokenConfig({
            name: "Second Token",
            symbol: "SECOND",
            totalSupply: 1000000 * 10**18,
            decimals: 18,
            mintable: false,
            burnable: false,
            pausable: false,
            capped: false,
            maxSupply: 0,
            initialOwner: address(this)
        });

        address predicted = factory.predictTokenAddress(config2, address(this));
        address actual = factory.createToken{value: serviceFee}(config2);

        assertEq(predicted, actual, "Prediction should work after nonce increment");
    }

    receive() external payable {}
}