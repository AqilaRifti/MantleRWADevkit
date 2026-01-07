---
sidebar_position: 5
title: YieldCalculator
description: Yield projection calculator component
keywords: [yield, calculator, projection, react]
---

# YieldCalculator

The `YieldCalculator` component provides an interactive yield projection calculator for investors.

## Import

```tsx
import { YieldCalculator } from '@mantle-rwa/react';
```

## Basic Usage

```tsx
<YieldCalculator
  tokenAddress="0x..."
  yieldDistributorAddress="0x..."
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `tokenAddress` | `string` | Yes | Address of the RWA token |
| `yieldDistributorAddress` | `string` | Yes | Address of yield distributor |
| `defaultAmount` | `string` | No | Default investment amount |
| `defaultPeriod` | `number` | No | Default projection period (months) |
| `showChart` | `boolean` | No | Show projection chart |
| `showBreakdown` | `boolean` | No | Show detailed breakdown |
| `className` | `string` | No | Additional CSS class |

## Examples

### Full Calculator

```tsx
<YieldCalculator
  tokenAddress="0x..."
  yieldDistributorAddress="0x..."
  showChart={true}
  showBreakdown={true}
/>
```

### With Defaults

```tsx
<YieldCalculator
  tokenAddress="0x..."
  yieldDistributorAddress="0x..."
  defaultAmount="10000"
  defaultPeriod={12}
/>
```

### Minimal View

```tsx
<YieldCalculator
  tokenAddress="0x..."
  yieldDistributorAddress="0x..."
  showChart={false}
  showBreakdown={false}
/>
```

## Calculator Features

### Input Fields

- **Investment Amount**: Token amount to calculate yield for
- **Time Period**: Projection period (1-60 months)
- **Reinvestment**: Toggle compound yield calculation

### Output Display

- **Projected Yield**: Total expected yield
- **APY**: Annual percentage yield
- **Monthly Breakdown**: Month-by-month projections
- **Comparison**: Compare different scenarios

### Chart

When `showChart={true}`:
- Line chart showing yield accumulation
- Interactive tooltips
- Multiple scenario comparison
- Export functionality

## Customization

### Custom Periods

```tsx
<YieldCalculator
  tokenAddress="0x..."
  yieldDistributorAddress="0x..."
  periodOptions={[
    { value: 3, label: '3 months' },
    { value: 6, label: '6 months' },
    { value: 12, label: '1 year' },
    { value: 24, label: '2 years' },
    { value: 60, label: '5 years' },
  ]}
/>
```

### Custom Yield Rate

```tsx
<YieldCalculator
  tokenAddress="0x..."
  yieldDistributorAddress="0x..."
  yieldRate={0.08} // 8% APY override
/>
```

### Custom Formatting

```tsx
<YieldCalculator
  tokenAddress="0x..."
  yieldDistributorAddress="0x..."
  formatAmount={(amount) => `$${amount.toLocaleString()}`}
  formatYield={(yield_) => `${yield_.toFixed(2)}%`}
/>
```

## Styling

### CSS Variables

```css
.rwa-yield-calculator {
  --calc-background: #1A1A1A;
  --calc-input-bg: #2D2D2D;
  --calc-accent: #65B3AE;
  --calc-border-radius: 12px;
}
```

### Class Names

| Class | Description |
|-------|-------------|
| `.rwa-yield-calculator` | Root container |
| `.rwa-calc-input` | Input fields |
| `.rwa-calc-result` | Result display |
| `.rwa-calc-chart` | Chart container |
| `.rwa-calc-breakdown` | Breakdown table |

## Calculation Formula

The calculator uses the following formula:

```
Simple Yield = Principal × APY × (Period / 12)
Compound Yield = Principal × ((1 + APY/12)^Period - 1)
```

Where:
- **Principal**: Investment amount
- **APY**: Annual percentage yield
- **Period**: Number of months

## See Also

- [YieldModule](/docs/api/sdk/yield-module)
- [Yield Distribution Guide](/docs/guides/yield-distribution)
