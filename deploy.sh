#!/bin/bash

set -e

echo "🚀 DeCo MVP Deployment Script"
echo "=============================="
echo ""

# Check if soroban CLI is installed
if ! command -v soroban &> /dev/null; then
    echo "❌ Soroban CLI not found. Please install it first:"
    echo "   cargo install --locked soroban-cli"
    exit 1
fi

# Build contract
echo "📦 Building contract..."
cd contract
soroban contract build
cd ..

# Check if admin identity exists
if ! soroban keys show admin &> /dev/null; then
    echo "🔑 Generating admin identity..."
    soroban keys generate admin --network testnet
fi

ADMIN_ADDRESS=$(soroban keys address admin)
echo "👤 Admin address: $ADMIN_ADDRESS"
echo ""

# Deploy contract
echo "🌐 Deploying contract to Testnet..."
CONTRACT_ID=$(soroban contract deploy \
  --wasm contract/target/wasm32-unknown-unknown/release/deco_mvp.wasm \
  --source admin \
  --network testnet)

echo "✅ Contract deployed!"
echo "📝 Contract ID: $CONTRACT_ID"
echo ""

# Initialize contract
echo "⚙️  Initializing contract..."
soroban contract invoke \
  --id $CONTRACT_ID \
  --source admin \
  --network testnet \
  -- \
  init \
  --admin $ADMIN_ADDRESS \
  --fee 100000000

echo "✅ Contract initialized!"
echo ""

# Update frontend config
echo "🔧 Updating frontend configuration..."
CONFIG_FILE="frontend/src/config.ts"
if [ -f "$CONFIG_FILE" ]; then
    sed -i.bak "s/YOUR_DEPLOYED_CONTRACT_ID_HERE/$CONTRACT_ID/" "$CONFIG_FILE"
    rm "${CONFIG_FILE}.bak"
    echo "✅ Frontend config updated!"
else
    echo "⚠️  Frontend config file not found. Please update manually."
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. cd frontend"
echo "2. npm install"
echo "3. npm run dev"
echo ""
echo "Contract ID: $CONTRACT_ID"
echo "Admin Address: $ADMIN_ADDRESS"
