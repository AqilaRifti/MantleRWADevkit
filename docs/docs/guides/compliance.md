---
sidebar_position: 3
title: Compliance
description: Guide to configuring compliance rules and transfer restrictions
keywords: [compliance, transfer restrictions, regulations, guide]
---

# Compliance Configuration

This guide covers setting up compliance rules and transfer restrictions for your RWA tokens.

## Overview

The compliance module enforces:
- Maximum holder limits
- Investment minimums/maximums
- Accreditation requirements
- Country restrictions
- Lockup periods
- Transfer limits

## Basic Setup

```typescript
import { RWAClient } from '@mantle-rwa/sdk';

const client = new RWAClient({
  network: 'mantle-sepolia',
  privateKey: process.env.PRIVATE_KEY,
});

const compliance = client.compliance('0xComplianceAddress');
```

## Configuring Rules

### Maximum Holders

```typescript
await compliance.setRule({
  id: 'max_holders',
  name: 'Maximum Holders',
  type: 'max_holders',
  enabled: true,
  parameters: { maxHolders: 500 },
});
```

### Investment Limits

```typescript
await compliance.setRule({
  id: 'investment_limits',
  name: 'Investment Limits',
  type: 'min_max_investment',
  enabled: true,
  parameters: {
    minInvestment: '1000',
    maxInvestment: '100000',
  },
});
```

### Accreditation Requirements

```typescript
await compliance.setRule({
  id: 'accreditation',
  name: 'Accredited Investors Only',
  type: 'accreditation',
  enabled: true,
  parameters: { minLevel: 'accredited' },
});
```

### Country Restrictions

```typescript
await compliance.setCountryRestrictions({
  mode: 'blocklist',
  countries: ['CN', 'KP', 'IR', 'CU', 'SY'],
});
```

### Lockup Period

```typescript
// 1 year lockup
await compliance.setLockupPeriod(365 * 24 * 60 * 60);
```

## Checking Compliance

```typescript
const check = await compliance.canTransfer(
  '0xFrom...',
  '0xTo...',
  '1000'
);

if (!check.allowed) {
  console.log('Transfer blocked:', check.reason);
  console.log('Failed rules:', check.failedRules);
}
```

## Exemptions

```typescript
// Exempt an address from a rule
await compliance.exemptFromRule('0xAddress...', 'max_holders');

// Remove exemption
await compliance.removeExemption('0xAddress...', 'max_holders');
```

## Compliance Reports

```typescript
const report = await compliance.generateReport();
console.log('Total holders:', report.totalHolders);
console.log('By country:', report.holdersByCountry);
console.log('Compliant:', report.summary.compliant);
```

## See Also

- [ComplianceModule API](/docs/api/sdk/compliance-module)
- [Security Best Practices](/docs/guides/security-best-practices)
