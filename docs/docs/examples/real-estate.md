---
sidebar_position: 1
title: Real Estate Tokenization
description: Complete example of tokenizing real estate properties
keywords: [real estate, property, tokenization, example]
---

# Real Estate Tokenization

This example demonstrates how to tokenize a real estate property using the Mantle RWA SDK.

## Overview

We'll create a tokenized real estate investment that:
- Represents fractional ownership of a property
- Distributes rental income as yield
- Enforces accredited investor requirements
- Supports secondary market trading

## Step 1: Deploy the Token

```typescript
import { RWAClient } from '@mantle-rwa/sdk';

const client = new RWAClient({
  network: 'mantle-sepolia',
  privateKey: process.env.PRIVATE_KEY,
});

const deployment = await client.deployRWASystem({
  tokenName: 'Manhattan Office Tower',
  tokenSymbol: 'MOT',
  initialSupply: '10000000', // 10M tokens = $10M property
  
  compliance: {
    maxHolders: 2000,
    minInvestment: '1000', // $1,000 minimum
    maxInvestment: '500000', // $500,000 maximum
    accreditedOnly: true,
    lockupPeriod: 365 * 24 * 60 * 60, // 1 year
  },
  
  yield: {
    paymentToken: '0xUSDC...',
    distributionFrequency: 'quarterly',
  },
});

console.log('Token:', deployment.token.address);
```

## Step 2: Configure KYC

```typescript
const kyc = deployment.kycRegistry;

// Configure Persona for KYC
await kyc.configureProvider({
  provider: 'persona',
  apiKey: process.env.PERSONA_API_KEY,
  templateId: 'tmpl_real_estate',
});
```

## Step 3: Verify Investors

```typescript
// Verify an accredited investor
await kyc.verifyInvestor({
  address: '0xInvestor1...',
  accreditationLevel: 'accredited',
  country: 'US',
  expirationDate: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
});
```

## Step 4: Mint Tokens

```typescript
const token = deployment.token;

// Mint tokens to verified investors
await token.batchMint([
  { to: '0xInvestor1...', amount: '100000' }, // $100,000
  { to: '0xInvestor2...', amount: '50000' },  // $50,000
  { to: '0xInvestor3...', amount: '25000' },  // $25,000
]);
```

## Step 5: Distribute Rental Income

```typescript
const yieldModule = deployment.yieldDistributor;

// Quarterly rental income distribution
await yieldModule.distribute({
  amount: '250000', // $250,000 quarterly rental income
  paymentToken: '0xUSDC...',
  memo: 'Q1 2025 Rental Income',
});
```

## Complete Example

See the full implementation in our [example repository](https://github.com/mantle-network/mantle-rwa-sdk/tree/main/examples/real-estate).

## See Also

- [Private Equity Example](/docs/examples/private-equity)
- [Full-Stack App Example](/docs/examples/full-stack-app)
