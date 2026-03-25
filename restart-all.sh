#!/bin/bash

set -e

echo "=========================================="
echo "ETH E-commerce DApp - Restart All"
echo "=========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"
STATE_FILE="$ROOT_DIR/.anvil_state.json"

PORTS=(6001 6002 6003 6004 8545)
PORT_NAMES=("compra-stablecoin" "pasarela-de-pago" "web-admin" "web-customer" "anvil")

export_state() {
    echo "  Exporting Anvil state..."
    STATE=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"anvil_dumpState","params":[],"id":1}')
    
    if echo "$STATE" | grep -q '"result"'; then
        echo "$STATE" > "$STATE_FILE"
        echo "  State saved to $STATE_FILE"
    else
        echo "  Warning: Could not export state"
    fi
}

import_state() {
    if [ -f "$STATE_FILE" ]; then
        echo "  Loading saved state..."
        STATE=$(cat "$STATE_FILE")
        RESULT=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" \
            -d "{\"jsonrpc\":\"2.0\",\"method\":\"anvil_loadState\",\"params\":[$STATE],\"id\":1}")
        
        if echo "$RESULT" | grep -q '"result":true'; then
            echo "  State loaded successfully!"
            return 0
        else
            echo "  Warning: Could not load state, will deploy new contracts"
            return 1
        fi
    fi
    return 1
}

echo ""
echo "[1/7] Stopping previous processes..."

ANVIL_WAS_RUNNING=false
ANVIL_PID=$(lsof -ti:8545 2>/dev/null || true)
if [ -n "$ANVIL_PID" ]; then
    ANVIL_WAS_RUNNING=true
    if [ -f "$STATE_FILE" ]; then
        export_state
    fi
fi

for i in "${!PORTS[@]}"; do
    PORT="${PORTS[$i]}"
    PID=$(lsof -ti:$PORT 2>/dev/null || true)
    if [ -n "$PID" ]; then
        echo "  Killing ${PORT_NAMES[$i]} (PID: $PID)"
        kill $PID 2>/dev/null || true
        sleep 1
    else
        echo "  ${PORT_NAMES[$i]} not running on port $PORT"
    fi
done

sleep 2

echo ""
echo "[2/7] Starting Anvil..."
cd "$ROOT_DIR/stablecoin/sc"
anvil --host 0.0.0.0 --port 8545 --chain-id 31337 --mnemonic "test test test test test test test test test test test junk" &
ANVIL_PID=$!
echo "  Anvil started (PID: $ANVIL_PID)"
sleep 3

STATE_LOADED=false
if import_state 2>/dev/null; then
    STATE_LOADED=true
fi

echo ""
echo "[3/7] Checking/Deploying contracts..."

SAVED_EUROTOKEN=$(grep "^NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=" "$ROOT_DIR/stablecoin/compra-stablecoin/.env.local" 2>/dev/null | cut -d '=' -f2-)
EUROTOKEN_ADDRESS=""

if [ -n "$SAVED_EUROTOKEN" ]; then
    CODE_CHECK=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"$SAVED_EUROTOKEN\",\"latest\"],\"id\":1}")
    if echo "$CODE_CHECK" | grep -q '"result":"0x0*"' || echo "$CODE_CHECK" | grep -q '"result":"0x"'; then
        echo "  EuroToken contract not found at: $SAVED_EUROTOKEN"
    else
        echo "  Found existing EuroToken at: $SAVED_EUROTOKEN"
        EUROTOKEN_ADDRESS="$SAVED_EUROTOKEN"
    fi
fi

if [ -z "$EUROTOKEN_ADDRESS" ]; then
    echo "  Deploying EuroToken..."
    cd "$ROOT_DIR/stablecoin/sc"
    PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
    forge script script/DeployEuroToken.s.sol:DeployEuroToken --broadcast --rpc-url http://localhost:8545 > /tmp/deploy_euro.log 2>&1 || true
    
    EUROTOKEN_ADDRESS=$(grep "EuroToken deployed at:" /tmp/deploy_euro.log 2>/dev/null | awk '{print $NF}')
    
    if [ -z "$EUROTOKEN_ADDRESS" ]; then
        echo "  ERROR: Could not extract EuroToken address from deployment log"
        echo "  Log contents:"
        cat /tmp/deploy_euro.log
        exit 1
    fi
    echo "  EuroToken deployed at: $EUROTOKEN_ADDRESS"
fi

cd "$ROOT_DIR/sc-ecommerce"

SAVED_COMMERCE=$(grep "^NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=" "$ROOT_DIR/web-customer/.env.local" 2>/dev/null | cut -d '=' -f2-)
COMMERCE_ADDRESS=""

if [ -n "$SAVED_COMMERCE" ]; then
    CODE_CHECK=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"$SAVED_COMMERCE\",\"latest\"],\"id\":1}")
    if echo "$CODE_CHECK" | grep -q '"result":"0x0*"' || echo "$CODE_CHECK" | grep -q '"result":"0x"'; then
        echo "  Ecommerce contract not found at: $SAVED_COMMERCE"
    else
        echo "  Found existing Ecommerce at: $SAVED_COMMERCE"
        COMMERCE_ADDRESS="$SAVED_COMMERCE"
    fi
fi

if [ -z "$COMMERCE_ADDRESS" ]; then
    echo "  Deploying Ecommerce..."
    cd "$ROOT_DIR/sc-ecommerce"
    EURO_TOKEN_ADDRESS=$EUROTOKEN_ADDRESS PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
    forge script script/DeployEcommerce.s.sol:DeployEcommerce --broadcast --rpc-url http://localhost:8545 > /tmp/deploy_commerce.log 2>&1 || true
    
    COMMERCE_ADDRESS=$(grep "Ecommerce deployed at:" /tmp/deploy_commerce.log 2>/dev/null | awk '{print $NF}')
    
    if [ -z "$COMMERCE_ADDRESS" ]; then
        echo "  ERROR: Could not extract Ecommerce address from deployment log"
        echo "  Log contents:"
        cat /tmp/deploy_commerce.log
        exit 1
    fi
    echo "  Ecommerce deployed at: $COMMERCE_ADDRESS"
fi

sleep 2

echo ""
echo "[4/7] Generating .env.local files..."

COMPRA_ENV="$ROOT_DIR/stablecoin/compra-stablecoin/.env.local"
if [ -f "$COMPRA_ENV" ]; then
    STRIPE_SECRET_KEY=$(grep "^STRIPE_SECRET_KEY=" "$COMPRA_ENV" 2>/dev/null | cut -d '=' -f2-)
    STRIPE_PUBLISHABLE_KEY=$(grep "^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=" "$COMPRA_ENV" 2>/dev/null | cut -d '=' -f2-)
    WALLET_PRIVATE_KEY=$(grep "^WALLET_PRIVATE_KEY=" "$COMPRA_ENV" 2>/dev/null | cut -d '=' -f2-)
    ETHEREUM_RPC_URL=$(grep "^ETHEREUM_RPC_URL=" "$COMPRA_ENV" 2>/dev/null | cut -d '=' -f2-)
fi

STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY:-sk_test_placeholder}
STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY:-pk_test_placeholder}
WALLET_PRIVATE_KEY=${WALLET_PRIVATE_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}
ETHEREUM_RPC_URL=${ETHEREUM_RPC_URL:-http://localhost:8545}

cat > "$COMPRA_ENV" << EOF
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
WALLET_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
ETHEREUM_RPC_URL=$ETHEREUM_RPC_URL
EOF
echo "  stablecoin/compra-stablecoin/.env.local updated"

cat > "$ROOT_DIR/stablecoin/pasarela-de-pago/.env.local" << EOF
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$COMMERCE_ADDRESS
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS
EOF
echo "  stablecoin/pasarela-de-pago/.env.local updated"

cat > "$ROOT_DIR/web-admin/.env.local" << EOF
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$COMMERCE_ADDRESS
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS
EOF
echo "  web-admin/.env.local updated"

cat > "$ROOT_DIR/web-customer/.env.local" << EOF
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$COMMERCE_ADDRESS
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS
EOF
echo "  web-customer/.env.local updated"

echo ""
echo "[5/7] Starting Next.js applications..."

cd "$ROOT_DIR/stablecoin/compra-stablecoin"
PORT=6001 npm run dev > /dev/null 2>&1 &
echo "  compra-stablecoin started (port 6001)"

cd "$ROOT_DIR/stablecoin/pasarela-de-pago"
PORT=6002 npm run dev > /dev/null 2>&1 &
echo "  pasarela-de-pago started (port 6002)"

cd "$ROOT_DIR/web-admin"
PORT=6003 npm run dev > /dev/null 2>&1 &
echo "  web-admin started (port 6003)"

cd "$ROOT_DIR/web-customer"
PORT=6004 npm run dev > /dev/null 2>&1 &
echo "  web-customer started (port 6004)"

sleep 8

echo ""
echo "[6/7] Health checks..."

check_service() {
    local name=$1
    local url=$2
    if [ "$name" = "Anvil" ]; then
        if curl -s -f -X POST "$url" -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null 2>&1; then
            echo "  ✓ $name - UP"
            return 0
        else
            echo "  ✗ $name - DOWN"
            return 1
        fi
    else
        if curl -s -f -o /dev/null "$url" 2>/dev/null; then
            echo "  ✓ $name - UP"
            return 0
        else
            echo "  ✗ $name - DOWN"
            return 1
        fi
    fi
}

check_service "Anvil" "http://localhost:8545"
check_service "Compra Stablecoin" "http://localhost:6001"
check_service "Pasarela de Pago" "http://localhost:6002"
check_service "Web Admin" "http://localhost:6003"
check_service "Web Customer" "http://localhost:6004"

echo ""
echo "[7/7] Saving state for next restart..."
export_state

echo ""
echo "=========================================="
echo "Environment started successfully!"
echo "=========================================="
echo ""
echo "Services:"
echo "  - Anvil:        http://localhost:8545"
echo "  - Compra Stablecoin:  http://localhost:6001"
echo "  - Pasarela de Pago:   http://localhost:6002"
echo "  - Web Admin:    http://localhost:6003"
echo "  - Web Customer: http://localhost:6004"
echo ""
echo "Contract Addresses:"
echo "  - EuroToken: $EUROTOKEN_ADDRESS"
echo "  - Ecommerce:  $COMMERCE_ADDRESS"
echo ""
echo "State file: $STATE_FILE"
echo ""
echo "To stop all services, run: pkill -f 'anvil\|next dev'"
echo ""
