// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title EuroToken - Euro-pegged stablecoin (1 EURT = 1 EUR)
/// @notice ERC20 token with 6 decimals representing digital euros
contract EuroToken is ERC20, Ownable {
    /// @notice Creates the EuroToken contract
    /// @param initialOwner Address authorized to mint tokens
    constructor(address initialOwner) ERC20("EuroToken", "EURT") Ownable(initialOwner) {}

    /// @notice Returns 6 decimals to represent euro cents
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Mints new tokens to a specified address
    /// @param to Recipient address
    /// @param amount Amount of tokens to mint (in base units, 6 decimals)
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "EuroToken: mint to zero address");
        require(amount > 0, "EuroToken: mint amount must be positive");
        _mint(to, amount);
    }
}
