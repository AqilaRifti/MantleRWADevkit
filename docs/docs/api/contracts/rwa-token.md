---
sidebar_position: 2
title: RWAToken
description: ERC-3643 compliant security token contract
keywords: [token, erc-3643, security token, contract]
---

# RWAToken

The `RWAToken` contract is an ERC-3643 compliant security token with built-in compliance and transfer restrictions.

## Overview

```solidity
contract RWAToken is 
    ERC20Upgradeable,
    ERC3643Compliant,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    // ...
}
```

## Functions

### Read Functions

#### `name`

Returns the token name.

```solidity
function name() external view returns (string memory);
```

#### `symbol`

Returns the token symbol.

```solidity
function symbol() external view returns (string memory);
```

#### `decimals`

Returns the token decimals.

```solidity
function decimals() external view returns (uint8);
```

#### `totalSupply`

Returns the total token supply.

```solidity
function totalSupply() external view returns (uint256);
```

#### `balanceOf`

Returns the balance of an address.

```solidity
function balanceOf(address account) external view returns (uint256);
```

#### `allowance`

Returns the allowance granted to a spender.

```solidity
function allowance(address owner, address spender) external view returns (uint256);
```

### Write Functions

#### `transfer`

Transfers tokens to a recipient.

```solidity
function transfer(address to, uint256 amount) external returns (bool);
```

**Requirements:**
- Caller must have sufficient balance
- Recipient must be KYC verified
- Transfer must pass compliance checks
- Contract must not be paused

#### `transferFrom`

Transfers tokens from one address to another.

```solidity
function transferFrom(address from, address to, uint256 amount) external returns (bool);
```

#### `approve`

Approves a spender to transfer tokens.

```solidity
function approve(address spender, uint256 amount) external returns (bool);
```

#### `mint`

Mints new tokens. Requires `MINTER_ROLE`.

```solidity
function mint(address to, uint256 amount) external;
```

#### `burn`

Burns tokens from caller's balance.

```solidity
function burn(uint256 amount) external;
```

#### `burnFrom`

Burns tokens from another address.

```solidity
function burnFrom(address from, uint256 amount) external;
```

#### `pause`

Pauses all transfers. Requires `PAUSER_ROLE`.

```solidity
function pause() external;
```

#### `unpause`

Unpauses transfers. Requires `PAUSER_ROLE`.

```solidity
function unpause() external;
```

## Events

```solidity
event Transfer(address indexed from, address indexed to, uint256 value);
event Approval(address indexed owner, address indexed spender, uint256 value);
event Paused(address account);
event Unpaused(address account);
event ComplianceUpdated(address indexed compliance);
```

## Compliance Integration

The token integrates with the compliance module for transfer restrictions:

```solidity
function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
) internal override {
    require(!paused(), "Token is paused");
    require(
        compliance.canTransfer(from, to, amount),
        "Transfer not compliant"
    );
}
```

## See Also

- [TokenModule](/docs/api/sdk/token-module)
- [ComplianceModule](/docs/api/sdk/compliance-module)
