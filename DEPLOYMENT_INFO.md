# DeCo MVP - Deployment Information

## ✅ Successfully Deployed with VC Feature!

### Contract Details
- **Contract ID**: `CAJSLON2PZSA7YL2LTQKHZKVIPURIVGGH4L4HTF5AWCPY3USIOAG42P6`
- **Admin Address**: `GAZ27SJ7YFLUGO2O4JCTOWLNNXQZ5C7H5A7WFWEBALT6F6JELKJKNV44`
- **Network**: Stellar Testnet
- **Status**: Deployed & Initialized

### Frontend
- **URL**: http://localhost:3001/
- **Status**: Running with beautiful Web3 UI

### Contract Explorer
- View on Stellar Expert: https://stellar.expert/explorer/testnet/contract/CAJSLON2PZSA7YL2LTQKHZKVIPURIVGGH4L4HTF5AWCPY3USIOAG42P6

---

## 🎨 New Features

### Three User Roles:

1. **👑 Admin** - Full control over the platform
   - Allocate funding to startups
   - Unlock milestones
   - Approve VC requests
   - Beautiful gradient UI with purple/indigo theme

2. **💼 Venture Capitalist (VC)** - Investment monitoring
   - Search and view any startup's portfolio
   - Monitor funding progress
   - Track milestone completions
   - Real-time on-chain data
   - Purple/pink gradient UI

3. **🚀 Founder** - Apply and receive funding
   - Submit applications
   - Request VC access
   - Track funding status
   - Claim unlocked funds
   - Blue/cyan gradient UI

---

## How to Use

### For Founders:

1. **Connect Wallet**: Use Freighter wallet (non-admin account)
2. **Submit Application**: 
   - Enter your project URL (GitHub, pitch deck, etc.)
   - Click "Apply Now"
   - Sign the transaction in Freighter
3. **Request VC Access** (Optional):
   - Click "Request VC Access"
   - Enter your company/fund name
   - Wait for admin approval
4. **Wait for Admin Approval**: Admin will allocate funding
5. **Claim Funds**: Once milestones are unlocked, click "Claim Funds"

### For Venture Capitalists:

1. **Request Access**: 
   - Connect wallet as founder
   - Click "Request VC Access"
   - Enter your company name
   - Wait for admin approval
2. **Monitor Portfolios**:
   - Once approved, you'll see the VC Dashboard
   - Search for any founder's address
   - View their funding status, milestones, and progress
   - Track real-time on-chain data

### For Admin:

1. **Connect Admin Wallet**: Use the admin address above
2. **Allocate Funding**:
   - Enter founder's Stellar address
   - Enter total USDC amount (e.g., 10000)
   - Click "Allocate Funding"
3. **Unlock Milestones**:
   - Enter founder's address
   - Enter amount to unlock (e.g., 2500)
   - Click "Unlock Milestone"
4. **Approve VCs**:
   - Enter VC's Stellar address
   - Click "Approve VC Access"
5. **Repeat**: Unlock more milestones as founders complete them

---

## 🎨 UI Improvements

### Beautiful Web3 Design:
- ✅ Gradient backgrounds and cards
- ✅ Emoji icons for visual appeal
- ✅ Role-based color themes
- ✅ Smooth animations and transitions
- ✅ Responsive design
- ✅ Loading states with spinners
- ✅ Progress bars for funding status
- ✅ Informative descriptions for each action
- ✅ Professional glassmorphism effects
- ✅ Shadow and hover effects

### Color Themes:
- **Admin**: Indigo/Purple gradients 👑
- **VC**: Purple/Pink gradients 💼
- **Founder**: Blue/Cyan gradients 🚀

---

## Contract Functions

### Founder Functions
- `apply(founder, project_link)` - Submit application
- `request_vc(vc_address, company_name)` - Request VC access
- `claim_funds(founder, usdc_token)` - Claim unlocked funds
- `get_startup_status(founder)` - View status

### Admin Functions  
- `fund_startup(admin, founder, total_amount)` - Allocate total funding
- `unlock_milestone(admin, founder, amount)` - Unlock funds for claiming
- `approve_vc(admin, vc_address)` - Approve VC request
- `get_admin()` - Get admin address
- `get_fee()` - Get application fee

### VC Functions
- `is_vc(vc_address)` - Check if address is approved VC
- `get_vc_request(vc_address)` - Get VC request details
- `get_startup_status(founder)` - View any startup's status

---

## Testing the Complete Flow

### 1. Test as Founder:
```
1. Connect with a non-admin wallet
2. Submit an application with project URL
3. Request VC access (optional)
4. Wait for admin to allocate funding
5. Wait for admin to unlock milestone
6. Claim your funds
```

### 2. Test as VC:
```
1. Request VC access as a founder
2. Admin approves your VC request
3. Disconnect and reconnect wallet
4. You'll now see the VC Dashboard
5. Search for any founder's address
6. View their complete funding status
```

### 3. Test as Admin:
```
1. Connect with admin wallet
2. Allocate funding to a founder
3. Unlock milestones progressively
4. Approve VC requests
5. Monitor the entire platform
```

---

## Next Steps

1. **Test the complete flow** with multiple accounts
2. **Customize branding** and colors
3. **Add more features**:
   - Application rejection flow
   - Milestone descriptions
   - Analytics dashboard
   - Email notifications
   - Multi-signature admin
4. **Prepare for Mainnet**:
   - Security audit
   - Comprehensive testing
   - Legal compliance

---

## Support

- Check TROUBLESHOOTING.md for common issues
- Review ARCHITECTURE.md for technical details
- Join Stellar Discord: https://discord.gg/stellar

Enjoy your beautiful Web3 accelerator platform! 🚀✨
