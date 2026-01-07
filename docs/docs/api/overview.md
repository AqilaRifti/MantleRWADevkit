---
sidebar_position: 1
title: API Overview
description: Overview of the Mantle RWA SDK API structure
keywords: [api, reference, sdk, react, contracts]
---

# API Overview

The Mantle RWA SDK provides three layers of APIs for building RWA applications:

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components                          │
│         High-level UI components for common tasks            │
├─────────────────────────────────────────────────────────────┤
│                     TypeScript SDK                           │
│          Programmatic access to all RWA operations           │
├─────────────────────────────────────────────────────────────┤
│                    Smart Contracts                           │
│           On-chain logic and state management                │
└─────────────────────────────────────────────────────────────┘
```

## API Layers

### TypeScript SDK (`@mantle-rwa/sdk`)

The core SDK provides programmatic access to all RWA operations:

| Module | Description |
|--------|-------------|
| [RWAClient](/docs/api/sdk/rwa-client) | Main client for SDK initialization and deployment |
| [TokenModule](/docs/api/sdk/token-module) | Token operations (mint, burn, transfer) |
| [KYCModule](/docs/api/sdk/kyc-module) | Investor verification and accreditation |
| [YieldModule](/docs/api/sdk/yield-module) | Yield distribution and claims |
| [ComplianceModule](/docs/api/sdk/compliance-module) | Transfer restrictions and compliance rules |

### React Components (`@mantle-rwa/react`)

Pre-built UI components for common RWA operations:

| Component | Description |
|-----------|-------------|
| [KYCFlow](/docs/api/react/kyc-flow) | Complete KYC verification flow |
| [InvestorDashboard](/docs/api/react/investor-dashboard) | Portfolio overview and management |
| [TokenMintForm](/docs/api/react/token-mint-form) | Token minting interface |
| [YieldCalculator](/docs/api/react/yield-calculator) | Yield projection calculator |

### Smart Contracts (`@mantle-rwa/contracts`)

On-chain contracts for RWA tokenization:

| Contract | Description |
|----------|-------------|
| [RWAToken](/docs/api/contracts/rwa-token) | ERC-3643 compliant security token |
| [KYCRegistry](/docs/api/contracts/kyc-registry) | On-chain KYC verification registry |
| [YieldDistributor](/docs/api/contracts/yield-distributor) | Yield distribution and claims |
| [AssetVault](/docs/api/contracts/asset-vault) | Asset custody and management |
| [RWAFactory](/docs/api/contracts/rwa-factory) | Factory for deploying RWA systems |

## Quick Reference

### Common Operations

```typescript
import { RWAClient } from '@mantle-rwa/sdk';

const client = new RWAClient({
  network: 'mantle-sepolia',
  privateKey: process.env.PRIVATE_KEY,
});

// Deploy a new RWA system
const deployment = await client.deployRWASystem({
  tokenName: 'My Token',
  tokenSymbol: 'MTK',
  initialSupply: '1000000',
});

// Connect to existing contracts
const token = client.token('0x...');
const kyc = client.kyc('0x...');
const yield_ = client.yield('0x...');
```

### Token Operations

```typescript
// Mint tokens
await token.mint({ to: '0x...', amount: '1000' });

// Transfer tokens
await token.transfer({ to: '0x...', amount: '500' });

// Check balance
const balance = await token.balanceOf('0x...');

// Pause/unpause
await token.pause();
await token.unpause();
```

### KYC Operations

```typescript
// Verify an investor
await kyc.verifyInvestor({
  address: '0x...',
  accreditationLevel: 'accredited',
  country: 'US',
});

// Check verification status
const isVerified = await kyc.isVerified('0x...');

// Get investor details
const investor = await kyc.getInvestor('0x...');
```

### Yield Operations

```typescript
// Distribute yield
await yield_.distribute({
  amount: '100000',
  paymentToken: '0x...', // USDC
});

// Claim yield
await yield_.claim('0x...');

// Preview distribution
const preview = await yield_.previewDistribution('100000');
```

## Common Patterns

### Error Handling

All SDK methods throw typed errors that can be caught and handled:

```typescript
import { RWAError, ComplianceError, KYCError } from '@mantle-rwa/sdk';

try {
  await token.transfer({ to: '0x...', amount: '1000' });
} catch (error) {
  if (error instanceof ComplianceError) {
    console.log('Transfer blocked by compliance:', error.reason);
  } else if (error instanceof KYCError) {
    console.log('KYC verification required:', error.message);
  } else if (error instanceof RWAError) {
    console.log('RWA error:', error.message);
  } else {
    throw error;
  }
}
```

### Event Listening

Subscribe to contract events:

```typescript
// Listen for transfers
token.on('Transfer', (from, to, amount) => {
  console.log(`Transfer: ${from} -> ${to}: ${amount}`);
});

// Listen for KYC verifications
kyc.on('InvestorVerified', (address, level) => {
  console.log(`Investor verified: ${address} (${level})`);
});

// Remove listener
token.off('Transfer', handler);
```

### Batch Operations

Perform multiple operations efficiently:

```typescript
// Batch mint
await token.batchMint([
  { to: '0x...', amount: '1000' },
  { to: '0x...', amount: '2000' },
  { to: '0x...', amount: '3000' },
]);

// Batch verify
await kyc.batchVerify([
  { address: '0x...', level: 'accredited' },
  { address: '0x...', level: 'qualified' },
]);
```

### Gas Estimation

Estimate gas before transactions:

```typescript
// Estimate gas for mint
const gasEstimate = await token.estimateGas.mint({
  to: '0x...',
  amount: '1000',
});

console.log('Estimated gas:', gasEstimate);

// Execute with custom gas
await token.mint(
  { to: '0x...', amount: '1000' },
  { gasLimit: gasEstimate * 120n / 100n } // 20% buffer
);
```

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

```typescript
import type {
  RWAClient,
  TokenModule,
  KYCModule,
  YieldModule,
  DeploymentResult,
  MintParams,
  TransferParams,
  VerifyInvestorParams,
} from '@mantle-rwa/sdk';

// All parameters and return types are fully typed
const params: MintParams = {
  to: '0x...',
  amount: '1000',
};

const result: TransactionReceipt = await token.mint(params);
```

## Next Steps

- [RWAClient Reference](/docs/api/sdk/rwa-client) - Main SDK client
- [React Components](/docs/api/react/overview) - UI components
- [Smart Contracts](/docs/api/contracts/overview) - Contract reference
