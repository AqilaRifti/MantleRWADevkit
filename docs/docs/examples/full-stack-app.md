---
sidebar_position: 3
title: Full-Stack Application
description: Complete full-stack RWA application example
keywords: [full-stack, application, nextjs, example]
---

# Full-Stack Application

This example demonstrates building a complete RWA investment platform with Next.js and the Mantle RWA SDK.

## Overview

The application includes:
- Investor onboarding with KYC
- Portfolio dashboard
- Token purchase flow
- Yield claiming interface

## Project Structure

```
my-rwa-app/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── dashboard/         # Investor dashboard
│   │   ├── invest/            # Investment flow
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── KYCFlow.tsx
│   │   ├── Dashboard.tsx
│   │   └── InvestForm.tsx
│   └── lib/
│       └── rwa-client.ts
├── package.json
└── .env.local
```

## Setup

```bash
npx create-next-app my-rwa-app
cd my-rwa-app
npm install @mantle-rwa/sdk @mantle-rwa/react wagmi viem
```

## RWA Client Setup

```typescript
// src/lib/rwa-client.ts
import { RWAClient } from '@mantle-rwa/sdk';

export const rwaClient = new RWAClient({
  network: process.env.NEXT_PUBLIC_NETWORK as 'mantle' | 'mantle-sepolia',
});
```

## Provider Setup

```tsx
// src/app/providers.tsx
'use client';

import { RWAProvider } from '@mantle-rwa/react';
import { WagmiProvider } from 'wagmi';

export function Providers({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <RWAProvider config={{ network: 'mantle-sepolia', theme: 'dark' }}>
        {children}
      </RWAProvider>
    </WagmiProvider>
  );
}
```

## Dashboard Page

```tsx
// src/app/dashboard/page.tsx
'use client';

import { InvestorDashboard } from '@mantle-rwa/react';

export default function DashboardPage() {
  return (
    <InvestorDashboard
      tokenAddress={process.env.NEXT_PUBLIC_TOKEN_ADDRESS}
      showYield={true}
      showTransactions={true}
    />
  );
}
```

## Live Demo

Check out the [example-web-app](https://github.com/mantle-network/mantle-rwa-sdk/tree/main/example-web-app) in our repository for the complete implementation.

## See Also

- [React Components](/docs/api/react/overview)
- [Quick Start](/docs/getting-started/quick-start)
