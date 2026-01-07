---
sidebar_position: 5
title: AssetVault
description: Asset custody and management contract
keywords: [vault, custody, assets, contract]
---

# AssetVault

The `AssetVault` contract provides secure custody for assets backing RWA tokens.

## Functions

### `deposit`

Deposits assets into the vault.

```solidity
function deposit(address token, uint256 amount) external;
```

### `withdraw`

Withdraws assets from the vault. Requires multi-sig approval.

```solidity
function withdraw(address token, uint256 amount, address recipient) external;
```

### `getBalance`

Returns the vault balance for a token.

```solidity
function getBalance(address token) external view returns (uint256);
```

## Events

```solidity
event Deposited(address indexed token, uint256 amount, address indexed depositor);
event Withdrawn(address indexed token, uint256 amount, address indexed recipient);
```

## See Also

- [Security Best Practices](/docs/guides/security-best-practices)
