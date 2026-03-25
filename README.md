# E-commerce Blockchain Platform

Plataforma de e-commerce descentralizada construida con blockchain Ethereum que permite a empresas registrar productos, gestionar inventarios y procesar pagos con tokens ERC-20 (EURT).

## Arquitectura del Proyecto

### Contratos Inteligentes (Smart Contracts)
- **sc-ecommerce/** - Contrato principal de e-commerce
  - Gestión de empresas (registro, activación)
  - Gestión de productos (CRUD, stock)
  - Carrito de compras
  - Generación de facturas
  - Procesamiento de pagos

- **stablecoin/**
  - **sc/** - Contrato EuroToken (ERC-20)
  - **compra-stablecoin/** - DApp para comprar EURT con ETH
  - **pasarela-de-pago/** - Pasarela de pago para procesar compras

### Aplicaciones Frontend
- **web-admin/** - Panel de administración para empresas
  - Registro de empresas
  - Gestión de productos
  - Ver invoices
  - Mint de tokens (solo admin)

- **web-customer/** - Tienda online para clientes
  - Catálogo de productos
  - Carrito de compras
  - Checkout y pago
  - Historial de pedidos

## Tecnologías

- **Blockchain**: Solidity, Forge
- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Web3**: Ethers.js v6
- **Red de prueba**: Anvil (Hardhat local)

## Requisitos

- Node.js 18+
- Foundry (Forge)
- MetaMask

## Instalación

```bash
# Instalar dependencias de los proyectos Next.js
cd web-admin && npm install
cd ../web-customer && npm install
cd ../stablecoin/compra-stablecoin && npm install
cd ../pasarela-de-pago && npm install

# Compilar contratos
cd ../../sc-ecommerce
forge build

# Compilar contrato EuroToken
cd ../stablecoin/sc
forge build
```

## Configuración

1. Copiar `.env.local.example` a `.env.local` en cada proyecto
2. Configurar las direcciones de los contratos
3. Ejecutar Anvil: `anvil`
4. Desplegar contratos
5. Actualizar archivos `.env.local` con las direcciones

## Ejecución

```bash
# Iniciar Anvil (red local)
anvil

# Web Admin (puerto 6003)
cd web-admin && npm run dev

# Web Customer (puerto 6004)
cd web-customer && npm run dev

# Compra Stablecoin (puerto 6001)
cd stablecoin/compra-stablecoin && npm run dev

# Pasarela de Pago (puerto 6002)
cd stablecoin/pasarela-de-pago && npm run dev
```

## Flujo de Uso

### Para Empresas
1. Conectar wallet en web-admin
2. Registrar empresa (nombre, tax ID)
3. Añadir productos con precio y stock
4. Gestionar pedidos y facturas

### Para Clientes
1. Comprar EURT en compra-stablecoin
2. Navegar productos en web-customer
3. Agregar al carrito y checkout
4. Aprobar tokens y pagar

## Estructura de Direcciones

- EuroToken: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- Ecommerce: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
- Red: Anvil (chainId: 31337, localhost:8545)

## Licencia

MIT
