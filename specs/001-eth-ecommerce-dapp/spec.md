# Feature Specification: ETH E-commerce DAPP

**Feature Branch**: `001-eth-ecommerce-dapp`
**Created**: 2026-03-06
**Status**: Draft
**Input**: User description: "Aplicación tipo ecommerce para la compra de tokens ERC20 en una DAPP con 4 aplicaciones web y 2 smart contracts, divididas en Bloque A (Stable Coin) y Bloque B (Ecommerce), más un script de integración completa."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compra de EuroTokens con tarjeta de crédito (Priority: P1)

Un usuario quiere adquirir EuroTokens (stablecoin ERC20 1:1 con EUR) usando su tarjeta de crédito. Conecta su wallet, indica la cantidad de tokens deseada, paga con tarjeta a través de un procesador de pagos fiat, y recibe los tokens acuñados directamente en su wallet.

**Why this priority**: Sin tokens en circulación, no hay compras posibles en el ecommerce. Esta es la puerta de entrada de liquidez al ecosistema.

**Independent Test**: Se puede probar conectando una wallet, realizando un pago de prueba con tarjeta, y verificando que el balance de EuroTokens del usuario aumenta en la cantidad correspondiente.

**Acceptance Scenarios**:

1. **Given** un usuario con wallet conectada y tarjeta válida, **When** solicita comprar 100 EURT y completa el pago, **Then** recibe 100 EURT en su wallet y ve confirmación en pantalla.
2. **Given** un usuario con wallet conectada, **When** el pago con tarjeta es rechazado, **Then** no se acuñan tokens y el usuario ve un mensaje de error claro.
3. **Given** un usuario sin wallet conectada, **When** intenta comprar tokens, **Then** el sistema le solicita conectar su wallet antes de continuar.

---

### User Story 2 - Gestión de empresa y productos por administrador (Priority: P2)

Un comerciante registra su empresa en la plataforma, agrega productos con nombre, descripción, precio en euros, stock e imagen. Puede editar, activar/desactivar productos y ver el inventario actual desde un panel de administración.

**Why this priority**: Sin empresas ni productos registrados, los clientes no tienen nada que comprar. Es prerequisito del flujo de compra.

**Independent Test**: Se puede probar registrando una empresa, agregando un producto, editándolo y verificando que aparece en el catálogo con los datos correctos.

**Acceptance Scenarios**:

1. **Given** un administrador con wallet conectada, **When** registra una empresa con nombre y NIF, **Then** la empresa queda registrada en blockchain y aparece en el panel.
2. **Given** una empresa registrada, **When** el administrador agrega un producto con precio 25.50 EUR y stock 100, **Then** el producto aparece en el catálogo con datos correctos.
3. **Given** un producto existente, **When** el administrador lo desactiva, **Then** el producto deja de aparecer en la tienda para clientes.
4. **Given** un usuario que NO es owner de la empresa, **When** intenta modificar un producto, **Then** la operación es rechazada.

---

### User Story 3 - Compra de productos con EuroTokens (Priority: P3)

Un cliente navega el catálogo de productos, agrega artículos al carrito, procede al checkout donde se genera una factura en blockchain, es redirigido a la pasarela de pagos donde autoriza la transferencia de tokens, y al regresar ve la factura marcada como pagada.

**Why this priority**: Es el flujo core del ecommerce, pero depende de que existan tokens (US1) y productos (US2).

**Independent Test**: Se puede probar con un usuario que tenga EuroTokens, agregando productos al carrito, haciendo checkout, pagando en la pasarela y verificando que la factura cambia a estado "Paid".

**Acceptance Scenarios**:

1. **Given** un cliente con wallet conectada, **When** navega el catálogo, **Then** ve los productos disponibles con precio, stock e imagen sin necesidad de tener wallet conectada para ver.
2. **Given** un cliente con productos en el carrito, **When** hace checkout, **Then** se crea una factura en blockchain con el monto total correcto.
3. **Given** una factura creada, **When** el cliente es redirigido a la pasarela y autoriza el pago con EuroTokens, **Then** los tokens se transfieren al comerciante y la factura se marca como pagada.
4. **Given** un cliente con una factura pagada, **When** vuelve a la tienda, **Then** ve la factura en su historial con estado "Paid".
5. **Given** un cliente sin suficientes EuroTokens, **When** intenta pagar, **Then** la transacción falla y se muestra un mensaje indicando fondos insuficientes.

---

### User Story 4 - Consulta de facturas e historial (Priority: P4)

Tanto el administrador (desde el panel admin) como el cliente (desde la tienda) pueden consultar el historial de facturas. El admin ve todas las facturas de su empresa, filtra por estado (pagada/pendiente) y ve detalles de transacción. El cliente ve sus propias facturas con estado de pago.

**Why this priority**: Es funcionalidad de consulta que complementa el flujo principal pero no lo bloquea.

**Independent Test**: Se puede probar con facturas existentes verificando que aparecen correctamente filtradas por estado y usuario.

**Acceptance Scenarios**:

1. **Given** un administrador con facturas en su empresa, **When** accede al panel de facturas, **Then** ve la lista completa con opción de filtrar por pagadas y pendientes.
2. **Given** un cliente con compras realizadas, **When** accede a "Mis Facturas", **Then** ve sus facturas con indicador visual de estado (Paid/Pending).

---

### User Story 5 - Despliegue y reinicio completo del entorno (Priority: P5)

Un desarrollador ejecuta un único script que detiene todas las aplicaciones, inicia la blockchain local, despliega ambos smart contracts, actualiza las variables de entorno con las nuevas direcciones de contratos, e inicia las 6 aplicaciones en sus puertos asignados.

**Why this priority**: Infraestructura de desarrollo que facilita la iteración pero no es funcionalidad de usuario final.

**Independent Test**: Se puede probar ejecutando el script y verificando que las 6 aplicaciones responden en sus puertos y que las direcciones de contrato son correctas.

**Acceptance Scenarios**:

1. **Given** un entorno limpio, **When** se ejecuta el script de despliegue, **Then** las 6 aplicaciones están corriendo y accesibles en sus puertos respectivos.
2. **Given** un entorno con aplicaciones ya corriendo, **When** se ejecuta el script, **Then** las aplicaciones anteriores se detienen, se redesplega todo y las nuevas direcciones de contrato se propagan automáticamente.

---

### Edge Cases

- ¿Qué sucede si la blockchain local (Anvil) se reinicia durante una compra en progreso?
- ¿Cómo se maneja un pago con tarjeta exitoso pero fallo en el mint de tokens (inconsistencia fiat/crypto)?
- ¿Qué pasa cuando un producto se queda sin stock mientras está en el carrito de otro usuario?
- ¿Cómo se comporta el sistema si el usuario cambia de red en MetaMask durante una transacción?
- ¿Qué ocurre si la pasarela de pagos recibe parámetros URL inválidos o manipulados?

## Clarifications

### Session 2026-03-06

- Q: ¿Cómo se maneja un pago con tarjeta exitoso pero fallo en el mint de tokens? → A: Registrar la deuda internamente y permitir al usuario reclamar los tokens pendientes desde la app.
- Q: ¿Existen límites mínimos/máximos para la compra de EuroTokens? → A: Mínimo 1 EURT, máximo 1,000 EURT por transacción, con límite diario de 5,000 EURT.
- Q: ¿Cómo se gestiona el stock cuando un producto se agota mientras está en el carrito de otro usuario? → A: Verificar stock al momento del checkout; si no hay stock suficiente, rechazar la operación y notificar al cliente.
- Q: ¿Qué sucede con las facturas que nunca se pagan? → A: Las facturas pendientes permanecen indefinidamente; el usuario puede volver a pagar en cualquier momento.
- Q: ¿Cómo se maneja si el usuario está en una red incorrecta en MetaMask? → A: Bloquear toda operación si la red no es la correcta (chainId 31337) y mostrar aviso para cambiar red.

## Requirements *(mandatory)*

### Functional Requirements

**Bloque A — Stable Coin**

- **FR-001**: El sistema MUST permitir crear un token ERC20 (EuroToken) con paridad 1:1 con EUR y 6 decimales.
- **FR-002**: Solo el owner del contrato MUST poder acuñar (mint) nuevos EuroTokens.
- **FR-003**: Los usuarios MUST poder comprar EuroTokens pagando con tarjeta de crédito a través de un procesador de pagos fiat. Monto mínimo: 1 EURT, máximo: 1,000 EURT por transacción, con límite diario de 5,000 EURT por usuario.
- **FR-004**: Tras un pago exitoso con tarjeta, el sistema MUST acuñar automáticamente los tokens correspondientes a la wallet del comprador. Si el mint falla, el sistema MUST registrar la deuda internamente y permitir al usuario reclamar los tokens pendientes desde la aplicación.
- **FR-005**: La pasarela de pagos MUST recibir parámetros (dirección del comerciante, monto, ID de factura, fecha, URL de retorno) y ejecutar la transferencia de tokens tras autorización del usuario.

**Bloque B — Ecommerce**

- **FR-006**: El sistema MUST permitir registrar empresas con nombre, dirección de wallet y NIF.
- **FR-007**: Los administradores de empresa MUST poder agregar, editar, activar/desactivar productos con nombre, descripción, precio, stock e imagen.
- **FR-008**: Los clientes MUST poder ver el catálogo de productos sin necesidad de conectar wallet.
- **FR-009**: Los clientes MUST poder agregar productos al carrito, modificar cantidades y ver el total.
- **FR-010**: El sistema MUST crear facturas en blockchain a partir del carrito del cliente al hacer checkout.
- **FR-011**: El sistema MUST procesar pagos verificando que la factura existe, no está pagada, y que el monto coincide antes de ejecutar la transferencia de tokens.
- **FR-012**: El sistema MUST verificar disponibilidad de stock al momento del checkout. Si el stock es insuficiente, MUST rechazar la operación y notificar al cliente. El stock se descuenta al confirmar la compra.

**Seguridad de Red**

- **FR-013**: Todas las aplicaciones web MUST bloquear operaciones de escritura en blockchain si la wallet del usuario no está conectada a la red correcta (chainId 31337 en desarrollo) y MUST mostrar un aviso claro indicando que debe cambiar de red.

**Integración**

- **FR-014**: El sistema MUST proporcionar un mecanismo de despliegue automatizado que inicie blockchain local, despliegue contratos y arranque todas las aplicaciones.
- **FR-015**: Las direcciones de contratos desplegados MUST propagarse automáticamente a todas las aplicaciones.

### Key Entities

- **EuroToken**: Token ERC20 representando euros digitales. Atributos clave: owner (dirección autorizada para mint), decimals (6), supply total.
- **Company**: Empresa registrada en la plataforma. Atributos: ID, nombre, dirección de wallet (receptora de pagos), NIF, estado activo/inactivo.
- **Product**: Artículo vendido por una empresa. Atributos: ID, empresa asociada, nombre, descripción, precio (en centavos de euro), stock, hash de imagen, estado activo/inactivo.
- **Cart**: Carrito de compras temporal por cliente. Contiene items con producto y cantidad.
- **Invoice**: Factura generada en blockchain. Atributos: ID, empresa, dirección del cliente, monto total, timestamp, estado de pago (Pending/Paid), hash de transacción de pago. Las facturas pendientes no expiran; el usuario puede completar el pago en cualquier momento.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Los usuarios pueden completar la compra de EuroTokens (desde selección de monto hasta recepción de tokens en wallet) en menos de 3 minutos.
- **SC-002**: Un administrador puede registrar una empresa y agregar su primer producto en menos de 5 minutos.
- **SC-003**: Un cliente puede completar el flujo completo de compra (navegar → carrito → checkout → pago → confirmación) en menos de 5 minutos.
- **SC-004**: El 100% de las facturas pagadas reflejan correctamente el estado "Paid" y el hash de transacción en menos de 30 segundos tras la confirmación del pago.
- **SC-005**: El script de despliegue pone en funcionamiento las 6 aplicaciones y los 2 contratos con una sola ejecución, sin intervención manual.
- **SC-006**: Las páginas de catálogo y panel de administración cargan en menos de 3 segundos.
- **SC-007**: El sistema impide el 100% de los intentos de operaciones no autorizadas (mint por no-owner, edición de productos de otra empresa, pagos duplicados).
