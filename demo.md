# Mantle RWA Devkit — Demo Guide

🔗 **Live Demo**: https://mantle-rwa-devkit-demo.vercel.app/

## Overview

The demo application showcases all major features of the Mantle RWA Devkit:

1. **KYC Verification Flow**
2. **Token Minting**
3. **Investor Dashboard**
4. **Yield Distribution**
5. **Transfer Restrictions**

## Prerequisites

- MetaMask or compatible wallet
- Mantle Sepolia testnet configured
- Test MNT tokens (from faucet)

## Demo Walkthrough

### 1. Connect Wallet

1. Visit https://mantle-rwa-devkit-demo.vercel.app/
2. Click "Connect Wallet"
3. Select MetaMask
4. Approve connection to Mantle Sepolia

### 2. KYC Verification

The KYC flow demonstrates the investor onboarding process:

1. Navigate to **KYC** section
2. Click "Start Verification"
3. (In demo mode, verification is simulated)
4. View your verification status and accreditation tier

**Accreditation Tiers:**
- `Retail` — Basic verified investor
- `Accredited` — Meets accredited investor criteria
- `Institutional` — Institutional investor

### 3. Token Operations

#### Viewing Token Info
- See token name, symbol, total supply
- View your token balance
- Check if you're eligible to receive tokens

#### Minting Tokens (Admin)
1. Navigate to **Mint** section
2. Enter recipient address
3. Enter amount
4. Click "Mint Tokens"
5. Confirm transaction in wallet

> Note: Only addresses with ISSUER_ROLE can mint. Recipients must be KYC verified.

### 4. Investor Dashboard

The dashboard shows:
- Current token balance
- Verification status
- Pending yield claims
- Transaction history

### 5. Yield Calculator

Estimate your yield based on:
- Token holdings
- Distribution amount
- Your proportional share

```
Your Yield = (Your Balance / Total Supply) × Distribution Amount
```

### 6. Transfer Restrictions Demo

Try transferring tokens to see compliance in action:

**Allowed:**
- KYC verified sender → KYC verified recipient ✅

**Blocked:**
- Unverified sender → Any recipient ❌
- Any sender → Unverified recipient ❌
- Expired KYC → Any transfer ❌

## Code Examples

### Initialize Client

```typescript
import { RWAClient } from '@mantle-rwa/sdk';

const client = new RWAClient({
  network: 'mantle-sepolia',
  privateKey: process.env.PRIVATE_KEY,
});
```

### Check KYC Status

```typescript
const registry = client.kyc.connect(REGISTRY_ADDRESS);
const isVerified = await registry.isVerified(walletAddress);
const info = await registry.getInvestorInfo(walletAddress);

console.log('Verified:', isVerified);
console.log('Tier:', info.tier);
console.log('Expires:', info.expiry);
```

### Mint Tokens

```typescript
const token = client.token.connect(TOKEN_ADDRESS);
const result = await token.mint(recipientAddress, '1000');

console.log('TX Hash:', result.transactionHash);
```

### Create Yield Distribution

```typescript
const distributor = client.yield.connect(DISTRIBUTOR_ADDRESS);

const result = await distributor.createDistribution(
  USDC_ADDRESS,      // Payment token
  '100000000000',    // 100,000 USDC (6 decimals)
  30                 // 30-day claim window
);

console.log('Distribution ID:', result.events[0].args.distributionId);
```

### Claim Yield

```typescript
const claimable = await distributor.getClaimableAmount(distributionId, myAddress);
console.log('Claimable:', claimable);

if (claimable > 0n) {
  await distributor.claim(distributionId);
}
```

## React Components

### KYC Flow

```tsx
import { KYCFlow } from '@mantle-rwa/react';

<KYCFlow
  registryAddress={REGISTRY_ADDRESS}
  onComplete={(tier) => console.log('Verified:', tier)}
  onError={(err) => console.error(err)}
/>
```

### Investor Dashboard

```tsx
import { InvestorDashboard } from '@mantle-rwa/react';

<InvestorDashboard
  tokenAddress={TOKEN_ADDRESS}
  registryAddress={REGISTRY_ADDRESS}
  distributorAddress={DISTRIBUTOR_ADDRESS}
/>
```

### Token Mint Form

```tsx
import { TokenMintForm } from '@mantle-rwa/react';

<TokenMintForm
  tokenAddress={TOKEN_ADDRESS}
  onSuccess={(result) => console.log('Minted:', result)}
/>
```

## Testnet Addresses

| Contract | Address |
|----------|---------|
| RWAToken | `0x...` (deployed on demo) |
| KYCRegistry | `0x...` (deployed on demo) |
| YieldDistributor | `0x...` (deployed on demo) |

## Troubleshooting

### "Sender not KYC verified"
Your wallet isn't registered in the KYC registry. Complete the KYC flow first.

### "Recipient not KYC verified"
The recipient address isn't KYC verified. They need to complete verification.

### "Transfer restricted"
A compliance module is blocking the transfer. Check:
- Accreditation requirements
- Jurisdiction restrictions
- Lock-up periods

### Transaction fails
- Ensure you have enough MNT for gas
- Check you're on Mantle Sepolia network
- Verify contract addresses are correct

## Links

- **Documentation**: https://mantle-rwa-devkit-docs.vercel.app/
- **GitHub**: https://github.com/AqilaRifti/MantleRWADevkit
- **Mantle Faucet**: https://faucet.sepolia.mantle.xyz/
