import { Contract, BrowserProvider } from 'ethers';

const EURO_TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function mint(address to, uint256 amount) external',
];

const ECOMMERCE_ABI = [
  // Company
  'function registerCompany(string name, string taxId) returns (uint256)',
  'function getCompany(uint256 companyId) view returns (tuple(uint256 companyId, string name, address companyAddress, string taxId, bool isActive))',
  'function toggleCompany(uint256 companyId) external',
  'function getCompanyByOwner(address owner) view returns (uint256)',
  // Product
  'function addProduct(uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash) returns (uint256)',
  'function updateProduct(uint256 productId, uint256 price, uint256 stock) external',
  'function toggleProduct(uint256 productId) external',
  'function getProduct(uint256 productId) view returns (tuple(uint256 productId, uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash, bool isActive))',
  'function getAllProducts() view returns (tuple(uint256 productId, uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash, bool isActive)[])',
  'function getProductsByCompany(uint256 companyId) view returns (tuple(uint256 productId, uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash, bool isActive)[])',
  // Cart
  'function addToCart(uint256 productId, uint256 quantity) external',
  'function removeFromCart(uint256 productId) external',
  'function getCart(address customer) view returns (tuple(uint256 productId, uint256 quantity)[])',
  'function clearCart() external',
  'function getCartTotal(address customer) view returns (uint256)',
  // Invoice
  'function createInvoice(uint256 companyId) returns (uint256)',
  'function getInvoice(uint256 invoiceId) view returns (tuple(uint256 invoiceId, uint256 companyId, address customerAddress, uint256 totalAmount, uint256 timestamp, bool isPaid, bytes32 paymentTxHash))',
  'function getInvoicesByCustomer(address customer) view returns (tuple(uint256 invoiceId, uint256 companyId, address customerAddress, uint256 totalAmount, uint256 timestamp, bool isPaid, bytes32 paymentTxHash)[])',
  'function getInvoicesByCompany(uint256 companyId) view returns (tuple(uint256 invoiceId, uint256 companyId, address customerAddress, uint256 totalAmount, uint256 timestamp, bool isPaid, bytes32 paymentTxHash)[])',
  // Payment
  'function processPayment(uint256 invoiceId) returns (uint256)',
  // Customer
  'function isCustomerRegistered(address customer) view returns (bool)',
];

export function getEuroTokenContract(address: string, provider: BrowserProvider): Contract {
  return new Contract(address, EURO_TOKEN_ABI, provider);
}

export function getEcommerceContract(address: string, provider: BrowserProvider): Contract {
  return new Contract(address, ECOMMERCE_ABI, provider);
}

export function getEuroTokenContractWithSigner(
  address: string,
  provider: BrowserProvider,
  signer: any
): Contract {
  return new Contract(address, EURO_TOKEN_ABI, signer);
}

export function getEcommerceContractWithSigner(
  address: string,
  provider: BrowserProvider,
  signer: any
): Contract {
  return new Contract(address, ECOMMERCE_ABI, signer);
}
