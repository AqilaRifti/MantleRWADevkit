---
sidebar_position: 4
title: First Deployment
description: Complete guide to deploying your first RWA token system
keywords: [deployment, contracts, token, setup]
---

# First Deployment

This guide walks you through deploying a complete RWA token system with all components configured and ready for production use.

## What Gets Deployed

When you deploy an RWA system, the SDK deploys and configures the following contracts:

| Contract | Purpose |
|----------|---------|
| **RWAToken** | ERC-3643 compliant security token |
| **KYCRegistry** | Investor verification and accreditation |
| **YieldDistributor** | Dividend and yield payments |
| **AssetVault** | Asset custody and management |
| **ComplianceModule** | Transfer restrictions and rules |

## Prerequisites

Before deploying, ensure you have:

1. Completed the [Quick Start](/docs/getting-started/quick-start) guide
2. Testnet MNT tokens for gas fees
3. Decided on your token parameters

## Step 1: Plan Your Token

Before deploying, define your token parameters:

```typescript
// Token identity
const tokenConfig = {
  name: 'Manhattan Real Estate Fund',
  symbol: 'MREF',
  initialSupply: '10000000', // 10 million tokens
};

// Compliance rules
const complianceConfig = {
  maxHolders: 2000,           // Maximum number of token holders
  minInvestment: '1000',      // Minimum tokens per investor
  maxInvestment: '500000',    // Maximum tokens per investor
  accreditedOnly: true,       // Require accredited investor status
  lockupPeriod: 365 * 24 * 60 * 60, // 1 year lockup in seconds
};

// Yield configuration
const yieldConfig = {
  paymentToken: 'USDC',       // Payment token for yields
  distributionFrequency: 'quarterly',
};
```

## Step 2: Deploy the System

Create your deployment script:

```typescript title="src/deploy-production.ts"
import 'dotenv/config';
import { RWAClient } from '@mantle-rwa/sdk';

const client = new RWAClient({
  network: 'mantle-sepolia', // Change to 'mantle' for mainnet
  privateKey: process.env.PRIVATE_KEY!,
});

async function deploy() {
  console.log('🚀 Starting RWA System Deployment\n');
  console.log('Deployer:', client.address);
  console.log('Network:', client.network);
  console.log('');

  const deployment = await client.deployRWASystem({
    // Token configuration
    tokenName: 'Manhattan Real Estate Fund',
    tokenSymbol: 'MREF',
    initialSupply: '10000000',
    
    // Compliance configuration
    compliance: {
      maxHolders: 2000,
      minInvestment: '1000',
      maxInvestment: '500000',
      accreditedOnly: true,
      lockupPeriod: 365 * 24 * 60 * 60,
    },
    
    // Yield configuration
    yield: {
      paymentToken: '0x...', // USDC address on Mantle
    },
    
    // Access control
    roles: {
      admin: client.address,
      compliance: client.address,
      treasury: client.address,
    },
  });

  console.log('✅ Deployment Complete!\n');
  
  return deployment;
}

deploy()
  .then((deployment) => {
    console.log('📋 Deployed Contracts:');
    console.log('');
    console.log('RWAToken:', deployment.token.address);
    console.log('KYCRegistry:', deployment.kycRegistry.address);
    console.log('YieldDistributor:', deployment.yieldDistributor.address);
    console.log('AssetVault:', deployment.assetVault.address);
    console.log('');
    console.log('🔗 Explorer Links:');
    console.log(`Token: https://sepolia.mantlescan.xyz/address/${deployment.token.address}`);
  })
  .catch(console.error);
```

## Step 3: Verify Deployment

After deployment, verify everything is configured correctly:

```typescript title="src/verify-deployment.ts"
import 'dotenv/config';
import { RWAClient } from '@mantle-rwa/sdk';

const client = new RWAClient({
  network: 'mantle-sepolia',
  privateKey: process.env.PRIVATE_KEY!,
});

async function verify(tokenAddress: string) {
  const token = client.token(tokenAddress);
  
  console.log('🔍 Verifying Deployment\n');
  
  // Token info
  const name = await token.name();
  const symbol = await token.symbol();
  const totalSupply = await token.totalSupply();
  const decimals = await token.decimals();
  
  console.log('Token Info:');
  console.log(`  Name: ${name}`);
  console.log(`  Symbol: ${symbol}`);
  console.log(`  Total Supply: ${totalSupply}`);
  console.log(`  Decimals: ${decimals}`);
  console.log('');
  
  // Compliance info
  const compliance = await token.getComplianceConfig();
  console.log('Compliance Config:');
  console.log(`  Max Holders: ${compliance.maxHolders}`);
  console.log(`  Min Investment: ${compliance.minInvestment}`);
  console.log(`  Max Investment: ${compliance.maxInvestment}`);
  console.log(`  Accredited Only: ${compliance.accreditedOnly}`);
  console.log('');
  
  // Role verification
  const isAdmin = await token.hasRole('ADMIN', client.address);
  console.log('Roles:');
  console.log(`  Admin: ${isAdmin ? '✅' : '❌'}`);
  
  console.log('\n✅ Verification Complete!');
}

// Replace with your deployed token address
verify('0x...');
```

## Step 4: Configure KYC

Set up your KYC provider to start verifying investors:

```typescript title="src/setup-kyc.ts"
import 'dotenv/config';
import { RWAClient } from '@mantle-rwa/sdk';

const client = new RWAClient({
  network: 'mantle-sepolia',
  privateKey: process.env.PRIVATE_KEY!,
});

async function setupKYC(kycRegistryAddress: string) {
  const kyc = client.kyc(kycRegistryAddress);
  
  // Configure KYC provider (example with Persona)
  await kyc.configureProvider({
    provider: 'persona',
    apiKey: process.env.PERSONA_API_KEY!,
    templateId: 'your-template-id',
  });
  
  console.log('✅ KYC Provider configured');
  
  // Manually verify an investor (for testing)
  await kyc.verifyInvestor({
    address: '0x...',
    accreditationLevel: 'accredited',
    country: 'US',
    expirationDate: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
  });
  
  console.log('✅ Test investor verified');
}

setupKYC('0x...');
```

## Step 5: Mint Initial Tokens

Mint tokens to verified investors:

```typescript title="src/mint-tokens.ts"
import 'dotenv/config';
import { RWAClient } from '@mantle-rwa/sdk';

const client = new RWAClient({
  network: 'mantle-sepolia',
  privateKey: process.env.PRIVATE_KEY!,
});

async function mintTokens(tokenAddress: string) {
  const token = client.token(tokenAddress);
  
  // Mint to a single investor
  await token.mint({
    to: '0x...', // Verified investor address
    amount: '10000',
  });
  
  console.log('✅ Tokens minted');
  
  // Batch mint to multiple investors
  await token.batchMint([
    { to: '0x...', amount: '5000' },
    { to: '0x...', amount: '7500' },
    { to: '0x...', amount: '2500' },
  ]);
  
  console.log('✅ Batch mint complete');
}

mintTokens('0x...');
```

## Deployment Checklist

Before going to mainnet, ensure you've completed:

- [ ] Deployed all contracts successfully
- [ ] Verified contract addresses on explorer
- [ ] Configured KYC provider
- [ ] Set up compliance rules
- [ ] Assigned appropriate roles
- [ ] Tested token transfers with verified addresses
- [ ] Configured yield distribution (if applicable)
- [ ] Reviewed security best practices

## Next Steps

Your RWA system is now deployed! Here's what to do next:

1. **[Set up KYC Integration](/docs/guides/kyc-integration)** - Configure investor verification
2. **[Configure Yield Distribution](/docs/guides/yield-distribution)** - Set up dividend payments
3. **[Review Security](/docs/guides/security-best-practices)** - Ensure your deployment is secure
4. **[Build Your Frontend](/docs/api/react/overview)** - Create a user interface

## Troubleshooting

### Deployment Failed

If deployment fails:
1. Check you have sufficient gas (at least 0.5 MNT recommended)
2. Verify your private key is correct
3. Check network connectivity

### Contract Verification Failed

To verify contracts on the explorer:
```bash
npx hardhat verify --network mantle-sepolia CONTRACT_ADDRESS
```

### Need Help?

- [FAQ](/docs/resources/faq)
- [Troubleshooting Guide](/docs/resources/troubleshooting)
- [GitHub Discussions](https://github.com/AqilaRifti/MantleRWADevkit/discussions)
