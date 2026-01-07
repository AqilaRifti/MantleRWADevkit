---
sidebar_position: 5
title: ComplianceModule
description: Transfer restrictions and compliance rule management
keywords: [compliance, transfer restrictions, rules, regulations]
---

# ComplianceModule

The `ComplianceModule` provides methods for managing transfer restrictions and compliance rules for RWA tokens.

## Getting an Instance

```typescript
import { RWAClient } from '@mantle-rwa/sdk';

const client = new RWAClient({ network: 'mantle-sepolia', privateKey: '...' });

// From deployment
const deployment = await client.deployRWASystem({ ... });
const compliance = deployment.complianceModule;

// From existing address
const compliance = client.compliance('0x1234...');
```

## Properties

### `address`

The contract address of the compliance module.

```typescript
const address: string = compliance.address;
```

## Read Methods

### `canTransfer`

Checks if a transfer is allowed under current compliance rules.

```typescript
const result = await compliance.canTransfer(
  from: string,
  to: string,
  amount: string
): Promise<TransferCheckResult>;
```

#### Returns

```typescript
interface TransferCheckResult {
  allowed: boolean;
  reason?: string;
  failedRules: string[];
}
```

#### Example

```typescript
const check = await compliance.canTransfer('0xFrom...', '0xTo...', '1000');

if (check.allowed) {
  console.log('Transfer is allowed');
} else {
  console.log('Transfer blocked:', check.reason);
  console.log('Failed rules:', check.failedRules);
}
```

### `getComplianceRules`

Returns all active compliance rules.

```typescript
const rules = await compliance.getComplianceRules(): Promise<ComplianceRule[]>;
```

#### Returns

```typescript
interface ComplianceRule {
  id: string;
  name: string;
  type: RuleType;
  enabled: boolean;
  parameters: Record<string, any>;
}

type RuleType = 
  | 'max_holders'
  | 'min_investment'
  | 'max_investment'
  | 'accreditation'
  | 'country_restriction'
  | 'lockup_period'
  | 'transfer_limit'
  | 'custom';
```

### `isCountryAllowed`

Checks if a country is allowed for investment.

```typescript
const allowed = await compliance.isCountryAllowed(countryCode: string): Promise<boolean>;
```

#### Example

```typescript
const usAllowed = await compliance.isCountryAllowed('US');
const cnAllowed = await compliance.isCountryAllowed('CN');
```

### `getHolderCount`

Returns the current number of token holders.

```typescript
const count = await compliance.getHolderCount(): Promise<number>;
```

### `getLockupEndDate`

Returns the lockup end date for an address.

```typescript
const endDate = await compliance.getLockupEndDate(address: string): Promise<number>;
```

### `isInLockup`

Checks if an address is currently in lockup period.

```typescript
const inLockup = await compliance.isInLockup(address: string): Promise<boolean>;
```

### `getTransferLimit`

Returns the transfer limit for an address.

```typescript
const limit = await compliance.getTransferLimit(address: string): Promise<TransferLimit>;
```

#### Returns

```typescript
interface TransferLimit {
  dailyLimit: bigint;
  monthlyLimit: bigint;
  dailyUsed: bigint;
  monthlyUsed: bigint;
}
```

## Write Methods

### `setRule`

Adds or updates a compliance rule.

```typescript
const tx = await compliance.setRule(rule: ComplianceRule, options?: TxOptions): Promise<TransactionReceipt>;
```

#### Example

```typescript
// Set max holders rule
await compliance.setRule({
  id: 'max_holders',
  name: 'Maximum Holders',
  type: 'max_holders',
  enabled: true,
  parameters: { maxHolders: 500 },
});

// Set country restriction
await compliance.setRule({
  id: 'country_restriction',
  name: 'Country Restrictions',
  type: 'country_restriction',
  enabled: true,
  parameters: {
    blockedCountries: ['CN', 'KP', 'IR'],
  },
});
```

### `enableRule`

Enables a compliance rule.

```typescript
const tx = await compliance.enableRule(ruleId: string, options?: TxOptions): Promise<TransactionReceipt>;
```

### `disableRule`

Disables a compliance rule.

```typescript
const tx = await compliance.disableRule(ruleId: string, options?: TxOptions): Promise<TransactionReceipt>;
```

### `setCountryRestrictions`

Sets country-level restrictions.

```typescript
const tx = await compliance.setCountryRestrictions(
  config: CountryConfig,
  options?: TxOptions
): Promise<TransactionReceipt>;
```

#### Parameters

```typescript
interface CountryConfig {
  mode: 'allowlist' | 'blocklist';
  countries: string[];
}
```

#### Example

```typescript
// Block specific countries
await compliance.setCountryRestrictions({
  mode: 'blocklist',
  countries: ['CN', 'KP', 'IR', 'CU'],
});

// Allow only specific countries
await compliance.setCountryRestrictions({
  mode: 'allowlist',
  countries: ['US', 'UK', 'DE', 'FR', 'JP'],
});
```

### `setLockupPeriod`

Sets the lockup period for new token holders.

```typescript
const tx = await compliance.setLockupPeriod(
  periodInSeconds: number,
  options?: TxOptions
): Promise<TransactionReceipt>;
```

#### Example

```typescript
// 1 year lockup
await compliance.setLockupPeriod(365 * 24 * 60 * 60);

// 6 month lockup
await compliance.setLockupPeriod(180 * 24 * 60 * 60);
```

### `setTransferLimits`

Sets transfer limits for addresses.

```typescript
const tx = await compliance.setTransferLimits(
  limits: TransferLimitConfig,
  options?: TxOptions
): Promise<TransactionReceipt>;
```

#### Parameters

```typescript
interface TransferLimitConfig {
  dailyLimit?: string;
  monthlyLimit?: string;
  perTransactionLimit?: string;
}
```

### `exemptFromRule`

Exempts an address from a specific rule.

```typescript
const tx = await compliance.exemptFromRule(
  address: string,
  ruleId: string,
  options?: TxOptions
): Promise<TransactionReceipt>;
```

### `removeExemption`

Removes an exemption from an address.

```typescript
const tx = await compliance.removeExemption(
  address: string,
  ruleId: string,
  options?: TxOptions
): Promise<TransactionReceipt>;
```

## Compliance Reports

### `generateReport`

Generates a compliance report.

```typescript
const report = await compliance.generateReport(options?: ReportOptions): Promise<ComplianceReport>;
```

#### Returns

```typescript
interface ComplianceReport {
  generatedAt: number;
  tokenAddress: string;
  totalHolders: number;
  holdersByCountry: Record<string, number>;
  holdersByAccreditation: Record<string, number>;
  activeRules: ComplianceRule[];
  recentViolations: Violation[];
  summary: {
    compliant: boolean;
    issues: string[];
  };
}
```

#### Example

```typescript
const report = await compliance.generateReport();
console.log('Total holders:', report.totalHolders);
console.log('By country:', report.holdersByCountry);
console.log('Compliant:', report.summary.compliant);
```

## Events

### Subscribing to Events

```typescript
// Transfer blocked
compliance.on('TransferBlocked', (from, to, amount, reason) => {
  console.log(`Transfer blocked: ${from} -> ${to}, reason: ${reason}`);
});

// Rule updated
compliance.on('RuleUpdated', (ruleId, enabled) => {
  console.log(`Rule ${ruleId} ${enabled ? 'enabled' : 'disabled'}`);
});

// Exemption granted
compliance.on('ExemptionGranted', (address, ruleId) => {
  console.log(`${address} exempted from ${ruleId}`);
});
```

## Built-in Rules

| Rule | Description | Parameters |
|------|-------------|------------|
| `max_holders` | Limits total number of holders | `maxHolders: number` |
| `min_investment` | Minimum investment amount | `minAmount: string` |
| `max_investment` | Maximum investment amount | `maxAmount: string` |
| `accreditation` | Requires accreditation level | `minLevel: AccreditationLevel` |
| `country_restriction` | Country-based restrictions | `mode, countries` |
| `lockup_period` | Transfer lockup period | `periodInSeconds: number` |
| `transfer_limit` | Daily/monthly transfer limits | `dailyLimit, monthlyLimit` |

## See Also

- [RWAClient](/docs/api/sdk/rwa-client)
- [KYCModule](/docs/api/sdk/kyc-module)
- [Compliance Guide](/docs/guides/compliance)
