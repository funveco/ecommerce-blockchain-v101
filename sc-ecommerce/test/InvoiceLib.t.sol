// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {InvoiceLib} from "../src/libs/InvoiceLib.sol";

contract InvoiceLibTest is Test {
    using InvoiceLib for InvoiceLib.Storage;

    InvoiceLib.Storage s;
    address customer1;
    address customer2;
    address companyOwner;

    function setUp() public {
        customer1 = makeAddr("customer1");
        customer2 = makeAddr("customer2");
        companyOwner = makeAddr("companyOwner");
    }

    function test_CreateInvoice() public {
        uint256 invoiceId = s.createInvoice(customer1, 1, 1000);
        assertEq(invoiceId, 1);

        InvoiceLib.Invoice memory invoice = s.getInvoice(invoiceId);
        assertEq(invoice.customerAddress, customer1);
        assertEq(invoice.companyId, 1);
        assertEq(invoice.totalAmount, 1000);
        assertFalse(invoice.isPaid);
        assertEq(invoice.paymentTxHash, bytes32(0));
    }

    function test_MarkAsPaid() public {
        uint256 invoiceId = s.createInvoice(customer1, 1, 1000);
        
        s.markAsPaid(invoiceId, bytes32(uint256(12345)));
        
        InvoiceLib.Invoice memory invoice = s.getInvoice(invoiceId);
        assertTrue(invoice.isPaid);
        assertEq(invoice.paymentTxHash, bytes32(uint256(12345)));
    }

    function test_GetInvoicesByCustomer() public {
        s.createInvoice(customer1, 1, 1000);
        s.createInvoice(customer1, 1, 2000);
        s.createInvoice(customer2, 1, 3000);
        
        InvoiceLib.Invoice[] memory invoices = s.getInvoicesByCustomer(customer1);
        assertEq(invoices.length, 2);
        assertEq(invoices[0].totalAmount, 1000);
        assertEq(invoices[1].totalAmount, 2000);
    }

    function test_GetInvoicesByCustomerEmpty() public view {
        InvoiceLib.Invoice[] memory invoices = s.getInvoicesByCustomer(customer1);
        assertEq(invoices.length, 0);
    }

    function test_GetInvoicesByCompany() public {
        s.createInvoice(customer1, 1, 1000);
        s.createInvoice(customer1, 2, 2000);
        s.createInvoice(customer1, 1, 3000);
        
        InvoiceLib.Invoice[] memory invoices = s.getInvoicesByCompany(1);
        assertEq(invoices.length, 2);
    }

    function test_GetInvoicesByCompanyEmpty() public view {
        InvoiceLib.Invoice[] memory invoices = s.getInvoicesByCompany(1);
        assertEq(invoices.length, 0);
    }
}
