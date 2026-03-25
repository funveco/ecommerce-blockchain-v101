# Tasks: ETH E-commerce DAPP

**Input**: Design documents from `/specs/001-eth-ecommerce-dapp/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Incluidos — la constitution (Principio II) exige testing comprehensivo.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Smart Contracts**: `stablecoin/sc/`, `sc-ecommerce/`
- **Web Apps**: `stablecoin/compra-stablecoin/`, `stablecoin/pasarela-de-pago/`, `web-admin/`, `web-customer/`
- **Integration**: `restart-all.sh`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialización de los 7 subproyectos y estructura base

- [x] T001 Inicializar proyecto Foundry para EuroToken en `stablecoin/sc/` (forge init, instalar OpenZeppelin con forge install)
- [x] T002 [P] Inicializar proyecto Foundry para Ecommerce en `sc-ecommerce/` (forge init, instalar OpenZeppelin con forge install)
- [x] T003 [P] Inicializar proyecto Next.js 15 con App Router + TypeScript + Tailwind CSS en `stablecoin/compra-stablecoin/`
- [x] T004 [P] Inicializar proyecto Next.js 15 con App Router + TypeScript + Tailwind CSS en `stablecoin/pasarela-de-pago/`
- [x] T005 [P] Inicializar proyecto Next.js 15 con App Router + TypeScript + Tailwind CSS en `web-admin/`
- [x] T006 [P] Inicializar proyecto Next.js 15 con App Router + TypeScript + Tailwind CSS en `web-customer/`
- [x] T007 [P] Crear archivo `.env.local.example` con variables requeridas en cada app Next.js (`stablecoin/compra-stablecoin/`, `stablecoin/pasarela-de-pago/`, `web-admin/`, `web-customer/`)

**Checkpoint**: Los 7 subproyectos compilan sin errores.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Smart contracts base y hooks compartidos que TODOS los user stories necesitan

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Implementar contrato EuroToken (ERC20, Ownable, mint, 6 decimals) en `stablecoin/sc/src/EuroToken.sol` según contract spec `contracts/eurotoken.md`
- [x] T009 Implementar tests de EuroToken (deploy, mint owner, mint non-owner fails, transfer, decimals) en `stablecoin/sc/test/EuroToken.t.sol`
- [x] T010 Crear script de deploy de EuroToken con mint inicial 1M EURT en `stablecoin/sc/script/DeployEuroToken.s.sol`
- [x] T011 Implementar CompanyLib (registerCompany, getCompany, toggleCompany, validaciones) en `sc-ecommerce/src/libs/CompanyLib.sol`
- [x] T012 [P] Implementar ProductLib (addProduct, updateProduct, toggleProduct, getters) en `sc-ecommerce/src/libs/ProductLib.sol`
- [x] T013 [P] Implementar CustomerLib (registro implícito de clientes por address) en `sc-ecommerce/src/libs/CustomerLib.sol`
- [x] T014 [P] Implementar CartLib (addToCart, removeFromCart, getCart, clearCart) en `sc-ecommerce/src/libs/CartLib.sol`
- [x] T015 [P] Implementar InvoiceLib (createInvoice con verificación de stock, getInvoice, getters por customer/company) en `sc-ecommerce/src/libs/InvoiceLib.sol`
- [x] T016 Implementar PaymentLib (processPayment con ReentrancyGuard, verificación invoice, transferFrom EuroToken, decremento stock) en `sc-ecommerce/src/libs/PaymentLib.sol`
- [x] T017 Implementar contrato principal Ecommerce.sol integrando todas las librerías, constructor con euroTokenAddress en `sc-ecommerce/src/Ecommerce.sol`
- [x] T018 Implementar interface IEcommerce con todas las funciones públicas en `sc-ecommerce/src/interfaces/IEcommerce.sol`
- [x] T019 Implementar tests de CompanyLib (registro, toggle, permisos) en `sc-ecommerce/test/CompanyLib.t.sol`
- [x] T020 [P] Implementar tests de ProductLib (CRUD, permisos, validaciones) en `sc-ecommerce/test/ProductLib.t.sol`
- [x] T021 [P] Implementar tests de CartLib (add, remove, clear, validaciones) en `sc-ecommerce/test/CartLib.t.sol`
- [x] T022 [P] Implementar tests de InvoiceLib (crear desde carrito, verificación stock) en `sc-ecommerce/test/InvoiceLib.t.sol`
- [x] T023 Implementar tests de PaymentLib (pago exitoso, reentrancy, invoice ya pagada, balance insuficiente) en `sc-ecommerce/test/PaymentLib.t.sol`
- [x] T024 Implementar test de integración E2E del contrato Ecommerce (registro empresa → producto → carrito → invoice → pago) en `sc-ecommerce/test/Ecommerce.t.sol`
- [x] T025 Crear script de deploy de Ecommerce (recibe dirección EuroToken) en `sc-ecommerce/script/DeployEcommerce.s.sol`
- [x] T026 Crear hook compartido `useWallet` (conexión MetaMask, detección chainId 31337, bloqueo si red incorrecta) como patrón base en `web-admin/src/hooks/useWallet.ts` (replicar en las otras 3 apps)
- [x] T027 [P] Crear utilidad `contracts.ts` con ABI loading y instanciación de contratos Ethers.js v6 en `web-admin/src/lib/contracts.ts` (replicar en las otras 3 apps)

**Checkpoint**: `forge test -vvv` pasa en `stablecoin/sc/` y `sc-ecommerce/`. Hook useWallet funciona con MetaMask en chainId 31337.

---

## Phase 3: User Story 1 — Compra de EuroTokens con tarjeta de crédito (Priority: P1) 🎯 MVP

**Goal**: Permitir a usuarios comprar EuroTokens pagando con tarjeta vía Stripe y recibir tokens en su wallet.

**Independent Test**: Conectar wallet → ingresar monto → pagar con tarjeta test (4242...) → verificar balance EURT incrementado.

### Tests for User Story 1

- [x] T028 [P] [US1] Escribir test del hook useEuroToken (lectura balance, evento mint) en `stablecoin/compra-stablecoin/src/hooks/__tests__/useEuroToken.test.ts`
- [x] T029 [P] [US1] Escribir test de API route create-payment-intent (validación monto mín/máx, límite diario) en `stablecoin/compra-stablecoin/src/app/api/create-payment-intent/__tests__/route.test.ts`

### Implementation for User Story 1

- [x] T030 [US1] Implementar hook useEuroToken (balance, allowance, eventos) en `stablecoin/compra-stablecoin/src/hooks/useEuroToken.ts`
- [x] T031 [US1] Implementar utilidad Stripe (inicialización SDK) en `stablecoin/compra-stablecoin/src/lib/stripe.ts`
- [x] T032 [US1] Implementar API route POST /api/create-payment-intent (validar monto 1-1000 EURT, límite diario 5000, crear PaymentIntent) en `stablecoin/compra-stablecoin/src/app/api/create-payment-intent/route.ts`
- [x] T033 [US1] Implementar API route POST /api/mint-tokens (verificar pago Stripe, ejecutar mint, registrar PendingMint si falla) en `stablecoin/compra-stablecoin/src/app/api/mint-tokens/route.ts`
- [x] T034 [US1] Implementar API route GET /api/pending-mints (listar mints pendientes por wallet) en `stablecoin/compra-stablecoin/src/app/api/pending-mints/route.ts`
- [x] T035 [US1] Implementar API route POST /api/claim-mint (reintentar mint de reclamación pendiente) en `stablecoin/compra-stablecoin/src/app/api/claim-mint/route.ts`
- [x] T036 [US1] Implementar componente EuroTokenPurchase (conexión wallet, formulario monto, integración Stripe Elements, flujo mint) en `stablecoin/compra-stablecoin/src/components/EuroTokenPurchase.tsx`
- [x] T037 [US1] Implementar página principal con EuroTokenPurchase, balance actual y lista de mints pendientes en `stablecoin/compra-stablecoin/src/app/page.tsx`
- [x] T038 [US1] Configurar variables de entorno (.env.local) para compra-stablecoin (Stripe keys, contract address, wallet private key) en `stablecoin/compra-stablecoin/.env.local`

**Checkpoint**: Usuario puede comprar EURT con tarjeta test Stripe y ver balance incrementado en wallet. Mints fallidos aparecen como reclamables.

---

## Phase 4: User Story 2 — Gestión de empresa y productos por administrador (Priority: P2)

**Goal**: Panel admin donde comerciantes registran empresa, gestionan productos (CRUD + toggle) y ven inventario.

**Independent Test**: Conectar wallet → registrar empresa → agregar producto → editar precio → desactivar producto → verificar que no aparece activo.

### Tests for User Story 2

- [x] T039 [P] [US2] Escribir test del hook useCompany (registro, lectura, toggle) en `web-admin/src/hooks/__tests__/useCompany.test.ts`
- [x] T040 [P] [US2] Escribir test del hook useProducts (CRUD, listado, toggle) en `web-admin/src/hooks/__tests__/useProducts.test.ts`

### Implementation for User Story 2

- [x] T041 [US2] Implementar hook useContract (instanciar contratos Ecommerce y EuroToken) en `web-admin/src/hooks/useContract.ts`
- [x] T042 [US2] Implementar hook useCompany (registerCompany, getCompany, toggleCompany, detección de empresa del wallet conectado) en `web-admin/src/hooks/useCompany.ts`
- [x] T043 [US2] Implementar hook useProducts (addProduct, updateProduct, toggleProduct, getAllProducts, getProductsByCompany) en `web-admin/src/hooks/useProducts.ts`
- [x] T044 [US2] Implementar componente WalletConnect (conexión, dirección, balance ETH/EURT, validación red) en `web-admin/src/components/WalletConnect.tsx`
- [x] T045 [US2] Implementar componente CompanyRegistration (formulario nombre + NIF, solo si wallet sin empresa) en `web-admin/src/components/CompanyRegistration.tsx`
- [x] T046 [US2] Implementar componente ProductForm (crear/editar producto: nombre, descripción, precio, stock, imagen IPFS) en `web-admin/src/components/ProductForm.tsx`
- [x] T047 [US2] Implementar componente ProductList (tabla de productos, botones editar/toggle, indicador stock) en `web-admin/src/components/ProductList.tsx`
- [x] T048 [US2] Implementar página Dashboard principal en `web-admin/src/app/page.tsx`
- [x] T049 [US2] Implementar página de empresas (lista + registro) en `web-admin/src/app/companies/page.tsx`
- [x] T050 [US2] Implementar página detalle empresa con tabs en `web-admin/src/app/company/[id]/page.tsx`
- [x] T051 [US2] Implementar página gestión de productos por empresa en `web-admin/src/app/company/[id]/products/page.tsx`

**Checkpoint**: Admin puede registrar empresa, CRUD completo de productos, toggle activo/inactivo, datos persistidos on-chain.

---

## Phase 5: User Story 3 — Compra de productos con EuroTokens (Priority: P3)

**Goal**: Cliente navega catálogo, agrega al carrito, hace checkout (crea invoice), paga en pasarela con tokens, ve factura pagada.

**Independent Test**: Navegar catálogo sin wallet → conectar wallet → agregar producto → checkout → pagar en pasarela → verificar invoice "Paid".

### Tests for User Story 3

- [x] T052 [P] [US3] Escribir test del hook useCart (add, remove, update, total) en `web-customer/src/hooks/__tests__/useCart.test.ts`
- [x] T053 [P] [US3] Escribir test del hook usePayment (approve, processPayment, estados) en `stablecoin/pasarela-de-pago/src/hooks/__tests__/usePayment.test.ts`

### Implementation for User Story 3 — Web Customer

- [x] T054 [US3] Implementar hook useContract en `web-customer/src/hooks/useContract.ts`
- [x] T055 [US3] Implementar hook useProducts (getAllProducts, read-only sin wallet) en `web-customer/src/hooks/useProducts.ts`
- [x] T056 [US3] Implementar hook useCart (addToCart, removeFromCart, getCart, clearCart, calcular total) en `web-customer/src/hooks/useCart.ts`
- [x] T057 [US3] Implementar hook useInvoices (createInvoice, getInvoicesByCustomer) en `web-customer/src/hooks/useInvoices.ts`
- [x] T058 [US3] Implementar componente WalletConnect en `web-customer/src/components/WalletConnect.tsx`
- [x] T059 [US3] Implementar componente ProductCard (imagen IPFS, nombre, precio, stock, botón Add to Cart) en `web-customer/src/components/ProductCard.tsx`
- [x] T060 [US3] Implementar componente CartItem (producto, cantidad, subtotal, botón eliminar) en `web-customer/src/components/CartItem.tsx`
- [x] T061 [US3] Implementar página catálogo de productos (grid, carga sin wallet, botón agregar requiere wallet) en `web-customer/src/app/page.tsx`
- [x] T062 [US3] Implementar página carrito (lista items, total, botón checkout → createInvoice → redirect a pasarela) en `web-customer/src/app/cart/page.tsx`

### Implementation for User Story 3 — Pasarela de Pago

- [x] T063 [US3] Implementar hook usePayment (parsear URL params, approve EuroToken, processPayment, estados de transacción) en `stablecoin/pasarela-de-pago/src/hooks/usePayment.ts`
- [x] T064 [US3] Implementar componente PaymentConfirmation (resumen: comerciante, monto, factura; botón pagar; estados loading/error/success) en `stablecoin/pasarela-de-pago/src/components/PaymentConfirmation.tsx`
- [x] T065 [US3] Implementar página pasarela (validar params URL, verificar wallet + red + balance, flujo approve → pay → redirect) en `stablecoin/pasarela-de-pago/src/app/page.tsx`

**Checkpoint**: Flujo completo: catálogo → carrito → checkout → pasarela → pago → invoice "Paid". Stock decrementado on-chain.

---

## Phase 6: User Story 4 — Consulta de facturas e historial (Priority: P4)

**Goal**: Admin ve facturas de su empresa con filtros. Cliente ve sus facturas con estado de pago.

**Independent Test**: Con facturas existentes (pagadas y pendientes), verificar que admin filtra por estado y cliente ve sus propias facturas.

### Implementation for User Story 4

- [x] T066 [US4] Implementar hook useInvoices (getInvoicesByCompany, filtro pagadas/pendientes) en `web-admin/src/hooks/useInvoices.ts`
- [x] T067 [US4] Implementar componente InvoiceList (tabla facturas, filtro estado, detalle con txHash) en `web-admin/src/components/InvoiceList.tsx`
- [x] T068 [US4] Implementar página facturas por empresa en `web-admin/src/app/company/[id]/invoices/page.tsx`
- [x] T069 [US4] Implementar componente InvoiceStatus (indicador visual Paid/Pending, link a tx) en `web-customer/src/components/InvoiceStatus.tsx`
- [x] T070 [US4] Implementar página "Mis Facturas" (lista facturas del cliente, estado, detalles) en `web-customer/src/app/orders/page.tsx`

**Checkpoint**: Admin ve facturas filtradas por estado. Cliente ve su historial con indicadores visuales Paid/Pending.

---

## Phase 7: User Story 5 — Despliegue y reinicio completo del entorno (Priority: P5)

**Goal**: Script bash que levanta todo el entorno local: Anvil + deploy contracts + start 4 apps.

**Independent Test**: Ejecutar script en entorno limpio → verificar 6 aplicaciones corriendo en puertos correctos con contratos desplegados.

### Implementation for User Story 5

- [x] T071 [US5] Implementar script restart-all.sh: parar procesos previos (kill ports 6001-6004, 8545) en `restart-all.sh`
- [x] T072 [US5] Agregar al script: iniciar Anvil con cuentas determinísticas en background en `restart-all.sh`
- [x] T073 [US5] Agregar al script: deploy EuroToken + Ecommerce, capturar direcciones de contratos en `restart-all.sh`
- [x] T074 [US5] Agregar al script: generar/actualizar `.env.local` en las 4 apps con direcciones de contratos en `restart-all.sh`
- [x] T075 [US5] Agregar al script: iniciar las 4 apps Next.js en puertos 6001-6004 en background en `restart-all.sh`
- [x] T076 [US5] Agregar al script: verificación de health check (curl a cada puerto) y output de resumen en `restart-all.sh`

**Checkpoint**: `./restart-all.sh` ejecuta y deja 6 servicios corriendo. `curl localhost:600X` responde para cada app.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Mejoras que afectan múltiples user stories

- [x] T077 [P] Implementar dark mode support con Tailwind en las 4 apps Next.js
- [x] T078 [P] Implementar responsive design en todas las páginas de `web-admin/` y `web-customer/`
- [x] T079 [P] Agregar loading skeletons para estados de carga en `web-customer/src/components/`
- [x] T080 [P] Agregar confirmaciones antes de transacciones blockchain (modal de confirmación) en las 4 apps
- [x] T081 [P] Agregar mensajes de éxito/error toast notifications en las 4 apps
- [x] T082 Ejecutar y validar quickstart.md completo (flujo E2E: comprar tokens → registrar empresa → agregar producto → comprar → pagar → verificar)
- [x] T083 [P] Optimizar gas: ejecutar `forge snapshot` en ambos contratos y documentar costos en `stablecoin/sc/` y `sc-ecommerce/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational (T008-T010 EuroToken)
- **US2 (Phase 4)**: Depends on Foundational (T011-T025 Ecommerce contract)
- **US3 (Phase 5)**: Depends on US1 (tokens exist) + US2 (products exist)
- **US4 (Phase 6)**: Depends on US3 (invoices exist)
- **US5 (Phase 7)**: Depends on Foundational (deploy scripts T010, T025)
- **Polish (Phase 8)**: Depends on US1-US4 complete

### User Story Dependencies

```
US1 (Compra tokens) ─────────────────────┐
                                          ├──→ US3 (Compra productos) ──→ US4 (Historial)
US2 (Gestión empresa/productos) ─────────┘
                                          
US5 (Deploy script) ── independent after Foundational
```

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Hooks before components
- Components before pages
- Core implementation before integration

### Parallel Opportunities

- T001-T007: All setup tasks [P] can run in parallel
- T011-T015: Contract libraries [P] can run in parallel
- T019-T022: Library tests [P] can run in parallel
- T028-T029: US1 tests [P] can run in parallel
- T039-T040: US2 tests [P] can run in parallel
- T052-T053: US3 tests [P] can run in parallel
- T066-T070: US4 tasks mostly parallelizable between admin/customer
- T071-T076: US5 sequential (script incremental)
- T077-T083: Polish tasks [P] can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (smart contracts + tests)
3. Complete Phase 3: User Story 1 (compra tokens)
4. **STOP and VALIDATE**: Test compra de EURT con Stripe test card
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Contracts desplegados y testeados
2. Add US1 → Compra de tokens funcional → Demo MVP
3. Add US2 → Admin puede gestionar empresa/productos → Demo
4. Add US3 → Flujo completo de compra con pasarela → Demo
5. Add US4 → Historial de facturas → Demo
6. Add US5 → Deploy automatizado → Dev experience completa
7. Polish → UX refinada

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
