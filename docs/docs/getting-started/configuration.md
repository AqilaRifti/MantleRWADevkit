---
sidebar_position: 3
title: Configuration
description: Configure the Mantle RWA SDK for your environment
keywords: [configuration, setup, environment, networks]
---

# Configuration

This guide covers all configuration options for the Mantle RWA SDK.

## RWAClient Configuration

The `RWAClient` is the main entry point for the SDK. Here are all available configuration options:

```typescript
import { RWAClient } from '@mantle-rwa/sdk';

const client = new RWAClient({
  // Required: Network to connect to
  network: 'mantle-sepolia',
  
  // Authentication (one of the following)
  privateKey: process.env.PRIVATE_KEY,
  // OR
  walletClient: yourWalletClient,
  
  // Optional: Custom RPC URL
  rpcUrl: 'https://your-custom-rpc.com',
  
  // Optional: Gas configuration
  gas: {
    maxFeePerGas: 1000000000n, // 1 gwei
    maxPriorityFeePerGas: 100000000n, // 0.1 gwei
  },
});
```

### Network Options

| Network | Chain ID | Description |
|---------|----------|-------------|
| `mantle` | 5000 | Mantle Mainnet |
| `mantle-sepolia` | 5003 | Mantle Sepolia Testnet |

### Authentication Methods

#### Private Key

For server-side applications or scripts:

```typescript
const client = new RWAClient({
  network: 'mantle-sepolia',
  privateKey: process.env.PRIVATE_KEY,
});
```

#### Wallet Client (viem)

For browser applications with wallet connections:

```typescript
import { createWalletClient, custom } from 'viem';
import { mantleSepolia } from 'viem/chains';

const walletClient = createWalletClient({
  chain: mantleSepolia,
  transport: custom(window.ethereum),
});

const client = new RWAClient({
  network: 'mantle-sepolia',
  walletClient,
});
```

## Environment Variables

We recommend using environment variables for sensitive configuration:

```bash title=".env"
# Required for server-side usage
PRIVATE_KEY=0x...

# Optional: Custom RPC endpoints
MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
MANTLE_MAINNET_RPC_URL=https://rpc.mantle.xyz

# Optional: API keys for enhanced features
PERSONA_API_KEY=your_persona_key
SYNAPS_API_KEY=your_synaps_key
```

### Loading Environment Variables

```typescript
import 'dotenv/config';
// or
import * as dotenv from 'dotenv';
dotenv.config();
```

## Network Configuration

### Custom RPC URLs

Override the default RPC endpoints:

```typescript
const client = new RWAClient({
  network: 'mantle-sepolia',
  privateKey: process.env.PRIVATE_KEY,
  rpcUrl: process.env.MANTLE_RPC_URL,
});
```

### Multiple Networks

Create clients for different networks:

```typescript
// Testnet client for development
const testnetClient = new RWAClient({
  network: 'mantle-sepolia',
  privateKey: process.env.PRIVATE_KEY,
});

// Mainnet client for production
const mainnetClient = new RWAClient({
  network: 'mantle',
  privateKey: process.env.PRIVATE_KEY,
  rpcUrl: process.env.MANTLE_MAINNET_RPC_URL,
});
```

## Gas Configuration

### Default Gas Settings

The SDK uses sensible defaults for gas estimation. Override when needed:

```typescript
const client = new RWAClient({
  network: 'mantle-sepolia',
  privateKey: process.env.PRIVATE_KEY,
  gas: {
    maxFeePerGas: 2000000000n, // 2 gwei
    maxPriorityFeePerGas: 100000000n, // 0.1 gwei
  },
});
```

### Per-Transaction Gas

Override gas for specific transactions:

```typescript
const tx = await client.token.mint({
  to: recipientAddress,
  amount: '1000',
}, {
  maxFeePerGas: 3000000000n,
});
```

## Deployment Configuration

### RWA System Deployment

Configure your RWA system deployment:

```typescript
const deployment = await client.deployRWASystem({
  // Token configuration
  tokenName: 'My RWA Token',
  tokenSymbol: 'MRWA',
  initialSupply: '1000000',
  decimals: 18, // Default: 18
  
  // Compliance configuration
  compliance: {
    maxHolders: 500,
    minInvestment: '100',
    maxInvestment: '100000',
    transferRestrictions: true,
    accreditedOnly: false,
  },
  
  // Yield configuration
  yield: {
    paymentToken: '0x...', // USDC address
    distributionFrequency: 'monthly',
  },
  
  // Access control
  roles: {
    admin: '0x...', // Default: deployer
    compliance: '0x...',
    treasury: '0x...',
  },
});
```

## React Provider Configuration

For React applications, configure the provider:

```tsx
import { RWAProvider } from '@mantle-rwa/react';

function App() {
  return (
    <RWAProvider
      config={{
        network: 'mantle-sepolia',
        theme: 'dark', // 'light' | 'dark' | 'system'
      }}
    >
      <YourApp />
    </RWAProvider>
  );
}
```

### Theme Configuration

Customize the React component themes:

```tsx
<RWAProvider
  config={{
    network: 'mantle-sepolia',
    theme: {
      mode: 'dark',
      colors: {
        primary: '#65B3AE',
        background: '#0D0D0D',
        surface: '#1A1A1A',
      },
      borderRadius: '8px',
    },
  }}
>
```

## TypeScript Configuration

For optimal TypeScript support:

```json title="tsconfig.json"
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## Next Steps

- [First Deployment](/docs/getting-started/first-deployment) - Deploy your first RWA system
- [API Reference](/docs/api/overview) - Explore all SDK methods
- [Security Best Practices](/docs/guides/security-best-practices) - Secure your deployment
