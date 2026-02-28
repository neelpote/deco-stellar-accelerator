# DeCo Platform - Deployment Information

## 🚀 Live Deployment

### Frontend
- **URL**: https://frontend-eight-navy-19.vercel.app
- **Status**: ✅ Active (Auto-deploys from GitHub main branch)
- **Last Updated**: XLM Migration Complete

### Smart Contract
- **Network**: Stellar Testnet
- **Contract ID**: `CBL6M6NXHSQJ6CJYIMV6FNEBNK3IRWLNQOFEM76FFGR6VGBRVXAPUA2V`
- **Native XLM Token**: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
- **Status**: ✅ Deployed and Initialized

### GitHub Repository
- **URL**: https://github.com/neelpote/deco-stellar-accelerator
- **Status**: ✅ Up to date with latest XLM migration

## Configuration Details

### Contract Settings
- **Admin Address**: `GAZ27SJ7YFLUGO2O4JCTOWLNNXQZ5C7H5A7WFWEBALT6F6JELKJKNV44`
- **Application Fee**: 10 XLM (100,000,000 stroops)
- **VC Stake Required**: 1000 XLM (10,000,000,000 stroops)
- **Voting Period**: 7 days per application

### Key Features Active
- ✅ DAO Voting System (7-day periods)
- ✅ VC Staking with XLM (no trustlines needed)
- ✅ Direct VC Investment in approved startups
- ✅ IPFS Metadata Storage (95% storage reduction)
- ✅ Cyberpunk UI with animations
- ✅ Real-time balance checking
- ✅ Freighter wallet integration

## How to Test the Live Platform

### 1. Get Testnet XLM
- **Stellar Laboratory**: https://laboratory.stellar.org/#account-creator?network=test
- **Friendbot**: https://friendbot.stellar.org
- **Any Stellar testnet faucet**

### 2. Connect Wallet
- Install Freighter wallet extension
- Switch to Testnet in settings
- Connect at https://frontend-eight-navy-19.vercel.app

### 3. Test as Founder
1. Fill out application form
2. Pay 10 XLM application fee
3. Wait for 7-day voting period
4. Get approved by admin
5. Receive VC investments

### 4. Test as Public Voter
1. Browse all applications
2. Vote Yes/No during voting periods
3. See real-time vote counts

### 5. Test as VC
1. Ensure you have 1000+ XLM
2. Click "💼 Become VC"
3. Stake 1000 XLM
4. Browse and invest in approved startups

### 6. Test as Admin
1. Use admin wallet: `GAZ27SJ7YFLUGO2O4JCTOWLNNXQZ5C7H5A7WFWEBALT6F6JELKJKNV44`
2. Review applications with vote results
3. Approve applications based on community votes

## Deployment Architecture

```
GitHub Repository (main branch)
    ↓ (Auto-deploy on push)
Vercel Production
    ↓ (Connects to)
Stellar Testnet Contract
    ↓ (Stores metadata on)
IPFS via Pinata
```

## Environment Variables (Vercel)
- `VITE_PINATA_JWT`: Configured for IPFS uploads
- Auto-deployed from repository settings

## Monitoring & Maintenance
- **Vercel Dashboard**: Auto-deployment logs
- **Stellar Expert**: Contract transaction monitoring
- **GitHub Actions**: Could be added for CI/CD
- **IPFS Pinata**: Metadata storage monitoring

## Next Steps for Production
1. **Security Audit**: Full smart contract audit
2. **Mainnet Deployment**: Deploy to Stellar Mainnet
3. **Domain Setup**: Custom domain for production
4. **Analytics**: Add user analytics and monitoring
5. **Performance**: Optimize bundle size and loading

---

**Status**: ✅ Fully Deployed and Operational
**Last Updated**: XLM Migration Complete
**Ready for Testing**: Yes - All features active