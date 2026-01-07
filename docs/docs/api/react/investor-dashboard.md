---
sidebar_position: 3
title: InvestorDashboard
description: Portfolio overview and management component
keywords: [dashboard, portfolio, investor, react]
---

# InvestorDashboard

The `InvestorDashboard` component provides a comprehensive portfolio overview for token holders.

## Import

```tsx
import { InvestorDashboard } from '@mantle-rwa/react';
```

## Basic Usage

```tsx
<InvestorDashboard tokenAddress="0x..." />
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `tokenAddress` | `string` | Yes | Address of the RWA token |
| `showYield` | `boolean` | No | Show yield information |
| `showTransactions` | `boolean` | No | Show transaction history |
| `showChart` | `boolean` | No | Show portfolio chart |
| `onTransfer` | `() => void` | No | Callback for transfer action |
| `onClaim` | `() => void` | No | Callback for claim action |
| `className` | `string` | No | Additional CSS class |

## Examples

### Full Dashboard

```tsx
<InvestorDashboard
  tokenAddress="0x..."
  showYield={true}
  showTransactions={true}
  showChart={true}
/>
```

### With Actions

```tsx
<InvestorDashboard
  tokenAddress="0x..."
  onTransfer={() => setShowTransferModal(true)}
  onClaim={async () => {
    await yieldModule.claim();
    toast.success('Yield claimed!');
  }}
/>
```

### Minimal View

```tsx
<InvestorDashboard
  tokenAddress="0x..."
  showYield={false}
  showTransactions={false}
  showChart={false}
/>
```

## Dashboard Sections

### Portfolio Summary

Displays:
- Token balance
- Current value (if price feed available)
- Percentage of total supply
- KYC/accreditation status

### Yield Information

When `showYield={true}`:
- Claimable yield amount
- Total yield claimed
- Next distribution date
- Yield history

### Transaction History

When `showTransactions={true}`:
- Recent transfers
- Mint/burn events
- Yield claims
- Pagination support

### Portfolio Chart

When `showChart={true}`:
- Balance over time
- Yield accumulation
- Interactive tooltips

## Customization

### Custom Sections

```tsx
<InvestorDashboard
  tokenAddress="0x..."
  sections={['balance', 'yield', 'transactions']}
  renderSection={(section, data) => (
    <CustomSection section={section} data={data} />
  )}
/>
```

### Custom Actions

```tsx
<InvestorDashboard
  tokenAddress="0x..."
  actions={[
    { label: 'Transfer', onClick: handleTransfer, icon: <SendIcon /> },
    { label: 'Claim Yield', onClick: handleClaim, icon: <ClaimIcon /> },
    { label: 'View Details', onClick: handleDetails, icon: <InfoIcon /> },
  ]}
/>
```

## Styling

### CSS Variables

```css
.rwa-investor-dashboard {
  --dashboard-background: #1A1A1A;
  --dashboard-card-bg: #2D2D2D;
  --dashboard-border-radius: 12px;
  --dashboard-spacing: 1.5rem;
}
```

### Class Names

| Class | Description |
|-------|-------------|
| `.rwa-investor-dashboard` | Root container |
| `.rwa-dashboard-card` | Card component |
| `.rwa-dashboard-balance` | Balance display |
| `.rwa-dashboard-yield` | Yield section |
| `.rwa-dashboard-chart` | Chart container |
| `.rwa-dashboard-transactions` | Transaction list |

## See Also

- [TokenModule](/docs/api/sdk/token-module)
- [YieldModule](/docs/api/sdk/yield-module)
