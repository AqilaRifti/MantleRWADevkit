---
sidebar_position: 3
title: KYCRegistry
description: On-chain KYC verification registry contract
keywords: [kyc, registry, verification, contract]
---

# KYCRegistry

The `KYCRegistry` contract manages on-chain KYC verification and accreditation status for investors.

## Functions

### `isVerified`

Checks if an address is KYC verified.

```solidity
function isVerified(address investor) external view returns (bool);
```

### `getAccreditationLevel`

Returns the accreditation level of an investor.

```solidity
function getAccreditationLevel(address investor) external view returns (uint8);
```

### `verifyInvestor`

Verifies an investor. Requires `VERIFIER_ROLE`.

```solidity
function verifyInvestor(
    address investor,
    uint8 accreditationLevel,
    bytes2 country,
    uint256 expirationDate
) external;
```

### `revokeVerification`

Revokes verification. Requires `VERIFIER_ROLE`.

```solidity
function revokeVerification(address investor) external;
```

## Events

```solidity
event InvestorVerified(address indexed investor, uint8 level, bytes2 country);
event VerificationRevoked(address indexed investor);
event AccreditationUpdated(address indexed investor, uint8 oldLevel, uint8 newLevel);
```

## See Also

- [KYCModule](/docs/api/sdk/kyc-module)
- [KYC Integration Guide](/docs/guides/kyc-integration)
