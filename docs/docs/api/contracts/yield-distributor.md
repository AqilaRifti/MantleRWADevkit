---
sidebar_position: 4
title: YieldDistributor
description: Yield distribution contract for dividend payments
keywords: [yield, distributor, dividends, contract]
---

# YieldDistributor

The `YieldDistributor` contract manages yield distributions and dividend payments to token holders.

## Functions

### `distribute`

Creates a new yield distribution.

```solidity
function distribute(
    uint256 amount,
    address paymentToken
) external returns (uint256 distributionId);
```

### `claim`

Claims yield for the caller.

```solidity
function claim(uint256 distributionId) external;
```

### `getClaimableAmount`

Returns claimable amount for an address.

```solidity
function getClaimableAmount(
    address investor,
    uint256 distributionId
) external view returns (uint256);
```

## Events

```solidity
event DistributionCreated(uint256 indexed id, uint256 amount, address paymentToken);
event YieldClaimed(address indexed investor, uint256 indexed distributionId, uint256 amount);
```

## See Also

- [YieldModule](/docs/api/sdk/yield-module)
- [Yield Distribution Guide](/docs/guides/yield-distribution)
