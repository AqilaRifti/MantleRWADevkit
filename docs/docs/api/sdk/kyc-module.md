---
sidebar_position: 3
title: KYCModule
description: KYC verification and investor accreditation management
keywords: [kyc, verification, accreditation, compliance]
---

# KYCModule

The `KYCModule` provides methods for managing investor KYC verification and accreditation status.

## Getting an Instance

```typescript
import { RWAClient } from '@mantle-rwa/sdk';

const client = new RWAClient({ network: 'mantle-sepolia', privateKey: '...' });

// From deployment
const deployment = await client.deployRWASystem({ ... });
const kyc = deployment.kycRegistry;

// From existing address
const kyc = client.kyc('0x1234...');
```

## Properties

### `address`

The contract address of the KYC registry.

```typescript
const address: string = kyc.address;
```

## Read Methods

### `isVerified`

Checks if an address is KYC verified.

```typescript
const verified = await kyc.isVerified(address: string): Promise<boolean>;
```

#### Example

```typescript
const isVerified = await kyc.isVerified('0x1234...');
if (isVerified) {
  console.log('Investor is verified');
}
```

### `getInvestor`

Returns the full investor record.

```typescript
const investor = await kyc.getInvestor(address: string): Promise<InvestorRecord>;
```

#### Returns

```typescript
interface InvestorRecord {
  address: string;
  verified: boolean;
  accreditationLevel: AccreditationLevel;
  country: string;
  verificationDate: number;
  expirationDate: number;
  metadata: Record<string, string>;
}

type AccreditationLevel = 'none' | 'retail' | 'qualified' | 'accredited' | 'institutional';
```

#### Example

```typescript
const investor = await kyc.getInvestor('0x1234...');
console.log('Accreditation:', investor.accreditationLevel);
console.log('Country:', investor.country);
console.log('Expires:', new Date(investor.expirationDate * 1000));
```

### `getAccreditationLevel`

Returns the accreditation level of an investor.

```typescript
const level = await kyc.getAccreditationLevel(address: string): Promise<AccreditationLevel>;
```

### `isAccredited`

Checks if an investor has accredited status or higher.

```typescript
const accredited = await kyc.isAccredited(address: string): Promise<boolean>;
```

### `getVerifiedCount`

Returns the total number of verified investors.

```typescript
const count = await kyc.getVerifiedCount(): Promise<number>;
```

### `isExpired`

Checks if an investor's verification has expired.

```typescript
const expired = await kyc.isExpired(address: string): Promise<boolean>;
```

## Write Methods

### `verifyInvestor`

Verifies an investor and sets their accreditation level.

```typescript
const tx = await kyc.verifyInvestor(params: VerifyInvestorParams, options?: TxOptions): Promise<TransactionReceipt>;
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | `string` | Yes | Investor wallet address |
| `accreditationLevel` | `AccreditationLevel` | Yes | Accreditation level |
| `country` | `string` | Yes | ISO country code |
| `expirationDate` | `number` | No | Unix timestamp for expiration |
| `metadata` | `Record<string, string>` | No | Additional metadata |

#### Example

```typescript
const tx = await kyc.verifyInvestor({
  address: '0x1234...',
  accreditationLevel: 'accredited',
  country: 'US',
  expirationDate: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year
  metadata: {
    verificationId: 'persona_123',
    verifiedBy: 'Persona',
  },
});
```

#### Errors

| Error | Condition |
|-------|-----------|
| `UnauthorizedError` | Caller doesn't have verifier role |
| `InvalidAddressError` | Invalid wallet address |
| `AlreadyVerifiedError` | Investor is already verified |

### `batchVerify`

Verifies multiple investors in a single transaction.

```typescript
const tx = await kyc.batchVerify(investors: VerifyInvestorParams[], options?: TxOptions): Promise<TransactionReceipt>;
```

#### Example

```typescript
const tx = await kyc.batchVerify([
  { address: '0x1111...', accreditationLevel: 'accredited', country: 'US' },
  { address: '0x2222...', accreditationLevel: 'qualified', country: 'UK' },
  { address: '0x3333...', accreditationLevel: 'retail', country: 'DE' },
]);
```

### `updateAccreditation`

Updates an investor's accreditation level.

```typescript
const tx = await kyc.updateAccreditation(
  address: string,
  level: AccreditationLevel,
  options?: TxOptions
): Promise<TransactionReceipt>;
```

#### Example

```typescript
// Upgrade to accredited
await kyc.updateAccreditation('0x1234...', 'accredited');

// Downgrade to retail
await kyc.updateAccreditation('0x1234...', 'retail');
```

### `revokeVerification`

Revokes an investor's verification status.

```typescript
const tx = await kyc.revokeVerification(address: string, options?: TxOptions): Promise<TransactionReceipt>;
```

#### Example

```typescript
await kyc.revokeVerification('0x1234...');
```

### `renewVerification`

Extends an investor's verification expiration date.

```typescript
const tx = await kyc.renewVerification(
  address: string,
  newExpirationDate: number,
  options?: TxOptions
): Promise<TransactionReceipt>;
```

#### Example

```typescript
// Extend by 1 year
const newExpiration = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
await kyc.renewVerification('0x1234...', newExpiration);
```

## Provider Integration

### `configureProvider`

Configures a KYC provider for automated verification.

```typescript
const tx = await kyc.configureProvider(config: ProviderConfig, options?: TxOptions): Promise<TransactionReceipt>;
```

#### Supported Providers

| Provider | Description |
|----------|-------------|
| `persona` | Persona identity verification |
| `synaps` | Synaps KYC/AML |
| `jumio` | Jumio identity verification |
| `sumsub` | Sum&Substance verification |

#### Example

```typescript
await kyc.configureProvider({
  provider: 'persona',
  apiKey: process.env.PERSONA_API_KEY,
  templateId: 'tmpl_...',
  webhookUrl: 'https://your-app.com/webhooks/kyc',
});
```

### `processWebhook`

Processes a webhook from a KYC provider.

```typescript
const result = await kyc.processWebhook(payload: WebhookPayload): Promise<WebhookResult>;
```

## Events

### Subscribing to Events

```typescript
// Investor verified
kyc.on('InvestorVerified', (address, level, country) => {
  console.log(`Verified: ${address} as ${level} from ${country}`);
});

// Verification revoked
kyc.on('VerificationRevoked', (address, reason) => {
  console.log(`Revoked: ${address} - ${reason}`);
});

// Accreditation updated
kyc.on('AccreditationUpdated', (address, oldLevel, newLevel) => {
  console.log(`Updated: ${address} from ${oldLevel} to ${newLevel}`);
});
```

## Accreditation Levels

| Level | Description | Typical Requirements |
|-------|-------------|---------------------|
| `none` | Not verified | - |
| `retail` | Basic verification | ID verification |
| `qualified` | Qualified purchaser | Net worth > $5M |
| `accredited` | Accredited investor | Income > $200K or net worth > $1M |
| `institutional` | Institutional investor | Registered institution |

## See Also

- [RWAClient](/docs/api/sdk/rwa-client)
- [TokenModule](/docs/api/sdk/token-module)
- [KYC Integration Guide](/docs/guides/kyc-integration)
