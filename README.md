# DeCo - Decentralized Combinator MVP

A streamlined MVP for a decentralized startup accelerator on Stellar Soroban (Testnet).

## 🚀 Live Demo
- **Frontend**: https://frontend-eight-navy-19.vercel.app
- **Contract**: `CBL6M6NXHSQJ6CJYIMV6FNEBNK3IRWLNQOFEM76FFGR6VGBRVXAPUA2V` (Stellar Testnet)
- **Native XLM Token**: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`

## 📱 Screenshots & CI/CD

### Mobile Responsive Design
The DeCo platform is fully responsive and works seamlessly on mobile devices:

![Mobile Responsive View](https://via.placeholder.com/300x600/1a1a2e/16213e?text=DeCo+Mobile+View)
*Mobile view showing the cyberpunk-themed interface with VC staking and voting features*

### CI/CD Pipeline
[![Build & Test](https://github.com/neelpote/deco-stellar-accelerator/actions/workflows/build-test.yml/badge.svg)](https://github.com/neelpote/deco-stellar-accelerator/actions/workflows/build-test.yml)

Our automated CI/CD pipeline ensures:
- ✅ Smart contract builds successfully
- ✅ Frontend TypeScript compilation
- ✅ Code quality checks
- ✅ Automated deployment to Vercel

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

- **DAO Voting**: 7-day public voting period for each application
- **VC Staking**: VCs stake 1000 XLM to become verified (fully decentralized)
- **Direct Investment**: VCs invest directly in approved startups
- **IPFS Storage**: Metadata stored on IPFS for 95% storage reduction
- **Native XLM**: Uses native XLM tokens for easy testing (no trustlines needed)
- **React Query**: All RPC calls wrapped to prevent rate-limiting
- **Freighter Integration**: Wallet connection and transaction signing
- **Cyberpunk UI**: Web3-themed interface with animations and neon effects

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

# Initialize with 10 XLM fee (100000000 stroops) and 1000 XLM VC stake (10000000000 stroops)
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source admin \
  --network testnet \
  -- \
  init \
  --admin $ADMIN_ADDRESS \
  --fee 100000000 \
  --vc_stake_required 10000000000
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
2. Fill out detailed application form (project name, description, URL, team info, funding goal)
3. Upload metadata to IPFS automatically
4. Submit application (pays 10 XLM fee)
5. Wait for 7-day public voting period
6. Admin approves based on votes
7. Claim XLM funds when VCs invest

### For Public Voters

1. Connect any Stellar wallet
2. Browse all submitted applications
3. Vote Yes/No during 7-day voting period
4. View real-time vote counts and progress

### For VCs (Venture Capitalists)

1. Connect Freighter wallet with 1000+ XLM
2. Click "💼 Become VC" and stake 1000 XLM
3. Browse approved startups
4. Invest directly in XLM (no admin approval needed)
5. Track your portfolio and investments

### For Admin

1. Connect with admin wallet
2. Review applications with vote results
3. Approve applications based on community votes
4. Minimal control - fully decentralized system

## Contract Functions

- `init(admin, fee, vc_stake_required)` - Initialize contract
- `apply(founder, ipfs_cid, funding_goal)` - Submit application with IPFS metadata
- `vote(voter, founder, vote_yes)` - Vote on applications during 7-day period
- `approve_application(admin, founder)` - Admin approves after reviewing votes
- `stake_to_become_vc(vc_address, company_name, xlm_token)` - Stake XLM to become VC
- `vc_invest(vc_address, founder, amount, xlm_token)` - VC invests in approved startup
- `claim_funds(founder, xlm_token)` - Claim invested XLM funds
- `get_all_startups()` - Get all submitted applications
- `get_startup_status(founder)` - Read startup data and voting results
- `get_vc_data(vc_address)` - Get VC information and stats
- `has_voted(voter, founder)` - Check if address has voted

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
