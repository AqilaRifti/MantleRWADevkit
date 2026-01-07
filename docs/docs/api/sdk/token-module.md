---
sidebar_position: 2
title: TokenModule
description: Token operations including mint, burn, transfer, and management
keywords: [token, mint, burn, transfer, erc-3643]
---

# TokenModule

The `TokenModule` provides methods for interacting with RWA token contracts, including minting, burning, transferring, and managing tokens.

## Getting an Instance

```typescript
import { RWAClient } from '@mantle-rwa/sdk';

const client = new RWAClient({ network: 'mantle-sepolia', privateKey: '...' });

// From deployment
const deployment = await client.deployRWASystem({ ... });
const token = deployment.token;

// From existing address
const token = client.token('0x1234...');
```

## Properties

### `address`

The contract address of the token.

```typescript
const address: string = token.address;
```

## Read Methods

### `name`

Returns the token name.

```typescript
const name = await token.name(): Promise<string>;
// 'Real Estate Token'
```

### `symbol`

Returns the token symbol.

```typescript
const symbol = await token.symbol(): Promise<string>;
// 'RET'
```

### `decimals`

Returns the token decimals.

```typescript
const decimals = await token.decimals(): Promise<number>;
// 18
```

### `totalSupply`

Returns the total token supply.

```typescript
const totalSupply = await token.totalSupply(): Promise<bigint>;
// 1000000000000000000000000n
```

### `balanceOf`

Returns the token balance of an address.

```typescript
const balance = await token.balanceOf(address: string): Promise<bigint>;
```

#### Example

```typescript
const balance = await token.balanceOf('0x1234...');
console.log('Balance:', balance);
```

### `allowance`

Returns the allowance granted to a spender.

```typescript
const allowance = await token.allowance(owner: string, spender: string): Promise<bigint>;
```

### `isPaused`

Returns whether the token is paused.

```typescript
const paused = await token.isPaused(): Promise<boolean>;
```

### `getComplianceConfig`

Returns the compliance configuration.

```typescript
const config = await token.getComplianceConfig(): Promise<ComplianceConfig>;
```

#### Returns

```typescript
interface ComplianceConfig {
  maxHolders: number;
  minInvestment: bigint;
  maxInvestment: bigint;
  accreditedOnly: boolean;
  lockupPeriod: number;
}
```

## Write Methods

### `mint`

Mints new tokens to an address. Requires minter role.

```typescript
const tx = await token.mint(params: MintParams, options?: TxOptions): Promise<TransactionReceipt>;
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `to` | `string` | Yes | Recipient address |
| `amount` | `string` | Yes | Amount to mint |

#### Example

```typescript
const tx = await token.mint({
  to: '0x1234...',
  amount: '1000',
});

console.log('Minted in tx:', tx.transactionHash);
```

#### Errors

| Error | Condition |
|-------|-----------|
| `UnauthorizedError` | Caller doesn't have minter role |
| `KYCError` | Recipient is not KYC verified |
| `ComplianceError` | Mint would violate compliance rules |

### `batchMint`

Mints tokens to multiple addresses in a single transaction.

```typescript
const tx = await token.batchMint(mints: MintParams[], options?: TxOptions): Promise<TransactionReceipt>;
```

#### Example

```typescript
const tx = await token.batchMint([
  { to: '0x1111...', amount: '1000' },
  { to: '0x2222...', amount: '2000' },
  { to: '0x3333...', amount: '3000' },
]);
```

### `burn`

Burns tokens from the caller's balance.

```typescript
const tx = await token.burn(amount: string, options?: TxOptions): Promise<TransactionReceipt>;
```

#### Example

```typescript
const tx = await token.burn('500');
```

### `burnFrom`

Burns tokens from another address (requires allowance).

```typescript
const tx = await token.burnFrom(from: string, amount: string, options?: TxOptions): Promise<TransactionReceipt>;
```

### `transfer`

Transfers tokens to another address.

```typescript
const tx = await token.transfer(params: TransferParams, options?: TxOptions): Promise<TransactionReceipt>;
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `to` | `string` | Yes | Recipient address |
| `amount` | `string` | Yes | Amount to transfer |

#### Example

```typescript
const tx = await token.transfer({
  to: '0x1234...',
  amount: '500',
});
```

#### Errors

| Error | Condition |
|-------|-----------|
| `InsufficientBalanceError` | Sender doesn't have enough tokens |
| `KYCError` | Recipient is not KYC verified |
| `ComplianceError` | Transfer violates compliance rules |
| `PausedError` | Token is paused |

### `transferFrom`

Transfers tokens from one address to another (requires allowance).

```typescript
const tx = await token.transferFrom(
  from: string,
  to: string,
  amount: string,
  options?: TxOptions
): Promise<TransactionReceipt>;
```

### `approve`

Approves a spender to transfer tokens.

```typescript
const tx = await token.approve(spender: string, amount: string, options?: TxOptions): Promise<TransactionReceipt>;
```

#### Example

```typescript
// Approve unlimited
await token.approve('0xSpender...', ethers.MaxUint256.toString());

// Approve specific amount
await token.approve('0xSpender...', '10000');
```

### `pause`

Pauses all token transfers. Requires pauser role.

```typescript
const tx = await token.pause(options?: TxOptions): Promise<TransactionReceipt>;
```

### `unpause`

Unpauses token transfers. Requires pauser role.

```typescript
const tx = await token.unpause(options?: TxOptions): Promise<TransactionReceipt>;
```

## Role Management

### `hasRole`

Checks if an address has a specific role.

```typescript
const hasRole = await token.hasRole(role: string, address: string): Promise<boolean>;
```

#### Roles

| Role | Description |
|------|-------------|
| `ADMIN` | Full administrative access |
| `MINTER` | Can mint new tokens |
| `BURNER` | Can burn tokens |
| `PAUSER` | Can pause/unpause transfers |
| `COMPLIANCE` | Can update compliance rules |

#### Example

```typescript
const isAdmin = await token.hasRole('ADMIN', '0x1234...');
const canMint = await token.hasRole('MINTER', '0x1234...');
```

### `grantRole`

Grants a role to an address. Requires admin role.

```typescript
const tx = await token.grantRole(role: string, address: string, options?: TxOptions): Promise<TransactionReceipt>;
```

### `revokeRole`

Revokes a role from an address. Requires admin role.

```typescript
const tx = await token.revokeRole(role: string, address: string, options?: TxOptions): Promise<TransactionReceipt>;
```

## Events

### Subscribing to Events

```typescript
// Transfer events
token.on('Transfer', (from, to, amount) => {
  console.log(`Transfer: ${from} -> ${to}: ${amount}`);
});

// Approval events
token.on('Approval', (owner, spender, amount) => {
  console.log(`Approval: ${owner} approved ${spender} for ${amount}`);
});

// Pause events
token.on('Paused', (account) => {
  console.log(`Token paused by ${account}`);
});

token.on('Unpaused', (account) => {
  console.log(`Token unpaused by ${account}`);
});
```

### Removing Listeners

```typescript
token.off('Transfer', handler);
token.removeAllListeners('Transfer');
```

## Gas Estimation

```typescript
// Estimate gas for mint
const gas = await token.estimateGas.mint({ to: '0x...', amount: '1000' });

// Estimate gas for transfer
const gas = await token.estimateGas.transfer({ to: '0x...', amount: '500' });
```

## See Also

- [RWAClient](/docs/api/sdk/rwa-client)
- [KYCModule](/docs/api/sdk/kyc-module)
- [ComplianceModule](/docs/api/sdk/compliance-module)
