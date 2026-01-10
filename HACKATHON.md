# Mantle RWA Devkit — Hackathon Submission

## 🏆 Project Overview

**Mantle RWA Devkit** is a complete, open-source toolkit for tokenizing real-world assets on Mantle Network with built-in regulatory compliance.

## 🔗 Links

| Resource | URL |
|----------|-----|
| **Live Demo** | https://mantle-rwa-devkit-demo.vercel.app/ |
| **Documentation** | https://mantle-rwa-devkit-docs.vercel.app/ |
| **GitHub** | https://github.com/AqilaRifti/MantleRWADevkit |

## 💡 Problem Statement

Tokenizing real-world assets (real estate, private equity, commodities) is a $16T opportunity, but building compliant platforms is extremely difficult:

- **Regulatory Complexity** — Securities require KYC/AML, accredited investor verification, and transfer restrictions
- **Technical Barriers** — Building ERC-3643 compliant contracts from scratch takes months
- **Integration Overhead** — Connecting KYC providers, building UIs, handling edge cases
- **Cost Prohibitive** — High gas fees on Ethereum make micro-distributions impractical

## ✅ Solution

A full-stack SDK that handles compliance out of the box:

```
Smart Contracts → TypeScript SDK → React Components → Your App
```

**Deploy compliant RWA tokens in days, not months.**

## 🛠️ What We Built

### Smart Contracts (Solidity)
- **RWAToken** — ERC-3643 compliant security token with transfer restrictions
- **KYCRegistry** — On-chain investor verification with expiring credentials
- **YieldDistributor** — Snapshot-based dividend distribution
- **Compliance Modules** — Pluggable rules (max holders, jurisdiction, lockups)

### TypeScript SDK
- Full API for all contract interactions
- KYC provider integrations (Persona, Synaps, Jumio)
- Type-safe with complete TypeScript support
- Event listeners for real-time updates

### React Components
- `<KYCFlow />` — Complete verification flow
- `<InvestorDashboard />` — Portfolio and yield overview
- `<TokenMintForm />` — Admin minting interface
- `<YieldCalculator />` — Distribution estimator

### Documentation
- Getting started guides
- API reference
- Architecture documentation
- Example applications

## 🏗️ Architecture

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
│  │ RWAToken │ │ KYCRegistry  │ │YieldDistrib│ │Compliance│ │
│  └──────────┘ └──────────────┘ └────────────┘ └──────────┘ │
├─────────────────────────────────────────────────────────────┤
│                     Mantle Network                           │
└─────────────────────────────────────────────────────────────┘
```

## ⚡ Key Features

### Compliance-First Design
Every token transfer automatically checks:
- ✅ Sender KYC verified
- ✅ Recipient KYC verified
- ✅ Verification not expired
- ✅ All compliance modules approve

**Non-compliant transfers are impossible at the protocol level.**

### Privacy-Preserving KYC
- On-chain registry stores only identity hashes
- Actual PII stays with your KYC provider
- Supports multiple accreditation tiers (Retail, Accredited, Institutional)

### Automated Yield Distribution
- Snapshot-based proportional distributions
- Multi-token support (USDC, USDT, MNT)
- Configurable claim windows
- Automatic unclaimed fund handling

### Mantle-Optimized
- 90%+ lower gas costs than Ethereum
- Fast finality for better UX
- Full EVM compatibility

## 📦 Packages

| Package | Description | Status |
|---------|-------------|--------|
| `@mantle-rwa/contracts` | Smart contracts | ✅ Complete |
| `@mantle-rwa/sdk` | TypeScript SDK | ✅ Complete |
| `@mantle-rwa/react` | React components | ✅ Complete |

## 🚀 Quick Start

```bash
npm install @mantle-rwa/sdk @mantle-rwa/react
```

```typescript
import { RWAClient } from '@mantle-rwa/sdk';

const client = new RWAClient({
  network: 'mantle-sepolia',
  privateKey: process.env.PRIVATE_KEY,
});

// Deploy complete RWA system
const deployment = await client.deployRWASystem({
  tokenName: 'Real Estate Token',
  tokenSymbol: 'RET',
  initialSupply: '1000000',
});
```

## 🎯 Use Cases

| Asset Class | Example |
|-------------|---------|
| **Real Estate** | Fractional ownership of commercial properties |
| **Private Equity** | Tokenized fund shares with automated distributions |
| **Commodities** | Gold-backed tokens with yield from lending |
| **Revenue Share** | Royalty tokens with quarterly distributions |
| **Carbon Credits** | Tokenized environmental assets |

## 🔒 Security

- **Role-Based Access Control** — Granular permissions for issuers, compliance officers, admins
- **UUPS Upgradeable** — Contracts can be upgraded without migrating tokens
- **Pausable** — Emergency stop functionality
- **Reentrancy Guards** — Protection against reentrancy attacks
- **Gas Optimized** — Efficient implementations to minimize costs

## 📊 Technical Highlights

- **ERC-3643 Compliant** — Industry standard for security tokens
- **Property-Based Testing** — Comprehensive test coverage with fast-check
- **TypeScript** — Full type safety across SDK and components
- **Monorepo** — Turborepo for efficient builds
- **Documentation** — Docusaurus-powered docs site

## 🗺️ Roadmap

- [x] Core smart contracts
- [x] TypeScript SDK
- [x] React component library
- [x] Documentation site
- [x] Example application
- [ ] Mainnet deployment
- [ ] Additional compliance modules
- [ ] Mobile SDK
- [ ] Subgraph for indexing

## 👨‍💻 Built By

**Aqila Rifti**

- GitHub: [@AqilaRifti](https://github.com/AqilaRifti)

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

**Built for Mantle Network. Open source. Ready for production.**
