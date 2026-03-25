// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {Ecommerce} from "../src/Ecommerce.sol";
import {EuroToken} from "stablecoin/sc/src/EuroToken.sol";
import {CompanyLib} from "../src/libs/CompanyLib.sol";
import {ProductLib} from "../src/libs/ProductLib.sol";
import {CartLib} from "../src/libs/CartLib.sol";
import {InvoiceLib} from "../src/libs/InvoiceLib.sol";

contract EcommerceTest is Test {
    Ecommerce public ecommerce;
    EuroToken public euroToken;
    
    address owner;
    address companyOwner;
    address customer;
    
    uint256 public companyId;
    uint256 public productId;

    function setUp() public {
        owner = address(this);
        companyOwner = makeAddr("companyOwner");
        customer = makeAddr("customer");
        
        euroToken = new EuroToken(owner);
        ecommerce = new Ecommerce(address(euroToken));
        
        euroToken.mint(customer, 10000 * 10 ** 6); // 10000 EURT
        euroToken.mint(owner, 1000000 * 10 ** 6); // 1M EURT for owner
        
        vm.prank(companyOwner);
        companyId = ecommerce.registerCompany("Test Store", "B12345678");
        
        vm.prank(companyOwner);
        productId = ecommerce.addProduct(companyId, "Test Product", "A test product", 1000, 100, "QmHash");
    }

    function test_Integration_RegisterCompany_AddProduct_Checkout_Pay() public {
        // 1. Verify company registered
        CompanyLib.Company memory company = ecommerce.getCompany(companyId);
        assertTrue(company.isActive);
        
        // 2. Verify product added
        ProductLib.Product memory product = ecommerce.getProduct(productId);
        assertEq(product.stock, 100);
        
        // 3. Customer adds product to cart
        vm.prank(customer);
        ecommerce.addToCart(productId, 5);
        
        // 4. Verify cart
        CartLib.CartItem[] memory items = ecommerce.getCart(customer);
        assertEq(items.length, 1);
        assertEq(items[0].productId, productId);
        assertEq(items[0].quantity, 5);
        
        // 5. Get cart total
        uint256 cartTotal = ecommerce.getCartTotal(customer);
        assertEq(cartTotal, 5000); // 5 * 1000
        
        // 6. Create invoice (checkout)
        vm.prank(customer);
        uint256 invoiceId = ecommerce.createInvoice(companyId);
        
        // 7. Verify invoice created
        InvoiceLib.Invoice memory inv = ecommerce.getInvoice(invoiceId);
        assertEq(inv.companyId, companyId);
        assertEq(inv.customerAddress, customer);
        assertEq(inv.totalAmount, 5000);
        assertFalse(inv.isPaid);
        
        // 8. Approve tokens for payment
        vm.prank(customer);
        euroToken.approve(address(ecommerce), 5000);
        
        // 9. Process payment
        vm.prank(customer);
        ecommerce.processPayment(invoiceId);
        
        // 10. Verify payment processed
        inv = ecommerce.getInvoice(invoiceId);
        assertTrue(inv.isPaid);
        
        // 11. Verify stock decremented
        product = ecommerce.getProduct(productId);
        assertEq(product.stock, 95); // 100 - 5
        
        // 12. Verify token transfer
        assertEq(euroToken.balanceOf(customer), 10000 * 10 ** 6 - 5000);
        assertEq(euroToken.balanceOf(companyOwner), 5000);
        
        // 13. Verify cart cleared
        items = ecommerce.getCart(customer);
        assertEq(items.length, 0);
    }

    function test_Integration_MultipleProducts_Cart() public {
        // Add another product
        vm.prank(companyOwner);
        uint256 productId2 = ecommerce.addProduct(companyId, "Product 2", "Desc 2", 2000, 50, "QmHash2");
        
        // Add both products to cart
        vm.prank(customer);
        ecommerce.addToCart(productId, 3);
        
        vm.prank(customer);
        ecommerce.addToCart(productId2, 2);
        
        // Verify cart total: 3*1000 + 2*2000 = 7000
        uint256 total = ecommerce.getCartTotal(customer);
        assertEq(total, 7000);
    }

    function test_Integration_InsufficientStock() public {
        // Add more than available stock to cart
        vm.prank(customer);
        ecommerce.addToCart(productId, 150); // Only 100 in stock
        
        // Create invoice should fail due to insufficient stock
        vm.prank(customer);
        vm.expectRevert();
        ecommerce.createInvoice(companyId);
    }
}
