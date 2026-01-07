---
sidebar_position: 2
title: Quick Start
description: Deploy your first RWA token on Mantle Network in under 10 minutes
keywords: [quick start, tutorial, getting started, deployment, testnet]
---

# Quick Start

Deploy your first compliant RWA token on Mantle Network in under 10 minutes. This guide walks you through the essential steps from setup to deployment.

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Node.js 18+ installed ([Installation guide](/docs/getting-started/installation))
- [ ] A code editor (VS Code recommended)
- [ ] A wallet with testnet MNT tokens
- [ ] Basic TypeScript knowledge

:::tip Get Testnet Tokens
Get free testnet MNT from the [Mantle Sepolia Faucet](https://faucet.sepolia.mantle.xyz/).
:::

## Step 1: Create a New Project

Create a new directory and initialize your project:

```bash
mkdir my-rwa-project
cd my-rwa-project
npm init -y
```

Install the required dependencies:

```bash
npm install @mantle-rwa/sdk viem dotenv typescript tsx
```

Initialize TypeScript:

```bash
npx tsc --init
```

## Step 2: Configure Environment

Create a `.env` file for your private key:

```bash title=".env"
PRIVATE_KEY=your_wallet_private_key_here
```

:::warning Security
Never commit your `.env` file to version control. Add it to `.gitignore`:
```bash
echo ".env" >> .gitignore
```
:::

## Step 3: Initialize the SDK

Create your first script to initialize the SDK:

```typescript title="src/deploy.ts"
import 'dotenv/config';
import { RWAClient } from '@mantle-rwa/sdk';

// Validate environment
if (!process.env.PRIVATE_KEY) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

// Initialize the SDK client
const client = new RWAClient({
  network: 'mantle-sepolia', // Use testnet for development
  privateKey: process.env.PRIVATE_KEY,
});

console.log('✅ SDK initialized successfully');
console.log('📍 Network:', client.network);
console.log('👛 Address:', client.address);
```

Run the script to verify your setup:

```bash
npx tsx src/deploy.ts
```

You should see output like:
```
✅ SDK initialized successfully
📍 Network: mantle-sepolia
👛 Address: 0x...
```

## Step 4: Deploy Your RWA System

Now let's deploy a complete RWA token system. Add the deployment code:

```typescript title="src/deploy.ts"
import 'dotenv/config';
import { RWAClient } from '@mantle-rwa/sdk';

if (!process.env.PRIVATE_KEY) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

const client = new RWAClient({
  network: 'mantle-sepolia',
  privateKey: process.env.PRIVATE_KEY,
});

async function main() {
  console.log('🚀 Deploying RWA System...\n');

  // Deploy the complete RWA system
  const deployment = await client.deployRWASystem({
    // Token configuration
    tokenName: 'My First RWA Token',
    tokenSymbol: 'MFRWA',
    initialSupply: '1000000', // 1 million tokens
    
    // Compliance configuration
    compliance: {
      maxHolders: 500,
      minInvestment: '100', // Minimum 100 tokens
      maxInvestment: '100000', // Maximum 100k tokens
    },
  });

  console.log('✅ Deployment successful!\n');
  console.log('📋 Contract Addresses:');
  console.log('   Token:', deployment.token.address);
  console.log('   KYC Registry:', deployment.kycRegistry.address);
  console.log('   Yield Distributor:', deployment.yieldDistributor.address);
  console.log('   Asset Vault:', deployment.assetVault.address);
  
  console.log('\n🔗 View on Explorer:');
  console.log(`   https://sepolia.mantlescan.xyz/address/${deployment.token.address}`);
}

main().catch(console.error);
```

Run the deployment:

```bash
npx tsx src/deploy.ts
```

:::info Deployment Time
The deployment typically takes 30-60 seconds as it deploys multiple contracts.
:::

## Step 5: Verify Your Deployment

After deployment, you can verify your token on the Mantle Sepolia explorer. The script outputs a direct link to your token contract.

You can also interact with your deployed contracts:

```typescript title="src/interact.ts"
import 'dotenv/config';
import { RWAClient } from '@mantle-rwa/sdk';

const client = new RWAClient({
  network: 'mantle-sepolia',
  privateKey: process.env.PRIVATE_KEY!,
});

async function main() {
  // Connect to your deployed token
  const token = client.token('YOUR_TOKEN_ADDRESS');
  
  // Get token info
  const name = await token.name();
  const symbol = await token.symbol();
  const totalSupply = await token.totalSupply();
  
  console.log('Token Info:');
  console.log('  Name:', name);
  console.log('  Symbol:', symbol);
  console.log('  Total Supply:', totalSupply);
  
  // Check your balance
  const balance = await token.balanceOf(client.address);
  console.log('  Your Balance:', balance);
}

main().catch(console.error);
```

## What's Next?

Congratulations! You've deployed your first RWA token system. Here's what to explore next:

### Immediate Next Steps

1. **[Configure KYC](/docs/guides/kyc-integration)** - Set up investor verification
2. **[Mint Tokens](/docs/api/sdk/token-module)** - Issue tokens to verified investors
3. **[Distribute Yield](/docs/guides/yield-distribution)** - Set up yield payments

### Learn More

- **[Architecture Overview](/docs/architecture/overview)** - Understand the system design
- **[API Reference](/docs/api/overview)** - Explore all SDK methods
- **[React Components](/docs/api/react/overview)** - Build UIs with pre-built components

### Example Projects

- **[Real Estate Tokenization](/docs/examples/real-estate)** - Complete property tokenization example
- **[Private Equity](/docs/examples/private-equity)** - Fund tokenization with lock-up periods
- **[Full-Stack App](/docs/examples/full-stack-app)** - Complete application with frontend

## Troubleshooting

### "Insufficient funds" Error

Ensure your wallet has enough testnet MNT for gas fees. Get tokens from the [faucet](https://faucet.sepolia.mantle.xyz/).

### "Invalid private key" Error

Check that your private key:
- Starts with `0x`
- Is 66 characters long (including `0x`)
- Is correctly copied without extra spaces

### Transaction Timeout

If transactions are timing out:
1. Check the [Mantle network status](https://status.mantle.xyz/)
2. Try increasing the gas limit in your configuration
3. Wait a few minutes and retry

### Need Help?

- Join our [Discord](https://discord.gg/0xMantle) for community support
- Check the [FAQ](/docs/resources/faq) for common questions
- Open an issue on [GitHub](https://github.com/mantle-network/mantle-rwa-sdk/issues)
