---
sidebar_position: 2
title: Troubleshooting
description: Common issues and solutions
keywords: [troubleshooting, errors, help]
---

# Troubleshooting

Common issues and their solutions when using the Mantle RWA SDK.

## Installation Issues

### Module not found errors

```
Error: Cannot find module '@mantle-rwa/sdk'
```

**Solution**: Ensure you've installed the package:
```bash
npm install @mantle-rwa/sdk
```

### TypeScript errors

```
Cannot find type definitions
```

**Solution**: The SDK includes TypeScript definitions. Ensure your `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

## Connection Issues

### Invalid private key

```
Error: Invalid private key format
```

**Solution**: Ensure your private key:
- Starts with `0x`
- Is 66 characters long
- Contains only hexadecimal characters

### Network connection failed

```
Error: Could not connect to network
```

**Solution**:
1. Check your internet connection
2. Verify the RPC URL is correct
3. Try a different RPC endpoint

## Transaction Issues

### Insufficient funds

```
Error: Insufficient funds for gas
```

**Solution**: Ensure your wallet has enough MNT for gas fees. Get testnet tokens from the [faucet](https://faucet.sepolia.mantle.xyz/).

### Transaction reverted

```
Error: Transaction reverted
```

**Solution**: Check the revert reason:
- KYC not verified
- Compliance rule violation
- Insufficient token balance
- Contract paused

### Gas estimation failed

```
Error: Gas estimation failed
```

**Solution**: The transaction would fail. Check:
- Input parameters are valid
- You have required permissions
- Contract state allows the operation

## Compliance Issues

### Transfer blocked

```
ComplianceError: Transfer not allowed
```

**Solution**: Check compliance rules:
```typescript
const check = await compliance.canTransfer(from, to, amount);
console.log('Reason:', check.reason);
console.log('Failed rules:', check.failedRules);
```

### KYC verification failed

```
KYCError: Investor not verified
```

**Solution**: Verify the investor before minting/transferring:
```typescript
await kyc.verifyInvestor({
  address: investorAddress,
  accreditationLevel: 'accredited',
  country: 'US',
});
```

## React Component Issues

### Provider not found

```
Error: useRWA must be used within RWAProvider
```

**Solution**: Wrap your app with `RWAProvider`:
```tsx
<RWAProvider config={{ network: 'mantle-sepolia' }}>
  <App />
</RWAProvider>
```

### Hydration mismatch

```
Warning: Hydration failed
```

**Solution**: Use `'use client'` directive for components using hooks:
```tsx
'use client';
import { useRWA } from '@mantle-rwa/react';
```

## Getting Help

If you can't resolve your issue:

1. Check the [FAQ](/docs/resources/faq)
2. Search [GitHub Issues](https://github.com/mantle-network/mantle-rwa-sdk/issues)
3. Ask in [Discord](https://discord.gg/0xMantle)
4. Open a new issue with details
