# DeCo MVP - Environment Setup Guide

Complete guide for setting up your development environment from scratch.

## Table of Contents
1. [Rust & Soroban Setup](#rust--soroban-setup)
2. [Node.js Setup](#nodejs-setup)
3. [Freighter Wallet Setup](#freighter-wallet-setup)
4. [Testnet Account Setup](#testnet-account-setup)
5. [Project Setup](#project-setup)
6. [Verification](#verification)

---

## Rust & Soroban Setup

### macOS

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Follow prompts, then restart terminal or run:
source $HOME/.cargo/env

# Verify installation
rustc --version
cargo --version

# Add WebAssembly target
rustup target add wasm32-unknown-unknown

# Install Soroban CLI
cargo install --locked soroban-cli --features opt

# Verify Soroban installation
soroban --version
```

### Linux (Ubuntu/Debian)

```bash
# Install dependencies
sudo apt update
sudo apt install -y build-essential pkg-config libssl-dev

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Add WebAssembly target
rustup target add wasm32-unknown-unknown

# Install Soroban CLI
cargo install --locked soroban-cli --features opt

# Verify
soroban --version
```

### Windows

```powershell
# Download and run rustup-init.exe from:
# https://rustup.rs/

# After installation, open new PowerShell and run:
rustup target add wasm32-unknown-unknown

# Install Soroban CLI
cargo install --locked soroban-cli --features opt

# Verify
soroban --version
```

---

## Node.js Setup

### macOS (using Homebrew)

```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@18

# Verify
node --version  # Should be v18.x or higher
npm --version
```

### macOS/Linux (using nvm - Recommended)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or run:
source ~/.bashrc  # or ~/.zshrc for zsh

# Install Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# Verify
node --version
npm --version
```

### Windows

```powershell
# Download and install from:
# https://nodejs.org/en/download/

# Choose LTS version (18.x or higher)

# Verify in new PowerShell:
node --version
npm --version
```

---

## Freighter Wallet Setup

### Installation

1. **Chrome/Brave/Edge**
   - Visit: https://www.freighter.app/
   - Click "Add to Chrome"
   - Pin extension to toolbar

2. **Firefox**
   - Visit: https://addons.mozilla.org/en-US/firefox/addon/freighter/
   - Click "Add to Firefox"

### Configuration

```
1. Open Freighter extension
2. Click "Create New Wallet" or "Import Wallet"
3. Save your recovery phrase securely (NEVER share this!)
4. Set a password
5. Click Settings (gear icon)
6. Select "Testnet" from network dropdown
7. Copy your public key (starts with G...)
```

### Create Multiple Accounts (for testing)

```
1. In Freighter, click account dropdown
2. Click "Create New Account"
3. Name it "Founder Test" or "Admin"
4. Repeat to create multiple test accounts
```

---

## Testnet Account Setup

### Method 1: Stellar Laboratory (Recommended)

```
1. Visit: https://laboratory.stellar.org/#account-creator?network=test
2. Paste your Freighter public key
3. Click "Get test network lumens"
4. Wait 5 seconds
5. Verify balance in Freighter (should show ~10,000 XLM)
```

### Method 2: Friendbot API

```bash
# Replace with your public key
curl "https://friendbot.stellar.org?addr=GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

### Method 3: Soroban CLI

```bash
# Generate and fund in one command
soroban keys generate admin --network testnet
soroban keys fund admin --network testnet

# Get the address
soroban keys address admin
```

### Verify Funding

```bash
# Check balance
soroban keys address admin | xargs -I {} curl "https://horizon-testnet.stellar.org/accounts/{}"
```

---

## Project Setup

### Clone or Create Project

```bash
# If you have the project
cd stellar-chain-project

# Or create from scratch
mkdir deco-mvp
cd deco-mvp
```

### Install Contract Dependencies

```bash
cd contract

# This will download and compile dependencies
cargo build --target wasm32-unknown-unknown --release

# Run tests to verify
cargo test
```

### Install Frontend Dependencies

```bash
cd ../frontend

# Install all packages
npm install

# If you get peer dependency errors:
npm install --legacy-peer-deps
```

---

## Verification

### Verify Rust Setup

```bash
# Check Rust version (should be 1.70+)
rustc --version

# Check cargo
cargo --version

# Check wasm target
rustup target list | grep wasm32-unknown-unknown
# Should show: wasm32-unknown-unknown (installed)

# Check Soroban CLI
soroban --version
# Should show: soroban 21.x.x or higher
```

### Verify Node.js Setup

```bash
# Check Node version (should be 18+)
node --version

# Check npm
npm --version

# Check global packages
npm list -g --depth=0
```

### Verify Contract Build

```bash
cd contract

# Build contract
cargo build --target wasm32-unknown-unknown --release

# Check output
ls -lh target/wasm32-unknown-unknown/release/*.wasm
# Should show deco_mvp.wasm

# Run tests
cargo test
# All tests should pass
```

### Verify Frontend Setup

```bash
cd frontend

# Check dependencies
npm list --depth=0

# Try to build
npm run build

# Should create dist/ folder
ls -la dist/
```

### Verify Freighter Connection

```bash
# Start dev server
cd frontend
npm run dev

# Open http://localhost:3000
# Click "Connect Freighter"
# Should see popup and connect successfully
```

---

## Common Setup Issues

### Rust Installation Issues

**Issue**: "rustc: command not found"
```bash
# Solution: Add to PATH
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Issue**: "error: linker `cc` not found"
```bash
# macOS
xcode-select --install

# Linux
sudo apt install build-essential
```

### Soroban Installation Issues

**Issue**: "failed to compile soroban-cli"
```bash
# Update Rust first
rustup update stable

# Try again
cargo install --locked soroban-cli --features opt
```

**Issue**: "soroban: command not found"
```bash
# Check cargo bin is in PATH
echo $PATH | grep cargo

# If not, add it:
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Node.js Issues

**Issue**: "npm: command not found"
```bash
# Reinstall Node.js or use nvm
nvm install 18
nvm use 18
```

**Issue**: "EACCES: permission denied"
```bash
# Don't use sudo! Fix npm permissions:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Freighter Issues

**Issue**: "Freighter not detected"
```
1. Ensure extension is installed and enabled
2. Hard refresh page (Cmd+Shift+R or Ctrl+Shift+R)
3. Check browser console for errors
4. Try different browser
```

**Issue**: "Wrong network"
```
1. Open Freighter
2. Click settings (gear icon)
3. Select "Testnet"
4. Refresh page
```

---

## Environment Variables (Optional)

Create `.env` files for easier configuration:

### Contract `.env`

```bash
# contract/.env
ADMIN_SECRET_KEY=SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TESTNET_RPC=https://soroban-testnet.stellar.org
```

### Frontend `.env`

```bash
# frontend/.env
VITE_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_NETWORK=testnet
VITE_RPC_URL=https://soroban-testnet.stellar.org
```

---

## IDE Setup (Optional but Recommended)

### VS Code Extensions

```
1. rust-analyzer (Rust language support)
2. Even Better TOML (TOML syntax)
3. ES7+ React/Redux/React-Native snippets
4. Tailwind CSS IntelliSense
5. Prettier - Code formatter
```

### VS Code Settings

```json
{
  "rust-analyzer.cargo.target": "wasm32-unknown-unknown",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

---

## Quick Start Checklist

After completing setup, verify everything works:

- [ ] `rustc --version` shows 1.70+
- [ ] `cargo --version` works
- [ ] `soroban --version` shows 21.x+
- [ ] `node --version` shows 18.x+
- [ ] `npm --version` works
- [ ] Freighter installed and on Testnet
- [ ] Test account funded (10,000+ XLM)
- [ ] `cd contract && cargo test` passes
- [ ] `cd frontend && npm install` succeeds
- [ ] `npm run dev` starts server
- [ ] Can connect Freighter at localhost:3000

If all checks pass, you're ready to deploy! 🚀

---

## Next Steps

1. Run deployment: `./deploy.sh`
2. Follow QUICKSTART.md for testing
3. Read ARCHITECTURE.md to understand the system
4. Check TROUBLESHOOTING.md if issues arise

## Getting Help

- **Rust Issues**: https://users.rust-lang.org/
- **Soroban Issues**: https://discord.gg/stellar (#soroban channel)
- **Node.js Issues**: https://stackoverflow.com/questions/tagged/node.js
- **Freighter Issues**: https://discord.gg/stellar (#freighter channel)

Happy building! 🎉
