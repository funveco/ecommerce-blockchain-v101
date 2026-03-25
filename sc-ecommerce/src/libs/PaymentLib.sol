// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {InvoiceLib} from "./InvoiceLib.sol";
import {CompanyLib} from "./CompanyLib.sol";
import {ProductLib} from "./ProductLib.sol";
import {CartLib} from "./CartLib.sol";

/// @title PaymentLib — Library for processing ERC20 payments
/// @notice Handles payment flow using EuroToken (ERC20) transfers
library PaymentLib {
    // ──────────────────── Errors ────────────────────

    error InvoiceNotFound(uint256 invoiceId);
    error InvoiceAlreadyPaid(uint256 invoiceId);
    error NotInvoiceCustomer();
    error TransferFailed();
    error InsufficientStock(uint256 productId, uint256 available, uint256 requested);

    // ──────────────────── Functions ────────────────────

    /// @notice Process a payment for an invoice using ERC20 transferFrom
    /// @dev Uses checks-effects-interactions pattern. ReentrancyGuard should be on the calling contract.
    /// @param invoiceStorage Invoice storage reference
    /// @param companyStorage Company storage reference
    /// @param productStorage Product storage reference
    /// @param cartStorage Cart storage reference
    /// @param euroToken The ERC20 token contract address
    /// @param invoiceId The invoice to pay
    /// @param caller The address making the payment
    /// @return The invoice ID that was paid
    function processPayment(
        InvoiceLib.Storage storage invoiceStorage,
        CompanyLib.Storage storage companyStorage,
        ProductLib.Storage storage productStorage,
        CartLib.Storage storage cartStorage,
        address euroToken,
        uint256 invoiceId,
        address caller
    ) internal returns (uint256) {
        // Checks
        InvoiceLib.Invoice memory invoice = InvoiceLib.getInvoice(invoiceStorage, invoiceId);
        if (invoice.customerAddress != caller) revert NotInvoiceCustomer();

        // Verify and decrement stock from cart items
        CartLib.CartItem[] memory cartItems = CartLib.getCart(cartStorage, caller);
        for (uint256 i = 0; i < cartItems.length; i++) {
            CartLib.CartItem memory item = cartItems[i];
            if (!ProductLib.hasSufficientStock(productStorage, item.productId, item.quantity)) {
                revert InsufficientStock(item.productId, productStorage.products[item.productId].stock, item.quantity);
            }
            ProductLib.decrementStock(productStorage, item.productId, item.quantity);
        }

        // Effects
        InvoiceLib.markAsPaid(invoiceStorage, invoiceId, bytes32(uint256(uint160(caller))));

        // Interactions
        CompanyLib.Company memory company = CompanyLib.getCompany(companyStorage, invoice.companyId);
        bool success = IERC20(euroToken).transferFrom(caller, company.companyAddress, invoice.totalAmount);
        if (!success) revert TransferFailed();

        // Clear cart after successful payment
        CartLib.clearCart(cartStorage, caller);

        return invoiceId;
    }
}
