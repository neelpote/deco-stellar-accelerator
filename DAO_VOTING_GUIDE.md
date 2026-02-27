# DeCo DAO Voting System Guide

## 🗳️ Overview

DeCo now features a fully decentralized DAO voting system where the community can vote on startup applications before admin approval.

## ✨ New Features

### 1. Public Voting
- **Anyone can vote** on pending startup applications
- **One wallet = One vote** (democratic voting)
- **7-day voting period** for each application
- **Real-time vote counting** displayed on-chain

### 2. Voting Process
1. Founder submits application
2. 7-day voting period begins automatically
3. Community votes Yes 👍 or No 👎
4. After voting ends, admin reviews results
5. Admin approves or rejects based on community input

### 3. Navigation System
New tab-based navigation for easy switching:
- **🚀 Founder** - Submit applications, claim funds
- **💼 VC** - Monitor portfolios (if approved)
- **🗳️ Vote** - Vote on applications (everyone)
- **👑 Admin** - Manage platform (admin only)

## 📊 How to Use

### For Voters (Everyone):

1. **Connect Wallet**
   - Click "Connect Freighter"
   - Make sure you're on Stellar Testnet

2. **Navigate to Voting**
   - Click the "🗳️ Vote" tab

3. **Find Application**
   - Enter founder's Stellar address
   - Click "Search"

4. **Review Application**
   - View project URL
   - Check voting period remaining
   - See current vote counts

5. **Cast Your Vote**
   - Click "👍 Vote YES" to support
   - Click "👎 Vote NO" to reject
   - Sign transaction in Freighter

6. **Track Results**
   - See real-time vote counts
   - View progress bar showing sentiment
   - Check if voting period is active

### For Founders:

**Your application now includes:**
- Automatic 7-day voting period
- Public vote tracking
- Community sentiment display
- Admin approval after voting

**Application Status:**
- ⏰ **Voting Active** - Community is voting
- 🔴 **Voting Ended** - Waiting for admin decision
- ✅ **Approved** - Admin approved your application

### For Admin:

**New Admin Function:**
1. Navigate to "👑 Admin" tab
2. Use "Approve Application" section
3. Enter founder's address
4. Review vote results (check in Vote tab first)
5. Click "Approve Application"
6. Then proceed with funding allocation

## 🎨 UI Features

### Voting View (Green/Teal Theme)
- Beautiful gradient cards
- Real-time vote counters
- Progress bars showing Yes/No ratio
- Time remaining countdown
- Voting status indicators

### Vote Display
- **👍 Yes Votes** - Green cards with count
- **👎 No Votes** - Red cards with count
- **Progress Bar** - Visual representation
- **Percentage** - Community sentiment

## 🔐 Smart Contract Updates

### New Functions:

```rust
// Vote on an application
vote(voter: Address, founder: Address, vote_yes: bool)

// Check if someone voted
has_voted(voter: Address, founder: Address) -> bool

// Admin approves after voting
approve_application(admin: Address, founder: Address)
```

### New Data Fields:

```rust
struct StartupData {
    url_or_hash: String,
    total_allocated: i128,
    unlocked_balance: i128,
    claimed_balance: i128,
    voting_end_time: u64,      // NEW: When voting ends
    yes_votes: u32,            // NEW: Yes vote count
    no_votes: u32,             // NEW: No vote count
    approved: bool,            // NEW: Admin approval status
}
```

## 📝 Voting Rules

### Eligibility
- ✅ Any Stellar address can vote
- ✅ One vote per address per application
- ✅ Must have XLM for transaction fees

### Restrictions
- ❌ Cannot vote twice on same application
- ❌ Cannot vote after period ends
- ❌ Cannot change vote once submitted

### Voting Period
- **Duration**: 7 days (604,800 seconds)
- **Starts**: When founder submits application
- **Ends**: Automatically after 7 days
- **Display**: Shows time remaining in days/hours/minutes

## 🚀 Live Deployment

### URLs:
- **Production**: https://frontend-eight-navy-19.vercel.app
- **GitHub**: https://github.com/neelpote/deco-stellar-accelerator
- **Contract ID**: `CACES5RB6DBCIYAZHFYWIIQXC4UI3PF5DRX5JW73EP3H546DH2GMECOM`

### Admin Access:
- **Address**: `GAZ27SJ7YFLUGO2O4JCTOWLNNXQZ5C7H5A7WFWEBALT6F6JELKJKNV44`
- **Secret**: `SBWOC4AQIWYJOR7J3MZTDYVAUZP2XBW7WVH4EXKMLTGQEOZIURA5JAL2`

## 🎯 Testing the DAO

### Complete Flow Test:

1. **As Founder (Account A)**:
   ```
   - Connect wallet
   - Submit application
   - Note your address
   ```

2. **As Voter 1 (Account B)**:
   ```
   - Switch to Vote tab
   - Search for founder's address
   - Vote YES
   ```

3. **As Voter 2 (Account C)**:
   ```
   - Switch to Vote tab
   - Search for founder's address
   - Vote NO
   ```

4. **As Admin**:
   ```
   - Check votes in Vote tab
   - Switch to Admin tab
   - Approve application
   - Allocate funding
   - Unlock milestones
   ```

5. **Back to Founder**:
   ```
   - See approved status
   - Claim funds
   ```

## 💡 Best Practices

### For Voters:
- Review project URL before voting
- Check existing vote counts
- Vote based on project merit
- Participate early in voting period

### For Founders:
- Submit quality project URLs
- Share your application address
- Engage with community
- Wait for voting period to end

### For Admin:
- Review vote results before approving
- Consider community sentiment
- Check project details
- Approve applications with strong support

## 🔮 Future Enhancements

Potential additions:
- Weighted voting based on token holdings
- Voting power delegation
- Proposal system for platform changes
- Automated approval based on vote threshold
- Voting rewards/incentives
- Discussion forum integration
- Vote history tracking
- Analytics dashboard

## 📊 Vote Statistics

Track these metrics:
- Total votes cast
- Approval rate
- Average voting time
- Community participation
- Vote distribution

## 🆘 Troubleshooting

### "Already voted"
- You can only vote once per application
- Use a different wallet to vote again

### "Voting period has ended"
- The 7-day period is over
- Wait for admin decision
- Find other active applications

### "Startup not found"
- Check the founder's address
- Ensure they submitted an application
- Address must be exact match

## 🎉 Success!

Your DeCo platform now has:
- ✅ Democratic DAO voting
- ✅ 7-day voting periods
- ✅ Real-time vote tracking
- ✅ Beautiful voting UI
- ✅ Admin approval workflow
- ✅ Complete transparency

The community now has a voice in startup selection! 🗳️✨
