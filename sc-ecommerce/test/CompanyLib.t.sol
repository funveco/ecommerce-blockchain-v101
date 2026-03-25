// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {CompanyLib} from "../src/libs/CompanyLib.sol";

contract CompanyLibTest is Test {
    using CompanyLib for CompanyLib.Storage;

    CompanyLib.Storage s;
    address owner;
    address user1;
    address user2;

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
    }

    function test_RegisterCompany() public {
        uint256 companyId = s.registerCompany("Test Company", "B12345678", user1);
        assertEq(companyId, 1);

        CompanyLib.Company memory company = s.getCompany(companyId);
        assertEq(company.name, "Test Company");
        assertEq(company.taxId, "B12345678");
        assertEq(company.companyAddress, user1);
        assertTrue(company.isActive);
    }

    function test_GetCompanyByOwner() public {
        uint256 companyId = s.registerCompany("Test Company", "B12345678", user1);
        assertEq(s.getCompanyByOwner(user1), companyId);
        assertEq(s.getCompanyByOwner(user2), 0);
    }
}
