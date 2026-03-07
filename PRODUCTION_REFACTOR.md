# DeCo Production Refactoring Guide

## 🎯 Overview
This document outlines the complete refactoring from MVP to production-ready DeCo platform.

## ✅ Smart Contract Security Improvements

### 1. Reentrancy Guards ✅
**Implementation**: `lib_v2.rs`
```rust
fn acquire_lock(env: &Env, address: &Address)
fn release_lock(env: &Env, address: &Address)
```
- Prevents reentrancy attacks on all fund movements
- Applied to: `stake_to_become_vc`, `vc_invest`, `claim_funds`
- Uses storage-based locks per address

### 2. Checked Math ✅
**Implementation**: Helper functions
```rust
fn checked_add(a: i128, b: i128) -> i128
fn checked_sub(a: i128, b: i128) -> i128  
fn checked_mul(a: i128, b: i128) -> i128
```
- Prevents overflow/underflow attacks
- All arithmetic operations use checked math
- Panics on overflow with clear error messages

### 3. Milestone-Based Escrow ✅
**New Feature**: 25% incremental fund release
```rust
pub fn unlock_milestone(env: Env, admin: Address, founder: Address)
```
- Funds released in 4 milestones (25% each)
- Time-based intervals between milestones
- Admin approval required for each milestone
- Prevents immediate 100% fund drain

**Data Structure**:
```rust
milestone_count: u32,        // Total milestones (4)
current_milestone: u32,      // Current milestone (0-3)
last_milestone_time: u64,    // Timestamp tracking
```

### 4. Emergency Pause (Circuit Breaker) ✅
**Implementation**: Admin-controlled pause mechanism
```rust
pub fn pause(env: Env, admin: Address)
pub fn unpause(env: Env, admin: Address)
fn require_not_paused(env: &Env)
```
- Admin can pause all contract operations
- Protects against discovered vulnerabilities
- Can be extended to multi-sig in future
- All critical functions check pause state

## 💰 Economic Logic Improvements

### 5. Sybil Resistance ✅
**Implementation**: Minimum balance requirement for voting
```rust
pub fn vote(..., xlm_token: Address) {
    let voter_balance = token_client.balance(&voter);
    if voter_balance < config.min_vote_balance {
        panic!("Insufficient balance to vote");
    }
}
```
- Requires minimum XLM balance to vote
- Configurable threshold (default: 100 XLM suggested)
- Prevents spam voting attacks
- Balance checked at vote time

### 6. Configurable VC Staking ✅
**Implementation**: Dynamic configuration
```rust
pub fn update_vc_stake_required(env: Env, admin: Address, new_amount: i128)
```
- VC stake amount no longer hardcoded
- Admin can adjust based on market conditions
- Stored in `ContractConfig` struct
- Can be updated without contract redeployment

**Configuration Structure**:
```rust
pub struct ContractConfig {
    pub vc_stake_required: i128,
    pub min_vote_balance: i128,
    pub milestone_interval: u64,
    // ... other config
}
```

## 🎨 Frontend Refactoring Plan

### 7. Persistent Wallet State (Context API)
**File**: `frontend/src/contexts/WalletContext.tsx`

```typescript
import { createContext, useContext, useState, useEffect } from 'react';

interface WalletContextType {
  publicKey: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const WalletProvider = ({ children }) => {
  const [publicKey, setPublicKey] = useState<string | null>(
    localStorage.getItem('wallet_public_key')
  );

  useEffect(() => {
    if (publicKey) {
      localStorage.setItem('wallet_public_key', publicKey);
    } else {
      localStorage.removeItem('wallet_public_key');
    }
  }, [publicKey]);

  // ... implementation
};
```

**Benefits**:
- Wallet state persists across page refreshes
- No need to reconnect on every page load
- Centralized wallet logic
- Easy to test and maintain

### 8. Transaction Feedback System
**File**: `frontend/src/components/TransactionToast.tsx`

```typescript
import { Toaster, toast } from 'react-hot-toast';

export const TransactionToast = {
  pending: (message: string) => {
    return toast.loading(message, {
      duration: Infinity,
      icon: '⏳',
    });
  },
  
  success: (toastId: string, message: string, txHash?: string) => {
    toast.success(
      <div>
        <p>{message}</p>
        {txHash && (
          <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}>
            View Transaction →
          </a>
        )}
      </div>,
      { id: toastId }
    );
  },
  
  error: (toastId: string, error: Error) => {
    toast.error(error.message, { id: toastId });
  },
};

// Usage:
const toastId = TransactionToast.pending('Staking XLM...');
try {
  const result = await stakeTransaction();
  TransactionToast.success(toastId, 'Staked successfully!', result.hash);
} catch (error) {
  TransactionToast.error(toastId, error);
}
```

**Features**:
- Loading state during transaction
- Success with transaction link
- Error handling with clear messages
- Auto-dismiss after success
- Persistent error messages

### 9. Environment Configuration
**File**: `frontend/.env.example`

```bash
# Contract Configuration
VITE_CONTRACT_ID=CBL6M6NXHSQJ6CJYIMV6FNEBNK3IRWLNQOFEM76FFGR6VGBRVXAPUA2V
VITE_XLM_TOKEN_CONTRACT=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC

# Network Configuration
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# IPFS Configuration
VITE_PINATA_JWT=your_jwt_here

# Feature Flags
VITE_ENABLE_MILESTONE_SYSTEM=true
VITE_MIN_VOTE_BALANCE=100
```

**File**: `frontend/src/config.ts`

```typescript
export const config = {
  contractId: import.meta.env.VITE_CONTRACT_ID,
  xlmTokenContract: import.meta.env.VITE_XLM_TOKEN_CONTRACT,
  networkPassphrase: import.meta.env.VITE_NETWORK_PASSPHRASE,
  horizonUrl: import.meta.env.VITE_HORIZON_URL,
  sorobanRpcUrl: import.meta.env.VITE_SOROBAN_RPC_URL,
  pinataJwt: import.meta.env.VITE_PINATA_JWT,
  minVoteBalance: Number(import.meta.env.VITE_MIN_VOTE_BALANCE) || 100,
} as const;

// Type-safe config access
export type Config = typeof config;
```

**Benefits**:
- No hardcoded values in source code
- Easy environment switching (testnet/mainnet)
- Secure credential management
- Type-safe configuration access

## 🧪 Testing Strategy

### 10. Comprehensive Unit Tests
**File**: `contract/src/test_v2.rs`

**Test Coverage**:

1. **Reentrancy Tests**
   - Test double-claim attempt
   - Test concurrent stake attempts
   - Verify lock acquisition/release

2. **Overflow/Underflow Tests**
   - Test maximum i128 values
   - Test subtraction underflow
   - Test multiplication overflow

3. **Milestone Tests**
   - Test 25% incremental release
   - Test time interval enforcement
   - Test milestone completion

4. **Voting Edge Cases**
   - Vote at last second of period
   - Vote with exact minimum balance
   - Vote after period ends (should fail)

5. **Circuit Breaker Tests**
   - Test pause functionality
   - Test operations while paused
   - Test unpause and resume

6. **Sybil Resistance Tests**
   - Vote with insufficient balance
   - Vote after balance drops
   - Multiple votes from same address

**Example Test**:
```rust
#[test]
fn test_reentrancy_protection() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DeCoV2);
    let client = DeCoV2Client::new(&env, &contract_id);
    
    // Setup
    let founder = Address::generate(&env);
    
    // Try to claim twice in same transaction
    // Should panic with "Reentrancy detected"
    client.claim_funds(&founder, &xlm_token);
    // Second call should fail
    assert!(panic::catch_unwind(|| {
        client.claim_funds(&founder, &xlm_token);
    }).is_err());
}
```

## 📊 Migration Path

### Phase 1: Deploy V2 Contract
1. Build new contract: `soroban contract build`
2. Deploy to testnet
3. Initialize with new parameters
4. Test all functions

### Phase 2: Frontend Updates
1. Implement WalletContext
2. Add TransactionToast
3. Move to .env configuration
4. Update all contract calls to V2

### Phase 3: Testing
1. Run unit tests
2. Integration testing
3. Security audit
4. Load testing

### Phase 4: Production Deployment
1. Deploy to mainnet
2. Monitor for 24 hours
3. Gradual rollout
4. Full migration

## 🔒 Security Checklist

- [x] Reentrancy guards on all fund movements
- [x] Checked math for all arithmetic
- [x] Milestone-based fund release
- [x] Emergency pause mechanism
- [x] Sybil resistance for voting
- [x] Configurable parameters
- [x] Input validation
- [x] Authorization checks
- [ ] External security audit (recommended)
- [ ] Bug bounty program (recommended)

## 📈 Performance Improvements

1. **Gas Optimization**
   - Batch operations where possible
   - Minimize storage reads/writes
   - Use efficient data structures

2. **Frontend Optimization**
   - React Query for caching
   - Lazy loading components
   - Optimistic UI updates

3. **Monitoring**
   - Transaction success rates
   - Gas usage tracking
   - Error rate monitoring

## 🚀 Next Steps

1. Review and test `lib_v2.rs`
2. Implement frontend refactoring
3. Write comprehensive tests
4. Security audit
5. Deploy to testnet
6. User acceptance testing
7. Mainnet deployment

## 📝 Notes

- All changes are backward compatible where possible
- Migration can be done gradually
- Old contract can run in parallel during transition
- Comprehensive documentation for all new features

---

**Status**: Ready for implementation
**Priority**: High - Security improvements critical
**Timeline**: 2-3 weeks for full implementation and testing
