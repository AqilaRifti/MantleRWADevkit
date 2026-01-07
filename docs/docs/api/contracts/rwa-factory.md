---
sidebar_position: 6
title: RWAFactory
description: Factory contract for deploying RWA systems
keywords: [factory, deployment, contract]
---

# RWAFactory

The `RWAFactory` contract deploys complete RWA token systems with all required contracts.

## Functions

### `deployRWASystem`

Deploys a complete RWA system.

```solidity
function deployRWASystem(
    string memory tokenName,
    string memory tokenSymbol,
    uint256 initialSupply,
    DeploymentConfig memory config
) external returns (DeploymentResult memory);
```

### `getDeployment`

Returns deployment information.

```solidity
function getDeployment(address token) external view returns (DeploymentResult memory);
```

## Events

```solidity
event RWASystemDeployed(
    address indexed token,
    address indexed kycRegistry,
    address indexed yieldDistributor,
    address assetVault
);
```

## See Also

- [RWAClient](/docs/api/sdk/rwa-client)
- [First Deployment](/docs/getting-started/first-deployment)
