<!--
=== Sync Impact Report ===
Version change: 1.0 → 1.1.0
Bump type: MINOR — materially expanded principles with project-specific
guidance, added new principles (V, VI, VII), restructured sections.

Modified principles:
  - I. Code Quality → I. Code Quality & Standards (expanded with stack-specific rules)
  - II. Testing Standards → II. Testing Standards (expanded with Foundry/contract specifics)
  - III. User Experience Consistency → III. User Experience Consistency (expanded with multi-app context)
  - IV. Performance Requirements → IV. Performance & Gas Optimization (expanded with blockchain specifics)

Added sections:
  - V. Multi-Application Architecture (new principle)
  - VI. Blockchain Security (new principle — elevated from generic section)
  - VII. Environment & Deployment Reproducibility (new principle)
  - Technology Stack section
  - Project Structure section

Removed sections:
  - None (all original sections preserved or restructured)

Templates requiring updates:
  - .specify/templates/plan-template.md — ✅ no outdated references
  - .specify/templates/spec-template.md — ✅ no outdated references
  - .specify/templates/tasks-template.md — ✅ no outdated references
  - .specify/templates/constitution-template.md — ✅ source template, no update needed

Follow-up TODOs: None
=== End Sync Impact Report ===
-->

# 01-eth-commerce Constitution

## Core Principles

### I. Code Quality & Standards

All code MUST adhere to strict quality standards per technology:

- **Solidity**: Follow Solidity style guide, use NatSpec comments on all
  public/external functions, inherit from OpenZeppelin contracts where
  applicable (ERC20, Ownable, ReentrancyGuard).
- **TypeScript/Next.js**: Strict mode enabled, no `any` types, proper
  interface definitions for all contract interactions and API responses.
- **Naming**: Contracts use PascalCase, functions use camelCase, constants
  use UPPER_SNAKE_CASE. Next.js components use PascalCase file names,
  hooks use `use` prefix (e.g., `useWallet`, `useContract`).
- **Documentation**: Every smart contract function MUST have NatSpec.
  Every React hook MUST have JSDoc describing parameters and return type.
- **Shared ABIs**: Contract ABIs MUST be generated from Foundry builds and
  imported by all frontend apps — never duplicated manually.

### II. Testing Standards

Comprehensive testing is mandatory across all six applications:

- **Smart Contracts (Foundry/Forge)**: Unit tests for every public
  function, fuzz tests for arithmetic operations, integration tests for
  cross-contract flows (EuroToken ↔ Ecommerce). Coverage MUST be ≥ 90%
  for critical paths (mint, payment, invoice creation).
- **Frontend (Next.js)**: Component tests for forms and wallet
  interactions, hook tests for contract calls, E2E tests for critical
  user flows (purchase flow, admin CRUD).
- **Cross-application**: The full flow (buy tokens → add to cart →
  checkout → pay via pasarela → invoice marked paid) MUST be tested
  end-to-end against a local Anvil instance.
- **Test isolation**: Each test MUST set up its own state; tests MUST NOT
  depend on execution order.

### III. User Experience Consistency

All four web applications MUST provide a consistent experience:

- **MetaMask integration**: Wallet connection flow MUST be identical
  across compra-stablecoin, pasarela-de-pago, web-admin, and
  web-customer. Use shared `useWallet` hook pattern.
- **Design system**: Tailwind CSS configuration (colors, spacing,
  typography) MUST be shared or mirrored across all Next.js apps.
- **Loading states**: Every blockchain transaction MUST show a pending
  indicator. Optimistic updates MUST be used for cart operations.
- **Error handling**: Transaction failures MUST display user-friendly
  messages with the option to retry. Network mismatch (not on
  localhost:8545 / chainId 31337) MUST be detected and communicated.
- **Accessibility**: WCAG 2.1 AA compliance is required for all UI
  components.

### IV. Performance & Gas Optimization

- **Smart contracts**: Use `mapping` for O(1) lookups, minimize storage
  writes, batch operations where possible. Gas costs for common
  operations (addToCart, createInvoice, processPayment) MUST be
  benchmarked and documented.
- **EuroToken decimals**: MUST use 6 decimals consistently across all
  contracts and frontends to represent euro cents.
- **Web applications**: Initial page load MUST complete within 3 seconds.
  Product catalog MUST support read-only access without wallet
  connection. Use caching for product data.
- **Async operations**: All blockchain calls MUST be asynchronous with
  proper loading states; UI MUST NOT block during transaction
  confirmation.

### V. Multi-Application Architecture

The project consists of 7 parts in two blocks — all MUST be independently
deployable yet interoperable:

- **Bloque A — Stable Coin**: sc (EuroToken contract), compra-stablecoin
  (buy tokens with Stripe), pasarela-de-pago (token payment gateway).
- **Bloque B — Ecommerce**: sc-ecommerce (main commerce contract),
  web-admin (merchant panel), web-customer (customer storefront).
- **Integration**: restart-all.sh (deploy & restart all 6 apps + Anvil).
- Each application MUST be startable independently for development.
  Contract addresses MUST be injected via `.env.local` and updated
  automatically by the deploy script.
- Port assignments are fixed: Anvil 8545, compra-stablecoin 6001,
  pasarela-de-pago 6002, web-admin 6003, web-customer 6004.

### VI. Blockchain Security

Smart contracts MUST implement the following protections:

- **Access control**: Only the company owner MAY modify their products.
  Only the contract owner MAY mint EuroTokens. Use OpenZeppelin
  `Ownable` or equivalent modifiers.
- **Reentrancy**: All functions involving token transfers MUST use
  `ReentrancyGuard` or checks-effects-interactions pattern.
- **Input validation**: All user-supplied values (amounts, quantities,
  addresses) MUST be validated on-chain. Zero-address checks MUST be
  enforced.
- **Payment integrity**: `processPayment` MUST verify invoice exists, is
  unpaid, and amount matches before executing ERC20 transfer.
- **Private keys**: Wallet private keys MUST NEVER be committed to
  version control. Use environment variables exclusively.

### VII. Environment & Deployment Reproducibility

- The `restart-all.sh` script MUST be the single entry point to bring
  up the entire local development environment (Anvil + deploy contracts
  + start all apps).
- Contract addresses generated during deploy MUST be automatically
  propagated to all `.env.local` files.
- All six applications MUST be resettable to a clean state via a single
  script execution.
- Anvil MUST run with deterministic accounts for consistent local
  development.

## Technology Stack

| Layer | Technology | Version/Standard |
|-------|-----------|-----------------|
| Smart Contracts | Solidity + Foundry/Forge | ERC20 (OpenZeppelin) |
| Local Blockchain | Anvil | localhost:8545 |
| Frontend | Next.js 15 (App Router) + TypeScript | React 18+ |
| Styling | Tailwind CSS | — |
| Wallet | MetaMask + Ethers.js v6 | — |
| Payments (fiat) | Stripe | — |
| Token Standard | ERC20 (EuroToken, 6 decimals) | — |

## Project Structure

```text
01-eth-commerce/
├── stablecoin/
│   ├── sc/                    # Parte 1: Smart Contract EuroToken
│   ├── compra-stablecoin/     # Parte 2: Buy tokens with Stripe
│   └── pasarela-de-pago/      # Parte 3: Token payment gateway
├── sc-ecommerce/              # Parte 4: Smart Contract E-commerce
├── web-admin/                 # Parte 5: Admin panel (Next.js)
├── web-customer/              # Parte 6: Customer storefront (Next.js)
└── restart-all.sh             # Parte 7: Full deploy & restart script
```

## Development Workflow

- Code reviews are required for all changes.
- Pull requests MUST include tests and documentation updates.
- CI/CD pipelines MUST run Foundry tests (`forge test`) and frontend
  linting before merge.
- Every PR MUST pass the Constitution Check from the plan template
  before approval.
- Commit messages MUST follow conventional commits format.

## Governance

This constitution governs all development decisions for 01-eth-commerce.
Amendments require documented justification and version increment
following semantic versioning:

- **MAJOR**: Backward-incompatible principle removal or redefinition.
- **MINOR**: New principle added or existing principle materially expanded.
- **PATCH**: Wording clarifications, typo fixes, non-semantic changes.

All PRs and reviews MUST verify compliance with these principles.
Complexity beyond what is specified here MUST be justified in the PR
description.

**Version**: 1.1.0 | **Ratified**: 2026-03-06 | **Last Amended**: 2026-03-06
