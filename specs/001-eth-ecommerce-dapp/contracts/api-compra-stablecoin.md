# API Contract: Compra Stablecoin

**Location**: `stablecoin/compra-stablecoin/src/app/api/`

## Endpoints

### POST /api/create-payment-intent

Creates a Stripe Payment Intent for purchasing EuroTokens.

**Request**:
```json
{
  "amount": 100,
  "walletAddress": "0x..."
}
```

**Validations**:
- `amount` >= 1 y <= 1000 (EURT)
- `walletAddress` es una dirección Ethereum válida
- Verificar límite diario del usuario (5,000 EURT) — no excedido

**Response (200)**:
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "amount": 100,
  "currency": "eur"
}
```

**Response (400)**:
```json
{
  "error": "Amount exceeds transaction limit (max 1,000 EURT)"
}
```

---

### POST /api/mint-tokens

Mints EuroTokens after successful Stripe payment confirmation.

**Request**:
```json
{
  "paymentIntentId": "pi_xxx",
  "walletAddress": "0x...",
  "amount": 100
}
```

**Validations**:
- Verificar que el Payment Intent está pagado en Stripe
- Verificar que no se ha procesado previamente (idempotencia)

**Response (200)**:
```json
{
  "success": true,
  "txHash": "0x...",
  "amount": 100,
  "walletAddress": "0x..."
}
```

**Response (500 — mint failure)**:
```json
{
  "success": false,
  "pendingMintId": "pm_xxx",
  "message": "Tokens pending — claim from your account"
}
```

---

### GET /api/pending-mints?walletAddress=0x...

Returns pending mints for a user (failed mints that need to be claimed).

**Response (200)**:
```json
{
  "pendingMints": [
    {
      "id": "pm_xxx",
      "amount": 100,
      "stripePaymentId": "pi_xxx",
      "status": "pending",
      "createdAt": "2026-03-06T10:00:00Z"
    }
  ]
}
```

---

### POST /api/claim-mint

Retries a failed mint for a pending claim.

**Request**:
```json
{
  "pendingMintId": "pm_xxx"
}
```

**Response (200)**:
```json
{
  "success": true,
  "txHash": "0x...",
  "amount": 100
}
```
