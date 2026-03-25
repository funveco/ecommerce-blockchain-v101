// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ProductLib} from "./ProductLib.sol";

/// @title CartLib — Library for managing shopping carts
/// @notice Provides cart operations: add, remove, get, clear, total
library CartLib {
    // ──────────────────── Structs ────────────────────

    struct CartItem {
        uint256 productId;
        uint256 quantity;
    }

    struct Storage {
        mapping(address => CartItem[]) carts;
    }

    // ──────────────────── Events ────────────────────

    event CartUpdated(address indexed customer, uint256 indexed productId, uint256 quantity);

    // ──────────────────── Errors ────────────────────

    error InvalidQuantity();
    error ProductNotInCart(uint256 productId);

    // ──────────────────── Functions ────────────────────

    /// @notice Add a product to the customer's cart (or increase quantity if already present)
    /// @param s Storage reference
    /// @param customer The customer address
    /// @param productId The product to add
    /// @param quantity The quantity to add (must be > 0)
    function addToCart(Storage storage s, address customer, uint256 productId, uint256 quantity) internal {
        if (quantity == 0) revert InvalidQuantity();

        CartItem[] storage cart = s.carts[customer];
        for (uint256 i = 0; i < cart.length; i++) {
            if (cart[i].productId == productId) {
                cart[i].quantity += quantity;
                emit CartUpdated(customer, productId, cart[i].quantity);
                return;
            }
        }

        cart.push(CartItem({productId: productId, quantity: quantity}));
        emit CartUpdated(customer, productId, quantity);
    }

    /// @notice Remove a product from the customer's cart
    /// @param s Storage reference
    /// @param customer The customer address
    /// @param productId The product to remove
    function removeFromCart(Storage storage s, address customer, uint256 productId) internal {
        CartItem[] storage cart = s.carts[customer];
        uint256 len = cart.length;

        for (uint256 i = 0; i < len; i++) {
            if (cart[i].productId == productId) {
                cart[i] = cart[len - 1];
                cart.pop();
                return;
            }
        }

        revert ProductNotInCart(productId);
    }

    /// @notice Get all items in a customer's cart
    /// @param s Storage reference
    /// @param customer The customer address
    /// @return items Array of cart items
    function getCart(Storage storage s, address customer) internal view returns (CartItem[] memory) {
        return s.carts[customer];
    }

    /// @notice Clear all items from a customer's cart
    /// @param s Storage reference
    /// @param customer The customer address
    function clearCart(Storage storage s, address customer) internal {
        delete s.carts[customer];
    }

    /// @notice Calculate the total price of the cart
    /// @param s Storage reference
    /// @param customer The customer address
    /// @param productStorage Product storage to look up prices
    /// @return total Sum of price * quantity for all items
    function getCartTotal(
        Storage storage s,
        address customer,
        ProductLib.Storage storage productStorage
    ) internal view returns (uint256 total) {
        CartItem[] storage cart = s.carts[customer];
        for (uint256 i = 0; i < cart.length; i++) {
            ProductLib.Product memory product = ProductLib.getProduct(productStorage, cart[i].productId);
            total += product.price * cart[i].quantity;
        }
    }
}
