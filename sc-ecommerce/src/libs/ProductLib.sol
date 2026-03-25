// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ProductLib — Library for managing products
/// @notice Provides CRUD operations for product management
library ProductLib {
    // ──────────────────── Structs ────────────────────

    struct Product {
        uint256 productId;
        uint256 companyId;
        string name;
        string description;
        uint256 price;
        uint256 stock;
        string ipfsImageHash;
        bool isActive;
    }

    struct Storage {
        mapping(uint256 => Product) products;
        uint256 nextProductId;
        uint256[] allProductIds;
    }

    // ──────────────────── Events ────────────────────

    event ProductAdded(
        uint256 indexed productId,
        uint256 indexed companyId,
        string name,
        uint256 price,
        uint256 stock
    );
    event ProductUpdated(uint256 indexed productId, uint256 price, uint256 stock);
    event ProductToggled(uint256 indexed productId, bool isActive);

    // ──────────────────── Errors ────────────────────

    error InvalidPrice();
    error ProductNotFound(uint256 productId);

    // ──────────────────── Functions ────────────────────

    /// @notice Add a new product
    /// @param s Storage reference
    /// @param companyId The company that owns this product
    /// @param name Product name
    /// @param description Product description
    /// @param price Product price (must be > 0)
    /// @param stock Initial stock quantity
    /// @param ipfsImageHash IPFS hash for the product image
    /// @return productId The ID assigned to the new product
    function addProduct(
        Storage storage s,
        uint256 companyId,
        string memory name,
        string memory description,
        uint256 price,
        uint256 stock,
        string memory ipfsImageHash
    ) internal returns (uint256 productId) {
        if (price == 0) revert InvalidPrice();

        s.nextProductId++;
        productId = s.nextProductId;

        s.products[productId] = Product({
            productId: productId,
            companyId: companyId,
            name: name,
            description: description,
            price: price,
            stock: stock,
            ipfsImageHash: ipfsImageHash,
            isActive: true
        });

        s.allProductIds.push(productId);

        emit ProductAdded(productId, companyId, name, price, stock);
    }

    /// @notice Update price and stock of a product
    /// @param s Storage reference
    /// @param productId The product to update
    /// @param price New price
    /// @param stock New stock quantity
    function updateProduct(Storage storage s, uint256 productId, uint256 price, uint256 stock) internal {
        if (s.products[productId].productId == 0) revert ProductNotFound(productId);

        s.products[productId].price = price;
        s.products[productId].stock = stock;

        emit ProductUpdated(productId, price, stock);
    }

    /// @notice Toggle a product's active status
    /// @param s Storage reference
    /// @param productId The product to toggle
    function toggleProduct(Storage storage s, uint256 productId) internal {
        if (s.products[productId].productId == 0) revert ProductNotFound(productId);

        s.products[productId].isActive = !s.products[productId].isActive;

        emit ProductToggled(productId, s.products[productId].isActive);
    }

    /// @notice Get a product by ID
    /// @param s Storage reference
    /// @param productId The product ID
    /// @return product The product data
    function getProduct(Storage storage s, uint256 productId) internal view returns (Product memory) {
        if (s.products[productId].productId == 0) revert ProductNotFound(productId);
        return s.products[productId];
    }

    /// @notice Get all products
    /// @param s Storage reference
    /// @return result Array of all products
    function getAllProducts(Storage storage s) internal view returns (Product[] memory) {
        uint256 len = s.allProductIds.length;
        Product[] memory result = new Product[](len);
        for (uint256 i = 0; i < len; i++) {
            result[i] = s.products[s.allProductIds[i]];
        }
        return result;
    }

    /// @notice Get all products belonging to a specific company
    /// @param s Storage reference
    /// @param companyId The company ID to filter by
    /// @return result Array of products for that company
    function getProductsByCompany(Storage storage s, uint256 companyId) internal view returns (Product[] memory) {
        uint256 len = s.allProductIds.length;

        // First pass: count matching products
        uint256 count = 0;
        for (uint256 i = 0; i < len; i++) {
            if (s.products[s.allProductIds[i]].companyId == companyId) {
                count++;
            }
        }

        // Second pass: populate result array
        Product[] memory result = new Product[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < len; i++) {
            if (s.products[s.allProductIds[i]].companyId == companyId) {
                result[idx] = s.products[s.allProductIds[i]];
                idx++;
            }
        }
        return result;
    }

    /// @notice Decrement stock for a product
    /// @param s Storage reference
    /// @param productId The product to decrement
    /// @param quantity The quantity to decrement
    function decrementStock(Storage storage s, uint256 productId, uint256 quantity) internal {
        if (s.products[productId].productId == 0) revert ProductNotFound(productId);
        if (s.products[productId].stock < quantity) revert InsufficientStock(productId, s.products[productId].stock, quantity);
        s.products[productId].stock -= quantity;
    }

    /// @notice Check if sufficient stock exists for a product
    /// @param s Storage reference
    /// @param productId The product to check
    /// @param quantity The quantity required
    /// @return True if sufficient stock
    function hasSufficientStock(Storage storage s, uint256 productId, uint256 quantity) internal view returns (bool) {
        if (s.products[productId].productId == 0) return false;
        return s.products[productId].stock >= quantity;
    }

    error InsufficientStock(uint256 productId, uint256 available, uint256 requested);
}
