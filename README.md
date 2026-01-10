# Mantle RWA Devkit

A comprehensive SDK for tokenizing real-world assets (RWA) on Mantle Network with built-in regulatory compliance.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Mantle](https://img.shields.io/badge/Mantle-Network-green)](https://mantle.xyz/)

🔗 **[Documentation](https://mantle-rwa-devkit-docs.vercel.app/)** | **[Live Demo](https://mantle-rwa-devkit-demo.vercel.app/)** | **[GitHub](https://github.com/AqilaRifti/MantleRWADevkit)**

## Overview

Mantle RWA Devkit provides everything you need to build compliant security token platforms:

- **Smart Contracts** — ERC-3643 compliant tokens with KYC/AML enforcement
- **TypeScript SDK** — Full-featured SDK for contract interactions
- **React Components** — Pre-built UI for KYC, minting, and yield distribution
- **Documentation** — Comprehensive guides and API reference

## Quick Start

```bash
# Install the SDK
npm install @mantle-rwa/sdk @mantle-rwa/react

# Or with pnpm
pnpm add @mantle-rwa/sdk @mantle-rwa/react
```

```typescript
import { RWAClient } from '@mantle-rwa/sdk';

const client = new RWAClient({
  network: 'mantle-sepolia',
  privateKey: process.env.PRIVATE_KEY,
});

// Deploy a complete RWA system
const deployment = await client.deployRWASystem({
  tokenName: 'Real Estate Token',
  tokenSymbol: 'RET',
  initialSupply: '1000000',
});

console.log('Token deployed:', deployment.token.address);
```

## Packages

| Package | Description |
|---------|-------------|
| `@mantle-rwa/sdk` | Core TypeScript SDK |
| `@mantle-rwa/react` | React components |
| `@mantle-rwa/contracts` | Smart contracts |

## Key Features

### Compliance-First Design
- Built on ERC-3643 (T-REX) standard
- On-chain KYC registry with expiring verifications
- Modular compliance rules
- Accreditation tier enforcement (Retail, Accredited, Institutional)

### Production Ready
- Audited smart contracts
- UUPS upgradeable proxies
- Gas-optimized implementations
- Comprehensive test coverage

### Developer Experience
- Full TypeScript support with type inference
- React components with dark/light themes
- Event listeners for real-time updates
- Detailed error messages

### Mantle Optimized
- Low transaction costs
- Fast finality
- Ethereum compatibility

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Your Application                        │
├─────────────────────────────────────────────────────────────┤
│                    React Components                          │
│  ┌──────────┐ ┌──────────────┐ ┌────────────┐ ┌──────────┐ │
│  │ KYCFlow  │ │InvestorDash  │ │ MintForm   │ │YieldCalc │ │
│  └──────────┘ └──────────────┘ └────────────┘ └──────────┘ │
├─────────────────────────────────────────────────────────────┤
│                     TypeScript SDK                           │
│  ┌──────────┐ ┌──────────────┐ ┌────────────┐ ┌──────────┐ │
│  │  Token   │ │     KYC      │ │   Yield    │ │Compliance│ │
│  │  Module  │ │    Module    │ │   Module   │ │  Module  │ │
│  └──────────┘ └──────────────┘ └────────────┘ └──────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Smart Contracts                           │
│  ┌──────────┐ ┌──────────────┐ ┌────────────┐ ┌──────────┐ │
│  │ RWAToken │ │ KYCRegistry  │ │YieldDistrib│ │AssetVault│ │
│  └──────────┘ └──────────────┘ └────────────┘ └──────────┘ │
├─────────────────────────────────────────────────────────────┤
│                     Mantle Network                           │
└─────────────────────────────────────────────────────────────┘
```

## Development

```bash
# Clone the repository
git clone https://github.com/AqilaRifti/MantleRWADevkit.git
cd MantleRWADevkit

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Start the example app
cd example-web-app
pnpm dev
```

## Documentation

- [Getting Started](https://mantle-rwa-devkit-docs.vercel.app/docs/getting-started/quick-start)
- [API Reference](https://mantle-rwa-devkit-docs.vercel.app/docs/api/overview)
- [Smart Contracts](https://mantle-rwa-devkit-docs.vercel.app/docs/contracts/overview)
- [React Components](https://mantle-rwa-devkit-docs.vercel.app/docs/react/overview)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

**Aqila Rifti**

- GitHub: [@AqilaRifti](https://github.com/AqilaRifti)

## Links

- [Documentation](https://mantle-rwa-devkit-docs.vercel.app/)
- [Live Demo](https://mantle-rwa-devkit-demo.vercel.app/)
- [GitHub Repository](https://github.com/AqilaRifti/MantleRWADevkit)
- [Mantle Network](https://mantle.xyz/)
