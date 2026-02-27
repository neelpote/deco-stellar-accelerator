# DeCo MVP - Quick Start Guide

Get your DeCo MVP running in 5 minutes!

## Prerequisites Checklist

- [ ] Rust installed (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- [ ] Soroban CLI installed (`cargo install --locked soroban-cli`)
- [ ] Node.js v18+ installed
- [ ] Freighter wallet extension installed and configured for Testnet
- [ ] Testnet account funded (https://laboratory.stellar.org/#account-creator?network=test)

## One-Command Deployment

```bash
./deploy.sh
```

This script will:
1. Build the smart contract
2. Generate admin identity (if needed)
3. Deploy to Stellar Testnet
4. Initialize the contract
5. Update frontend configuration

## Manual Deployment (Alternative)

### Step 1: Build Contract
```bash
cd contract
soroban contract build
```

### Step 2: Deploy Contract
```bash
soroban keys generate admin --network testnet
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/deco_mvp.wasm \
  --source admin \
  --network testnet
```

### Step 3: Initialize Contract
```bash
ADMIN_ADDRESS=$(soroban keys address admin)
soroban contract invoke \
  --id <YOUR_CONTRACT_ID> \
  --source admin \
  --network testnet \
  -- \
  init \
  --admin $ADMIN_ADDRESS \
  --fee 100000000
```

### Step 4: Update Frontend Config
Edit `frontend/src/config.ts` and replace `YOUR_DEPLOYED_CONTRACT_ID_HERE` with your contract ID.

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Test the Flow

### As a Founder:
1. Connect Freighter wallet (non-admin account)
2. Enter a project URL: `https://github.com/myproject`
3. Click "Apply Now" - Freighter will prompt to sign (10 XLM fee)
4. Wait for confirmation

### As Admin:
1. Disconnect current wallet
2. Connect with admin wallet (the one used in deployment)
3. You'll see "Admin Dashboard"
4. **Allocate Funding:**
   - Enter founder's address
   - Enter total amount (e.g., 10000 USDC)
   - Click "Allocate Funding"
5. **Unlock Milestone:**
   - Enter founder's address
   - Enter amount to unlock (e.g., 2500 USDC)
   - Click "Unlock Milestone"

### Back to Founder:
1. Reconnect founder wallet
2. See updated status with unlocked funds
3. Click "Claim Funds"
4. Funds transferred to wallet!

## Common Issues

### "Contract already initialized"
The contract can only be initialized once. If you need to redeploy, deploy a new contract instance.

### "Transaction failed"
- Check you have enough XLM for transaction fees
- Ensure Freighter is on Testnet
- Verify contract ID is correct in config.ts

### "Admin not set"
Run the initialization command with your admin address.

### Frontend shows "Loading..." forever
- Check contract ID in `frontend/src/config.ts`
- Verify contract is deployed and initialized
- Check browser console for errors

## Key Addresses

After deployment, save these:
- **Contract ID**: Found in deploy.sh output
- **Admin Address**: Run `soroban keys address admin`

## Testing Checklist

- [ ] Founder can apply (10 XLM deducted)
- [ ] Admin can allocate total funding
- [ ] Admin can unlock milestone
- [ ] Founder can claim unlocked funds
- [ ] Status updates correctly after each action

## Next Steps

1. Test the complete flow with multiple founders
2. Try unlocking funds in multiple milestones
3. Verify USDC balances in Stellar Laboratory
4. Customize the UI styling
5. Add more features (rejection flow, analytics, etc.)

## Support

- Stellar Discord: https://discord.gg/stellar
- Soroban Docs: https://soroban.stellar.org/docs
- Freighter Docs: https://docs.freighter.app/

Happy building! 🚀
