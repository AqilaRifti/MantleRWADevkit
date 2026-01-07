---
sidebar_position: 1
title: React Components Overview
description: Pre-built React components for RWA applications
keywords: [react, components, ui, frontend]
---

# React Components

The `@mantle-rwa/react` package provides pre-built React components for common RWA operations, with full theming support and accessibility compliance.

## Installation

```bash npm2yarn
npm install @mantle-rwa/react @mantle-rwa/sdk
```

## Setup

Wrap your application with the `RWAProvider`:

```tsx
import { RWAProvider } from '@mantle-rwa/react';

function App() {
  return (
    <RWAProvider
      config={{
        network: 'mantle-sepolia',
        theme: 'dark',
      }}
    >
      <YourApp />
    </RWAProvider>
  );
}
```

## Available Components

| Component | Description |
|-----------|-------------|
| [KYCFlow](/docs/api/react/kyc-flow) | Complete KYC verification flow |
| [InvestorDashboard](/docs/api/react/investor-dashboard) | Portfolio overview and management |
| [TokenMintForm](/docs/api/react/token-mint-form) | Token minting interface |
| [YieldCalculator](/docs/api/react/yield-calculator) | Yield projection calculator |

## Quick Example

```tsx
import { KYCFlow, InvestorDashboard } from '@mantle-rwa/react';

function InvestorPage() {
  return (
    <div>
      <KYCFlow
        tokenAddress="0x..."
        onComplete={(result) => console.log('KYC complete:', result)}
      />
      
      <InvestorDashboard
        tokenAddress="0x..."
        showYield={true}
      />
    </div>
  );
}
```

## Theming

### Built-in Themes

```tsx
<RWAProvider config={{ theme: 'dark' }}>  {/* Dark theme */}
<RWAProvider config={{ theme: 'light' }}> {/* Light theme */}
<RWAProvider config={{ theme: 'system' }}> {/* System preference */}
```

### Custom Theme

```tsx
<RWAProvider
  config={{
    network: 'mantle-sepolia',
    theme: {
      mode: 'dark',
      colors: {
        primary: '#65B3AE',
        secondary: '#4FA39E',
        background: '#0D0D0D',
        surface: '#1A1A1A',
        text: '#E5E5E5',
        textSecondary: '#A0AEC0',
        error: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
      },
      borderRadius: '8px',
      fontFamily: 'Inter, sans-serif',
    },
  }}
>
```

## Hooks

The package also exports useful hooks:

```tsx
import { useRWA, useToken, useKYC, useYield } from '@mantle-rwa/react';

function MyComponent() {
  const { client, isConnected } = useRWA();
  const { balance, transfer } = useToken('0x...');
  const { isVerified, startVerification } = useKYC('0x...');
  const { claimable, claim } = useYield('0x...');
  
  // ...
}
```

### `useRWA`

Access the RWA client and connection state.

```tsx
const { client, isConnected, address, network } = useRWA();
```

### `useToken`

Token operations and state.

```tsx
const {
  balance,
  totalSupply,
  transfer,
  approve,
  isLoading,
  error,
} = useToken(tokenAddress);
```

### `useKYC`

KYC verification state and actions.

```tsx
const {
  isVerified,
  accreditationLevel,
  startVerification,
  isLoading,
} = useKYC(kycRegistryAddress);
```

### `useYield`

Yield distribution state and claims.

```tsx
const {
  claimable,
  totalClaimed,
  claim,
  isLoading,
} = useYield(yieldDistributorAddress);
```

## TypeScript Support

All components are fully typed:

```tsx
import type {
  KYCFlowProps,
  InvestorDashboardProps,
  TokenMintFormProps,
  YieldCalculatorProps,
  RWAProviderConfig,
} from '@mantle-rwa/react';
```

## Accessibility

All components follow WAI-ARIA guidelines:

- Keyboard navigation support
- Screen reader compatible
- Focus management
- Color contrast compliance

## Next Steps

- [KYCFlow Component](/docs/api/react/kyc-flow)
- [InvestorDashboard Component](/docs/api/react/investor-dashboard)
- [TokenMintForm Component](/docs/api/react/token-mint-form)
- [YieldCalculator Component](/docs/api/react/yield-calculator)
