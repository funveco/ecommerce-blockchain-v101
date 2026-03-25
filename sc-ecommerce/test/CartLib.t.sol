// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {CartLib} from "../src/libs/CartLib.sol";
import {ProductLib} from "../src/libs/ProductLib.sol";

contract CartLibTest is Test {
    using CartLib for CartLib.Storage;
    using ProductLib for ProductLib.Storage;

    CartLib.Storage cartStorage;
    ProductLib.Storage productStorage;
    address customer;
    address otherCustomer;

    function setUp() public {
        customer = makeAddr("customer");
        otherCustomer = makeAddr("otherCustomer");
        
        productStorage.addProduct(1, "Product 1", "Desc 1", 1000, 100, "Qm1");
        productStorage.addProduct(1, "Product 2", "Desc 2", 2000, 50, "Qm2");
    }

    function test_AddToCart() public {
        cartStorage.addToCart(customer, 1, 5);
        
        CartLib.CartItem[] memory items = cartStorage.getCart(customer);
        assertEq(items.length, 1);
        assertEq(items[0].productId, 1);
        assertEq(items[0].quantity, 5);
    }

    function test_AddToCartMultiple() public {
        cartStorage.addToCart(customer, 1, 5);
        cartStorage.addToCart(customer, 2, 3);
        
        CartLib.CartItem[] memory items = cartStorage.getCart(customer);
        assertEq(items.length, 2);
    }

    function test_AddToCartIncreaseQuantity() public {
        cartStorage.addToCart(customer, 1, 5);
        cartStorage.addToCart(customer, 1, 3);
        
        CartLib.CartItem[] memory items = cartStorage.getCart(customer);
        assertEq(items.length, 1);
        assertEq(items[0].quantity, 8);
    }

    function test_RemoveFromCart() public {
        cartStorage.addToCart(customer, 1, 5);
        cartStorage.addToCart(customer, 2, 3);
        
        cartStorage.removeFromCart(customer, 1);
        
        CartLib.CartItem[] memory items = cartStorage.getCart(customer);
        assertEq(items.length, 1);
        assertEq(items[0].productId, 2);
    }

    function test_GetCartEmpty() public view {
        CartLib.CartItem[] memory items = cartStorage.getCart(customer);
        assertEq(items.length, 0);
    }

    function test_ClearCart() public {
        cartStorage.addToCart(customer, 1, 5);
        cartStorage.addToCart(customer, 2, 3);
        
        cartStorage.clearCart(customer);
        
        CartLib.CartItem[] memory items = cartStorage.getCart(customer);
        assertEq(items.length, 0);
    }

    function test_GetCartTotal() public {
        cartStorage.addToCart(customer, 1, 2);
        cartStorage.addToCart(customer, 2, 3);
        
        uint256 total = cartStorage.getCartTotal(customer, productStorage);
        assertEq(total, 8000);
    }

    function test_GetCartTotalEmpty() public view {
        uint256 total = cartStorage.getCartTotal(customer, productStorage);
        assertEq(total, 0);
    }

    function test_SeparateCarts() public {
        cartStorage.addToCart(customer, 1, 5);
        cartStorage.addToCart(otherCustomer, 1, 10);
        
        CartLib.CartItem[] memory customerItems = cartStorage.getCart(customer);
        CartLib.CartItem[] memory otherItems = cartStorage.getCart(otherCustomer);
        
        assertEq(customerItems[0].quantity, 5);
        assertEq(otherItems[0].quantity, 10);
    }
}
