# DeCo MVP - Troubleshooting Guide

Common issues and their solutions.

## Contract Issues

### Build Errors

#### Error: "failed to resolve: use of undeclared crate or module"
```bash
# Solution: Update Rust and add wasm target
rustup update
rustup target add wasm32-unknown-unknown
```

#### Error: "package `soroban-sdk` cannot be built"
```bash
# Solution: Update soroban-sdk version
cd contract
cargo update soroban-sdk
cargo build --target wasm32-unknown-unknown --release
```

#### Error: "linker `rust-lld` not found"
```bash
# Solution: Reinstall Rust toolchain
rustup toolchain install stable
rustup default stable
```

### Deployment Errors

#### Error: "account not found"
```bash
# Solution: Fund your account on Testnet
# Visit: https://laboratory.stellar.org/#account-creator?network=test
# Or use CLI:
soroban keys fund admin --network testnet
```

#### Error: "Contract already initialized"
```
# This is expected - contracts can only be initialized once
# Solution: Deploy a new contract instance
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/deco_mvp.wasm \
  --source admin \
  --network testnet
```

#### Error: "insufficient balance"
```bash
# Solution: Get more XLM from friendbot
curl "https://friendbot.stellar.org?addr=$(soroban keys address admin)"
```

### Contract Invocation Errors

#### Error: "Admin not set"
```bash
# Solution: Initialize the contract
ADMIN_ADDRESS=$(soroban keys address admin)
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source admin \
  --network testnet \
  -- \
  init \
  --admin $ADMIN_ADDRESS \
  --fee 100000000
```

#### Error: "Unauthorized: not admin"
```bash
# Solution: Use the correct admin account
# Check current admin:
soroban contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- \
  get_admin

# Make sure you're using the same account that initialized the contract
```

## Frontend Issues

### Installation Errors

#### Error: "npm ERR! code ERESOLVE"
```bash
# Solution: Use legacy peer deps
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

#### Error: "Cannot find module '@stellar/stellar-sdk'"
```bash
# Solution: Install dependencies
cd frontend
npm install
```

### Build Errors

#### Error: "Module not found: Error: Can't resolve 'crypto'"
```bash
# Solution: This is expected in browser environment
# Stellar SDK handles polyfills automatically
# If issue persists, add to vite.config.ts:
# resolve: {
#   alias: {
#     crypto: 'crypto-browserify'
#   }
# }
```

#### Error: "TypeScript error: Cannot find name 'Buffer'"
```bash
# Solution: Add node types
npm install --save-dev @types/node
```

### Runtime Errors

#### Error: "Freighter is not installed"
```
Solution:
1. Install Freighter: https://www.freighter.app/
2. Refresh the page
3. Click "Connect Freighter"
```

#### Error: "User declined access"
```
Solution:
1. Click "Connect Freighter" again
2. In Freighter popup, click "Connect"
3. Make sure you're on Testnet (check Freighter settings)
```

#### Error: "Transaction failed"
```
Possible causes:
1. Insufficient XLM balance
   - Solution: Fund account via friendbot
   
2. Wrong network (Mainnet vs Testnet)
   - Solution: Switch Freighter to Testnet
   
3. Contract not initialized
   - Solution: Run init command
   
4. Invalid contract ID
   - Solution: Check config.ts has correct CONTRACT_ID
```

#### Error: "Loading..." forever
```
Possible causes:
1. Wrong contract ID in config.ts
   - Solution: Update CONTRACT_ID in frontend/src/config.ts
   
2. Contract not deployed
   - Solution: Deploy contract first
   
3. RPC endpoint down
   - Solution: Check https://soroban-testnet.stellar.org status
   
4. Network issues
   - Solution: Check browser console for errors
```

#### Error: "Simulation failed"
```
Possible causes:
1. Contract function doesn't exist
   - Solution: Verify contract is deployed correctly
   
2. Invalid parameters
   - Solution: Check function signature matches
   
3. Contract panic (e.g., "Already applied")
   - Solution: Check contract state, may need to use different account
```

### Wallet Connection Issues

#### Freighter not detecting
```
Solution:
1. Ensure Freighter extension is enabled
2. Hard refresh page (Cmd+Shift+R or Ctrl+Shift+R)
3. Check browser console for errors
4. Try different browser
```

#### Wrong network
```
Solution:
1. Open Freighter
2. Click settings (gear icon)
3. Select "Testnet" from network dropdown
4. Refresh page
```

#### Account not funded
```
Solution:
1. Copy your public key from Freighter
2. Visit: https://laboratory.stellar.org/#account-creator?network=test
3. Paste address and click "Get test network lumens"
4. Wait 5 seconds and try again
```

## Transaction Issues

### Application Transaction

#### Error: "Insufficient XLM for fee"
```
Solution:
- You need at least 11 XLM (10 for fee + 1 for transaction)
- Fund account via friendbot
```

#### Error: "Already applied"
```
Solution:
- This address has already submitted an application
- Use a different Stellar account
- Or contact admin to reset (requires contract redeployment)
```

### Funding Transaction

#### Error: "Startup not found"
```
Solution:
- Founder must apply first
- Check founder address is correct
- Verify application transaction succeeded
```

#### Error: "Unauthorized: not admin"
```
Solution:
- Only admin can fund startups
- Connect with admin wallet
- Verify admin address matches contract admin
```

### Unlock Transaction

#### Error: "Cannot unlock more than allocated"
```
Solution:
- Check total_allocated amount
- Unlock amount must be ≤ (total_allocated - already_unlocked)
- Allocate more funding first if needed
```

### Claim Transaction

#### Error: "No funds to claim"
```
Solution:
- Admin must unlock funds first
- Check unlocked_balance > claimed_balance
- Wait for unlock transaction to confirm
```

#### Error: "Token transfer failed"
```
Possible causes:
1. Contract doesn't have USDC
   - Solution: This is expected on Testnet (USDC simulation)
   - For real testing, admin must fund contract with USDC
   
2. Trustline not established
   - Solution: Add USDC trustline in Freighter
   
3. Wrong token address
   - Solution: Verify TESTNET_USDC_ASSET in config.ts
```

## Development Issues

### Hot Reload Not Working

```bash
# Solution: Restart dev server
cd frontend
npm run dev
```

### Port Already in Use

```bash
# Solution: Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Or use different port in vite.config.ts
```

### TypeScript Errors

```bash
# Solution: Regenerate types
cd frontend
npx tsc --noEmit
```

## Testing Issues

### Contract Tests Fail

```bash
# Solution: Run tests with proper flags
cd contract
cargo test -- --nocapture

# If specific test fails, run it individually:
cargo test test_init -- --nocapture
```

### Can't Run Tests

```bash
# Solution: Install test dependencies
cd contract
cargo build --tests
cargo test
```

## Network Issues

### RPC Rate Limiting

```
Error: "Too many requests"

Solution:
- React Query handles this automatically
- Increase refetchInterval in hooks
- Wait a few minutes before retrying
```

### Horizon Timeout

```
Error: "Request timeout"

Solution:
- Check network connection
- Try again in a few seconds
- Verify Stellar Testnet status: https://status.stellar.org/
```

### Transaction Pending Forever

```
Solution:
1. Check transaction hash in Stellar Laboratory
2. If not found after 30 seconds, resubmit
3. Increase transaction timeout in code
4. Check Testnet isn't congested
```

## Data Issues

### Status Not Updating

```
Solution:
1. React Query refetches every 10 seconds
2. Manually refresh page
3. Check browser console for errors
4. Verify transaction succeeded on-chain
```

### Wrong Balance Displayed

```
Solution:
1. Check decimal conversion (USDC uses 7 decimals)
2. Verify contract storage:
   soroban contract invoke --id <ID> -- get_startup_status --founder <ADDR>
3. Clear browser cache
4. Invalidate React Query cache (disconnect/reconnect wallet)
```

## Debugging Tips

### Enable Verbose Logging

```typescript
// In frontend/src/stellar.ts, add:
console.log('Transaction XDR:', transaction.toXDR());
console.log('Simulation result:', simulated);
```

### Check Contract State

```bash
# View all contract data
soroban contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- \
  get_startup_status \
  --founder <FOUNDER_ADDRESS>
```

### Inspect Transaction

```bash
# Get transaction details
soroban contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- \
  get_admin

# Or use Stellar Laboratory:
# https://laboratory.stellar.org/#explorer?network=test
```

### Browser DevTools

```
1. Open browser console (F12)
2. Check Network tab for RPC calls
3. Look for errors in Console tab
4. Use React DevTools for component state
```

## Getting Help

### Resources

- **Stellar Discord**: https://discord.gg/stellar
  - #soroban channel for contract questions
  - #freighter for wallet issues

- **Soroban Docs**: https://soroban.stellar.org/docs
  - Comprehensive guides and examples

- **Stellar Laboratory**: https://laboratory.stellar.org/
  - Test transactions and view accounts

- **GitHub Issues**: Create issue in your repo
  - Include error messages
  - Share transaction hashes
  - Provide contract ID

### Information to Include

When asking for help, provide:
1. Error message (full text)
2. Contract ID
3. Transaction hash (if applicable)
4. Network (Testnet/Mainnet)
5. Steps to reproduce
6. Browser console logs
7. Soroban CLI version: `soroban --version`
8. Node version: `node --version`

## Common Gotchas

1. **Testnet vs Mainnet**: Always verify you're on Testnet
2. **Decimal Places**: USDC uses 7 decimals, not 18
3. **Authorization**: Admin functions require admin signature
4. **One-time Init**: Contracts can only be initialized once
5. **XLM vs USDC**: Application fee is XLM, funding is USDC
6. **Freighter Network**: Must match contract network
7. **Contract ID**: Must be updated in frontend config
8. **Account Funding**: Need XLM for transaction fees

## Still Stuck?

1. Check all config files match deployment
2. Verify contract is deployed and initialized
3. Ensure wallet is funded and on correct network
4. Try with fresh browser session (incognito)
5. Redeploy contract and update frontend config
6. Ask in Stellar Discord with details above

Remember: Most issues are configuration mismatches between contract deployment and frontend config!
