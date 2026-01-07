# KYC Integration Guide

This guide walks you through integrating Know Your Customer (KYC) providers with the Mantle RWA SDK to verify investor eligibility and maintain regulatory compliance.

## Overview

The Mantle RWA SDK supports multiple KYC providers through a unified interface, allowing you to:
- Verify investor identities
- Determine accreditation status
- Maintain compliance with securities regulations
- Sync verification results to on-chain registry

## Supported Providers

### Persona
- **Best for**: US-focused projects requiring accredited investor verification
- **Features**: Identity verification, accreditation checks, ongoing monitoring
- **Pricing**: Pay-per-verification model
- **Documentation**: [Persona Developer Docs](https://docs.withpersona.com/)

### Synaps
- **Best for**: European projects requiring GDPR compliance
- **Features**: Identity verification, AML screening, document verification
- **Pricing**: Subscription-based with volume discounts
- **Documentation**: [Synaps API Docs](https://docs.synaps.io/)

### Jumio
- **Best for**: Global projects requiring comprehensive identity verification
- **Features**: Document verification, biometric matching, fraud detection
- **Pricing**: Enterprise pricing with custom rates
- **Documentation**: [Jumio Developer Portal](https://developer.jumio.com/)

## Integration Steps

### Step 1: Choose Your Provider

Select a KYC provider based on your requirements:

```typescript
import { RWAClient } from '@mantle-rwa/sdk';

const client = new RWAClient({
  network: 'mantle-testnet',
  privateKey: process.env.PRIVATE_KEY,
});

// Set your preferred KYC provider
client.kyc.setProvider('persona'); // or 'synaps' or 'jumio'
```

### Step 2: Configure Provider Credentials

Set up your provider API credentials:

```bash
# .env
PERSONA_API_KEY=your_persona_api_key
PERSONA_TEMPLATE_ID=your_template_id
PERSONA_ENVIRONMENT=sandbox # or production

SYNAPS_API_KEY=your_synaps_api_key
SYNAPS_CLIENT_ID=your_client_id

JUMIO_API_TOKEN=your_jumio_token
JUMIO_API_SECRET=your_jumio_secret
JUMIO_DATACENTER=US # or EU, SG
```

### Step 3: Implement Verification Flow

#### Basic Verification

```typescript
async function verifyInvestor(investorAddress: string) {
  try {
    // Initiate KYC verification
    const session = await client.kyc.verifyInvestor(investorAddress);
    
    console.log('Verification session created:', session.sessionId);
    console.log('Verification URL:', session.verificationUrl);
    
    // Return URL to investor for completion
    return session.verificationUrl;
  } catch (error) {
    console.error('KYC verification failed:', error);
    throw error;
  }
}
```

#### Check Verification Status

```typescript
async function checkVerificationStatus(sessionId: string) {
  const status = await client.kyc.checkStatus(sessionId);
  
  switch (status.status) {
    case 'pending':
      console.log('Verification in progress...');
      break;
    case 'completed':
      console.log('Verification completed successfully');
      const result = await client.kyc.getVerificationResult(sessionId);
      return result;
    case 'failed':
      console.log('Verification failed:', status.reason);
      break;
  }
}
```

#### Update On-Chain Registry

```typescript
async function syncToRegistry(
  registryAddress: string,
  investorAddress: string,
  verificationResult: VerificationResult
) {
  try {
    const txResult = await client.kyc.updateRegistry(
      registryAddress,
      investorAddress,
      verificationResult
    );
    
    console.log('Registry updated:', txResult.hash);
    return txResult;
  } catch (error) {
    console.error('Registry update failed:', error);
    throw error;
  }
}
```

## Provider-Specific Configuration

### Persona Integration

```typescript
// Configure Persona-specific options
client.kyc.setProvider('persona', {
  apiKey: process.env.PERSONA_API_KEY,
  templateId: process.env.PERSONA_TEMPLATE_ID,
  environment: process.env.PERSONA_ENVIRONMENT,
  
  // Verification requirements
  requirements: {
    identity: true,
    accreditation: true,
    address: true,
    tax: false,
  },
  
  // Webhook configuration
  webhookUrl: 'https://your-app.com/webhooks/persona',
});

// Custom verification flow
async function personaVerification(investorAddress: string) {
  const session = await client.kyc.verifyInvestor(investorAddress, {
    // Persona-specific options
    referenceId: `investor_${investorAddress}`,
    fields: {
      nameFirst: 'John',
      nameLast: 'Doe',
      emailAddress: 'john.doe@example.com',
    },
  });
  
  return session;
}
```

### Synaps Integration

```typescript
// Configure Synaps-specific options
client.kyc.setProvider('synaps', {
  apiKey: process.env.SYNAPS_API_KEY,
  clientId: process.env.SYNAPS_CLIENT_ID,
  
  // Verification steps
  steps: [
    'identity',
    'document',
    'liveness',
    'aml',
  ],
  
  // GDPR compliance
  gdprCompliant: true,
  dataRetentionDays: 2555, // 7 years
});

// Custom verification flow
async function synapsVerification(investorAddress: string) {
  const session = await client.kyc.verifyInvestor(investorAddress, {
    // Synaps-specific options
    alias: investorAddress,
    locale: 'en',
    tier: 3, // Full verification
  });
  
  return session;
}
```

### Jumio Integration

```typescript
// Configure Jumio-specific options
client.kyc.setProvider('jumio', {
  apiToken: process.env.JUMIO_API_TOKEN,
  apiSecret: process.env.JUMIO_API_SECRET,
  datacenter: process.env.JUMIO_DATACENTER,
  
  // Verification workflow
  workflow: 'identity_verification',
  
  // Document types
  acceptedDocuments: [
    'PASSPORT',
    'DRIVING_LICENSE',
    'ID_CARD',
  ],
});

// Custom verification flow
async function jumioVerification(investorAddress: string) {
  const session = await client.kyc.verifyInvestor(investorAddress, {
    // Jumio-specific options
    userReference: investorAddress,
    workflowId: 'your_workflow_id',
    locale: 'en',
  });
  
  return session;
}
```

## Webhook Handling

Set up webhooks to receive real-time verification updates:

### Express.js Webhook Handler

```typescript
import express from 'express';
import { RWAClient } from '@mantle-rwa/sdk';

const app = express();
app.use(express.json());

const client = new RWAClient({
  network: 'mantle-testnet',
  privateKey: process.env.PRIVATE_KEY,
});

// Persona webhook
app.post('/webhooks/persona', async (req, res) => {
  const { data } = req.body;
  
  if (data.attributes.status === 'completed') {
    const verificationResult = await client.kyc.getVerificationResult(
      data.attributes['reference-id']
    );
    
    // Update on-chain registry
    await client.kyc.updateRegistry(
      process.env.KYC_REGISTRY_ADDRESS!,
      data.attributes['reference-id'],
      verificationResult
    );
  }
  
  res.status(200).send('OK');
});

// Synaps webhook
app.post('/webhooks/synaps', async (req, res) => {
  const { session_id, status } = req.body;
  
  if (status === 'FINISHED') {
    const verificationResult = await client.kyc.getVerificationResult(session_id);
    
    // Update on-chain registry
    await client.kyc.updateRegistry(
      process.env.KYC_REGISTRY_ADDRESS!,
      session_id,
      verificationResult
    );
  }
  
  res.status(200).send('OK');
});

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

## Frontend Integration

### React Component Integration

```tsx
import { KYCFlow } from '@mantle-rwa/react';
import { useState } from 'react';

function InvestorOnboarding() {
  const [kycStatus, setKycStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  
  return (
    <div className="onboarding">
      <h2>Investor Verification</h2>
      
      <KYCFlow
        provider="persona"
        onComplete={(kycData) => {
          console.log('KYC completed:', kycData);
          setKycStatus('completed');
        }}
        onError={(error) => {
          console.error('KYC failed:', error);
          setKycStatus('failed');
        }}
        requiredFields={['identity', 'accreditation']}
        theme="light"
        registryAddress={process.env.REACT_APP_KYC_REGISTRY_ADDRESS}
        autoUpdateRegistry={true}
      />
      
      {kycStatus === 'completed' && (
        <div className="success">
          ✅ Verification completed! You can now purchase tokens.
        </div>
      )}
    </div>
  );
}
```

### Custom Verification UI

```tsx
import { useRWAClient } from '@mantle-rwa/react';
import { useState } from 'react';

function CustomKYCFlow() {
  const client = useRWAClient();
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const startVerification = async () => {
    setLoading(true);
    try {
      const session = await client.kyc.verifyInvestor(userAddress);
      setVerificationUrl(session.verificationUrl);
    } catch (error) {
      console.error('Failed to start verification:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="kyc-flow">
      {!verificationUrl ? (
        <button onClick={startVerification} disabled={loading}>
          {loading ? 'Starting verification...' : 'Start KYC Verification'}
        </button>
      ) : (
        <iframe
          src={verificationUrl}
          width="100%"
          height="600px"
          frameBorder="0"
        />
      )}
    </div>
  );
}
```

## Batch Operations

For managing multiple investors efficiently:

```typescript
async function batchVerifyInvestors(investors: Array<{
  address: string;
  email: string;
  name: string;
}>) {
  const verificationSessions = [];
  
  // Start verification for all investors
  for (const investor of investors) {
    const session = await client.kyc.verifyInvestor(investor.address, {
      emailAddress: investor.email,
      nameFirst: investor.name.split(' ')[0],
      nameLast: investor.name.split(' ')[1],
    });
    
    verificationSessions.push({
      address: investor.address,
      sessionId: session.sessionId,
    });
  }
  
  return verificationSessions;
}

async function batchUpdateRegistry(
  registryAddress: string,
  verificationResults: Array<{
    address: string;
    result: VerificationResult;
  }>
) {
  // Batch update registry for gas efficiency
  const txResult = await client.kyc.batchUpdateRegistry(
    registryAddress,
    verificationResults
  );
  
  console.log('Batch registry update:', txResult.hash);
  return txResult;
}
```

## Testing and Development

### Mock Provider for Testing

```typescript
import { MockKYCProvider } from '@mantle-rwa/sdk/testing';

// Use mock provider in development
if (process.env.NODE_ENV === 'development') {
  client.kyc.setProvider(new MockKYCProvider({
    // Always approve verifications
    autoApprove: true,
    
    // Simulate verification delay
    verificationDelay: 2000,
    
    // Default verification result
    defaultResult: {
      verified: true,
      tier: 'Accredited',
      identityHash: '0x1234...',
      expiryDate: new Date('2025-12-31'),
    },
  }));
}
```

### Testing Verification Flow

```typescript
import { describe, it, expect } from 'vitest';

describe('KYC Integration', () => {
  it('should verify investor successfully', async () => {
    const session = await client.kyc.verifyInvestor('0x1234...');
    expect(session.sessionId).toBeDefined();
    expect(session.verificationUrl).toContain('https://');
  });
  
  it('should update registry after verification', async () => {
    const verificationResult = {
      verified: true,
      tier: 'Accredited' as const,
      identityHash: '0x1234...',
      expiryDate: new Date('2025-12-31'),
    };
    
    const txResult = await client.kyc.updateRegistry(
      registryAddress,
      investorAddress,
      verificationResult
    );
    
    expect(txResult.status).toBe('success');
  });
});
```

## Security Best Practices

### API Key Management
- Store API keys in environment variables
- Use different keys for development and production
- Rotate keys regularly
- Monitor API key usage

### Data Privacy
- Never store raw identity documents
- Use identity hashes for on-chain storage
- Implement data retention policies
- Comply with GDPR/CCPA requirements

### Webhook Security
- Verify webhook signatures
- Use HTTPS endpoints only
- Implement rate limiting
- Log all webhook events

## Troubleshooting

### Common Issues

**1. Verification Fails**
```
Error: Verification failed - insufficient documentation
```
Solution: Check provider requirements and ensure all required documents are provided.

**2. Registry Update Fails**
```
Error: Transaction reverted - investor not verified
```
Solution: Ensure verification is completed before updating registry.

**3. Webhook Not Received**
```
Error: Webhook timeout
```
Solution: Check webhook URL accessibility and implement proper error handling.

### Provider-Specific Issues

**Persona**
- Check template configuration
- Verify API key permissions
- Review webhook endpoint setup

**Synaps**
- Ensure client ID matches API key
- Check step configuration
- Verify GDPR compliance settings

**Jumio**
- Confirm datacenter selection
- Check workflow configuration
- Verify document type acceptance

## Production Checklist

Before going live:

- [ ] Production API keys configured
- [ ] Webhook endpoints secured with HTTPS
- [ ] Data retention policies implemented
- [ ] Compliance requirements verified
- [ ] Error handling and logging in place
- [ ] Rate limiting configured
- [ ] Monitoring and alerting set up
- [ ] Privacy policy updated
- [ ] Terms of service include KYC requirements

---

With proper KYC integration, your RWA platform will maintain regulatory compliance while providing a smooth investor onboarding experience.