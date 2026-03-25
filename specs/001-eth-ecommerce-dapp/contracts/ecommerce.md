# Contract: Ecommerce

**Location**: `sc-ecommerce/src/Ecommerce.sol`

## Interface

### Company Management (CompanyLib)

```
function registerCompany(string name, string taxId) → uint256 companyId
    Registers a new company linked to msg.sender wallet.
    Validations:
      - msg.sender has no existing company
      - name and taxId are non-empty
      - msg.sender != address(0)
    Events: CompanyRegistered(companyId, msg.sender, name)

function getCompany(uint256 companyId) → Company
    Returns company data. Reverts if not found.

function toggleCompany(uint256 companyId) → void
    Toggles isActive status.
    Access: only company owner (companyAddress == msg.sender)
    Events: CompanyToggled(companyId, isActive)
```

### Product Management (ProductLib)

```
function addProduct(
    uint256 companyId,
    string name,
    string description,
    uint256 price,
    uint256 stock,
    string ipfsImageHash
) → uint256 productId
    Access: only company owner
    Validations: price > 0, company exists and is active
    Events: ProductAdded(productId, companyId, name, price)

function updateProduct(uint256 productId, uint256 price, uint256 stock) → void
    Access: only owner of product's company
    Events: ProductUpdated(productId, price, stock)

function toggleProduct(uint256 productId) → void
    Access: only owner of product's company
    Events: ProductToggled(productId, isActive)

function getProduct(uint256 productId) → Product
function getAllProducts() → Product[]
function getProductsByCompany(uint256 companyId) → Product[]
```

### Cart Management (CartLib)

```
function addToCart(uint256 productId, uint256 quantity) → void
    Adds product to msg.sender's cart.
    Validations: product exists, is active, quantity > 0
    Events: CartUpdated(msg.sender, productId, quantity)

function removeFromCart(uint256 productId) → void
    Removes product from msg.sender's cart.

function getCart(address customer) → CartItem[]
    Returns cart contents for a customer.

function clearCart(address customer) → void
    Internal function to empty cart after invoice creation.
```

### Invoice Management (InvoiceLib)

```
function createInvoice(uint256 companyId) → uint256 invoiceId
    Creates invoice from msg.sender's cart for given company.
    Validations:
      - Cart has items for this company
      - All products have sufficient stock
      - Stock is NOT decremented here (only verified)
    Events: InvoiceCreated(invoiceId, companyId, msg.sender, totalAmount)

function getInvoice(uint256 invoiceId) → Invoice
function getInvoicesByCustomer(address customer) → Invoice[]
function getInvoicesByCompany(uint256 companyId) → Invoice[]
```

### Payment Processing (PaymentLib)

```
function processPayment(uint256 invoiceId) → void
    Processes payment for an invoice using EuroToken transfer.
    Validations:
      - Invoice exists
      - Invoice is not already paid (isPaid == false)
      - msg.sender == invoice.customerAddress
      - msg.sender has approved sufficient EuroToken allowance
      - EuroToken balance of msg.sender >= totalAmount
    Actions:
      - transferFrom(customer, companyAddress, totalAmount)
      - Decrement stock for each product in invoice
      - Set isPaid = true
      - Record paymentTxHash
      - Clear customer's cart
    Events: PaymentProcessed(invoiceId, msg.sender, totalAmount)
    Security: ReentrancyGuard
```

## Events Summary

```
event CompanyRegistered(uint256 indexed companyId, address indexed owner, string name)
event CompanyToggled(uint256 indexed companyId, bool isActive)
event ProductAdded(uint256 indexed productId, uint256 indexed companyId, string name, uint256 price)
event ProductUpdated(uint256 indexed productId, uint256 price, uint256 stock)
event ProductToggled(uint256 indexed productId, bool isActive)
event CartUpdated(address indexed customer, uint256 indexed productId, uint256 quantity)
event InvoiceCreated(uint256 indexed invoiceId, uint256 indexed companyId, address indexed customer, uint256 totalAmount)
event PaymentProcessed(uint256 indexed invoiceId, address indexed customer, uint256 totalAmount)
```

## Constructor

```
constructor(address euroTokenAddress)
    Sets the EuroToken contract address for payment processing.
```
