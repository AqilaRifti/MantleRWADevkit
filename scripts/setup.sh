#!/bin/bash
set -e

echo "🚀 Setting up Mantle RWA SDK..."

# Check for required tools
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required. Install with: npm install -g pnpm"; exit 1; }

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "📦 Installing dependencies..."
pnpm install

echo "🔧 Setting up Foundry for smart contracts..."
cd packages/contracts

# Install Foundry dependencies
if command -v forge >/dev/null 2>&1; then
    forge install OpenZeppelin/openzeppelin-contracts --no-commit
    forge install OpenZeppelin/openzeppelin-contracts-upgradeable --no-commit
    forge install foundry-rs/forge-std --no-commit
    echo "✅ Foundry dependencies installed"
else
    echo "⚠️  Foundry not found. Install from https://getfoundry.sh"
    echo "   After installing, run: forge install"
fi

cd ../..

echo "🏗️  Building packages..."
pnpm build

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env and configure"
echo "  2. Run 'pnpm test' to verify installation"
echo "  3. Check docs/ for documentation"
