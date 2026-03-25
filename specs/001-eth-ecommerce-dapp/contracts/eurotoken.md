# Contract: EuroToken (ERC20 Stablecoin)

**Location**: `stablecoin/sc/src/EuroToken.sol`

## Interface

### Inherited (OpenZeppelin ERC20)

```
function name() → string "EuroToken"
function symbol() → string "EURT"
function decimals() → uint8 6
function totalSupply() → uint256
function balanceOf(address account) → uint256
function transfer(address to, uint256 amount) → bool
function allowance(address owner, address spender) → uint256
function approve(address spender, uint256 amount) → bool
function transferFrom(address from, address to, uint256 amount) → bool
```

### Custom

```
function owner() → address
    Returns the contract owner (authorized to mint).

function mint(address to, uint256 amount) → void
    Mints `amount` tokens to `to` address.
    Access: onlyOwner
    Validations:
      - `to` != address(0)
      - `amount` > 0
    Events: Transfer(address(0), to, amount)
```

## Events

```
event Transfer(address indexed from, address indexed to, uint256 value)
event Approval(address indexed owner, address indexed spender, uint256 value)
```

## Deploy Script

**Location**: `stablecoin/sc/script/DeployEuroToken.s.sol`

- Deploy EuroToken contract
- Mint inicial: 1,000,000 EURT (1_000_000_000_000 unidades base) al deployer
- Output: dirección del contrato desplegado
