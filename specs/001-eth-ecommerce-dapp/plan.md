# Implementation Plan: ETH E-commerce DAPP

**Branch**: `001-eth-ecommerce-dapp` | **Date**: 2026-03-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-eth-ecommerce-dapp/spec.md`

## Summary

Plataforma ecommerce descentralizada compuesta por 7 partes: 2 smart contracts (EuroToken ERC20 stablecoin + Ecommerce con librerías para empresas, productos, carritos e invoices), 4 aplicaciones Next.js (compra de stablecoins con Stripe, pasarela de pagos con tokens, panel admin, tienda para clientes) y un script de despliegue automatizado. Los contratos se desarrollan con Foundry/Solidity heredando de OpenZeppelin, los frontends con Next.js 15 App Router + TypeScript + Tailwind CSS + Ethers.js v6, y los pagos fiat con Stripe.

## Technical Context

**Language/Version**: Solidity ^0.8.20 (smart contracts), TypeScript 5.x (frontends)
**Primary Dependencies**: OpenZeppelin Contracts (ERC20, Ownable, ReentrancyGuard), Foundry/Forge (SC dev/test), Next.js 15 (App Router), Ethers.js v6, Stripe SDK, Tailwind CSS
**Storage**: Blockchain (Ethereum/Anvil) — toda la persistencia de negocio on-chain; `.env.local` para configuración
**Testing**: Forge test (smart contracts — unit, fuzz, integration), Vitest/Jest (frontend hooks/components)
**Target Platform**: Web (browser) + Anvil local blockchain (localhost:8545)
**Project Type**: Multi-app DApp (2 smart contracts + 4 web apps + 1 deploy script)
**Performance Goals**: Page load < 3s, compra de tokens < 3 min, flujo completo < 5 min, gas optimizado con mappings O(1)
**Constraints**: Entorno local (Anvil chainId 31337), 6 decimales para EuroToken, puertos fijos (6001-6004 + 8545), límite compra 1,000 EURT/tx y 5,000 EURT/día
**Scale/Scope**: Desarrollo local, 7 partes, ~15 páginas frontend, 2 contratos con 6 librerías

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Code Quality & Standards | ✅ PASS | Solidity NatSpec + TS strict mode + shared ABIs from Foundry builds |
| II | Testing Standards | ✅ PASS | Forge tests (unit/fuzz/integration) + frontend component/hook tests + E2E cross-app |
| III | User Experience Consistency | ✅ PASS | Shared useWallet pattern, Tailwind config mirrored, loading states, network validation |
| IV | Performance & Gas Optimization | ✅ PASS | Mappings O(1), 6 decimals, page load < 3s, async blockchain calls |
| V | Multi-Application Architecture | ✅ PASS | 7 parts in 2 blocks, independent start, .env.local injection, fixed ports |
| VI | Blockchain Security | ✅ PASS | Ownable, ReentrancyGuard, input validation, payment integrity checks, no keys in VCS |
| VII | Environment & Deployment Reproducibility | ✅ PASS | restart-all.sh single entry point, auto-propagation of addresses, deterministic Anvil |

All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/001-eth-ecommerce-dapp/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── eurotoken.md
│   ├── ecommerce.md
│   ├── api-compra-stablecoin.md
│   └── api-pasarela.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
01-eth-commerce/
├── stablecoin/
│   ├── sc/                          # Parte 1: EuroToken contract
│   │   ├── src/
│   │   │   └── EuroToken.sol
│   │   ├── test/
│   │   │   └── EuroToken.t.sol
│   │   ├── script/
│   │   │   └── DeployEuroToken.s.sol
│   │   └── lib/                     # OpenZeppelin (forge install)
│   ├── compra-stablecoin/           # Parte 2: Buy tokens (Next.js)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── page.tsx
│   │   │   │   └── api/
│   │   │   │       ├── create-payment-intent/route.ts
│   │   │   │       └── mint-tokens/route.ts
│   │   │   ├── components/
│   │   │   │   └── EuroTokenPurchase.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useWallet.ts
│   │   │   │   └── useEuroToken.ts
│   │   │   └── lib/
│   │   │       ├── contracts.ts
│   │   │       └── stripe.ts
│   │   └── .env.local
│   └── pasarela-de-pago/            # Parte 3: Payment gateway (Next.js)
│       ├── src/
│       │   ├── app/
│       │   │   └── page.tsx
│       │   ├── components/
│       │   │   └── PaymentConfirmation.tsx
│       │   ├── hooks/
│       │   │   ├── useWallet.ts
│       │   │   └── usePayment.ts
│       │   └── lib/
│       │       └── contracts.ts
│       └── .env.local
├── sc-ecommerce/                    # Parte 4: Ecommerce contract
│   ├── src/
│   │   ├── Ecommerce.sol
│   │   ├── libs/
│   │   │   ├── CompanyLib.sol
│   │   │   ├── ProductLib.sol
│   │   │   ├── CustomerLib.sol
│   │   │   ├── CartLib.sol
│   │   │   ├── InvoiceLib.sol
│   │   │   └── PaymentLib.sol
│   │   └── interfaces/
│   │       └── IEcommerce.sol
│   ├── test/
│   │   ├── Ecommerce.t.sol
│   │   ├── CompanyLib.t.sol
│   │   ├── ProductLib.t.sol
│   │   ├── CartLib.t.sol
│   │   ├── InvoiceLib.t.sol
│   │   └── PaymentLib.t.sol
│   ├── script/
│   │   └── DeployEcommerce.s.sol
│   └── lib/
├── web-admin/                       # Parte 5: Admin panel (Next.js)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx             # Dashboard
│   │   │   ├── companies/
│   │   │   │   └── page.tsx
│   │   │   └── company/
│   │   │       └── [id]/
│   │   │           ├── page.tsx
│   │   │           ├── products/page.tsx
│   │   │           └── invoices/page.tsx
│   │   ├── components/
│   │   │   ├── WalletConnect.tsx
│   │   │   ├── CompanyRegistration.tsx
│   │   │   ├── ProductList.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   └── InvoiceList.tsx
│   │   ├── hooks/
│   │   │   ├── useWallet.ts
│   │   │   ├── useContract.ts
│   │   │   ├── useCompany.ts
│   │   │   └── useProducts.ts
│   │   └── lib/
│   │       └── contracts.ts
│   └── .env.local
├── web-customer/                    # Parte 6: Customer store (Next.js)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx             # Product catalog
│   │   │   ├── cart/page.tsx
│   │   │   └── orders/page.tsx
│   │   ├── components/
│   │   │   ├── WalletConnect.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── CartItem.tsx
│   │   │   └── InvoiceStatus.tsx
│   │   ├── hooks/
│   │   │   ├── useWallet.ts
│   │   │   ├── useContract.ts
│   │   │   ├── useProducts.ts
│   │   │   ├── useCart.ts
│   │   │   └── useInvoices.ts
│   │   └── lib/
│   │       └── contracts.ts
│   └── .env.local
└── restart-all.sh                   # Parte 7: Deploy script
```

**Structure Decision**: Multi-app architecture — 2 Foundry projects (stablecoin/sc, sc-ecommerce) + 4 Next.js apps (compra-stablecoin, pasarela-de-pago, web-admin, web-customer) + 1 bash script. Each app is independently runnable with shared contract ABI imports.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 6 applications | Each serves a distinct user role and domain (token buyer, payment gateway, merchant, customer) | Combining would create a monolith with mixed concerns and complex routing |
| 6 contract libraries | Separation of concerns for Company/Product/Cart/Invoice/Payment/Customer | A single contract file would exceed readability and testability limits |
