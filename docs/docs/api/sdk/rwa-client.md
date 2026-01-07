---
sidebar_position: 1
title: RWAClient
description: Main client for initializing and using the Mantle RWA SDK
keywords: [rwa client, sdk, initialization]
---

# RWAClient

The `RWAClient` is the main entry point for the Mantle RWA SDK. It provides methods for deploying RWA systems and accessing module instances.

## Constructor

```typescript
import { RWAClient } from '@mantle-rwa/sdk';

const client = new RWAClient(config: RWAClientConfig);
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `network` | `'mantle' \| 'mantle-sepolia'` | Yes | Network to connect to |
| `privateKey` | `string` | No* | Private key for signing transactions |
| `walletClient` | `WalletClient` | No* | Viem wallet client for browser usage |
| `rpcUrl` | `string` | No | Custom RPC endpoint |
| `gas` | `GasConfig` | No | Gas configuration options |

*Either `privateKey` or `walletClient` is required.

### Example

```typescript
// Server-side with private key
const client = new RWAClient({
  network: 'mantle-sepolia',
  privateKey: process.env.PRIVATE_KEY,
});

// Browser with wallet client
const client = new RWAClient({
  network: 'mantle-sepolia',
  walletClient: yourWalletClient,
});
```

## Properties

### `address`

The address of the connected wallet.

```typescript
const address: string = client.address;
// '0x1234...'
```

### `network`

The current network name.

```typescript
const network: string = client.network;
// 'mantle-sepolia'
```

### `chainId`

The chain ID of the current network.

```typescript
const chainId: number = client.chainId;
// 5003
```

## Methods

### `deployRWASystem`

Deploys a complete RWA token system including all required contracts.

```typescript
const deployment = await client.deployRWASystem(config: DeployRWASystemConfig): Promise<DeploymentResult>;
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenName` | `string` | Yes | Name of the token |
| `tokenSymbol` | `string` | Yes | Symbol of the token |
| `initialSupply` | `string` | Yes | Initial token supply |
| `decimals` | `number` | No | Token decimals (default: 18) |
| `compliance` | `ComplianceConfig` | No | Compliance configuration |
| `yield` | `YieldConfig` | No | Yield distribution configuration |
| `roles` | `RolesConfig` | No | Access control roles |

#### Returns

```typescript
interface DeploymentResult {
  token: TokenModule;
  kycRegistry: KYCModule;
  yieldDistributor: YieldModule;
  assetVault: AssetVaultModule;
  complianceModule: ComplianceModule;
  transactionHash: string;
}
```

#### Example

```typescript
const deployment = await client.deployRWASystem({
  tokenName: 'Real Estate Token',
  tokenSymbol: 'RET',
  initialSupply: '1000000',
  compliance: {
    maxHolders: 500,
    minInvestment: '100',
    maxInvestment: '100000',
  },
});

console.log('Token address:', deployment.token.address);
```

### `token`

Returns a TokenModule instance for an existing token contract.

```typescript
const token = client.token(address: string): TokenModule;
```

#### Example

```typescript
const token = client.token('0x1234...');
const balance = await token.balanceOf('0x5678...');
```

### `kyc`

Returns a KYCModule instance for an existing KYC registry contract.

```typescript
const kyc = client.kyc(address: string): KYCModule;
```

#### Example

```typescript
const kyc = client.kyc('0x1234...');
const isVerified = await kyc.isVerified('0x5678...');
```

### `yield`

Returns a YieldModule instance for an existing yield distributor contract.

```typescript
const yieldModule = client.yield(address: string): YieldModule;
```

#### Example

```typescript
const yieldModule = client.yield('0x1234...');
await yieldModule.distribute({ amount: '10000', paymentToken: '0x...' });
```

### `compliance`

Returns a ComplianceModule instance for an existing compliance contract.

```typescript
const compliance = client.compliance(address: string): ComplianceModule;
```

#### Example

```typescript
const compliance = client.compliance('0x1234...');
const canTransfer = await compliance.canTransfer('0xFrom...', '0xTo...', '1000');
```

## Type Definitions

### `RWAClientConfig`

```typescript
interface RWAClientConfig {
  network: 'mantle' | 'mantle-sepolia';
  privateKey?: string;
  walletClient?: WalletClient;
  rpcUrl?: string;
  gas?: {
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
  };
}
```

### `DeployRWASystemConfig`

```typescript
interface DeployRWASystemConfig {
  tokenName: string;
  tokenSymbol: string;
  initialSupply: string;
  decimals?: number;
  compliance?: {
    maxHolders?: number;
    minInvestment?: string;
    maxInvestment?: string;
    accreditedOnly?: boolean;
    lockupPeriod?: number;
    transferRestrictions?: boolean;
  };
  yield?: {
    paymentToken?: string;
    distributionFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  };
  roles?: {
    admin?: string;
    compliance?: string;
    treasury?: string;
  };
}
```

## Error Handling

```typescript
import { RWAError, NetworkError, ConfigurationError } from '@mantle-rwa/sdk';

try {
  const client = new RWAClient({
    network: 'mantle-sepolia',
    privateKey: 'invalid-key',
  });
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.log('Invalid configuration:', error.message);
  }
}
```

## See Also

- [TokenModule](/docs/api/sdk/token-module)
- [KYCModule](/docs/api/sdk/kyc-module)
- [YieldModule](/docs/api/sdk/yield-module)
- [ComplianceModule](/docs/api/sdk/compliance-module)
