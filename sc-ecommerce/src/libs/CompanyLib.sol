// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CompanyLib — Library for managing companies
/// @notice Provides CRUD operations for company registration and management
library CompanyLib {
    // ──────────────────── Structs ────────────────────

    struct Company {
        uint256 companyId;
        string name;
        address companyAddress;
        string taxId;
        bool isActive;
    }

    struct Storage {
        mapping(uint256 => Company) companies;
        mapping(address => uint256) ownerToCompany;
        uint256 nextCompanyId;
    }

    // ──────────────────── Events ────────────────────

    event CompanyRegistered(uint256 indexed companyId, string name, address indexed companyAddress, string taxId);
    event CompanyToggled(uint256 indexed companyId, bool isActive);

    // ──────────────────── Errors ────────────────────

    error EmptyName();
    error EmptyTaxId();
    error InvalidAddress();
    error AddressAlreadyRegistered();
    error CompanyNotFound(uint256 companyId);
    error NotCompanyOwner();

    // ──────────────────── Functions ────────────────────

    /// @notice Register a new company
    /// @param s Storage reference
    /// @param name Company name (must be non-empty)
    /// @param taxId Company tax ID (must be non-empty)
    /// @param companyAddress Wallet address that owns the company
    /// @return companyId The ID assigned to the new company
    function registerCompany(
        Storage storage s,
        string memory name,
        string memory taxId,
        address companyAddress
    ) internal returns (uint256 companyId) {
        if (bytes(name).length == 0) revert EmptyName();
        if (bytes(taxId).length == 0) revert EmptyTaxId();
        if (companyAddress == address(0)) revert InvalidAddress();
        if (s.ownerToCompany[companyAddress] != 0) revert AddressAlreadyRegistered();

        s.nextCompanyId++;
        companyId = s.nextCompanyId;

        s.companies[companyId] = Company({
            companyId: companyId,
            name: name,
            companyAddress: companyAddress,
            taxId: taxId,
            isActive: true
        });

        s.ownerToCompany[companyAddress] = companyId;

        emit CompanyRegistered(companyId, name, companyAddress, taxId);
    }

    /// @notice Get a company by ID
    /// @param s Storage reference
    /// @param companyId The company ID to look up
    /// @return company The company data
    function getCompany(Storage storage s, uint256 companyId) internal view returns (Company memory) {
        if (s.companies[companyId].companyId == 0) revert CompanyNotFound(companyId);
        return s.companies[companyId];
    }

    /// @notice Toggle a company's active status
    /// @param s Storage reference
    /// @param companyId The company ID to toggle
    /// @param caller The address calling this function (must be company owner)
    function toggleCompany(Storage storage s, uint256 companyId, address caller) internal {
        if (s.companies[companyId].companyId == 0) revert CompanyNotFound(companyId);
        if (s.companies[companyId].companyAddress != caller) revert NotCompanyOwner();

        s.companies[companyId].isActive = !s.companies[companyId].isActive;

        emit CompanyToggled(companyId, s.companies[companyId].isActive);
    }

    /// @notice Get the company ID associated with an owner address
    /// @param s Storage reference
    /// @param owner The owner address
    /// @return companyId The company ID (0 if none)
    function getCompanyByOwner(Storage storage s, address owner) internal view returns (uint256) {
        return s.ownerToCompany[owner];
    }
}
