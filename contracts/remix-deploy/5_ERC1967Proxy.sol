// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title TokenFactoryProxy
 * @dev UUPS proxy for TokenFactory implementation
 *
 * This is a simple wrapper around OpenZeppelin's ERC1967Proxy
 * to provide a more descriptive contract name for deployment tracking.
 *
 * Usage:
 * 1. Deploy TokenFactory implementation first
 * 2. Deploy this proxy with implementation address and initialization data
 * 3. The proxy will automatically call initialize() on the implementation
 */
contract TokenFactoryProxy is ERC1967Proxy {
    /**
     * @dev Constructor for the UUPS proxy
     * @param implementation Address of the TokenFactory implementation contract
     * @param data Encoded call to initialize() function with parameters:
     *        - address owner: Contract owner address
     *        - address feeRecipient: Address to receive service fees
     *        - uint256 serviceFee: Service fee amount in wei
     */
    constructor(
        address implementation,
        bytes memory data
    ) ERC1967Proxy(implementation, data) {
        // The constructor automatically calls the implementation's initialize function
        // with the provided data parameter
    }
}

/**
 * @title IERC20Template
 * @dev Interface for deployable ERC20 token templates (included for reference)
 */
interface IERC20Template {
    function initialize(
        string calldata tokenName,
        string calldata tokenSymbol,
        uint256 totalSupply,
        uint8 tokenDecimals,
        address tokenOwner,
        bool mintable,
        bool burnable,
        bool pausable,
        bool capped,
        uint256 maxSupply
    ) external;
}

/**
 * @title ITokenFactory
 * @dev Interface for TokenFactory (included for reference)
 */
interface ITokenFactory {
    struct TokenConfig {
        string name;
        string symbol;
        uint256 totalSupply;
        uint8 decimals;
        bool mintable;
        bool burnable;
        bool pausable;
        bool capped;
        uint256 maxSupply;
        address initialOwner;
    }

    function initialize(
        address owner,
        address feeRecipient,
        uint256 serviceFee
    ) external;

    function createToken(TokenConfig calldata config)
        external
        payable
        returns (address tokenAddress);

    function addTemplate(bytes32 templateId, address implementation) external;
    function getServiceFee() external view returns (uint256);
    function getFeeRecipient() external view returns (address);
}