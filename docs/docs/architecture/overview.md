---
sidebar_position: 1
title: Architecture Overview
description: System architecture and component relationships
keywords: [architecture, design, system]
---

# Architecture Overview

This document provides a comprehensive overview of the Mantle RWA SDK architecture.

## System Architecture

```mermaid
graph TB
    subgraph "Application Layer"
        A[Your Application]
        B[React Components]
    end
    
    subgraph "SDK Layer"
        C[RWAClient]
        D[TokenModule]
        E[KYCModule]
        F[YieldModule]
        G[ComplianceModule]
    end
    
    subgraph "Contract Layer"
        H[RWAToken]
        I[KYCRegistry]
        J[YieldDistributor]
        K[AssetVault]
        L[ComplianceModule]
    end
    
    subgraph "Infrastructure"
        M[Mantle Network]
        N[IPFS/Storage]
        O[KYC Providers]
    end
    
    A --> B
    A --> C
    B --> C
    C --> D
    C --> E
    C --> F
    C --> G
    D --> H
    E --> I
    F --> J
    G --> L
    H --> M
    I --> M
    J --> M
    K --> M
    E --> O
```

## Token Transfer Flow

```mermaid
sequenceDiagram
    participant User
    participant SDK
    participant Token
    participant Compliance
    participant KYC

    User->>SDK: transfer(to, amount)
    SDK->>Token: transfer(to, amount)
    Token->>Compliance: canTransfer(from, to, amount)
    Compliance->>KYC: isVerified(to)
    KYC-->>Compliance: verified status
    Compliance-->>Token: transfer allowed
    Token-->>SDK: transaction receipt
    SDK-->>User: success
```

## Yield Distribution Flow

```mermaid
sequenceDiagram
    participant Admin
    participant SDK
    participant YieldDistributor
    participant Token
    participant Investor

    Admin->>SDK: distribute(amount)
    SDK->>YieldDistributor: createDistribution(amount)
    YieldDistributor->>Token: snapshot balances
    YieldDistributor-->>SDK: distribution created
    
    Investor->>SDK: claim()
    SDK->>YieldDistributor: claim(investor)
    YieldDistributor->>Investor: transfer yield
    YieldDistributor-->>SDK: claimed
```

## Contract Relationships

```mermaid
graph LR
    A[RWAFactory] -->|deploys| B[RWAToken]
    A -->|deploys| C[KYCRegistry]
    A -->|deploys| D[YieldDistributor]
    A -->|deploys| E[AssetVault]
    
    B -->|checks| C
    B -->|uses| F[ComplianceModule]
    D -->|reads| B
    F -->|checks| C
```

## Component Overview

### Smart Contracts

| Contract | Purpose |
|----------|---------|
| RWAToken | ERC-3643 security token |
| KYCRegistry | Investor verification |
| YieldDistributor | Dividend distribution |
| AssetVault | Asset custody |
| ComplianceModule | Transfer restrictions |
| RWAFactory | System deployment |

### SDK Modules

| Module | Purpose |
|--------|---------|
| RWAClient | Main entry point |
| TokenModule | Token operations |
| KYCModule | KYC management |
| YieldModule | Yield distribution |
| ComplianceModule | Compliance rules |

### React Components

| Component | Purpose |
|-----------|---------|
| KYCFlow | Verification flow |
| InvestorDashboard | Portfolio view |
| TokenMintForm | Minting interface |
| YieldCalculator | Yield projections |

## Security Model

### Access Control

```
DEFAULT_ADMIN_ROLE
├── MINTER_ROLE
├── BURNER_ROLE
├── PAUSER_ROLE
├── COMPLIANCE_ROLE
└── VERIFIER_ROLE
```

### Upgradeability

All contracts use UUPS proxy pattern:
- Implementation contracts are upgradeable
- Only admin can upgrade
- Storage layout preserved across upgrades

## See Also

- [API Overview](/docs/api/overview)
- [Smart Contracts](/docs/api/contracts/overview)
- [Security Best Practices](/docs/guides/security-best-practices)
