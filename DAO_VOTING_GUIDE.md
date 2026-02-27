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

3. **Browse All Applications**
   - See all submitted applications in card view
   - View project names, descriptions, and vote counts
   - Click any card to view full details

4. **Or Search Specific Application**
   - Enter founder's Stellar address
   - Click "Search"

5. **Review Application Details**
   - Project name and description
   - Project URL (GitHub, website, etc.)
   - Team information and experience
   - Funding goal amount
   - Current vote counts and percentage
   - Time remaining in voting period

6. **Cast Your Vote**
   - Click "👍 Vote YES" to support
   - Click "👎 Vote NO" to reject
   - Sign transaction in Freighter

7. **Track Results**
   - See real-time vote counts
   - View progress bar showing sentiment
   - Check if voting period is active

### For Founders:

**Application Form Fields:**
1. **Project Name** - Your startup's name
2. **Description** - Detailed explanation of your project, problem, and solution
3. **Project URL** - Link to GitHub, pitch deck, website, or demo
4. **Team Information** - Team members, experience, and background
5. **Funding Goal** - Amount of USDC you're requesting

**Your application now includes:**
- Automatic 7-day voting period
- Public vote tracking
- Community sentiment display
- Admin approval after voting
- All project details visible to voters

**Application Status:**
- ⏰ **Voting Active** - Community is voting
- 🔴 **Voting Ended** - Waiting for admin decision
- ✅ **Approved** - Admin approved your application

### For Admin:

**Review & Approve Applications:**
1. Navigate to "👑 Admin" tab
2. Use "Review & Approve Application" section
3. Enter founder's address to review
4. See full application details:
   - Project name and description
   - Project URL
   - Team information
   - Funding goal
   - Community vote counts and approval percentage
5. Review the information and votes
6. Click "Use Reviewed Address" to auto-fill approval field
7. Click "Approve Application"
8. Then proceed with funding allocation

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
    project_name: String,      // NEW: Project name
    description: String,       // NEW: Project description
    project_url: String,       // NEW: Project URL
    team_info: String,         // NEW: Team information
    funding_goal: i128,        // NEW: Requested funding amount
    total_allocated: i128,
    unlocked_balance: i128,
    claimed_balance: i128,
    voting_end_time: u64,      // When voting ends
    yes_votes: u32,            // Yes vote count
    no_votes: u32,             // No vote count
    approved: bool,            // Admin approval status
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
- **Contract ID**: `CBCDOVUQSZ257HSQYE5CQKKUX2FW5KZ3TKPNERBAJV6SR7XRFXRCMBFW`

### Admin Access:
- **Address**: `GAZ27SJ7YFLUGO2O4JCTOWLNNXQZ5C7H5A7WFWEBALT6F6JELKJKNV44`
- **Secret**: `SBWOC4AQIWYJOR7J3MZTDYVAUZP2XBW7WVH4EXKMLTGQEOZIURA5JAL2`

## 🎯 Testing the DAO

### Complete Flow Test:

1. **As Founder (Account A)**:
   ```
   - Connect wallet
   - Fill out detailed application form:
     * Project Name
     * Description
     * Project URL
     * Team Information
     * Funding Goal
   - Submit application
   - Note your address
   ```

2. **As Voter 1 (Account B)**:
   ```
   - Switch to Vote tab
   - Browse all applications or search for founder's address
   - Review project details (name, description, URL, team, funding goal)
   - Vote YES
   ```

3. **As Voter 2 (Account C)**:
   ```
   - Switch to Vote tab
   - Browse all applications or search for founder's address
   - Review project details
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
- Browse all applications to find interesting projects
- Review all project details before voting
- Check project URL, team info, and funding goal
- Consider existing vote counts and community sentiment
- Vote based on project merit and feasibility
- Participate early in voting period

### For Founders:
- Provide detailed, compelling project information
- Include a working project URL (GitHub, demo, pitch deck)
- Describe your team's experience and qualifications
- Set a realistic funding goal
- Share your application address with community
- Engage with potential voters
- Wait for voting period to end

### For Admin:
- Use the review feature to see full application details
- Check project name, description, URL, team, and funding goal
- Review vote results and approval percentage
- Consider community sentiment
- Verify project URL is legitimate
- Approve applications with strong support and quality information

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
- ✅ Detailed application forms with 5 key fields
- ✅ All applications list view for easy browsing
- ✅ 7-day voting periods
- ✅ Real-time vote tracking
- ✅ Beautiful voting UI with project cards
- ✅ Admin review interface with full project details
- ✅ VC view with complete project information
- ✅ Complete transparency

The community now has a voice in startup selection with full project visibility! 🗳️✨

## 📋 Latest Updates (Current Version)

### Application Form Enhancement:
- **5 detailed fields** for comprehensive project information
- **All applications list** in voting page for easy navigation
- **Project cards** showing name, description, and vote status
- **Enhanced admin review** with full project details before approval
- **Updated VC view** displaying all project information

### Contract Updates:
- New contract deployed: `CBCDOVUQSZ257HSQYE5CQKKUX2FW5KZ3TKPNERBAJV6SR7XRFXRCMBFW`
- Stores project name, description, URL, team info, and funding goal
- `get_all_startups()` function to retrieve all applications
- Enhanced `StartupData` struct with detailed fields

### Frontend Improvements:
- Application cards in voting view
- Click-to-view detailed application information
- Admin can review applications before approving
- VC dashboard shows complete project details
- Responsive design for all new features
