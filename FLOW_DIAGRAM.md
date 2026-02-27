# DeCo MVP - Flow Diagrams

Visual representations of the system flows.

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                     FOUNDER JOURNEY                              │
└─────────────────────────────────────────────────────────────────┘

1. CONNECT WALLET
   ┌──────────┐
   │ Founder  │──────> Opens DeCo App
   └──────────┘              │
                             ▼
                    ┌─────────────────┐
                    │ Click "Connect" │
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │ Freighter Popup │
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │ Approve Access  │
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │ Founder View    │
                    └─────────────────┘

2. SUBMIT APPLICATION
   ┌──────────────────┐
   │ Enter Project URL│
   └────────┬─────────┘
            ▼
   ┌──────────────────┐
   │ Click "Apply Now"│
   └────────┬─────────┘
            ▼
   ┌──────────────────┐
   │ Freighter Signs  │ (10 XLM fee)
   └────────┬─────────┘
            ▼
   ┌──────────────────┐
   │ Transaction Sent │
   └────────┬─────────┘
            ▼
   ┌──────────────────┐
   │ Status: Applied  │
   │ Allocated: 0     │
   │ Unlocked: 0      │
   │ Claimed: 0       │
   └──────────────────┘

3. WAIT FOR ADMIN APPROVAL
   ┌──────────────────┐
   │ Admin Reviews    │
   └────────┬─────────┘
            ▼
   ┌──────────────────┐
   │ Admin Allocates  │ (e.g., 10,000 USDC)
   └────────┬─────────┘
            ▼
   ┌──────────────────┐
   │ Status Updates   │
   │ Allocated: 10000 │
   │ Unlocked: 0      │
   │ Claimed: 0       │
   └──────────────────┘

4. MILESTONE COMPLETION
   ┌──────────────────┐
   │ Founder Completes│
   │ Milestone 1      │
   └────────┬─────────┘
            ▼
   ┌──────────────────┐
   │ Admin Unlocks    │ (e.g., 2,500 USDC)
   └────────┬─────────┘
            ▼
   ┌──────────────────┐
   │ Status Updates   │
   │ Allocated: 10000 │
   │ Unlocked: 2500   │
   │ Claimed: 0       │
   └──────────────────┘

5. CLAIM FUNDS
   ┌──────────────────┐
   │ Click "Claim"    │
   └────────┬─────────┘
            ▼
   ┌──────────────────┐
   │ Freighter Signs  │
   └────────┬─────────┘
            ▼
   ┌──────────────────┐
   │ USDC Transferred │
   └────────┬─────────┘
            ▼
   ┌──────────────────┐
   │ Status Updates   │
   │ Allocated: 10000 │
   │ Unlocked: 2500   │
   │ Claimed: 2500    │
   └──────────────────┘

6. REPEAT FOR MORE MILESTONES
   ┌──────────────────┐
   │ Complete M2      │──> Admin Unlocks 2500 ──> Claim ──> Claimed: 5000
   └──────────────────┘
   ┌──────────────────┐
   │ Complete M3      │──> Admin Unlocks 2500 ──> Claim ──> Claimed: 7500
   └──────────────────┘
   ┌──────────────────┐
   │ Complete M4      │──> Admin Unlocks 2500 ──> Claim ──> Claimed: 10000
   └──────────────────┘
```

## Admin Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN JOURNEY                               │
└─────────────────────────────────────────────────────────────────┘

1. CONNECT AS ADMIN
   ┌──────────┐
   │  Admin   │──────> Opens DeCo App
   └──────────┘              │
                             ▼
                    ┌─────────────────┐
                    │ Connect Wallet  │
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │ System Detects  │
                    │ Admin Address   │
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │  Admin View     │
                    └─────────────────┘

2. REVIEW APPLICATIONS
   ┌──────────────────┐
   │ Check Founder's  │
   │ Project URL      │
   └────────┬─────────┘
            ▼
   ┌──────────────────┐
   │ Evaluate Project │
   └────────┬─────────┘
            ▼
        Decision?
            │
    ┌───────┴───────┐
    ▼               ▼
  Reject         Approve
    │               │
    └───────────────┘
                    │
                    ▼
   ┌──────────────────────────┐
   │ Enter Founder Address    │
   │ Enter Total Amount       │
   │ (e.g., 10,000 USDC)      │
   └────────┬─────────────────┘
            ▼
   ┌──────────────────────────┐
   │ Click "Allocate Funding" │
   └────────┬─────────────────┘
            ▼
   ┌──────────────────────────┐
   │ Freighter Signs          │
   └────────┬─────────────────┘
            ▼
   ┌──────────────────────────┐
   │ Funding Allocated        │
   └──────────────────────────┘

3. UNLOCK MILESTONES
   ┌──────────────────────────┐
   │ Founder Reports Progress │
   └────────┬─────────────────┘
            ▼
   ┌──────────────────────────┐
   │ Admin Verifies Milestone │
   └────────┬─────────────────┘
            ▼
   ┌──────────────────────────┐
   │ Enter Founder Address    │
   │ Enter Unlock Amount      │
   │ (e.g., 2,500 USDC)       │
   └────────┬─────────────────┘
            ▼
   ┌──────────────────────────┐
   │ Click "Unlock Milestone" │
   └────────┬─────────────────┘
            ▼
   ┌──────────────────────────┐
   │ Freighter Signs          │
   └────────┬─────────────────┘
            ▼
   ┌──────────────────────────┐
   │ Funds Unlocked           │
   └──────────────────────────┘

4. MONITOR PROGRESS
   ┌──────────────────────────┐
   │ Track Multiple Startups  │
   │ • Startup A: 5000/10000  │
   │ • Startup B: 2500/15000  │
   │ • Startup C: 10000/10000 │
   └──────────────────────────┘
```

## Smart Contract State Transitions

```
┌─────────────────────────────────────────────────────────────────┐
│                  CONTRACT STATE MACHINE                          │
└─────────────────────────────────────────────────────────────────┘

INITIALIZATION
   ┌─────────────┐
   │ Uninitialized│
   └──────┬──────┘
          │ init(admin, fee)
          ▼
   ┌─────────────┐
   │ Initialized │
   │ Admin: Set  │
   │ Fee: Set    │
   └─────────────┘

STARTUP LIFECYCLE
   ┌─────────────┐
   │ No Record   │
   └──────┬──────┘
          │ apply(founder, url)
          ▼
   ┌─────────────────────┐
   │ Applied             │
   │ url: "github.com/x" │
   │ allocated: 0        │
   │ unlocked: 0         │
   │ claimed: 0          │
   └──────┬──────────────┘
          │ fund_startup(admin, founder, 10000)
          ▼
   ┌─────────────────────┐
   │ Funded              │
   │ url: "github.com/x" │
   │ allocated: 10000    │
   │ unlocked: 0         │
   │ claimed: 0          │
   └──────┬──────────────┘
          │ unlock_milestone(admin, founder, 2500)
          ▼
   ┌─────────────────────┐
   │ Milestone Unlocked  │
   │ url: "github.com/x" │
   │ allocated: 10000    │
   │ unlocked: 2500      │
   │ claimed: 0          │
   └──────┬──────────────┘
          │ claim_funds(founder, usdc)
          ▼
   ┌─────────────────────┐
   │ Funds Claimed       │
   │ url: "github.com/x" │
   │ allocated: 10000    │
   │ unlocked: 2500      │
   │ claimed: 2500       │
   └──────┬──────────────┘
          │ (repeat unlock/claim)
          ▼
   ┌─────────────────────┐
   │ Fully Claimed       │
   │ url: "github.com/x" │
   │ allocated: 10000    │
   │ unlocked: 10000     │
   │ claimed: 10000      │
   └─────────────────────┘
```

## Transaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRANSACTION ANATOMY                           │
└─────────────────────────────────────────────────────────────────┘

APPLY TRANSACTION
   ┌──────────────┐
   │ User Action  │ Click "Apply Now"
   └──────┬───────┘
          ▼
   ┌──────────────────────────┐
   │ Frontend                 │
   │ 1. Build Transaction     │
   │ 2. Add contract.call()   │
   │    - apply               │
   │    - founder address     │
   │    - project URL         │
   └──────┬───────────────────┘
          ▼
   ┌──────────────────────────┐
   │ Soroban RPC              │
   │ 1. Simulate Transaction  │
   │ 2. Calculate Fees        │
   │ 3. Return Prepared TX    │
   └──────┬───────────────────┘
          ▼
   ┌──────────────────────────┐
   │ Freighter Wallet         │
   │ 1. Show TX Details       │
   │ 2. User Approves         │
   │ 3. Sign with Private Key │
   └──────┬───────────────────┘
          ▼
   ┌──────────────────────────┐
   │ Submit to Network        │
   │ 1. Send Signed TX        │
   │ 2. Get TX Hash           │
   └──────┬───────────────────┘
          ▼
   ┌──────────────────────────┐
   │ Poll for Result          │
   │ 1. Check TX Status       │
   │ 2. Wait for Confirmation │
   │ 3. Parse Result          │
   └──────┬───────────────────┘
          ▼
   ┌──────────────────────────┐
   │ Update UI                │
   │ 1. Invalidate Cache      │
   │ 2. Refetch Data          │
   │ 3. Show Success Message  │
   └──────────────────────────┘

CLAIM TRANSACTION
   ┌──────────────┐
   │ User Action  │ Click "Claim Funds"
   └──────┬───────┘
          ▼
   ┌──────────────────────────┐
   │ Frontend                 │
   │ 1. Build Transaction     │
   │ 2. Add contract.call()   │
   │    - claim_funds         │
   │    - founder address     │
   │    - USDC token address  │
   └──────┬───────────────────┘
          ▼
   ┌──────────────────────────┐
   │ Smart Contract           │
   │ 1. Verify Authorization  │
   │ 2. Calculate Claimable   │
   │ 3. Transfer USDC         │
   │ 4. Update claimed_balance│
   └──────┬───────────────────┘
          ▼
   ┌──────────────────────────┐
   │ USDC Token Contract      │
   │ 1. Transfer from Contract│
   │ 2. Transfer to Founder   │
   └──────┬───────────────────┘
          ▼
   ┌──────────────────────────┐
   │ Founder Wallet           │
   │ USDC Balance Increased   │
   └──────────────────────────┘
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATA FLOW                                   │
└─────────────────────────────────────────────────────────────────┘

READ FLOW (Get Startup Status)
   ┌──────────────┐
   │ Component    │ useStartupStatus(address)
   └──────┬───────┘
          ▼
   ┌──────────────────────────┐
   │ React Query              │
   │ 1. Check Cache (5s TTL)  │
   │ 2. Return if Fresh       │
   └──────┬───────────────────┘
          │ Cache Miss
          ▼
   ┌──────────────────────────┐
   │ stellar.ts               │
   │ getStartupStatus()       │
   └──────┬───────────────────┘
          ▼
   ┌──────────────────────────┐
   │ Build Read Transaction   │
   │ contract.call(           │
   │   'get_startup_status',  │
   │   founder_address        │
   │ )                        │
   └──────┬───────────────────┘
          ▼
   ┌──────────────────────────┐
   │ Soroban RPC              │
   │ simulateTransaction()    │
   └──────┬───────────────────┘
          ▼
   ┌──────────────────────────┐
   │ Smart Contract           │
   │ Read from Storage        │
   │ Return StartupData       │
   └──────┬───────────────────┘
          ▼
   ┌──────────────────────────┐
   │ Parse Result             │
   │ scValToNative()          │
   └──────┬───────────────────┘
          ▼
   ┌──────────────────────────┐
   │ React Query Cache        │
   │ Store for 5s             │
   │ Auto-refetch in 10s      │
   └──────┬───────────────────┘
          ▼
   ┌──────────────┐
   │ Component    │ Render Data
   └──────────────┘

WRITE FLOW (Unlock Milestone)
   ┌──────────────┐
   │ Admin Click  │ "Unlock Milestone"
   └──────┬───────┘
          ▼
   ┌──────────────────────────┐
   │ useMutation              │
   │ unlockMutation.mutate()  │
   └──────┬───────────────────┘
          ▼
   ┌──────────────────────────┐
   │ Build Write Transaction  │
   │ contract.call(           │
   │   'unlock_milestone',    │
   │   admin, founder, amount │
   │ )                        │
   └──────┬───────────────────┘
          ▼
   ┌──────────────────────────┐
   │ Soroban RPC              │
   │ prepareTransaction()     │
   └──────┬───────────────────┘
          ▼
   ┌──────────────────────────┐
   │ Freighter                │
   │ signTransaction()        │
   └──────┬───────────────────┘
          ▼
   ┌──────────────────────────┐
   │ Soroban RPC              │
   │ sendTransaction()        │
   └──────┬───────────────────┘
          ▼
   ┌──────────────────────────┐
   │ Smart Contract           │
   │ 1. Verify admin auth     │
   │ 2. Update unlocked_bal   │
   │ 3. Save to storage       │
   └──────┬───────────────────┘
          ▼
   ┌──────────────────────────┐
   │ Poll Transaction         │
   │ getTransaction(hash)     │
   └──────┬───────────────────┘
          ▼
   ┌──────────────────────────┐
   │ Success Handler          │
   │ 1. Invalidate cache      │
   │ 2. Show success message  │
   └──────┬───────────────────┘
          ▼
   ┌──────────────────────────┐
   │ React Query Refetch      │
   │ Get updated data         │
   └──────┬───────────────────┘
          ▼
   ┌──────────────┐
   │ UI Updates   │ Show new unlocked amount
   └──────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING                                │
└─────────────────────────────────────────────────────────────────┘

   ┌──────────────┐
   │ User Action  │
   └──────┬───────┘
          ▼
   ┌──────────────────────────┐
   │ Try Transaction          │
   └──────┬───────────────────┘
          │
          ├─> Success ──> Update UI
          │
          └─> Error
                │
    ┌───────────┴───────────┐
    │                       │
    ▼                       ▼
┌─────────────┐    ┌──────────────────┐
│ User Denied │    │ Transaction Fail │
└──────┬──────┘    └────────┬─────────┘
       │                    │
       │         ┌──────────┴──────────┐
       │         │                     │
       │         ▼                     ▼
       │  ┌──────────────┐    ┌──────────────┐
       │  │ Insufficient │    │ Contract     │
       │  │ Balance      │    │ Panic        │
       │  └──────┬───────┘    └──────┬───────┘
       │         │                   │
       └─────────┴───────────────────┘
                 │
                 ▼
       ┌──────────────────┐
       │ Error Handler    │
       │ 1. Log to console│
       │ 2. Show alert    │
       │ 3. Don't update  │
       └──────────────────┘
```

These diagrams provide a visual understanding of how DeCo MVP works from multiple perspectives!
