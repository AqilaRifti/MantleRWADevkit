---
sidebar_position: 1
title: Introduction
description: Welcome to the Mantle RWA SDK - the complete toolkit for building compliant real-world asset tokenization platforms on Mantle Network.
keywords: [mantle, rwa, sdk, tokenization, real-world assets, erc-3643]
---

# Mantle RWA SDK

Welcome to the Mantle RWA SDK documentation. This SDK provides everything you need to build compliant real-world asset (RWA) tokenization platforms on Mantle Network.

## What is Mantle RWA SDK?

The Mantle RWA SDK is a comprehensive toolkit for tokenizing real-world assets with built-in regulatory compliance. It includes:

- **Smart Contracts**: ERC-3643 (T-REX) compliant security token contracts with KYC/AML verification
- **TypeScript SDK**: Full-featured SDK for interacting with RWA contracts
- **React Components**: Pre-built UI components for common RWA operations
- **Documentation**: Comprehensive guides and API reference

## Key Features

### 🛡️ Compliance-First Design

Built on the ERC-3643 (T-REX) standard, the SDK ensures your tokens meet regulatory requirements:

- Built-in KYC/AML verification
- Modular compliance rules
- Transfer restrictions and whitelisting
- Accredited investor verification

### ⚡ Production Ready

Deploy with confidence using battle-tested infrastructure:

- Audited smart contracts
- Gas-optimized implementations
- UUPS upgradeable proxies
- Comprehensive test coverage

### 🔧 Developer Experience

Focus on building your product, not infrastructure:

- Full TypeScript support with type inference
- React components with dark/light themes
- Extensive documentation and examples
- Active community support

### 🌐 Mantle Optimized

Take advantage of Mantle Network's benefits:

- Low transaction costs
- Fast finality
- Ethereum compatibility
- Robust infrastructure

## Quick Example

```typescript
import { RWAClient } from '@mantle-rwa/sdk';

// Initialize the SDK
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

## Architecture Overview

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

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| `@mantle-rwa/sdk` | Core TypeScript SDK | [![npm](https://img.shields.io/npm/v/@mantle-rwa/sdk)](https://www.npmjs.com/package/@mantle-rwa/sdk) |
| `@mantle-rwa/react` | React components | [![npm](https://img.shields.io/npm/v/@mantle-rwa/react)](https://www.npmjs.com/package/@mantle-rwa/react) |
| `@mantle-rwa/contracts` | Smart contracts | [![npm](https://img.shields.io/npm/v/@mantle-rwa/contracts)](https://www.npmjs.com/package/@mantle-rwa/contracts) |

## Next Steps

<div className="row">
  <div className="col col--6">
    <div className="card margin-bottom--lg">
      <div className="card__header">
        <h3>🚀 Quick Start</h3>
      </div>
      <div className="card__body">
        <p>Deploy your first RWA token in under 10 minutes.</p>
      </div>
      <div className="card__footer">
        <a className="button button--primary button--block" href="/docs/getting-started/quick-start">Get Started</a>
      </div>
    </div>
  </div>
  <div className="col col--6">
    <div className="card margin-bottom--lg">
      <div className="card__header">
        <h3>📚 API Reference</h3>
      </div>
      <div className="card__body">
        <p>Explore the complete SDK, React, and contract APIs.</p>
      </div>
      <div className="card__footer">
        <a className="button button--secondary button--block" href="/docs/api/overview">View API</a>
      </div>
    </div>
  </div>
</div>

## Community & Support

- **Discord**: [Join our community](https://discord.gg/0xMantle)
- **GitHub**: [Report issues & contribute](https://github.com/mantle-network/mantle-rwa-sdk)
- **Twitter**: [Follow for updates](https://twitter.com/0xMantle)
