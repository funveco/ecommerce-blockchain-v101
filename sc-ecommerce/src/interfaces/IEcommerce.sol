// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {CompanyLib} from "../libs/CompanyLib.sol";
import {ProductLib} from "../libs/ProductLib.sol";
import {CartLib} from "../libs/CartLib.sol";
import {InvoiceLib} from "../libs/InvoiceLib.sol";

/// @title IEcommerce — Interface for the Ecommerce contract
/// @notice Defines all public function signatures
interface IEcommerce {
    // ──────────────────── Company ────────────────────

    /// @notice Register a new company
    function registerCompany(string calldata name, string calldata taxId) external returns (uint256);

    /// @notice Get company data by ID
    function getCompany(uint256 companyId) external view returns (CompanyLib.Company memory);

    /// @notice Toggle company active status
    function toggleCompany(uint256 companyId) external;

    /// @notice Get company ID for a given owner address
    function getCompanyByOwner(address owner) external view returns (uint256);

    // ──────────────────── Product ────────────────────

    /// @notice Add a new product
    function addProduct(
        uint256 companyId,
        string calldata name,
        string calldata description,
        uint256 price,
        uint256 stock,
        string calldata ipfsImageHash
    ) external returns (uint256);

    /// @notice Update product price and stock
    function updateProduct(uint256 productId, uint256 price, uint256 stock) external;

    /// @notice Toggle product active status
    function toggleProduct(uint256 productId) external;

    /// @notice Get a product by ID
    function getProduct(uint256 productId) external view returns (ProductLib.Product memory);

    /// @notice Get all products
    function getAllProducts() external view returns (ProductLib.Product[] memory);

    /// @notice Get products for a specific company
    function getProductsByCompany(uint256 companyId) external view returns (ProductLib.Product[] memory);

    // ──────────────────── Cart ────────────────────

    /// @notice Add a product to the caller's cart
    function addToCart(uint256 productId, uint256 quantity) external;

    /// @notice Remove a product from the caller's cart
    function removeFromCart(uint256 productId) external;

    /// @notice Get cart contents for a customer
    function getCart(address customer) external view returns (CartLib.CartItem[] memory);

    /// @notice Clear all items from the caller's cart
    function clearCart() external;

    /// @notice Get the total cost of a customer's cart
    function getCartTotal(address customer) external view returns (uint256);

    // ──────────────────── Invoice ────────────────────

    /// @notice Create an invoice from the customer's cart for a company
    function createInvoice(uint256 companyId) external returns (uint256);

    /// @notice Create invoices for all companies in the cart
    function createInvoicesFromCart() external returns (uint256[] memory);

    /// @notice Get an invoice by ID
    function getInvoice(uint256 invoiceId) external view returns (InvoiceLib.Invoice memory);

    /// @notice Get all invoices for a customer
    function getInvoicesByCustomer(address customer) external view returns (InvoiceLib.Invoice[] memory);

    /// @notice Get all invoices for a company
    function getInvoicesByCompany(uint256 companyId) external view returns (InvoiceLib.Invoice[] memory);

    // ──────────────────── Payment ────────────────────

    /// @notice Process payment for an invoice
    function processPayment(uint256 invoiceId) external returns (uint256);

    // ──────────────────── Customer ────────────────────

    /// @notice Check if an address is a registered customer
    function isCustomerRegistered(address customer) external view returns (bool);

    // ──────────────────── State ────────────────────

    /// @notice Get the EuroToken contract address
    function euroToken() external view returns (address);
}
