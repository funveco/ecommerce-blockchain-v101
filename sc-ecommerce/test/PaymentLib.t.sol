// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {PaymentLib} from "../src/libs/PaymentLib.sol";
import {InvoiceLib} from "../src/libs/InvoiceLib.sol";
import {CompanyLib} from "../src/libs/CompanyLib.sol";
import {ProductLib} from "../src/libs/ProductLib.sol";
import {CartLib} from "../src/libs/CartLib.sol";
import {EuroToken} from "stablecoin/sc/src/EuroToken.sol";

contract PaymentLibTest is Test {
    using InvoiceLib for InvoiceLib.Storage;
    using CompanyLib for CompanyLib.Storage;
    using ProductLib for ProductLib.Storage;
    using CartLib for CartLib.Storage;

    InvoiceLib.Storage invoiceStorage;
    CompanyLib.Storage companyStorage;
    ProductLib.Storage productStorage;
    CartLib.Storage cartStorage;
    
    EuroToken public euroToken;
    address owner;
    address companyOwner;
    address customer;

    function setUp() public {
        owner = address(this);
        companyOwner = makeAddr("companyOwner");
        customer = makeAddr("customer");
        
        euroToken = new EuroToken(owner);
        euroToken.mint(customer, 10000);
        
        companyStorage.registerCompany("Test Company", "B12345678", companyOwner);
        uint256 productId = productStorage.addProduct(1, "Product", "Desc", 1000, 10, "Qm");
        cartStorage.addToCart(customer, productId, 5);
    }

    function test_ProcessPaymentSuccess() public {
        uint256 invoiceId = invoiceStorage.createInvoice(customer, 1, 5000);
        
        vm.prank(customer);
        euroToken.approve(address(this), 5000);
        
        PaymentLib.processPayment(
            invoiceStorage,
            companyStorage,
            productStorage,
            cartStorage,
            address(euroToken),
            invoiceId,
            customer
        );
        
        InvoiceLib.Invoice memory invoice = invoiceStorage.getInvoice(invoiceId);
        assertTrue(invoice.isPaid);
        assertEq(euroToken.balanceOf(customer), 5000);
        assertEq(euroToken.balanceOf(companyOwner), 5000);
    }

    function test_ProcessPaymentStockDecremented() public {
        uint256 invoiceId = invoiceStorage.createInvoice(customer, 1, 5000);
        
        vm.prank(customer);
        euroToken.approve(address(this), 5000);
        
        ProductLib.Product memory productBefore = productStorage.getProduct(1);
        assertEq(productBefore.stock, 10);
        
        PaymentLib.processPayment(
            invoiceStorage,
            companyStorage,
            productStorage,
            cartStorage,
            address(euroToken),
            invoiceId,
            customer
        );
        
        ProductLib.Product memory productAfter = productStorage.getProduct(1);
        assertEq(productAfter.stock, 5);
    }

    function test_ProcessPaymentClearsCart() public {
        uint256 invoiceId = invoiceStorage.createInvoice(customer, 1, 5000);
        
        vm.prank(customer);
        euroToken.approve(address(this), 5000);
        
        PaymentLib.processPayment(
            invoiceStorage,
            companyStorage,
            productStorage,
            cartStorage,
            address(euroToken),
            invoiceId,
            customer
        );
        
        CartLib.CartItem[] memory items = cartStorage.getCart(customer);
        assertEq(items.length, 0);
    }
}
