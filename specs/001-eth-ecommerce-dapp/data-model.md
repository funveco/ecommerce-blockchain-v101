# Data Model: ETH E-commerce DAPP

**Branch**: `001-eth-ecommerce-dapp` | **Date**: 2026-03-06

## Entities

### EuroToken (ERC20 Contract)

| Field | Type | Description |
|-------|------|-------------|
| name | string | "EuroToken" |
| symbol | string | "EURT" |
| decimals | uint8 | 6 (representa centavos de euro) |
| owner | address | Dirección autorizada para mint |
| totalSupply | uint256 | Supply total acuñado |
| balanceOf | mapping(address => uint256) | Balance por wallet |
| allowance | mapping(address => mapping(address => uint256)) | Aprobaciones ERC20 |

**Validaciones**:
- Solo `owner` puede ejecutar `mint`
- `to` address no puede ser zero address en mint
- Monto mínimo mint: 1 EURT (1_000_000 en unidades base)
- Monto máximo mint por transacción: 1,000 EURT
- Límite diario por usuario: 5,000 EURT (controlado en backend, no on-chain)

**Operaciones**: mint, transfer, approve, transferFrom (heredadas de ERC20)

---

### Company

| Field | Type | Description |
|-------|------|-------------|
| companyId | uint256 | ID auto-incremental |
| name | string | Nombre de la empresa |
| companyAddress | address | Wallet receptora de pagos |
| taxId | string | NIF/CIF de la empresa |
| isActive | bool | Estado activo/inactivo |

**Validaciones**:
- `companyAddress` no puede ser zero address
- `name` y `taxId` no pueden estar vacíos
- Una wallet solo puede registrar una empresa
- Solo `companyAddress` puede modificar datos de su empresa

**Estado de vida**: Activa → Inactiva (toggle por owner)

**Relaciones**: 1 Company → N Products, 1 Company → N Invoices

---

### Product

| Field | Type | Description |
|-------|------|-------------|
| productId | uint256 | ID auto-incremental |
| companyId | uint256 | Empresa propietaria |
| name | string | Nombre del producto |
| description | string | Descripción |
| price | uint256 | Precio en unidades base (6 decimals, ej: 25_500_000 = 25.50 EUR) |
| stock | uint256 | Unidades disponibles |
| ipfsImageHash | string | Hash IPFS de la imagen |
| isActive | bool | Disponible para compra |

**Validaciones**:
- `price` > 0
- `companyId` debe existir y estar activo
- Solo owner de la empresa puede crear/editar
- `stock` se decrementa al confirmar pago, no al crear invoice

**Estado de vida**: Activo → Inactivo (toggle por company owner)

**Relaciones**: N:1 con Company, referenciado por CartItem

---

### CartItem

| Field | Type | Description |
|-------|------|-------------|
| productId | uint256 | Producto en el carrito |
| quantity | uint256 | Cantidad solicitada |

**Almacenamiento**: `mapping(address => CartItem[])` — carrito por wallet del cliente

**Validaciones**:
- `quantity` > 0
- `productId` debe existir y estar activo
- Stock se verifica al checkout, no al agregar

**Operaciones**: addToCart, removeFromCart, updateQuantity, clearCart, getCart

---

### Invoice

| Field | Type | Description |
|-------|------|-------------|
| invoiceId | uint256 | ID auto-incremental |
| companyId | uint256 | Empresa vendedora |
| customerAddress | address | Wallet del comprador |
| totalAmount | uint256 | Monto total (6 decimals) |
| timestamp | uint256 | Fecha de creación (block.timestamp) |
| isPaid | bool | Estado de pago |
| paymentTxHash | bytes32 | Hash de la transacción de pago |

**Validaciones**:
- Se crea desde el carrito del cliente (al menos 1 item)
- `totalAmount` se calcula sumando (price × quantity) de cada item
- Stock se verifica antes de crear la invoice
- `processPayment` verifica: invoice existe, no está pagada, monto coincide
- Una vez pagada, no puede modificarse

**Estado de vida**: Pending → Paid (sin expiración, sin cancelación)

**Relaciones**: N:1 con Company, N:1 con Customer (por address)

---

### PendingMint (Backend — off-chain)

| Field | Type | Description |
|-------|------|-------------|
| id | string | ID único |
| userAddress | address | Wallet destino del mint |
| amount | uint256 | Cantidad de EURT a acuñar |
| stripePaymentId | string | ID del Payment Intent de Stripe |
| status | string | "pending" / "completed" / "failed" |
| createdAt | timestamp | Fecha de creación |
| completedAt | timestamp | Fecha de resolución |

**Nota**: Esta entidad vive en el backend (API route o storage local), no on-chain. Registra mints fallidos para reclamación posterior.

## Relationships Diagram

```
EuroToken (ERC20)
    │
    ├── mint → PendingMint (off-chain, fallback)
    │
    └── transferFrom ← PaymentLib.processPayment
                            │
Company ──1:N──→ Product    │
    │                │      │
    │                └──→ CartItem[] (per customer address)
    │                         │
    └──1:N──→ Invoice ←──────┘ (created from cart)
                  │
                  └── isPaid (Pending → Paid via processPayment)
```
