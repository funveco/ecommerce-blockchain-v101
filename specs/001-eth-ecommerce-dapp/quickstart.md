# Quickstart: ETH E-commerce DAPP

**Branch**: `001-eth-ecommerce-dapp` | **Date**: 2026-03-22

## Prerequisites

- Node.js 18+
- Foundry (forge, anvil, cast) instalado
- MetaMask browser extension
- Cuenta Stripe en modo test (con claves pk_test y sk_test)

## Setup Rápido (Una sola ejecución)

```bash
# Clonar y entrar al proyecto
cd 01-eth-commerce

# Ejecutar el script de despliegue completo
chmod +x restart-all.sh
./restart-all.sh
```

El script realiza automáticamente:
1. Detiene aplicaciones anteriores
2. Exporta estado de Anvil (si existe)
3. Inicia Anvil en localhost:8545 (cuentas determinísticas)
4. Importa estado anterior o despliega nuevos contratos
5. Actualiza `.env.local` en las 4 apps con direcciones de contratos
6. Inicia las 4 aplicaciones Next.js
7. Guarda el estado de Anvil para persistencia

## URLs de Acceso

| App | URL | Descripción |
|-----|-----|-------------|
| Anvil | http://localhost:8545 | Blockchain local |
| Compra Stablecoin | http://localhost:6001 | Comprar EURT con tarjeta |
| Pasarela de Pago | http://localhost:6002 | Pagar con tokens |
| Web Admin | http://localhost:6003 | Panel de administración |
| Web Customer | http://localhost:6004 | Tienda para clientes |

## Arquitectura del Sistema

### Cuentas de Anvil (Wallet del Servidor)

```
Account 0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10,000 ETH)
  - Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
  - Rol: Owner de contratos, wallet del servidor para mint de EURT

Account 1-9: Disponibles para clientes y empresas
```

### Flujo Completo de Tokens EURT

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         COMPRA DE EURT (Puerto 6001)                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Cliente ────[Stripe Payment]───► Servidor                          │
│                                               │                         │
│                                               ▼                         │
│                                    [transfer EURT al cliente]          │
│                                               │                         │
│                                               ▼                         │
│                              Cliente recibe EURT en su wallet           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPRA EN E-COMMERCE (Puerto 6004)                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Cliente ────[Selecciona productos]───► Carrito                       │
│                    │                                                     │
│                    ▼                                                     │
│              [createInvoice] ──► Invoice creado                         │
│                    │                                                     │
│                    ▼                                                     │
│            [Pasarela Puerto 6002]                                       │
│                    │                                                     │
│                    ▼                                                     │
│          [transferFrom: Cliente → Empresa]                               │
│                    │                                                     │
│                    ▼                                                     │
│        Empresa recibe EURT en su wallet                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Roles en el Sistema

| Rol | Wallet | Funciones |
|-----|--------|-----------|
| **Servidor** | Account 0 (Anvil) | Mintea y transfiere EURT a clientes |
| **Cliente** | Cualquier cuenta Anvil | Compra EURT, compra productos |
| **Empresa** | Cualquier cuenta Anvil | Registra empresa, agrega productos, recibe pagos |

## Configuración de MetaMask

1. Agregar red personalizada:
   - Network Name: `Anvil Local`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. Importar cuentas de Anvil según necesidad:
   - Private Key Account 0: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - Private Key Account 1: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
   - etc.

## Flujo de Verificación Paso a Paso

### 1. Registrar una Empresa (Puerto 6003)

```
1. Conectar MetaMask con una cuenta (ej: Account 1)
2. Hacer clic en "Registrar Empresa"
3. Ingresar:
   - Nombre: "Mi Tienda"
   - NIF: "A12345678"
4. La empresa se registra con tu wallet como owner
5. Agregar productos:
   - Nombre: "Producto 1"
   - Precio: 50 EURT
   - Stock: 100
```

### 2. Comprar EuroTokens (Puerto 6001)

```
1. Conectar MetaMask con OTRA cuenta diferente (ej: Account 2)
2. Ingresar monto a comprar (ej: 200 EURT)
3. Hacer clic en "Proceed to Payment"
4. Usar tarjeta de prueba Stripe: 4242 4242 4242 4242
5. Esperar confirmación
6. Modal muestra:
   ✓ Compra exitosa
   ✓ Billetera receptora: 0x7099... (tu cuenta)
   ✓ Hash de transacción
```

### 3. Comprar Productos como Cliente (Puerto 6004)

```
1. Navegar el catálogo (no requiere wallet)
2. Conectar MetaMask con la misma cuenta que tiene EURT (Account 2)
3. Agregar productos al carrito
4. Hacer checkout
5. Se crea invoice automáticamente
6. Redirige a Pasarela (Puerto 6002)
7. Pagar → tus EURT se transfieren a la wallet de la empresa
8. Volver a /orders → ver factura pagada
```

### 4. Verificar Recibos (Puerto 6003 - Como Empresa)

```
1. Conectar con la cuenta de empresa (Account 1)
2. Ver sección "Órdenes Recibidas"
3. Ver facturas pagadas con EURT
4. Ver el balance de EURT en tu wallet de empresa
```

## Persistencia del Estado

### Archivo de Estado

El script guarda el estado de Anvil en:
```
01-eth-commerce/.anvil_state.json
```

### Cómo Funciona

```
Al reiniciar (./restart-all.sh):
1. Si había un estado guardado → se restaura automáticamente
2. Si el estado es inválido → se despliegan nuevos contratos
3. Los tokens y contratos persisten entre reinicios
```

### Primera Ejecución vs Reinicios

| Situación | Acción |
|-----------|--------|
| Primera vez | Despliega contratos, mint 1,000,000 EURT a servidor |
| Con estado previo | Restaura estado existente |
| Estado corrupto | Despliega nuevos contratos |

## Direcciones de Contratos

Las direcciones se muestran al ejecutar `./restart-all.sh`:

```
Contract Addresses:
  - EuroToken: 0x...
  - Ecommerce:  0x...
```

O se pueden verificar en:
```bash
grep EUROTOKEN stablecoin/compra-stablecoin/.env.local
grep COMMERCE web-customer/.env.local
```

## Variables de Entorno

Cada app requiere un archivo `.env.local`. El script `restart-all.sh` los genera automáticamente:

```bash
# compra-stablecoin/.env.local
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
WALLET_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
ETHEREUM_RPC_URL=http://localhost:8545

# pasarela-de-pago/.env.local
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0x...

# web-admin/.env.local
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0x...

# web-customer/.env.local
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0x...
```

## Comandos Útiles

```bash
# Verificar contratos desplegados
curl -X POST http://localhost:8545 -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["<ADDRESS>","latest"],"id":1}'

# Verificar balance de EURT
cast call <EUROTOKEN_ADDRESS> "balanceOf(address)(uint256)" <WALLET_ADDRESS> \
  --rpc-url http://localhost:8545

# Verificar estado de invoice
cast call <ECOMMERCE_ADDRESS> "getInvoice(uint256)(uint256,uint256,uint256,bool,bytes32)" <INVOICE_ID> \
  --rpc-url http://localhost:8545

# Ejecutar tests de smart contracts
cd stablecoin/sc && forge test -vvv
cd sc-ecommerce && forge test -vvv

# Desplegar contratos manualmente
cd stablecoin/sc && PRIVATE_KEY=0x... forge script script/DeployEuroToken.s.sol:DeployEuroToken --broadcast --rpc-url http://localhost:8545

cd sc-ecommerce && PRIVATE_KEY=0x... EUROTOKEN_ADDRESS=0x... forge script script/DeployEcommerce.s.sol:DeployEcommerce --broadcast --rpc-url http://localhost:8545

# Exportar estado manualmente
curl -X POST http://localhost:8545 -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"anvil_dumpState","params":[],"id":1}' > estado.json

# Importar estado manualmente
curl -X POST http://localhost:8545 -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"anvil_loadState","params":["'"$(cat estado.json)"'"],"id":1}'
```

## Solución de Problemas

### BAD_DATA error al llamar balanceOf
- Verificar que `NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS` sea la dirección correcta
- Verificar que el contrato esté desplegado en la red correcta

### Insufficient balance
- El servidor necesita tener EURT para transferir
- Verificar que la wallet del servidor tiene tokens
- Si no tiene: desplegar de nuevo con `forge script DeployEuroToken.s.sol`

### Metamask no conecta
- Agregar red personalizada con Chain ID 31337
- Importar cuenta con Private Key de Anvil

### Modal de confirmación no aparece después de compra
- Verificar que el servidor tiene EURT para transferir
- Revisar consola del navegador (F12) para errores
- Verificar que el contrato EURT está desplegado correctamente

### Estado no persiste entre reinicios
- Verificar que el archivo `.anvil_state.json` existe
- Si está corrupto, eliminarlo: `rm .anvil_state.json`

### Transacción revertida en compra de e-commerce
- Verificar que el cliente tiene suficientes EURT
- Verificar que la empresa está activa
- Verificar que hay stock disponible
