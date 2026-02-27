# DeCo MVP - Documentation Index

Complete guide to all documentation files in this project.

## 📚 Documentation Overview

This project includes comprehensive documentation covering setup, architecture, troubleshooting, and more.

---

## 🚀 Getting Started (Read These First)

### 1. [README.md](README.md)
**Main project documentation**
- Project overview and features
- Prerequisites and installation
- Deployment instructions
- Usage guide for founders and admins
- Tech stack details
- Security notes

**Start here if**: You want a complete overview of the project.

### 2. [QUICKSTART.md](QUICKSTART.md)
**5-minute setup guide**
- Prerequisites checklist
- One-command deployment (`./deploy.sh`)
- Testing the complete flow
- Common issues and solutions

**Start here if**: You want to get up and running quickly.

### 3. [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)
**Complete environment setup from scratch**
- Rust & Soroban installation
- Node.js setup
- Freighter wallet configuration
- Testnet account funding
- Verification steps

**Start here if**: You're setting up your development environment for the first time.

---

## 🏗️ Technical Documentation

### 4. [ARCHITECTURE.md](ARCHITECTURE.md)
**Deep technical dive**
- System architecture diagrams
- Smart contract data structures
- Function flows and state machines
- Frontend architecture
- Security model
- Rate limiting strategy
- Scalability considerations
- Cost analysis

**Read this if**: You want to understand how the system works internally.

### 5. [FLOW_DIAGRAM.md](FLOW_DIAGRAM.md)
**Visual flow diagrams**
- Complete user journeys (Founder & Admin)
- Smart contract state transitions
- Transaction anatomy
- Data flow architecture
- Error handling flows

**Read this if**: You prefer visual representations of system flows.

### 6. [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
**Complete project overview**
- What was built
- File structure breakdown
- Features implemented
- Design decisions explained
- Testing status
- Code statistics
- Security considerations
- Next steps for production

**Read this if**: You want a comprehensive summary of everything in the project.

---

## 🔧 Problem Solving

### 7. [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
**Common issues and solutions**
- Contract build/deployment errors
- Frontend installation/runtime errors
- Transaction failures
- Wallet connection issues
- Network problems
- Debugging tips
- Getting help resources

**Read this if**: You're encountering errors or issues.

---

## 📁 Project Files

### Smart Contract Files

```
contract/
├── src/
│   ├── lib.rs              # Main contract implementation
│   └── test.rs             # Contract test suite
└── Cargo.toml              # Rust dependencies
```

**Key Files**:
- `lib.rs`: Contains all contract logic (init, apply, fund, unlock, claim)
- `test.rs`: 8+ comprehensive tests
- `Cargo.toml`: Uses soroban-sdk 21.7.0

### Frontend Files

```
frontend/
├── src/
│   ├── components/
│   │   ├── AdminView.tsx       # Admin dashboard
│   │   └── FounderView.tsx     # Founder dashboard
│   ├── hooks/
│   │   ├── useWallet.ts        # Freighter integration
│   │   ├── useAdmin.ts         # Admin state
│   │   └── useStartupStatus.ts # Startup data
│   ├── App.tsx                 # Main app component
│   ├── config.ts               # Network configuration
│   ├── stellar.ts              # Soroban RPC client
│   ├── types.ts                # TypeScript types
│   └── main.tsx                # Entry point
├── package.json                # Dependencies
├── vite.config.ts              # Vite config
└── tailwind.config.js          # Tailwind setup
```

**Key Files**:
- `App.tsx`: Main application with role-based routing
- `config.ts`: **UPDATE CONTRACT_ID HERE AFTER DEPLOYMENT**
- `stellar.ts`: All blockchain interaction logic
- `FounderView.tsx`: Application and claiming interface
- `AdminView.tsx`: Funding and milestone management

### Deployment Files

```
deploy.sh                   # Automated deployment script
.gitignore                  # Git ignore rules
```

**Key Files**:
- `deploy.sh`: One-command deployment (build, deploy, initialize, configure)

---

## 📖 Reading Order by Use Case

### For First-Time Setup
1. ENVIRONMENT_SETUP.md (setup tools)
2. QUICKSTART.md (deploy and test)
3. README.md (understand features)

### For Understanding the System
1. README.md (overview)
2. ARCHITECTURE.md (technical details)
3. FLOW_DIAGRAM.md (visual flows)
4. PROJECT_SUMMARY.md (complete picture)

### For Development
1. ARCHITECTURE.md (understand structure)
2. README.md (API reference)
3. TROUBLESHOOTING.md (when stuck)

### For Debugging
1. TROUBLESHOOTING.md (common issues)
2. ARCHITECTURE.md (understand behavior)
3. FLOW_DIAGRAM.md (trace flows)

### For Production Planning
1. PROJECT_SUMMARY.md (what's built)
2. ARCHITECTURE.md (scalability & security)
3. README.md (deployment process)

---

## 🎯 Quick Reference

### Contract Functions

```rust
// Initialization
init(admin: Address, fee: i128)

// Founder Functions
apply(founder: Address, project_link: String)
claim_funds(founder: Address, usdc_token: Address)

// Admin Functions
fund_startup(admin: Address, founder: Address, total_amount: i128)
unlock_milestone(admin: Address, founder: Address, amount_to_unlock: i128)

// Read-Only Functions
get_startup_status(founder: Address) -> Option<StartupData>
get_admin() -> Address
get_fee() -> i128
```

### Frontend Configuration

```typescript
// frontend/src/config.ts
export const CONTRACT_ID = 'YOUR_DEPLOYED_CONTRACT_ID_HERE';
export const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
export const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
```

### Deployment Commands

```bash
# Automated
./deploy.sh

# Manual
cd contract && soroban contract build
soroban contract deploy --wasm target/wasm32-unknown-unknown/release/deco_mvp.wasm --source admin --network testnet
soroban contract invoke --id <CONTRACT_ID> --source admin --network testnet -- init --admin <ADMIN_ADDR> --fee 100000000

# Frontend
cd frontend && npm install && npm run dev
```

---

## 📊 Documentation Statistics

- **Total Documentation Files**: 8
- **Total Lines**: ~3,500+
- **Code Files**: 15+
- **Test Files**: 1 (8+ tests)
- **Configuration Files**: 6

---

## 🔗 External Resources

### Stellar & Soroban
- [Soroban Documentation](https://soroban.stellar.org/docs)
- [Stellar SDK Docs](https://stellar.github.io/js-stellar-sdk/)
- [Soroban Examples](https://github.com/stellar/soroban-examples)
- [Stellar Laboratory](https://laboratory.stellar.org/)

### Freighter Wallet
- [Freighter Website](https://www.freighter.app/)
- [Freighter API Docs](https://docs.freighter.app/)
- [Freighter GitHub](https://github.com/stellar/freighter)

### React & TypeScript
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query/latest)

### Community
- [Stellar Discord](https://discord.gg/stellar)
- [Stellar Stack Exchange](https://stellar.stackexchange.com/)
- [Stellar Developers Google Group](https://groups.google.com/g/stellar-dev)

---

## 🆘 Getting Help

### In This Project
1. Check TROUBLESHOOTING.md for your specific error
2. Review ARCHITECTURE.md to understand expected behavior
3. Verify setup in ENVIRONMENT_SETUP.md
4. Follow QUICKSTART.md step-by-step

### External Help
1. **Stellar Discord** (#soroban channel) - Best for contract questions
2. **Stellar Discord** (#freighter channel) - For wallet issues
3. **Stack Overflow** - Tag with `stellar` and `soroban`
4. **GitHub Issues** - For project-specific bugs

### Information to Provide
When asking for help, include:
- Which documentation file you're following
- Exact error message
- Contract ID (if deployed)
- Transaction hash (if applicable)
- Output of `soroban --version` and `node --version`
- Steps to reproduce

---

## 📝 Contributing to Documentation

If you find issues or want to improve documentation:

1. **Typos/Errors**: Create an issue or PR
2. **Missing Information**: Suggest additions
3. **Unclear Sections**: Request clarification
4. **New Use Cases**: Share your experience

---

## ✅ Documentation Checklist

Before deploying to production, ensure you've read:

- [ ] README.md (complete overview)
- [ ] QUICKSTART.md (deployment process)
- [ ] ARCHITECTURE.md (security model)
- [ ] TROUBLESHOOTING.md (common issues)
- [ ] PROJECT_SUMMARY.md (what's not included)

---

## 🎓 Learning Path

### Beginner (New to Stellar/Soroban)
1. Read README.md introduction
2. Follow ENVIRONMENT_SETUP.md completely
3. Run through QUICKSTART.md
4. Experiment with the application
5. Read FLOW_DIAGRAM.md to understand flows

### Intermediate (Familiar with Blockchain)
1. Skim README.md
2. Read ARCHITECTURE.md
3. Review contract code (contract/src/lib.rs)
4. Study frontend integration (frontend/src/stellar.ts)
5. Understand React Query usage

### Advanced (Ready to Extend)
1. Read PROJECT_SUMMARY.md (what's missing)
2. Study ARCHITECTURE.md (scalability section)
3. Review test suite (contract/src/test.rs)
4. Plan your extensions
5. Refer to TROUBLESHOOTING.md as needed

---

## 📅 Documentation Maintenance

This documentation is current as of the project creation date. Key areas that may need updates:

- **Soroban SDK Version**: Currently 21.7.0
- **Stellar SDK Version**: Currently 12.0.0
- **React Query Version**: Currently 5.17.0
- **Network URLs**: Testnet endpoints
- **Contract ID**: Must be updated after deployment

---

## 🎉 You're Ready!

With this comprehensive documentation, you have everything needed to:
- ✅ Set up your environment
- ✅ Deploy the contract
- ✅ Run the frontend
- ✅ Understand the architecture
- ✅ Troubleshoot issues
- ✅ Extend the system

**Start with QUICKSTART.md and you'll be running in 5 minutes!**

Happy building! 🚀
