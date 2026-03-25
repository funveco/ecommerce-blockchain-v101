# Research: ETH E-commerce DAPP

**Branch**: `001-eth-ecommerce-dapp` | **Date**: 2026-03-06

## Decision Log

### 1. ERC20 Token Implementation

- **Decision**: Heredar de OpenZeppelin `ERC20` y `Ownable` para EuroToken
- **Rationale**: OpenZeppelin es el estándar de la industria para contratos auditados y seguros. Evita errores comunes en implementaciones custom.
- **Alternatives considered**:
  - Implementación ERC20 desde cero — rechazada por riesgo de vulnerabilidades
  - Solmate ERC20 — menor adopción y documentación vs OpenZeppelin

### 2. Arquitectura de Librerías del Contrato Ecommerce

- **Decision**: Usar `library` de Solidity con pattern `using LibX for Storage`
- **Rationale**: Las librerías reducen el tamaño del contrato principal delegando lógica, permiten testing aislado de cada módulo y reutilización.
- **Alternatives considered**:
  - Contrato monolítico — rechazado por superar límites de tamaño y dificultar testing
  - Contratos separados con proxies — sobreingeniería para entorno local de desarrollo
  - Diamond pattern (EIP-2535) — complejidad innecesaria para el scope del proyecto

### 3. Framework de Smart Contracts

- **Decision**: Foundry (Forge + Anvil)
- **Rationale**: Testing nativo en Solidity (sin JavaScript), fuzz testing integrado, scripts de deploy tipados, Anvil como blockchain local determinista.
- **Alternatives considered**:
  - Hardhat — requiere JS/TS para tests, más overhead de configuración
  - Truffle — descontinuado, sin soporte activo

### 4. Frontend Framework

- **Decision**: Next.js 15 con App Router + TypeScript strict
- **Rationale**: Server components para SEO del catálogo, API routes para backend (Stripe, mint), App Router como estándar actual de Next.js.
- **Alternatives considered**:
  - Vite + React — sin server-side rendering ni API routes integradas
  - Remix — menor ecosistema para integración con Web3

### 5. Interacción con Blockchain

- **Decision**: Ethers.js v6
- **Rationale**: API moderna con ESM nativo, tipado TypeScript mejorado, buena documentación para interacción con contratos ERC20.
- **Alternatives considered**:
  - Viem + Wagmi — mejor DX para hooks React pero agrega dependencia extra
  - Web3.js — API legacy, bundle más grande

### 6. Gestión de Pagos Fiat

- **Decision**: Stripe Payment Intents API
- **Rationale**: Estándar de la industria, soporte test mode con tarjetas de prueba, webhooks para confirmación asíncrona, SDK oficial para Next.js.
- **Alternatives considered**:
  - Stripe Checkout (hosted) — menos control sobre UX
  - PayPal — menor integración con ecosistema crypto

### 7. Almacenamiento de Imágenes de Productos

- **Decision**: IPFS hash almacenado on-chain, imagen servida via gateway IPFS público
- **Rationale**: Descentralizado, inmutable, consistente con la naturaleza blockchain del proyecto. El hash IPFS se guarda como string en el struct Product.
- **Alternatives considered**:
  - Almacenamiento local/S3 — centralizado, contradice principios DApp
  - Base64 on-chain — costos de gas prohibitivos

### 8. Manejo de Fallo Mint tras Pago Fiat

- **Decision**: Registrar deuda interna + reclamación desde app (clarificación Q1)
- **Rationale**: Evita pérdida de fondos del usuario sin complejidad de reintentos automáticos. El backend mantiene un registro de mints pendientes que el usuario puede reclamar.
- **Alternatives considered**:
  - Reintento automático + reembolso Stripe — complejidad de gestión de estados
  - Reembolso inmediato — mala UX si el fallo es temporal

### 9. Validación de Stock

- **Decision**: Verificar stock al momento del checkout, no al agregar al carrito (clarificación Q3)
- **Rationale**: Patrón estándar de ecommerce. No bloquea stock para carritos abandonados. Verificación on-chain en `createInvoice` garantiza consistencia.
- **Alternatives considered**:
  - Reserva temporal con TTL — requiere cronjob o keeper, complejidad innecesaria on-chain
  - Sin verificación (fail en contrato) — mala UX, error críptico para el usuario

### 10. Ciclo de Vida de Invoices

- **Decision**: Facturas pendientes sin expiración (clarificación Q4)
- **Rationale**: Simplicidad on-chain — no requiere mecanismos de limpieza. El usuario puede pagar cuando quiera. El stock no se reserva hasta el pago.
- **Alternatives considered**:
  - Expiración con cleanup — requiere keeper o función manual, gas adicional
  - Cancelación manual — agrega complejidad de estados (Pending/Paid/Cancelled)
