# API Contract: Pasarela de Pago

**Location**: `stablecoin/pasarela-de-pago/src/app/page.tsx`

## Interfaz por URL Parameters

La pasarela recibe datos de pago vía query parameters cuando el cliente es redirigido desde web-customer.

### URL Format

```
http://localhost:6002/?merchant_address=0x...&amount=100.50&invoice=123&date=2026-03-06&redirect=http://localhost:6004/orders
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| merchant_address | string (address) | ✅ | Wallet del comerciante (Company.companyAddress) |
| amount | string (decimal) | ✅ | Monto en EUR (ej: "100.50") |
| invoice | string (uint256) | ✅ | ID de la factura en el contrato Ecommerce |
| date | string (ISO date) | ✅ | Fecha de la factura |
| redirect | string (URL) | ✅ | URL de retorno tras pago exitoso |

### Validations

- Todos los parámetros requeridos presentes
- `merchant_address` es una dirección Ethereum válida
- `amount` es un número positivo
- `invoice` es un ID válido existente en el contrato
- `redirect` es una URL válida con protocol http/https

### Flow

1. Parsear y validar parámetros URL
2. Mostrar resumen: comerciante, monto, factura
3. Verificar wallet conectada y red correcta (chainId 31337)
4. Verificar balance de EuroTokens suficiente
5. Solicitar approve de EuroTokens al contrato Ecommerce
6. Ejecutar `processPayment(invoiceId)` en el contrato Ecommerce
7. Esperar confirmación de transacción
8. Redirigir a `redirect` URL

### Error States

- Wallet no conectada → Mostrar botón de conexión
- Red incorrecta → Mostrar aviso de cambio de red
- Balance insuficiente → Mostrar mensaje con balance actual y monto requerido
- Parámetros inválidos → Mostrar error y no permitir pago
- Transacción rechazada → Mostrar error con opción de reintentar
