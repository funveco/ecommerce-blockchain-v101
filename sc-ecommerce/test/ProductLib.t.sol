// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {ProductLib} from "../src/libs/ProductLib.sol";
import {CompanyLib} from "../src/libs/CompanyLib.sol";

contract ProductLibTest is Test {
    using ProductLib for ProductLib.Storage;
    using CompanyLib for CompanyLib.Storage;

    ProductLib.Storage productStorage;
    CompanyLib.Storage companyStorage;
    address owner;
    address companyOwner;

    function setUp() public {
        owner = address(this);
        companyOwner = makeAddr("companyOwner");
        companyStorage.registerCompany("Test Company", "B12345678", companyOwner);
    }

    function test_AddProduct() public {
        uint256 productId = productStorage.addProduct(
            1,
            "Test Product",
            "Description",
            1000,
            100,
            "QmHash"
        );
        assertEq(productId, 1);

        ProductLib.Product memory product = productStorage.getProduct(productId);
        assertEq(product.name, "Test Product");
        assertEq(product.description, "Description");
        assertEq(product.price, 1000);
        assertEq(product.stock, 100);
        assertEq(product.ipfsImageHash, "QmHash");
        assertTrue(product.isActive);
    }

    function test_GetAllProducts() public {
        productStorage.addProduct(1, "Product 1", "Desc 1", 1000, 100, "Qm1");
        productStorage.addProduct(1, "Product 2", "Desc 2", 2000, 50, "Qm2");
        
        ProductLib.Product[] memory products = productStorage.getAllProducts();
        assertEq(products.length, 2);
    }

    function test_GetProductsByCompany() public {
        companyStorage.registerCompany("Company 2", "B22222222", makeAddr("owner2"));
        
        productStorage.addProduct(1, "Product 1", "Desc 1", 1000, 100, "Qm1");
        productStorage.addProduct(2, "Product 2", "Desc 2", 2000, 50, "Qm2");
        productStorage.addProduct(1, "Product 3", "Desc 3", 3000, 25, "Qm3");
        
        ProductLib.Product[] memory products = productStorage.getProductsByCompany(1);
        assertEq(products.length, 2);
    }

    function test_UpdateProduct() public {
        uint256 productId = productStorage.addProduct(1, "Test", "Desc", 1000, 100, "Qm");
        
        productStorage.updateProduct(productId, 2000, 50);
        
        ProductLib.Product memory product = productStorage.getProduct(productId);
        assertEq(product.price, 2000);
        assertEq(product.stock, 50);
    }

    function test_ToggleProduct() public {
        uint256 productId = productStorage.addProduct(1, "Test", "Desc", 1000, 100, "Qm");
        
        productStorage.toggleProduct(productId);
        
        ProductLib.Product memory product = productStorage.getProduct(productId);
        assertFalse(product.isActive);
        
        productStorage.toggleProduct(productId);
        
        product = productStorage.getProduct(productId);
        assertTrue(product.isActive);
    }

    function test_DecrementStock() public {
        uint256 productId = productStorage.addProduct(1, "Test", "Desc", 1000, 100, "Qm");
        
        productStorage.decrementStock(productId, 30);
        
        ProductLib.Product memory product = productStorage.getProduct(productId);
        assertEq(product.stock, 70);
    }

    function test_HasSufficientStock() public {
        uint256 productId = productStorage.addProduct(1, "Test", "Desc", 1000, 100, "Qm");
        
        assertTrue(productStorage.hasSufficientStock(productId, 50));
        assertTrue(productStorage.hasSufficientStock(productId, 100));
        assertFalse(productStorage.hasSufficientStock(productId, 101));
    }
}
