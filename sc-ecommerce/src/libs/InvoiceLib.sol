// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title InvoiceLib — Library for managing invoices
/// @notice Provides invoice creation, lookup, and payment marking
library InvoiceLib {
    // ──────────────────── Structs ────────────────────

    struct Invoice {
        uint256 invoiceId;
        uint256 companyId;
        address customerAddress;
        uint256 totalAmount;
        uint256 timestamp;
        bool isPaid;
        bytes32 paymentTxHash;
    }

    struct Storage {
        mapping(uint256 => Invoice) invoices;
        uint256 nextInvoiceId;
        mapping(address => uint256[]) customerInvoices;
        mapping(uint256 => uint256[]) companyInvoices;
    }

    // ──────────────────── Events ────────────────────

    event InvoiceCreated(
        uint256 indexed invoiceId,
        uint256 indexed companyId,
        address indexed customerAddress,
        uint256 totalAmount
    );
    event PaymentProcessed(uint256 indexed invoiceId, address indexed customerAddress, bytes32 txHash);

    // ──────────────────── Errors ────────────────────

    error InvoiceNotFound(uint256 invoiceId);
    error InvoiceAlreadyPaid(uint256 invoiceId);

    // ──────────────────── Functions ────────────────────

    /// @notice Create a new invoice
    /// @param s Storage reference
    /// @param customer The customer address
    /// @param companyId The company ID
    /// @param totalAmount The total amount for the invoice
    /// @return invoiceId The ID assigned to the new invoice
    function createInvoice(
        Storage storage s,
        address customer,
        uint256 companyId,
        uint256 totalAmount
    ) internal returns (uint256 invoiceId) {
        s.nextInvoiceId++;
        invoiceId = s.nextInvoiceId;

        s.invoices[invoiceId] = Invoice({
            invoiceId: invoiceId,
            companyId: companyId,
            customerAddress: customer,
            totalAmount: totalAmount,
            timestamp: block.timestamp,
            isPaid: false,
            paymentTxHash: bytes32(0)
        });

        s.customerInvoices[customer].push(invoiceId);
        s.companyInvoices[companyId].push(invoiceId);

        emit InvoiceCreated(invoiceId, companyId, customer, totalAmount);
    }

    /// @notice Get an invoice by ID
    /// @param s Storage reference
    /// @param invoiceId The invoice ID
    /// @return invoice The invoice data
    function getInvoice(Storage storage s, uint256 invoiceId) internal view returns (Invoice memory) {
        if (s.invoices[invoiceId].invoiceId == 0) revert InvoiceNotFound(invoiceId);
        return s.invoices[invoiceId];
    }

    /// @notice Get all invoices for a customer
    /// @param s Storage reference
    /// @param customer The customer address
    /// @return result Array of invoices
    function getInvoicesByCustomer(Storage storage s, address customer) internal view returns (Invoice[] memory) {
        uint256[] storage ids = s.customerInvoices[customer];
        Invoice[] memory result = new Invoice[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = s.invoices[ids[i]];
        }
        return result;
    }

    /// @notice Get all invoices for a company
    /// @param s Storage reference
    /// @param companyId The company ID
    /// @return result Array of invoices
    function getInvoicesByCompany(Storage storage s, uint256 companyId) internal view returns (Invoice[] memory) {
        uint256[] storage ids = s.companyInvoices[companyId];
        Invoice[] memory result = new Invoice[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = s.invoices[ids[i]];
        }
        return result;
    }

    /// @notice Mark an invoice as paid
    /// @param s Storage reference
    /// @param invoiceId The invoice to mark as paid
    /// @param txHash The payment transaction hash
    function markAsPaid(Storage storage s, uint256 invoiceId, bytes32 txHash) internal {
        if (s.invoices[invoiceId].invoiceId == 0) revert InvoiceNotFound(invoiceId);
        if (s.invoices[invoiceId].isPaid) revert InvoiceAlreadyPaid(invoiceId);

        s.invoices[invoiceId].isPaid = true;
        s.invoices[invoiceId].paymentTxHash = txHash;

        emit PaymentProcessed(invoiceId, s.invoices[invoiceId].customerAddress, txHash);
    }
}
