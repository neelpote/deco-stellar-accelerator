# IPFS Migration Guide - Phase 2 Complete

## 🎯 Overview

DeCo has been upgraded to use **IPFS (InterPlanetary File System)** for storing project metadata off-chain. This significantly reduces on-chain storage costs and makes the platform Mainnet-ready.

## ✅ What Changed

### Smart Contract Optimization:

**Before (Heavy On-Chain Storage):**
```rust
struct StartupData {
    project_name: String,      // ~50 bytes
    description: String,       // ~500 bytes
    project_url: String,       // ~100 bytes
    team_info: String,         // ~300 bytes
    funding_goal: i128,
    // ... other fields
}
```

**After (IPFS-Optimized):**
```rust
struct StartupData {
    ipfs_cid: String,          // ~46 bytes (CID only!)
    funding_goal: i128,
    // ... other fields
}
```

**Storage Savings**: ~900 bytes → ~46 bytes per application (95% reduction!)

### Frontend Integration:

1. **Upload to IPFS First**: Project metadata uploaded to Pinata
2. **Store CID On-Chain**: Only the IPFS CID stored in smart contract
3. **Fetch from IPFS**: Frontend retrieves metadata when displaying

---

## 🔧 Technical Implementation

### 1. Smart Contract Changes

**File**: `contract/src/lib.rs`

**Updated `apply()` function:**
```rust
pub fn apply(
    env: Env,
    founder: Address,
    ipfs_cid: String,        // Only CID now!
    funding_goal: i128,
) {
    // ... validation logic
    
    let startup_data = StartupData {
        ipfs_cid,
        funding_goal,
        total_allocated: 0,
        unlocked_balance: 0,
        claimed_balance: 0,
        voting_end_time,
        yes_votes: 0,
        no_votes: 0,
        approved: false,
    };
    
    // Store on-chain
}
```

**New Contract ID**: `CAKHYOFVLMGRO66VA2GQ6YG4FJZN3N4QGWMM342P3645RQZDKE6PAQUZ`

### 2. IPFS Integration

**File**: `frontend/src/ipfs.ts`

**Upload Function:**
```typescript
export const uploadToIPFS = async (metadata: ProjectMetadata): Promise<string> => {
  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    {
      pinataContent: {
        project_name: metadata.project_name,
        description: metadata.description,
        project_url: metadata.project_url,
        team_info: metadata.team_info,
        timestamp: Date.now(),
      },
      pinataMetadata: {
        name: `DeCo-${metadata.project_name}-${Date.now()}`,
      },
    },
    { headers: { Authorization: `Bearer ${PINATA_JWT}` } }
  );
  
  return response.data.IpfsHash; // Returns CID
};
```

**Fetch Function:**
```typescript
export const fetchFromIPFS = async (cid: string): Promise<ProjectMetadata> => {
  const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${cid}`);
  return response.data;
};
```

### 3. Frontend Workflow

**Application Submission** (`FounderView.tsx`):
```typescript
const applyMutation = useMutation({
  mutationFn: async (data) => {
    // Step 1: Upload to IPFS
    const ipfsCid = await uploadToIPFS({
      project_name: data.name,
      description: data.desc,
      project_url: data.url,
      team_info: data.team,
    });
    
    // Step 2: Submit CID to blockchain
    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          'apply',
          StellarSdk.Address.fromString(publicKey).toScVal(),
          StellarSdk.nativeToScVal(ipfsCid, { type: 'string' }),
          StellarSdk.nativeToScVal(goalInStroops, { type: 'i128' })
        )
      )
      .setTimeout(30)
      .build();
    
    // ... sign and submit
  },
});
```

**Metadata Fetching** (Custom Hook):
```typescript
export const useIPFSMetadata = (cid: string | undefined) => {
  return useQuery<ProjectMetadata | null>({
    queryKey: ['ipfsMetadata', cid],
    queryFn: async () => {
      if (!cid) return null;
      return await fetchFromIPFS(cid);
    },
    enabled: !!cid,
    staleTime: 60000, // Cache for 1 minute
    retry: 3,
  });
};
```

**Display in UI**:
```typescript
const { data: startupData } = useStartupStatus(founderAddress);
const { data: metadata, isLoading } = useIPFSMetadata(startupData?.ipfs_cid);

// Render metadata
{metadata && (
  <div>
    <h3>{metadata.project_name}</h3>
    <p>{metadata.description}</p>
    <a href={metadata.project_url}>View Project</a>
    <p>{metadata.team_info}</p>
  </div>
)}
```

---

## 🔑 Setup Instructions

### 1. Get Pinata API Credentials

1. Go to [https://app.pinata.cloud/](https://app.pinata.cloud/)
2. Sign up for free account
3. Navigate to API Keys
4. Create new API key with permissions:
   - `pinFileToIPFS`
   - `pinJSONToIPFS`
5. Copy your JWT token

### 2. Configure Environment Variables

Create `frontend/.env` file:
```bash
# Pinata IPFS Configuration
VITE_PINATA_JWT=your_jwt_token_here
```

**Alternative** (using API keys):
```bash
VITE_PINATA_API_KEY=your_api_key_here
VITE_PINATA_SECRET_KEY=your_secret_key_here
```

### 3. Install Dependencies

```bash
cd frontend
npm install axios
```

### 4. Build and Deploy

```bash
# Build frontend
npm run build

# Deploy to Vercel
vercel --prod
```

---

## 📊 Data Structure

### On-Chain (Stellar Blockchain):
```json
{
  "ipfs_cid": "QmX7Zd9...",
  "funding_goal": "500000000000",
  "total_allocated": "0",
  "unlocked_balance": "0",
  "claimed_balance": "0",
  "voting_end_time": 1735689600,
  "yes_votes": 0,
  "no_votes": 0,
  "approved": false
}
```

### Off-Chain (IPFS):
```json
{
  "project_name": "AI Code Assistant",
  "description": "VS Code extension using GPT-4 to help developers write better code faster...",
  "project_url": "https://github.com/myproject/ai-assistant",
  "team_info": "2 engineers from Google with 10 years experience in AI/ML...",
  "timestamp": 1735603200000
}
```

---

## 🎯 Benefits

### 1. **Cost Reduction**
- **95% less on-chain storage**
- Lower transaction fees
- Mainnet-ready economics

### 2. **Scalability**
- No storage limits for descriptions
- Can add more metadata fields easily
- IPFS handles large data efficiently

### 3. **Decentralization**
- Data stored on IPFS (distributed)
- No single point of failure
- Content-addressed (immutable)

### 4. **Performance**
- Faster blockchain transactions
- Parallel IPFS fetching
- Cached metadata in frontend

---

## 🔄 Migration Process

### For Existing Applications:

**Old applications** (with on-chain metadata) will need to be migrated:

1. Fetch old data from blockchain
2. Upload to IPFS
3. Update contract with CID
4. Remove old fields

**Note**: Current deployment is fresh, so no migration needed.

---

## 🧪 Testing

### Test IPFS Upload:
```typescript
import { uploadToIPFS } from './ipfs';

const cid = await uploadToIPFS({
  project_name: "Test Project",
  description: "This is a test",
  project_url: "https://example.com",
  team_info: "Test team",
});

console.log('IPFS CID:', cid);
// Output: QmX7Zd9...
```

### Test IPFS Fetch:
```typescript
import { fetchFromIPFS } from './ipfs';

const metadata = await fetchFromIPFS('QmX7Zd9...');
console.log('Metadata:', metadata);
```

### Test Full Flow:
1. Fill application form
2. Click "Submit Application"
3. Watch console for "Uploading to IPFS..."
4. See CID in transaction
5. View application in voting page
6. Metadata loads from IPFS

---

## 📝 Files Changed

### Smart Contract:
- `contract/src/lib.rs` - Updated `StartupData` struct and `apply()` function

### Frontend:
- `frontend/src/ipfs.ts` - New IPFS utility functions
- `frontend/src/types.ts` - Updated types with `ProjectMetadata`
- `frontend/src/hooks/useIPFSMetadata.ts` - New custom hook
- `frontend/src/components/FounderView.tsx` - IPFS upload integration
- `frontend/src/components/PublicVotingView.tsx` - IPFS fetch integration
- `frontend/src/components/StartupCard.tsx` - New component with IPFS
- `frontend/src/config.ts` - Updated contract ID
- `frontend/.env.example` - Pinata configuration template

---

## 🚀 Deployment Info

**Contract ID**: `CAKHYOFVLMGRO66VA2GQ6YG4FJZN3N4QGWMM342P3645RQZDKE6PAQUZ`

**Network**: Stellar Testnet

**IPFS Gateway**: `https://gateway.pinata.cloud/ipfs/`

**Frontend**: https://frontend-eight-navy-19.vercel.app

---

## 🔮 Future Enhancements

1. **IPFS Pinning Service**: Ensure data persistence
2. **Multiple Gateways**: Fallback if one gateway is down
3. **Image Upload**: Store project logos/screenshots
4. **Document Upload**: Pitch decks, whitepapers
5. **Version Control**: Track metadata changes over time
6. **Encryption**: Optional private metadata
7. **CDN Integration**: Faster global access

---

## 🆘 Troubleshooting

### "Failed to upload to IPFS"
- Check Pinata API credentials in `.env`
- Verify JWT token is valid
- Check network connection
- Try regenerating API key

### "Unable to load metadata from IPFS"
- Check IPFS gateway is accessible
- Verify CID is correct
- Try different gateway
- Check browser console for errors

### "Transaction failed"
- Ensure CID is valid string
- Check funding goal is positive number
- Verify wallet has XLM for fees
- Try again with higher fee

---

## 📚 Resources

- **Pinata Docs**: https://docs.pinata.cloud/
- **IPFS Docs**: https://docs.ipfs.tech/
- **Stellar Docs**: https://developers.stellar.org/
- **Soroban Docs**: https://soroban.stellar.org/

---

## 🎉 Success!

DeCo is now optimized with IPFS storage:
- ✅ 95% reduction in on-chain storage
- ✅ Mainnet-ready economics
- ✅ Scalable metadata storage
- ✅ Decentralized data layer
- ✅ Fast and efficient

Phase 2 Complete! 🚀
