# DeCo - Decentralized Combinator MVP

A streamlined MVP for a decentralized startup accelerator on Stellar Soroban (Testnet).

## Project Structure

```
.
├── contract/          # Rust smart contract
│   ├── src/
│   │   └── lib.rs    # Main contract logic
│   └── Cargo.toml
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── README.md
```

## Features

- **Anti-Spam**: 10 XLM application fee
- **Milestone-Based Funding**: Admin unlocks funds progressively
- **Testnet USDC**: Uses native Testnet USDC for funding
- **React Query**: All RPC calls wrapped to prevent rate-limiting
- **Freighter Integration**: Wallet connection and transaction signing

## Prerequisites

1. **Rust & Soroban CLI**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup target add wasm32-unknown-unknown
   cargo install --locked soroban-cli
   ```

2. **Node.js** (v18+)
   ```bash
   # Install from https://nodejs.org/
   ```

3. **Freighter Wallet**
   - Install from: https://www.freighter.app/
   - Switch to Testnet in settings
   - Fund your account: https://laboratory.stellar.org/#account-creator?network=test

## Smart Contract Deployment

### 1. Build the Contract

```bash
cd contract
soroban contract build
```

### 2. Deploy to Testnet

```bash
# Configure Testnet identity (first time only)
soroban keys generate admin --network testnet

# Deploy contract
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/deco_mvp.wasm \
  --source admin \
  --network testnet
```

Save the returned contract ID (e.g., `CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)

### 3. Initialize the Contract

```bash
# Get your admin address
ADMIN_ADDRESS=$(soroban keys address admin)

# Initialize with 10 XLM fee (100000000 stroops)
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source admin \
  --network testnet \
  -- \
  init \
  --admin $ADMIN_ADDRESS \
  --fee 100000000
```

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Contract ID

Edit `frontend/src/config.ts` and replace `YOUR_DEPLOYED_CONTRACT_ID_HERE` with your deployed contract ID.

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## Usage

### For Founders

1. Connect Freighter wallet
2. Enter project URL (GitHub, pitch deck, etc.)
3. Click "Apply Now" (pays 10 XLM fee)
4. Wait for admin to allocate funding
5. Claim unlocked funds when milestones are approved

### For Admin

1. Connect with admin wallet
2. **Allocate Funding**: Set total USDC pool for a founder
3. **Unlock Milestone**: Release specific amounts for claiming

## Contract Functions

- `init(admin, fee)` - Initialize contract
- `apply(founder, project_link)` - Submit application with XLM fee
- `fund_startup(admin, founder, total_amount)` - Allocate total funding
- `unlock_milestone(admin, founder, amount)` - Unlock funds for claiming
- `claim_funds(founder, usdc_token)` - Claim unlocked funds
- `get_startup_status(founder)` - Read startup data
- `get_admin()` - Get admin address
- `get_fee()` - Get application fee

## Tech Stack

- **Smart Contract**: Rust, soroban-sdk 21.7.0
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Web3**: @stellar/stellar-sdk, @stellar/freighter-api
- **State Management**: @tanstack/react-query

## Security Notes

- Testnet only - DO NOT use on Mainnet without audit
- Admin functions require authorization
- Founder claim requires authorization
- Application fee prevents spam
- All RPC calls use React Query for rate-limit protection

## Troubleshooting

### Contract Build Fails
```bash
rustup update
cargo clean
cargo build --target wasm32-unknown-unknown --release
```

### Transaction Fails
- Ensure sufficient XLM balance for fees
- Check Freighter is on Testnet
- Verify contract ID in config.ts

### RPC Rate Limiting
- React Query handles this automatically
- Adjust refetch intervals in hooks if needed

## Next Steps

- Add application review/rejection flow
- Implement multi-signature admin
- Add milestone submission interface
- Create analytics dashboard
- Deploy to Mainnet (after audit)

## License

MIT
