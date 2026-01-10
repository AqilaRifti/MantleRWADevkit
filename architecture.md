# Mantle RWA Devkit — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Your Application                              │   │
│  │  • Web App / Mobile App / Backend Service                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│                           COMPONENT LAYER                                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │   KYCFlow    │ │  Investor    │ │  TokenMint   │ │    Yield     │       │
│  │  Component   │ │  Dashboard   │ │    Form      │ │  Calculator  │       │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘       │
│                         @mantle-rwa/react                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                              SDK LAYER                                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │    Token     │ │     KYC      │ │    Yield     │ │  Compliance  │       │
│  │    Module    │ │    Module    │ │    Module    │ │    Module    │       │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘       │
│                          @mantle-rwa/sdk                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                           CONTRACT LAYER                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │   RWAToken   │ │  KYCRegistry │ │    Yield     │ │  Compliance  │       │
│  │   (ERC-3643) │ │              │ │ Distributor  │ │   Modules    │       │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘       │
│                        @mantle-rwa/contracts                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                           NETWORK LAYER                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Mantle Network                                │   │
│  │  • Low gas costs • Fast finality • EVM compatible                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Smart Contract Architecture

### RWAToken (ERC-3643 Compliant)

```
┌─────────────────────────────────────────────────────────────┐
│                        RWAToken                              │
├─────────────────────────────────────────────────────────────┤
│  Inherits:                                                   │
│  • ERC20Upgradeable (token standard)                        │
│  • ERC20PausableUpgradeable (emergency stop)                │
│  • ERC20SnapshotUpgradeable (dividend snapshots)            │
│  • AccessControlUpgradeable (role-based permissions)        │
│  • UUPSUpgradeable (upgradeable proxy)                      │
├─────────────────────────────────────────────────────────────┤
│  Roles:                                                      │
│  • DEFAULT_ADMIN_ROLE — Full control                        │
│  • ISSUER_ROLE — Mint/burn tokens, create snapshots         │
│  • COMPLIANCE_OFFICER_ROLE — Manage KYC, pause/unpause      │
│  • UPGRADER_ROLE — Upgrade contract implementation          │
├─────────────────────────────────────────────────────────────┤
│  Key Functions:                                              │
│  • mint(to, amount) — Mint to KYC-verified address          │
│  • burn(from, amount) — Burn tokens                         │
│  • pause() / unpause() — Emergency controls                 │
│  • snapshot() — Create balance snapshot for dividends       │
│  • isTransferAllowed(from, to, amount) — Check compliance   │
├─────────────────────────────────────────────────────────────┤
│  Transfer Hook (_beforeTokenTransfer):                       │
│  1. Check sender is KYC verified                            │
│  2. Check recipient is KYC verified                         │
│  3. Check all compliance modules approve                    │
│  4. Revert if any check fails                               │
└─────────────────────────────────────────────────────────────┘
```

### KYCRegistry

```
┌─────────────────────────────────────────────────────────────┐
│                       KYCRegistry                            │
├─────────────────────────────────────────────────────────────┤
│  Storage:                                                    │
│  mapping(address => InvestorData) investors                 │
│                                                              │
│  InvestorData {                                              │
│    bool verified;                                            │
│    AccreditationTier tier;  // None, Retail, Accredited,    │
│    uint256 expiryTimestamp; //   Institutional              │
│    bytes32 identityHash;    // Hash of PII (privacy)        │
│  }                                                           │
├─────────────────────────────────────────────────────────────┤
│  Roles:                                                      │
│  • KYC_ADMIN_ROLE — Add/update/remove investors             │
│  • UPGRADER_ROLE — Upgrade contract                         │
├─────────────────────────────────────────────────────────────┤
│  Key Functions:                                              │
│  • addInvestor(addr, tier, expiry, hash)                    │
│  • updateInvestor(addr, tier, expiry)                       │
│  • removeInvestor(addr)                                     │
│  • batchAddInvestors([...]) — Bulk onboarding               │
│  • isVerified(addr) — Check status + expiry                 │
│  • isAccredited(addr) — Check tier >= Accredited            │
└─────────────────────────────────────────────────────────────┘
```

### YieldDistributor

```
┌─────────────────────────────────────────────────────────────┐
│                     YieldDistributor                         │
├─────────────────────────────────────────────────────────────┤
│  Storage:                                                    │
│  mapping(uint256 => Distribution) distributions             │
│                                                              │
│  Distribution {                                              │
│    address paymentToken;      // USDC, USDT, MNT, etc.      │
│    uint256 totalAmount;       // Total to distribute        │
│    uint256 snapshotId;        // Token snapshot ID          │
│    uint256 claimDeadline;     // Claim window end           │
│    uint256 claimedAmount;     // Amount claimed so far      │
│    uint256 totalSupplyAtSnapshot;                           │
│    bool unclaimedHandled;     // Unclaimed funds processed  │
│  }                                                           │
├─────────────────────────────────────────────────────────────┤
│  Roles:                                                      │
│  • DISTRIBUTOR_ROLE — Create distributions                  │
│  • DEFAULT_ADMIN_ROLE — Configure unclaimed recipient       │
├─────────────────────────────────────────────────────────────┤
│  Key Functions:                                              │
│  • createDistribution(token, amount, days)                  │
│  • claim(distributionId)                                    │
│  • claimMultiple([ids])                                     │
│  • handleUnclaimedFunds(id) — After deadline                │
│  • getClaimableAmount(id, addr)                             │
├─────────────────────────────────────────────────────────────┤
│  Claim Calculation:                                          │
│  claimAmount = (holderBalance × totalAmount) / totalSupply  │
└─────────────────────────────────────────────────────────────┘
```

### Compliance Modules

```
┌─────────────────────────────────────────────────────────────┐
│                    IComplianceModule                         │
├─────────────────────────────────────────────────────────────┤
│  Interface:                                                  │
│  • checkCompliance(from, to, amount) → (bool, string)       │
│  • onTransfer(from, to, amount) — Post-transfer hook        │
├─────────────────────────────────────────────────────────────┤
│  Example Modules:                                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ MaxHoldersModule                                     │    │
│  │ • Limits total number of token holders              │    │
│  │ • Useful for regulatory caps (e.g., 99 investors)   │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ JurisdictionModule                                   │    │
│  │ • Restricts transfers by country/region             │    │
│  │ • Whitelist or blacklist jurisdictions              │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ LockupModule                                         │    │
│  │ • Enforces holding periods                          │    │
│  │ • Per-investor or global lockups                    │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ AccreditedOnlyModule                                 │    │
│  │ • Requires Accredited or Institutional tier         │    │
│  │ • For Reg D offerings                               │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## SDK Architecture

### Module Structure

```
RWAClient
├── token: TokenModule
│   └── connect(address) → TokenInstance
│       ├── mint(to, amount)
│       ├── burn(from, amount)
│       ├── transfer(to, amount)
│       ├── balanceOf(address)
│       ├── pause() / unpause()
│       └── snapshot()
│
├── kyc: KYCModule
│   ├── connect(address) → KYCRegistryInstance
│   │   ├── isVerified(address)
│   │   ├── isAccredited(address)
│   │   ├── getInvestorInfo(address)
│   │   ├── addInvestor(...)
│   │   └── batchAddInvestors([...])
│   ├── setProvider('persona' | 'synaps' | 'jumio' | custom)
│   ├── verifyInvestor(address)
│   └── generateIdentityHash(data)
│
├── yield: YieldModule
│   └── connect(address) → YieldDistributorInstance
│       ├── createDistribution(token, amount, days)
│       ├── claim(id)
│       ├── claimMultiple([ids])
│       ├── getClaimableAmount(id, address)
│       └── handleUnclaimedFunds(id)
│
└── compliance: ComplianceModule
    ├── checkTransferEligibility(token, from, to, amount)
    └── getComplianceModules(token)
```

### Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│     SDK      │────▶│   Contract   │
│  (React UI)  │     │  (ethers.js) │     │   (Solidity) │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  User Input  │     │  Validation  │     │   On-chain   │
│  • Address   │     │  • Format    │     │   Storage    │
│  • Amount    │     │  • Types     │     │   • State    │
│  • Actions   │     │  • Errors    │     │   • Events   │
└──────────────┘     └──────────────┘     └──────────────┘
```

## KYC Integration Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           KYC VERIFICATION FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User    │    │  Your    │    │   KYC    │    │  Your    │    │   KYC    │
│  Wallet  │    │  App     │    │ Provider │    │ Backend  │    │ Registry │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │               │
     │  1. Connect   │               │               │               │
     │──────────────▶│               │               │               │
     │               │               │               │               │
     │               │ 2. Start KYC  │               │               │
     │               │──────────────▶│               │               │
     │               │               │               │               │
     │               │ 3. Redirect   │               │               │
     │◀──────────────│◀──────────────│               │               │
     │               │               │               │               │
     │  4. Complete verification     │               │               │
     │──────────────────────────────▶│               │               │
     │               │               │               │               │
     │               │               │ 5. Webhook    │               │
     │               │               │──────────────▶│               │
     │               │               │               │               │
     │               │               │               │ 6. Add to     │
     │               │               │               │    registry   │
     │               │               │               │──────────────▶│
     │               │               │               │               │
     │               │               │               │ 7. Confirmed  │
     │               │               │               │◀──────────────│
     │               │               │               │               │
     │               │ 8. Status update              │               │
     │◀──────────────│◀─────────────────────────────│               │
     │               │               │               │               │
```

## Transfer Compliance Check

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TRANSFER COMPLIANCE CHECK                            │
└─────────────────────────────────────────────────────────────────────────────┘

transfer(from, to, amount)
         │
         ▼
┌─────────────────────┐
│ _beforeTokenTransfer│
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐     ┌─────────────────────┐
│ Is from == 0x0?     │─Yes─▶│ ALLOW (mint)        │
│ (mint operation)    │      └─────────────────────┘
└─────────┬───────────┘
          │ No
          ▼
┌─────────────────────┐     ┌─────────────────────┐
│ Is to == 0x0?       │─Yes─▶│ ALLOW (burn)        │
│ (burn operation)    │      └─────────────────────┘
└─────────┬───────────┘
          │ No
          ▼
┌─────────────────────┐     ┌─────────────────────┐
│ KYC: isVerified(from)│─No─▶│ REVERT              │
│                     │      │ "Sender not KYC     │
└─────────┬───────────┘      │  verified"          │
          │ Yes              └─────────────────────┘
          ▼
┌─────────────────────┐     ┌─────────────────────┐
│ KYC: isVerified(to) │─No─▶│ REVERT              │
│                     │      │ "Recipient not KYC  │
└─────────┬───────────┘      │  verified"          │
          │ Yes              └─────────────────────┘
          ▼
┌─────────────────────┐
│ For each compliance │
│ module:             │
│ checkCompliance()   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐     ┌─────────────────────┐
│ All modules pass?   │─No─▶│ REVERT              │
│                     │      │ (module reason)     │
└─────────┬───────────┘      └─────────────────────┘
          │ Yes
          ▼
┌─────────────────────┐
│ ALLOW TRANSFER      │
└─────────────────────┘
```

## Yield Distribution Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         YIELD DISTRIBUTION FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

1. CREATE DISTRIBUTION
   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │   Issuer     │────▶│   Transfer   │────▶│   Create     │
   │   calls      │     │   USDC to    │     │   snapshot   │
   │   create()   │     │   contract   │     │   of token   │
   └──────────────┘     └──────────────┘     └──────────────┘

2. CLAIM PERIOD (e.g., 30 days)
   ┌──────────────────────────────────────────────────────────┐
   │                                                          │
   │  Holder A: 10% of supply → Claims 10% of distribution   │
   │  Holder B: 25% of supply → Claims 25% of distribution   │
   │  Holder C: 15% of supply → Claims 15% of distribution   │
   │  ...                                                     │
   │                                                          │
   └──────────────────────────────────────────────────────────┘

3. AFTER DEADLINE
   ┌──────────────┐     ┌──────────────┐
   │  Unclaimed   │────▶│  Sent to     │
   │  funds       │     │  configured  │
   │  (50%)       │     │  recipient   │
   └──────────────┘     └──────────────┘
```

## Security Model

### Role-Based Access Control

```
┌─────────────────────────────────────────────────────────────┐
│                    ROLE HIERARCHY                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  DEFAULT_ADMIN_ROLE                                         │
│  └── Can grant/revoke all roles                             │
│      │                                                       │
│      ├── ISSUER_ROLE                                        │
│      │   └── mint, burn, snapshot                           │
│      │                                                       │
│      ├── COMPLIANCE_OFFICER_ROLE                            │
│      │   └── setKYCRegistry, addComplianceModule,           │
│      │       pause, unpause                                  │
│      │                                                       │
│      ├── UPGRADER_ROLE                                      │
│      │   └── authorizeUpgrade                               │
│      │                                                       │
│      ├── KYC_ADMIN_ROLE (KYCRegistry)                       │
│      │   └── addInvestor, updateInvestor, removeInvestor    │
│      │                                                       │
│      └── DISTRIBUTOR_ROLE (YieldDistributor)                │
│          └── createDistribution, handleUnclaimedFunds       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Upgrade Pattern (UUPS)

```
┌──────────────┐     ┌──────────────┐
│    Proxy     │────▶│Implementation│
│  (storage)   │     │   (logic)    │
└──────────────┘     └──────────────┘
       │                    │
       │                    ▼
       │             ┌──────────────┐
       │             │Implementation│
       │             │     v2       │
       │             └──────────────┘
       │                    │
       └────────────────────┘
         (upgrade changes pointer)
```

## Links

- **Documentation**: https://mantle-rwa-devkit-docs.vercel.app/
- **Live Demo**: https://mantle-rwa-devkit-demo.vercel.app/
- **GitHub**: https://github.com/AqilaRifti/MantleRWADevkit
