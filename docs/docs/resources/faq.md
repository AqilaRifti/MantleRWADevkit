---
sidebar_position: 1
title: FAQ
description: Frequently asked questions about the Mantle RWA SDK
keywords: [faq, questions, help]
---

# Frequently Asked Questions

## General

### What is the Mantle RWA SDK?

The Mantle RWA SDK is a comprehensive toolkit for tokenizing real-world assets on Mantle Network. It includes smart contracts, a TypeScript SDK, and React components for building compliant RWA platforms.

### What types of assets can I tokenize?

You can tokenize various real-world assets including:
- Real estate (commercial, residential)
- Private equity and venture capital
- Commodities (precious metals, agricultural)
- Art and collectibles
- Revenue-sharing agreements

### Is the SDK production-ready?

Yes, the SDK is production-ready with:
- Audited smart contracts
- Comprehensive test coverage
- Gas-optimized implementations
- Active maintenance and support

## Technical

### Which networks are supported?

- **Mantle Mainnet** (Chain ID: 5000)
- **Mantle Sepolia Testnet** (Chain ID: 5003)

### What compliance standards does it support?

The SDK implements ERC-3643 (T-REX), the standard for security tokens, which includes:
- Identity verification (KYC/AML)
- Transfer restrictions
- Compliance modules
- Token recovery

### Can I upgrade the contracts?

Yes, all contracts use the UUPS proxy pattern for upgradeability. Only addresses with the admin role can perform upgrades.

### How do I handle gas fees?

The SDK automatically estimates gas. You can also configure custom gas settings:

```typescript
const client = new RWAClient({
  network: 'mantle-sepolia',
  privateKey: process.env.PRIVATE_KEY,
  gas: {
    maxFeePerGas: 2000000000n,
  },
});
```

## KYC & Compliance

### Which KYC providers are supported?

- Persona
- Synaps
- Jumio
- Sum&Substance

### Can I use my own KYC provider?

Yes, you can integrate custom KYC providers by implementing the verification webhook handler.

### How do I handle different jurisdictions?

Use the compliance module to set country restrictions:

```typescript
await compliance.setCountryRestrictions({
  mode: 'blocklist',
  countries: ['CN', 'KP', 'IR'],
});
```

## Yield Distribution

### How are yields calculated?

Yields are distributed proportionally based on token holdings at the snapshot block.

### What payment tokens are supported?

Any ERC-20 token can be used for yield payments. Common choices include USDC and USDT.

### Can investors auto-compound yields?

Currently, investors must manually claim yields. Auto-compounding can be implemented at the application level.

## Support

### Where can I get help?

- [GitHub Discussions](https://github.com/AqilaRifti/MantleRWADevkit/discussions)
- [GitHub Issues](https://github.com/AqilaRifti/MantleRWADevkit/issues)
- [Documentation](/docs/intro)

### How do I report a bug?

Open an issue on [GitHub](https://github.com/AqilaRifti/MantleRWADevkit/issues) with:
- SDK version
- Steps to reproduce
- Expected vs actual behavior
- Error messages

### Is there a bug bounty program?

Yes, we have an active bug bounty program. See our [security policy](https://github.com/AqilaRifti/MantleRWADevkit/security) for details.
