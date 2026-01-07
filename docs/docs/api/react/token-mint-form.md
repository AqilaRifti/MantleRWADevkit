---
sidebar_position: 4
title: TokenMintForm
description: Token minting interface component
keywords: [mint, form, token, react]
---

# TokenMintForm

The `TokenMintForm` component provides an interface for minting tokens to verified investors.

## Import

```tsx
import { TokenMintForm } from '@mantle-rwa/react';
```

## Basic Usage

```tsx
<TokenMintForm
  tokenAddress="0x..."
  onSuccess={(tx) => console.log('Minted:', tx)}
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `tokenAddress` | `string` | Yes | Address of the RWA token |
| `onSuccess` | `(tx: TransactionReceipt) => void` | No | Callback on successful mint |
| `onError` | `(error: Error) => void` | No | Callback on error |
| `maxAmount` | `string` | No | Maximum mintable amount |
| `showKYCCheck` | `boolean` | No | Show KYC verification status |
| `batchMode` | `boolean` | No | Enable batch minting |
| `className` | `string` | No | Additional CSS class |

## Examples

### Single Mint

```tsx
<TokenMintForm
  tokenAddress="0x..."
  onSuccess={(tx) => {
    toast.success('Tokens minted successfully!');
    refetchBalance();
  }}
  onError={(error) => {
    toast.error(error.message);
  }}
/>
```

### Batch Minting

```tsx
<TokenMintForm
  tokenAddress="0x..."
  batchMode={true}
  onSuccess={(tx) => {
    console.log('Batch mint complete:', tx);
  }}
/>
```

### With KYC Check

```tsx
<TokenMintForm
  tokenAddress="0x..."
  showKYCCheck={true}
  kycRegistryAddress="0x..."
/>
```

### With Amount Limits

```tsx
<TokenMintForm
  tokenAddress="0x..."
  maxAmount="100000"
  minAmount="100"
/>
```

## Form Fields

### Single Mode

- **Recipient Address**: Wallet address to receive tokens
- **Amount**: Number of tokens to mint
- **Memo** (optional): Transaction memo

### Batch Mode

- **CSV Upload**: Upload CSV with addresses and amounts
- **Manual Entry**: Add multiple recipients manually
- **Preview**: Review before submitting

## Validation

The form automatically validates:

- Valid Ethereum address format
- Recipient KYC status (if enabled)
- Amount within min/max limits
- Compliance rule checks
- Sufficient minter permissions

## Customization

### Custom Fields

```tsx
<TokenMintForm
  tokenAddress="0x..."
  additionalFields={[
    {
      name: 'investorId',
      label: 'Investor ID',
      type: 'text',
      required: true,
    },
  ]}
/>
```

### Custom Validation

```tsx
<TokenMintForm
  tokenAddress="0x..."
  validate={async (values) => {
    const errors = {};
    if (values.amount > maxAllowed) {
      errors.amount = 'Exceeds maximum allowed';
    }
    return errors;
  }}
/>
```

## Styling

### CSS Variables

```css
.rwa-mint-form {
  --form-background: #1A1A1A;
  --form-input-bg: #2D2D2D;
  --form-border-radius: 8px;
  --form-spacing: 1rem;
}
```

### Class Names

| Class | Description |
|-------|-------------|
| `.rwa-mint-form` | Root container |
| `.rwa-mint-input` | Input fields |
| `.rwa-mint-button` | Submit button |
| `.rwa-mint-preview` | Batch preview |
| `.rwa-mint-error` | Error messages |

## See Also

- [TokenModule](/docs/api/sdk/token-module)
- [KYCModule](/docs/api/sdk/kyc-module)
