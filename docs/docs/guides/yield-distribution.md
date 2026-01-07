---
sidebar_position: 2
title: Yield Distribution
description: Guide to distributing yield and dividends to token holders
keywords: [yield, dividends, distribution, guide]
---

# Yield Distribution

This guide covers setting up and managing yield distributions for your RWA token holders.

## Overview

The yield distribution system allows you to:
- Distribute dividends to token holders
- Support multiple payment tokens (USDC, USDT, etc.)
- Snapshot balances at distribution time
- Allow investors to claim their share

## Setup

### Initialize Yield Module

```typescript
import { RWAClient } from '@mantle-rwa/sdk';

const client = new RWAClient({
  network: 'mantle-sepolia',
  privateKey: process.env.PRIVATE_KEY,
});

const yieldModule = client.yield('0xYieldDistributorAddress');
```

### Configure Payment Token

```typescript
// Set USDC as the payment token
await yieldModule.setPaymentToken('0xUSDCAddress');
```

## Creating a Distribution

### Step 1: Approve Payment Tokens

```typescript
import { erc20Abi } from 'viem';

// Approve yield distributor to spend USDC
const usdc = client.publicClient.readContract({
  address: '0xUSDCAddress',
  abi: erc20Abi,
});

await client.walletClient.writeContract({
  address: '0xUSDCAddress',
  abi: erc20Abi,
  functionName: 'approve',
  args: ['0xYieldDistributorAddress', parseUnits('100000', 6)],
});
```

### Step 2: Preview Distribution

```typescript
const preview = await yieldModule.previewDistribution('100000');

console.log('Eligible holders:', preview.eligibleHolders);
console.log('Per token amount:', preview.perTokenAmount);
console.log('Breakdown:', preview.breakdown);
```

### Step 3: Execute Distribution

```typescript
const tx = await yieldModule.distribute({
  amount: '100000', // 100,000 USDC
  paymentToken: '0xUSDCAddress',
  memo: 'Q4 2024 Dividend',
});

console.log('Distribution ID:', tx.events.DistributionCreated.distributionId);
```

## Claiming Yield

### For Investors

```typescript
// Check claimable amount
const claimable = await yieldModule.getClaimableAmount(investorAddress);
console.log('Claimable:', claimable);

// Claim yield
await yieldModule.claim();
```

### Batch Claims

```typescript
// Claim from multiple distributions
await yieldModule.batchClaim([1, 2, 3, 4, 5]);
```

## Distribution Schedule

### Automated Distributions

```typescript
// Configure quarterly distributions
await yieldModule.setDistributionConfig({
  distributionFrequency: 'quarterly',
  autoDistribute: true,
  minDistributionAmount: '10000',
});
```

## Best Practices

1. **Preview before distributing** - Always preview to verify amounts
2. **Announce distributions** - Notify investors before distribution
3. **Set claim deadlines** - Configure expiration for unclaimed yield
4. **Keep records** - Maintain off-chain records for compliance

## See Also

- [YieldModule API](/docs/api/sdk/yield-module)
- [YieldCalculator Component](/docs/api/react/yield-calculator)
