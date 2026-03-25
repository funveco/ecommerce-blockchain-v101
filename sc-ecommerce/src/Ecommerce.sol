// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {CompanyLib} from "./libs/CompanyLib.sol";
import {ProductLib} from "./libs/ProductLib.sol";
import {CustomerLib} from "./libs/CustomerLib.sol";
import {CartLib} from "./libs/CartLib.sol";
import {InvoiceLib} from "./libs/InvoiceLib.sol";
import {PaymentLib} from "./libs/PaymentLib.sol";

/// @title Ecommerce — Main e-commerce contract
/// @notice Integrates company, product, customer, cart, invoice, and payment management
/// @dev Uses library storage pattern with ReentrancyGuard for payment safety
contract Ecommerce is ReentrancyGuard {
    using CompanyLib for CompanyLib.Storage;
    using ProductLib for ProductLib.Storage;
    using CustomerLib for CustomerLib.Storage;
    using CartLib for CartLib.Storage;
    using InvoiceLib for InvoiceLib.Storage;

    // ──────────────────── State ────────────────────

    address public euroToken;

    CompanyLib.Storage private companyStorage;
    ProductLib.Storage private productStorage;
    CustomerLib.Storage private customerStorage;
    CartLib.Storage private cartStorage;
    InvoiceLib.Storage private invoiceStorage;

    // ──────────────────── Errors ────────────────────

    error NotCompanyOwner();
    error CompanyNotActive();
    error EmptyCart();
    error ProductNotForCompany(uint256 productId, uint256 companyId);
    error ProductNotActive(uint256 productId);
    error InsufficientStock(uint256 productId, uint256 available, uint256 requested);

    // ──────────────────── Events ────────────────────

    event InvoiceCreated(uint256 indexed invoiceId, uint256 indexed companyId, address indexed customer, uint256 totalAmount);

    // ──────────────────── Constructor ────────────────────

    /// @notice Deploy the Ecommerce contract
    /// @param _euroToken Address of the EuroToken ERC20 contract
    constructor(address _euroToken) {
        euroToken = _euroToken;
    }

    // ══════════════════════════════════════════════════
    //                  COMPANY FUNCTIONS
    // ══════════════════════════════════════════════════

    /// @notice Register a new company
    /// @param name Company name
    /// @param taxId Company tax identification number
    /// @return companyId The ID assigned to the new company
    function registerCompany(string calldata name, string calldata taxId) external returns (uint256) {
        return companyStorage.registerCompany(name, taxId, msg.sender);
    }

    /// @notice Get company data by ID
    /// @param companyId The company ID
    /// @return company Company struct
    function getCompany(uint256 companyId) external view returns (CompanyLib.Company memory) {
        return companyStorage.getCompany(companyId);
    }

    /// @notice Toggle company active status (only company owner)
    /// @param companyId The company ID to toggle
    function toggleCompany(uint256 companyId) external {
        companyStorage.toggleCompany(companyId, msg.sender);
    }

    /// @notice Get the company ID for a given owner address
    /// @param owner The owner address
    /// @return companyId The company ID (0 if none)
    function getCompanyByOwner(address owner) external view returns (uint256) {
        return companyStorage.getCompanyByOwner(owner);
    }

    // ══════════════════════════════════════════════════
    //                 PRODUCT FUNCTIONS
    // ══════════════════════════════════════════════════

    /// @notice Add a new product (only company owner, company must be active)
    /// @param companyId The company the product belongs to
    /// @param name Product name
    /// @param description Product description
    /// @param price Product price (in token units, must be > 0)
    /// @param stock Initial stock quantity
    /// @param ipfsImageHash IPFS hash for product image
    /// @return productId The ID assigned to the new product
    function addProduct(
        uint256 companyId,
        string calldata name,
        string calldata description,
        uint256 price,
        uint256 stock,
        string calldata ipfsImageHash
    ) external returns (uint256) {
        _requireCompanyOwner(companyId);
        _requireCompanyActive(companyId);
        return productStorage.addProduct(companyId, name, description, price, stock, ipfsImageHash);
    }

    /// @notice Update product price and stock (only company owner)
    /// @param productId The product to update
    /// @param price New price
    /// @param stock New stock
    function updateProduct(uint256 productId, uint256 price, uint256 stock) external {
        ProductLib.Product memory product = productStorage.getProduct(productId);
        _requireCompanyOwner(product.companyId);
        productStorage.updateProduct(productId, price, stock);
    }

    /// @notice Toggle product active status (only company owner)
    /// @param productId The product to toggle
    function toggleProduct(uint256 productId) external {
        ProductLib.Product memory product = productStorage.getProduct(productId);
        _requireCompanyOwner(product.companyId);
        productStorage.toggleProduct(productId);
    }

    /// @notice Get a product by ID
    /// @param productId The product ID
    /// @return product Product struct
    function getProduct(uint256 productId) external view returns (ProductLib.Product memory) {
        return productStorage.getProduct(productId);
    }

    /// @notice Get all products
    /// @return products Array of all products
    function getAllProducts() external view returns (ProductLib.Product[] memory) {
        return productStorage.getAllProducts();
    }

    /// @notice Get products for a specific company
    /// @param companyId The company ID
    /// @return products Array of products
    function getProductsByCompany(uint256 companyId) external view returns (ProductLib.Product[] memory) {
        return productStorage.getProductsByCompany(companyId);
    }

    // ══════════════════════════════════════════════════
    //                  CART FUNCTIONS
    // ══════════════════════════════════════════════════

    /// @notice Add a product to the caller's cart
    /// @param productId The product to add
    /// @param quantity The quantity to add
    function addToCart(uint256 productId, uint256 quantity) external {
        customerStorage.registerCustomer(msg.sender);
        cartStorage.addToCart(msg.sender, productId, quantity);
    }

    /// @notice Remove a product from the caller's cart
    /// @param productId The product to remove
    function removeFromCart(uint256 productId) external {
        cartStorage.removeFromCart(msg.sender, productId);
    }

    /// @notice Get the caller's cart contents
    /// @param customer The customer address
    /// @return items Array of cart items
    function getCart(address customer) external view returns (CartLib.CartItem[] memory) {
        return cartStorage.getCart(customer);
    }

    /// @notice Clear all items from the caller's cart
    function clearCart() external {
        cartStorage.clearCart(msg.sender);
    }

    /// @notice Get the total cost of the caller's cart
    /// @param customer The customer address
    /// @return total Total price
    function getCartTotal(address customer) external view returns (uint256) {
        return cartStorage.getCartTotal(customer, productStorage);
    }

    // ══════════════════════════════════════════════════
    //                 INVOICE FUNCTIONS
    // ══════════════════════════════════════════════════

    /// @notice Create an invoice from the customer's cart for a specific company
    /// @param companyId The company ID to create invoice for
    /// @return invoiceId The ID assigned to the new invoice
    function createInvoice(uint256 companyId) external returns (uint256) {
        CartLib.CartItem[] memory cartItems = cartStorage.getCart(msg.sender);
        if (cartItems.length == 0) revert EmptyCart();

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < cartItems.length; i++) {
            CartLib.CartItem memory item = cartItems[i];
            ProductLib.Product memory product = productStorage.getProduct(item.productId);

            if (product.companyId != companyId) revert ProductNotForCompany(item.productId, companyId);
            if (!product.isActive) revert ProductNotActive(item.productId);
            if (!ProductLib.hasSufficientStock(productStorage, item.productId, item.quantity)) {
                revert InsufficientStock(item.productId, product.stock, item.quantity);
            }

            totalAmount += product.price * item.quantity;
        }

        customerStorage.registerCustomer(msg.sender);
        uint256 invoiceId = invoiceStorage.createInvoice(msg.sender, companyId, totalAmount);

        emit InvoiceCreated(invoiceId, companyId, msg.sender, totalAmount);

        return invoiceId;
    }

    /// @notice Create invoices for all companies in the cart
    /// @return invoiceIds Array of created invoice IDs
    function createInvoicesFromCart() external returns (uint256[] memory) {
        CartLib.CartItem[] memory cartItems = cartStorage.getCart(msg.sender);
        if (cartItems.length == 0) revert EmptyCart();

        for (uint256 i = 0; i < cartItems.length; i++) {
            CartLib.CartItem memory item = cartItems[i];
            ProductLib.Product memory product = productStorage.getProduct(item.productId);

            if (!product.isActive) revert ProductNotActive(item.productId);
            if (!ProductLib.hasSufficientStock(productStorage, item.productId, item.quantity)) {
                revert InsufficientStock(item.productId, product.stock, item.quantity);
            }
        }

        uint256[] memory uniqueCompanyIds = new uint256[](cartItems.length);
        uint256[] memory companyTotals = new uint256[](cartItems.length);
        uint256 uniqueCount = 0;

        for (uint256 i = 0; i < cartItems.length; i++) {
            CartLib.CartItem memory item = cartItems[i];
            ProductLib.Product memory product = productStorage.getProduct(item.productId);
            uint256 cid = product.companyId;
            
            bool found = false;
            for (uint256 j = 0; j < uniqueCount; j++) {
                if (uniqueCompanyIds[j] == cid) {
                    companyTotals[j] += product.price * item.quantity;
                    found = true;
                    break;
                }
            }
            if (!found) {
                uniqueCompanyIds[uniqueCount] = cid;
                companyTotals[uniqueCount] = product.price * item.quantity;
                uniqueCount++;
            }
        }

        uint256[] memory invoiceIds = new uint256[](uniqueCount);
        
        for (uint256 i = 0; i < uniqueCount; i++) {
            customerStorage.registerCustomer(msg.sender);
            uint256 invoiceId = invoiceStorage.createInvoice(msg.sender, uniqueCompanyIds[i], companyTotals[i]);
            invoiceIds[i] = invoiceId;
            emit InvoiceCreated(invoiceId, uniqueCompanyIds[i], msg.sender, companyTotals[i]);
        }

        return invoiceIds;
    }

    /// @notice Get an invoice by ID
    /// @param invoiceId The invoice ID
    /// @return invoice Invoice struct
    function getInvoice(uint256 invoiceId) external view returns (InvoiceLib.Invoice memory) {
        return invoiceStorage.getInvoice(invoiceId);
    }

    /// @notice Get all invoices for a customer
    /// @param customer The customer address
    /// @return invoices Array of invoices
    function getInvoicesByCustomer(address customer) external view returns (InvoiceLib.Invoice[] memory) {
        return invoiceStorage.getInvoicesByCustomer(customer);
    }

    /// @notice Get all invoices for a company
    /// @param companyId The company ID
    /// @return invoices Array of invoices
    function getInvoicesByCompany(uint256 companyId) external view returns (InvoiceLib.Invoice[] memory) {
        return invoiceStorage.getInvoicesByCompany(companyId);
    }

    // ══════════════════════════════════════════════════
    //                 PAYMENT FUNCTIONS
    // ══════════════════════════════════════════════════

    /// @notice Process payment for an invoice using EuroToken
    /// @dev Protected by ReentrancyGuard
    /// @param invoiceId The invoice to pay
    /// @return The paid invoice ID
    function processPayment(uint256 invoiceId) external nonReentrant returns (uint256) {
        return PaymentLib.processPayment(
            invoiceStorage,
            companyStorage,
            productStorage,
            cartStorage,
            euroToken,
            invoiceId,
            msg.sender
        );
    }

    // ══════════════════════════════════════════════════
    //                 CUSTOMER FUNCTIONS
    // ══════════════════════════════════════════════════

    /// @notice Check if an address is a registered customer
    /// @param customer The address to check
    /// @return True if registered
    function isCustomerRegistered(address customer) external view returns (bool) {
        return customerStorage.isRegistered(customer);
    }

    // ══════════════════════════════════════════════════
    //                INTERNAL HELPERS
    // ══════════════════════════════════════════════════

    function _requireCompanyOwner(uint256 companyId) internal view {
        CompanyLib.Company memory company = companyStorage.getCompany(companyId);
        if (company.companyAddress != msg.sender) revert NotCompanyOwner();
    }

    function _requireCompanyActive(uint256 companyId) internal view {
        CompanyLib.Company memory company = companyStorage.getCompany(companyId);
        if (!company.isActive) revert CompanyNotActive();
    }
}
