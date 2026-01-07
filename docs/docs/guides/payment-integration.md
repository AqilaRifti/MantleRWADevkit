# Payment Integration Guide

This guide covers integrating payment processors with your RWA tokenization platform to handle fiat-to-token conversions, yield distributions, and investor payments.

## Overview

The Mantle RWA SDK supports integration with various payment processors to enable:
- Fiat currency deposits for token purchases
- Automated yield distributions in stablecoins
- Subscription payments for platform fees
- Cross-border payment processing

## Supported Payment Methods

### Stablecoins (Recommended)
- **USDC**: Primary stablecoin for most transactions
- **USDT**: Alternative stablecoin option
- **MNT**: Native Mantle token for gas and fees

### Fiat Payment Processors
- **Stripe**: Global payment processing
- **Circle**: USDC-native payments
- **Ramp**: Crypto on-ramp services
- **MoonPay**: Fiat-to-crypto gateway

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Investor      │    │   Your App      │    │   Mantle RWA    │
│                 │    │                 │    │   Contracts     │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Fiat Wallet │ │───▶│ │ Payment     │ │───▶│ │ Token Mint  │ │
│ └─────────────┘ │    │ │ Processor   │ │    │ └─────────────┘ │
│                 │    │ └─────────────┘ │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Crypto      │ │───▶│ │ RWA SDK     │ │───▶│ │ Yield Dist. │ │
│ │ Wallet      │ │    │ │             │ │    │ └─────────────┘ │
│ └─────────────┘ │    │ └─────────────┘ │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Stripe Integration

### Setup

```bash
npm install stripe @stripe/stripe-js
```

```typescript
import Stripe from 'stripe';
import { RWAClient } from '@mantle-rwa/sdk';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const rwaClient = new RWAClient({
  network: 'mantle-testnet',
  privateKey: process.env.PRIVATE_KEY,
});
```

### Token Purchase Flow

```typescript
interface TokenPurchaseRequest {
  investorAddress: string;
  tokenAmount: string;
  pricePerToken: number; // USD
  currency: 'usd' | 'eur' | 'gbp';
}

async function createTokenPurchaseIntent(request: TokenPurchaseRequest) {
  const totalAmount = parseFloat(request.tokenAmount) * request.pricePerToken;
  
  // Create Stripe payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalAmount * 100), // Convert to cents
    currency: request.currency,
    metadata: {
      investorAddress: request.investorAddress,
      tokenAmount: request.tokenAmount,
      tokenContract: process.env.TOKEN_CONTRACT_ADDRESS!,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}
```

### Payment Confirmation and Token Minting

```typescript
import { Request, Response } from 'express';

async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send('Webhook Error');
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    // Extract metadata
    const { investorAddress, tokenAmount, tokenContract } = paymentIntent.metadata;
    
    try {
      // Verify investor KYC status
      const registry = rwaClient.kyc.connect(process.env.KYC_REGISTRY_ADDRESS!);
      const investorInfo = await registry.getInvestorInfo(investorAddress);
      
      if (!investorInfo.verified) {
        throw new Error('Investor not KYC verified');
      }

      // Mint tokens to investor
      const token = rwaClient.token.connect(tokenContract);
      const mintResult = await token.mint(investorAddress, tokenAmount);
      
      console.log('Tokens minted:', mintResult.hash);
      
      // Update payment record
      await updatePaymentRecord(paymentIntent.id, {
        status: 'completed',
        txHash: mintResult.hash,
        blockNumber: mintResult.blockNumber,
      });
      
    } catch (error) {
      console.error('Token minting failed:', error);
      
      // Refund payment
      await stripe.refunds.create({
        payment_intent: paymentIntent.id,
        reason: 'requested_by_customer',
      });
      
      await updatePaymentRecord(paymentIntent.id, {
        status: 'failed',
        error: error.message,
      });
    }
  }

  res.status(200).send('OK');
}
```

### Frontend Integration

```tsx
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

interface TokenPurchaseFormProps {
  tokenAmount: string;
  pricePerToken: number;
  investorAddress: string;
}

function TokenPurchaseForm({ tokenAmount, pricePerToken, investorAddress }: TokenPurchaseFormProps) {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const initializePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investorAddress,
          tokenAmount,
          pricePerToken,
          currency: 'usd',
        }),
      });
      
      const { clientSecret } = await response.json();
      setClientSecret(clientSecret);
    } catch (error) {
      console.error('Payment initialization failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="token-purchase">
      <div className="purchase-summary">
        <h3>Purchase Summary</h3>
        <p>Tokens: {tokenAmount}</p>
        <p>Price per token: ${pricePerToken}</p>
        <p>Total: ${(parseFloat(tokenAmount) * pricePerToken).toFixed(2)}</p>
      </div>

      {!clientSecret ? (
        <button onClick={initializePayment} disabled={loading}>
          {loading ? 'Initializing...' : 'Purchase Tokens'}
        </button>
      ) : (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm />
        </Elements>
      )}
    </div>
  );
}

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/purchase-success`,
      },
    });

    if (error) {
      console.error('Payment failed:', error);
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe || processing}>
        {processing ? 'Processing...' : 'Complete Purchase'}
      </button>
    </form>
  );
}
```

## Circle Integration (USDC-Native)

### Setup

```bash
npm install @circle-fin/circle-sdk
```

```typescript
import { Circle, CircleEnvironments } from '@circle-fin/circle-sdk';

const circle = new Circle(
  process.env.CIRCLE_API_KEY!,
  CircleEnvironments.sandbox // or production
);
```

### USDC Payment Flow

```typescript
async function createUSDCPayment(request: {
  investorAddress: string;
  usdcAmount: string;
  sourceWalletId: string;
}) {
  // Create USDC transfer
  const transfer = await circle.transfers.create({
    source: {
      type: 'wallet',
      id: request.sourceWalletId,
    },
    destination: {
      type: 'blockchain',
      address: request.investorAddress,
      chain: 'MATIC', // Polygon for USDC
    },
    amount: {
      amount: request.usdcAmount,
      currency: 'USD',
    },
  });

  return transfer.data;
}

async function handleUSDCPayment(transferId: string) {
  // Check transfer status
  const transfer = await circle.transfers.get(transferId);
  
  if (transfer.data?.status === 'complete') {
    // Transfer completed, mint tokens
    const tokenAmount = calculateTokenAmount(transfer.data.amount.amount);
    
    const token = rwaClient.token.connect(process.env.TOKEN_CONTRACT_ADDRESS!);
    const mintResult = await token.mint(
      transfer.data.destination.address,
      tokenAmount
    );
    
    console.log('Tokens minted for USDC payment:', mintResult.hash);
  }
}
```

## Ramp Integration (Crypto On-Ramp)

### Setup

```typescript
interface RampConfig {
  hostApiKey: string;
  hostLogoUrl: string;
  hostAppName: string;
  userAddress: string;
  swapAsset: string;
  swapAmount?: string;
}

function initializeRamp(config: RampConfig) {
  const rampWidget = new window.RampInstantSDK({
    hostApiKey: config.hostApiKey,
    variant: 'auto',
    userAddress: config.userAddress,
    swapAsset: config.swapAsset, // e.g., 'MATIC_USDC'
    swapAmount: config.swapAmount,
    hostLogoUrl: config.hostLogoUrl,
    hostAppName: config.hostAppName,
  });

  rampWidget.on('*', (event) => {
    console.log('Ramp event:', event);
  });

  rampWidget.show();
  return rampWidget;
}
```

### React Integration

```tsx
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

function RampOnboarding() {
  const { address } = useAccount();
  const [rampWidget, setRampWidget] = useState<any>(null);

  useEffect(() => {
    if (address && window.RampInstantSDK) {
      const widget = initializeRamp({
        hostApiKey: process.env.REACT_APP_RAMP_API_KEY!,
        hostLogoUrl: 'https://your-app.com/logo.png',
        hostAppName: 'Your RWA Platform',
        userAddress: address,
        swapAsset: 'MATIC_USDC',
        swapAmount: '100', // $100 default
      });

      setRampWidget(widget);

      return () => {
        widget?.destroy();
      };
    }
  }, [address]);

  return (
    <div className="ramp-integration">
      <h3>Buy USDC to Purchase Tokens</h3>
      <p>Use your credit card or bank account to buy USDC, then purchase RWA tokens.</p>
      
      {!address ? (
        <p>Please connect your wallet first.</p>
      ) : (
        <button onClick={() => rampWidget?.show()}>
          Buy USDC with Ramp
        </button>
      )}
    </div>
  );
}
```

## Yield Distribution Payments

### Automated USDC Distributions

```typescript
async function distributeYieldInUSDC(config: {
  yieldDistributorAddress: string;
  usdcAddress: string;
  totalAmount: string;
  claimWindowDays: number;
}) {
  const distributor = rwaClient.yield.connect(config.yieldDistributorAddress);
  
  // Create distribution
  const result = await distributor.createDistribution(
    config.usdcAddress,
    config.totalAmount,
    config.claimWindowDays
  );
  
  console.log('Yield distribution created:', result.hash);
  
  // Notify investors
  await notifyInvestorsOfYield(result.distributionId);
  
  return result;
}

async function notifyInvestorsOfYield(distributionId: number) {
  // Get all token holders
  const holders = await getTokenHolders();
  
  // Send email notifications
  for (const holder of holders) {
    await sendYieldNotification(holder.email, {
      distributionId,
      amount: holder.claimableAmount,
      deadline: holder.claimDeadline,
    });
  }
}
```

### Batch Payment Processing

```typescript
async function processBatchPayments(payments: Array<{
  recipient: string;
  amount: string;
  currency: 'USDC' | 'USDT';
}>) {
  const results = [];
  
  for (const payment of payments) {
    try {
      let txResult;
      
      if (payment.currency === 'USDC') {
        // Use Circle for USDC
        txResult = await processUSDCPayment(payment);
      } else {
        // Use direct blockchain transfer for USDT
        txResult = await processUSDTPayment(payment);
      }
      
      results.push({
        recipient: payment.recipient,
        status: 'success',
        txHash: txResult.hash,
      });
      
    } catch (error) {
      results.push({
        recipient: payment.recipient,
        status: 'failed',
        error: error.message,
      });
    }
  }
  
  return results;
}
```

## Security Best Practices

### Payment Validation

```typescript
async function validatePayment(paymentData: {
  amount: string;
  currency: string;
  investorAddress: string;
}) {
  // 1. Verify investor KYC status
  const registry = rwaClient.kyc.connect(process.env.KYC_REGISTRY_ADDRESS!);
  const investorInfo = await registry.getInvestorInfo(paymentData.investorAddress);
  
  if (!investorInfo.verified) {
    throw new Error('Investor not KYC verified');
  }
  
  // 2. Check investment limits
  const currentInvestment = await getCurrentInvestmentAmount(paymentData.investorAddress);
  const newTotal = currentInvestment + parseFloat(paymentData.amount);
  
  if (investorInfo.tier === 'Retail' && newTotal > 10000) {
    throw new Error('Investment exceeds retail investor limit');
  }
  
  // 3. Validate payment amount
  if (parseFloat(paymentData.amount) <= 0) {
    throw new Error('Invalid payment amount');
  }
  
  return true;
}
```

### Webhook Security

```typescript
import crypto from 'crypto';

function verifyStripeWebhook(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET!)
    .update(payload, 'utf8')
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

function verifyCircleWebhook(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.CIRCLE_WEBHOOK_SECRET!)
    .update(payload, 'utf8')
    .digest('hex');
    
  return signature === expectedSignature;
}
```

## Error Handling and Recovery

### Payment Failure Recovery

```typescript
async function handlePaymentFailure(paymentId: string, error: Error) {
  console.error(`Payment ${paymentId} failed:`, error);
  
  // 1. Log the failure
  await logPaymentFailure(paymentId, error);
  
  // 2. Notify relevant parties
  await notifyPaymentFailure(paymentId, error);
  
  // 3. Attempt recovery based on error type
  if (error.message.includes('insufficient_funds')) {
    // Retry with lower amount or different payment method
    await suggestAlternativePayment(paymentId);
  } else if (error.message.includes('kyc')) {
    // Redirect to KYC completion
    await redirectToKYC(paymentId);
  } else {
    // Generic retry mechanism
    await schedulePaymentRetry(paymentId);
  }
}

async function schedulePaymentRetry(paymentId: string, attempt: number = 1) {
  const maxAttempts = 3;
  const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
  
  if (attempt <= maxAttempts) {
    setTimeout(async () => {
      try {
        await retryPayment(paymentId);
      } catch (error) {
        await schedulePaymentRetry(paymentId, attempt + 1);
      }
    }, delay);
  } else {
    await markPaymentAsFailed(paymentId);
  }
}
```

## Testing and Development

### Mock Payment Processor

```typescript
class MockPaymentProcessor {
  private payments = new Map<string, any>();
  
  async createPaymentIntent(amount: number, currency: string) {
    const paymentId = `mock_${Date.now()}`;
    
    this.payments.set(paymentId, {
      id: paymentId,
      amount,
      currency,
      status: 'requires_payment_method',
      created: Date.now(),
    });
    
    return {
      id: paymentId,
      client_secret: `${paymentId}_secret`,
    };
  }
  
  async confirmPayment(paymentId: string) {
    const payment = this.payments.get(paymentId);
    if (!payment) throw new Error('Payment not found');
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    payment.status = 'succeeded';
    this.payments.set(paymentId, payment);
    
    return payment;
  }
  
  async getPayment(paymentId: string) {
    return this.payments.get(paymentId);
  }
}

// Use in development
const paymentProcessor = process.env.NODE_ENV === 'development' 
  ? new MockPaymentProcessor()
  : stripe;
```

### Integration Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('Payment Integration', () => {
  it('should create payment intent successfully', async () => {
    const intent = await createTokenPurchaseIntent({
      investorAddress: '0x1234...',
      tokenAmount: '100',
      pricePerToken: 10,
      currency: 'usd',
    });
    
    expect(intent.clientSecret).toBeDefined();
    expect(intent.paymentIntentId).toBeDefined();
  });
  
  it('should mint tokens after successful payment', async () => {
    // Mock successful payment
    const paymentIntent = {
      id: 'pi_test_123',
      metadata: {
        investorAddress: '0x1234...',
        tokenAmount: '100',
        tokenContract: tokenAddress,
      },
    };
    
    // Process webhook
    await handleStripeWebhook(paymentIntent);
    
    // Verify tokens were minted
    const balance = await token.balanceOf('0x1234...');
    expect(balance).toBe(100n);
  });
});
```

## Production Checklist

Before going live with payment integration:

- [ ] Production API keys configured for all payment processors
- [ ] Webhook endpoints secured with HTTPS and signature verification
- [ ] Payment validation and KYC checks implemented
- [ ] Error handling and retry mechanisms in place
- [ ] Compliance with financial regulations (PCI DSS, etc.)
- [ ] Rate limiting and fraud detection configured
- [ ] Monitoring and alerting for payment failures
- [ ] Backup payment methods available
- [ ] Customer support processes for payment issues
- [ ] Regular security audits scheduled

## Regulatory Considerations

### Compliance Requirements

1. **Know Your Customer (KYC)**: Verify all investors before processing payments
2. **Anti-Money Laundering (AML)**: Monitor for suspicious payment patterns
3. **Securities Regulations**: Ensure compliance with local securities laws
4. **Tax Reporting**: Maintain records for tax reporting requirements
5. **Data Privacy**: Protect payment and personal information (GDPR, CCPA)

### Record Keeping

```typescript
interface PaymentRecord {
  id: string;
  investorAddress: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  txHash?: string;
  createdAt: Date;
  completedAt?: Date;
  metadata: Record<string, any>;
}

async function createPaymentRecord(data: Omit<PaymentRecord, 'id' | 'createdAt'>) {
  const record: PaymentRecord = {
    ...data,
    id: generatePaymentId(),
    createdAt: new Date(),
  };
  
  await savePaymentRecord(record);
  return record;
}
```

---

With proper payment integration, your RWA platform can seamlessly handle fiat-to-token conversions while maintaining regulatory compliance and providing a smooth user experience.