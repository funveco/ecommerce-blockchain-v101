// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CustomerLib — Minimal library for customer registration
/// @notice Tracks registered customer addresses
library CustomerLib {
    // ──────────────────── Structs ────────────────────

    struct Storage {
        mapping(address => bool) registered;
    }

    // ──────────────────── Functions ────────────────────

    /// @notice Register a customer (implicitly, idempotent)
    /// @param s Storage reference
    /// @param customer The customer address to register
    function registerCustomer(Storage storage s, address customer) internal {
        s.registered[customer] = true;
    }

    /// @notice Check if a customer is registered
    /// @param s Storage reference
    /// @param customer The address to check
    /// @return True if the customer is registered
    function isRegistered(Storage storage s, address customer) internal view returns (bool) {
        return s.registered[customer];
    }
}
