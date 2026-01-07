---
sidebar_position: 2
title: Private Equity Tokenization
description: Example of tokenizing private equity fund shares
keywords: [private equity, fund, tokenization, example]
---

# Private Equity Tokenization

This example demonstrates tokenizing private equity fund shares with lock-up periods and dividend distributions.

## Overview

We'll create a tokenized PE fund that:
- Represents LP interests in a fund
- Enforces qualified purchaser requirements
- Implements 3-year lock-up period
- Distributes fund returns

## Deployment

```typescript
import { RWAClient } from '@mantle-rwa/sdk';

const client = new RWAClient({
  network: 'mantle-sepolia',
  privateKey: process.env.PRIVATE_KEY,
});

const deployment = await client.deployRWASystem({
  tokenName: 'Growth Equity Fund I',
  tokenSymbol: 'GEF1',
  initialSupply: '100000000', // $100M fund
  
  compliance: {
    maxHolders: 99, // Reg D 506(c) limit
    minInvestment: '250000', // $250K minimum
    accreditedOnly: true,
    lockupPeriod: 3 * 365 * 24 * 60 * 60, // 3 years
  },
});
```

## Investor Onboarding

```typescript
// Verify qualified purchaser
await kyc.verifyInvestor({
  address: '0xLP1...',
  accreditationLevel: 'qualified', // Qualified purchaser
  country: 'US',
  metadata: {
    investorType: 'individual',
    netWorth: '5000000+',
  },
});
```

## Capital Calls

```typescript
// Mint tokens for capital call
await token.mint({
  to: '0xLP1...',
  amount: '1000000', // $1M commitment
});
```

## Distributions

```typescript
// Distribute fund returns
await yieldModule.distribute({
  amount: '5000000', // $5M distribution
  paymentToken: '0xUSDC...',
  memo: 'Portfolio Exit - Company A',
});
```

## See Also

- [Real Estate Example](/docs/examples/real-estate)
- [Compliance Guide](/docs/guides/compliance)
