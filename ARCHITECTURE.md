# DeCo MVP - Architecture Documentation

## System Overview

DeCo (Decentralized Combinator) is a milestone-based funding platform built on Stellar Soroban. It enables transparent, programmable startup funding with built-in anti-spam mechanics.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Founder View │  │  Admin View  │  │ Wallet Hook  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │  React Query    │                        │
│                   │  (RPC Manager)  │                        │
│                   └────────┬────────┘                        │
└────────────────────────────┼──────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │ Freighter API   │
                    │ (Wallet Bridge) │
                    └────────┬────────┘
                             │
┌────────────────────────────▼──────────────────────────────────┐
│                    Stellar Testnet                            │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Soroban RPC Server                      │    │
│  └────────────────────┬─────────────────────────────────┘    │
│                       │                                       │
│  ┌────────────────────▼─────────────────────────────────┐    │
│  │              DeCo Smart Contract                     │    │
│  │  ┌────────────────────────────────────────────────┐  │    │
│  │  │  State Storage                                 │  │    │
│  │  │  • Admin Address                               │  │    │
│  │  │  • Application Fee                             │  │    │
│  │  │  • Startup_Map: Address → StartupData         │  │    │
│  │  └────────────────────────────────────────────────┘  │    │
│  │  ┌────────────────────────────────────────────────┐  │    │
│  │  │  Functions                                     │  │    │
│  │  │  • init()                                      │  │    │
│  │  │  • apply()                                     │  │    │
│  │  │  • fund_startup()                              │  │    │
│  │  │  • unlock_milestone()                          │  │    │
│  │  │  • claim_funds()                               │  │    │
│  │  │  • get_startup_status()                        │  │    │
│  │  └────────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
```

## Smart Contract Architecture

### Data Structures

#### DataKey (Storage Keys)
```rust
enum DataKey {
    Admin,                  // Stores admin address
    ApplicationFee,         // Stores XLM fee amount
    Startup(Address),       // Maps founder address to StartupData
}
```

#### StartupData
```rust
struct StartupData {
    url_or_hash: String,      // Project URL or content hash
    total_allocated: i128,    // Total USDC allocated
    unlocked_balance: i128,   // USDC unlocked for claiming
    claimed_balance: i128,    // USDC already claimed
}
```

### Function Flow

#### 1. Initialization Flow
```
Admin → init(admin_addr, fee) → Contract Storage
                                    ↓
                            [Admin, ApplicationFee]
```

#### 2. Application Flow
```
Founder → apply(founder_addr, url) → Verify not applied
                                         ↓
                                    Transfer XLM fee
                                         ↓
                                    Create StartupData
                                         ↓
                                    Store in Startup_Map
```

#### 3. Funding Flow
```
Admin → fund_startup(admin, founder, amount) → Verify admin
                                                    ↓
                                            Update total_allocated
                                                    ↓
                                            Store StartupData
```

#### 4. Milestone Unlock Flow
```
Admin → unlock_milestone(admin, founder, amount) → Verify admin
                                                       ↓
                                                Verify ≤ total_allocated
                                                       ↓
                                                Increment unlocked_balance
                                                       ↓
                                                Store StartupData
```

#### 5. Claim Flow
```
Founder → claim_funds(founder, usdc_token) → Calculate claimable
                                                  ↓
                                            Transfer USDC
                                                  ↓
                                            Update claimed_balance
                                                  ↓
                                            Store StartupData
```

## Frontend Architecture

### Component Hierarchy

```
App (QueryClientProvider)
├── AppContent
│   ├── Navigation Bar
│   │   ├── Logo
│   │   ├── Wallet Status
│   │   └── Connect/Disconnect Button
│   │
│   └── Main Content (Conditional)
│       ├── FounderView (if not admin)
│       │   ├── Application Form
│       │   └── Status Dashboard
│       │       ├── Project Info
│       │       ├── Funding Status
│       │       └── Claim Button
│       │
│       └── AdminView (if admin)
│           ├── Allocate Funding Form
│           └── Unlock Milestone Form
```

### State Management

#### React Query Cache Structure
```typescript
{
  'startupStatus': {
    [founderAddress]: StartupData | null
  },
  'admin': string | null
}
```

#### Wallet State
```typescript
{
  publicKey: string | null,
  isConnected: boolean
}
```

### Data Flow

#### Read Operations (React Query)
```
Component → useQuery Hook → stellar.ts → Soroban RPC
                                              ↓
                                        Simulate Transaction
                                              ↓
                                        Parse Result
                                              ↓
Component ← Cache Update ← Return Data ←─────┘
```

#### Write Operations (Mutations)
```
Component → useMutation → Build Transaction → Freighter Sign
                                                    ↓
                                            Send to Network
                                                    ↓
                                            Poll for Result
                                                    ↓
Component ← Invalidate Cache ← Success/Error ←─────┘
```

## Security Model

### Authorization Checks

1. **Admin Functions** (`fund_startup`, `unlock_milestone`)
   - Requires `admin.require_auth()`
   - Verifies caller matches stored admin address

2. **Founder Functions** (`apply`, `claim_funds`)
   - Requires `founder.require_auth()`
   - Ensures only founder can act on their own data

### Anti-Spam Mechanism

- 10 XLM application fee
- Fee transferred to admin on application
- Prevents duplicate applications (checked in contract)

### Fund Safety

- Funds can only be unlocked up to `total_allocated`
- Claimed amount tracked to prevent double-claiming
- Only unlocked funds can be claimed

## Network Configuration

### Testnet Settings
```typescript
NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015'
HORIZON_URL: 'https://horizon-testnet.stellar.org'
SOROBAN_RPC_URL: 'https://soroban-testnet.stellar.org'
```

### Asset Configuration
```typescript
TESTNET_USDC: {
  code: 'USDC',
  issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
}
```

## Rate Limiting Strategy

### React Query Configuration
```typescript
{
  refetchInterval: 10000,    // Refetch every 10s
  staleTime: 5000,           // Data fresh for 5s
  retry: 2,                  // Retry failed requests twice
  refetchOnWindowFocus: false // Don't refetch on focus
}
```

### Benefits
- Prevents excessive RPC calls
- Automatic retry on failure
- Shared cache across components
- Background refetching

## Deployment Architecture

### Build Process
```
Rust Source → cargo build → WASM Binary
                                ↓
                        soroban contract optimize
                                ↓
                        Optimized WASM
                                ↓
                        soroban contract deploy
                                ↓
                        Contract ID on Testnet
```

### Frontend Build
```
TypeScript/React → Vite Build → Static Assets
                                      ↓
                                  dist/
                                      ↓
                              Deploy to hosting
```

## Scalability Considerations

### Current Limitations
- Single admin (can be upgraded to multi-sig)
- On-chain storage per startup (minimal: URL + 3 numbers)
- Sequential milestone unlocking

### Future Improvements
1. **Multi-signature admin** - Require multiple approvals
2. **Off-chain data storage** - Store only hash on-chain
3. **Batch operations** - Process multiple startups at once
4. **Event emission** - Add contract events for indexing
5. **Governance token** - Decentralize admin decisions

## Testing Strategy

### Contract Tests
- Unit tests for each function
- Integration tests for full flow
- Edge case tests (overflow, unauthorized access)
- Run with: `cargo test`

### Frontend Testing (Recommended)
- Component tests with React Testing Library
- E2E tests with Playwright
- Wallet interaction mocking

## Monitoring & Debugging

### Contract Debugging
```bash
# View contract storage
soroban contract invoke --id <CONTRACT_ID> -- get_startup_status --founder <ADDRESS>

# Check admin
soroban contract invoke --id <CONTRACT_ID> -- get_admin

# View transaction details
stellar laboratory → Transaction → View XDR
```

### Frontend Debugging
- React Query DevTools (add to App.tsx)
- Browser console for transaction XDR
- Freighter transaction history

## Cost Analysis

### Transaction Costs (Testnet)
- Deploy: ~0.5 XLM
- Initialize: ~0.01 XLM
- Apply: 10 XLM (fee) + ~0.01 XLM (gas)
- Fund/Unlock: ~0.01 XLM
- Claim: ~0.01 XLM

### Storage Costs
- Per startup: ~100 bytes
- Estimated: 10,000 startups = 1 MB on-chain

## Compliance & Legal

### Testnet Disclaimer
- This is a testnet implementation
- Not audited for production use
- No real value transferred

### Mainnet Considerations
- Smart contract audit required
- KYC/AML compliance for funding
- Legal structure for admin entity
- Terms of service for founders

## References

- [Soroban Documentation](https://soroban.stellar.org/docs)
- [Stellar SDK](https://stellar.github.io/js-stellar-sdk/)
- [Freighter API](https://docs.freighter.app/)
- [React Query](https://tanstack.com/query/latest)
