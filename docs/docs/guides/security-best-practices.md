# Security Best Practices

Security is paramount when building RWA tokenization platforms. This guide covers essential security practices for smart contracts, SDK usage, and application deployment.

## Smart Contract Security

### Access Control

Implement proper role-based access control:

```solidity
// ✅ Good: Use OpenZeppelin's AccessControl
import "@openzeppelin/contracts/access/AccessControl.sol";

contract RWAToken is ERC20, AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant COMPLIANCE_OFFICER_ROLE = keccak256("COMPLIANCE_OFFICER_ROLE");
    
    modifier onlyIssuer() {
        require(hasRole(ISSUER_ROLE, msg.sender), "Not authorized");
        _;
    }
    
    function mint(address to, uint256 amount) external onlyIssuer {
        _mint(to, amount);
    }
}
```

### Multi-Signature Requirements

Use multi-signature wallets for critical operations:

```typescript
// ✅ Good: Multi-sig for admin functions
const deployment = await client.deployRWASystem({
  tokenName: "Secure RWA Token",
  tokenSymbol: "SRT",
  initialSupply: "1000",
  vaultSigners: [
    "0x1234...", // Issuer
    "0x5678...", // Custodian
    "0x9abc...", // Compliance Officer
  ],
  vaultThreshold: 2, // Require 2 of 3 signatures
});
```

### Reentrancy Protection

Always use reentrancy guards for external calls:

```solidity
// ✅ Good: Use ReentrancyGuard
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract AssetVault is ReentrancyGuard {
    function withdraw(address token, uint256 amount) 
        external 
        nonReentrant 
        onlyAuthorized 
    {
        IERC20(token).transfer(msg.sender, amount);
    }
}
```

### Input Validation

Validate all inputs thoroughly:

```solidity
// ✅ Good: Comprehensive validation
function addInvestor(
    address investor,
    AccreditationTier tier,
    uint256 expiryTimestamp,
    bytes32 identityHash
) external onlyKYCAdmin {
    require(investor != address(0), "Invalid address");
    require(expiryTimestamp > block.timestamp, "Expiry in past");
    require(identityHash != bytes32(0), "Invalid identity hash");
    require(tier != AccreditationTier.None, "Invalid tier");
    
    // Implementation...
}
```

## Private Key Management

### Development Environment

```bash
# ✅ Good: Use environment variables
PRIVATE_KEY=0x1234567890abcdef...

# ❌ Bad: Never hardcode keys
const privateKey = "0x1234567890abcdef..."; // DON'T DO THIS
```

### Production Environment

Use hardware wallets or secure key management:

```typescript
// ✅ Good: Hardware wallet integration
import { LedgerSigner } from '@ethersproject/hardware-wallets';

const signer = new LedgerSigner(provider, "m/44'/60'/0'/0/0");
const client = new RWAClient({
  network: 'mantle',
  signer: signer,
});
```

### Key Rotation

Implement regular key rotation:

```typescript
// ✅ Good: Role transfer process
async function rotateIssuerKey(
  oldIssuer: string,
  newIssuer: string
) {
  const token = client.connectToken(tokenAddress);
  
  // Grant role to new issuer
  await token.grantIssuerRole(newIssuer);
  
  // Revoke role from old issuer
  await token.revokeIssuerRole(oldIssuer);
  
  console.log('Issuer key rotated successfully');
}
```

## Network Security

### RPC Endpoint Security

Use secure, reliable RPC endpoints:

```typescript
// ✅ Good: Use reputable providers
const client = new RWAClient({
  network: {
    chainId: 5000,
    rpcUrl: 'https://rpc.mantle.xyz', // Official Mantle RPC
  },
  privateKey: process.env.PRIVATE_KEY,
});

// ❌ Bad: Untrusted RPC endpoints
const client = new RWAClient({
  network: {
    chainId: 5000,
    rpcUrl: 'https://random-rpc-provider.com', // Potentially malicious
  },
  privateKey: process.env.PRIVATE_KEY,
});
```

### Rate Limiting

Implement proper rate limiting:

```typescript
// ✅ Good: Rate limiting for API calls
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});

app.use('/api/', limiter);
```

## Application Security

### Environment Variables

Secure environment variable management:

```bash
# ✅ Good: Separate environments
# .env.development
PRIVATE_KEY=0x... # Development key
RPC_URL=https://rpc.sepolia.mantle.xyz
KYC_PROVIDER=mock

# .env.production
PRIVATE_KEY=0x... # Production key (from secure vault)
RPC_URL=https://rpc.mantle.xyz
KYC_PROVIDER=persona
```

### Input Sanitization

Sanitize all user inputs:

```typescript
// ✅ Good: Input validation
import { isAddress } from 'ethers';
import validator from 'validator';

function validateMintRequest(recipient: string, amount: string) {
  // Validate Ethereum address
  if (!isAddress(recipient)) {
    throw new Error('Invalid recipient address');
  }
  
  // Validate amount
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    throw new Error('Invalid amount');
  }
  
  // Sanitize amount string
  const sanitizedAmount = validator.escape(amount);
  
  return { recipient, amount: sanitizedAmount };
}
```

### Error Handling

Implement secure error handling:

```typescript
// ✅ Good: Safe error messages
try {
  await client.token.mint(recipient, amount);
} catch (error) {
  // Log detailed error internally
  console.error('Mint failed:', error);
  
  // Return generic error to user
  throw new Error('Transaction failed. Please try again.');
}

// ❌ Bad: Exposing sensitive information
try {
  await client.token.mint(recipient, amount);
} catch (error) {
  // Don't expose internal details
  throw error; // Could leak private keys or internal state
}
```

## KYC Security

### Data Privacy

Protect investor data:

```typescript
// ✅ Good: Hash sensitive data
import { keccak256, toUtf8Bytes } from 'ethers';

function createIdentityHash(personalData: {
  name: string;
  ssn: string;
  address: string;
}) {
  // Combine and hash sensitive data
  const combined = `${personalData.name}|${personalData.ssn}|${personalData.address}`;
  const hash = keccak256(toUtf8Bytes(combined));
  
  // Store only the hash on-chain
  return hash;
}

// ❌ Bad: Storing raw PII
function storePersonalData(personalData: any) {
  // Never store raw personal data on-chain
  return personalData; // DON'T DO THIS
}
```

### Webhook Security

Secure webhook endpoints:

```typescript
// ✅ Good: Verify webhook signatures
import crypto from 'crypto';

function verifyPersonaWebhook(payload: string, signature: string) {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.PERSONA_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

app.post('/webhooks/persona', (req, res) => {
  const signature = req.headers['persona-signature'] as string;
  const payload = JSON.stringify(req.body);
  
  if (!verifyPersonaWebhook(payload, signature)) {
    return res.status(401).send('Unauthorized');
  }
  
  // Process webhook...
});
```

## Frontend Security

### Content Security Policy

Implement CSP headers:

```typescript
// ✅ Good: Strict CSP
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline'; " +
    "connect-src 'self' https://rpc.mantle.xyz https://api.persona.com;"
  );
  next();
});
```

### Wallet Connection Security

Secure wallet interactions:

```typescript
// ✅ Good: Validate wallet connection
import { useAccount, useConnect } from 'wagmi';

function SecureWalletConnection() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  
  // Validate connected address
  useEffect(() => {
    if (isConnected && address) {
      // Verify address format
      if (!isAddress(address)) {
        disconnect();
        throw new Error('Invalid wallet address');
      }
      
      // Check if address is on allowlist (if applicable)
      checkAddressAllowlist(address);
    }
  }, [address, isConnected]);
  
  return (
    <div>
      {isConnected ? (
        <span>Connected: {address}</span>
      ) : (
        <button onClick={() => connect({ connector: connectors[0] })}>
          Connect Wallet
        </button>
      )}
    </div>
  );
}
```

## Monitoring and Alerting

### Transaction Monitoring

Monitor for suspicious activity:

```typescript
// ✅ Good: Transaction monitoring
async function monitorTransactions() {
  const token = client.connectToken(tokenAddress);
  
  token.onTransfer((from, to, amount) => {
    // Check for large transfers
    if (amount > parseEther('1000')) {
      alertLargeTransfer(from, to, amount);
    }
    
    // Check for rapid transfers
    checkRapidTransfers(from, to);
    
    // Log all transfers
    logTransfer(from, to, amount);
  });
  
  token.onTransferRestricted((from, to, reason) => {
    // Alert on blocked transfers
    alertBlockedTransfer(from, to, reason);
  });
}
```

### Security Alerts

Set up automated alerts:

```typescript
// ✅ Good: Security alerting
import { sendAlert } from './alerting';

async function checkSecurityEvents() {
  // Monitor for admin role changes
  const token = client.connectToken(tokenAddress);
  
  token.on('RoleGranted', (role, account, sender) => {
    sendAlert({
      type: 'ROLE_GRANTED',
      message: `Role ${role} granted to ${account} by ${sender}`,
      severity: 'HIGH',
    });
  });
  
  // Monitor for emergency pauses
  token.on('Paused', (account) => {
    sendAlert({
      type: 'CONTRACT_PAUSED',
      message: `Contract paused by ${account}`,
      severity: 'CRITICAL',
    });
  });
}
```

## Incident Response

### Emergency Procedures

Prepare for security incidents:

```typescript
// ✅ Good: Emergency response procedures
class EmergencyResponse {
  async pauseAllContracts() {
    const contracts = [
      client.connectToken(tokenAddress),
      client.connectVault(vaultAddress),
      client.connectYieldDistributor(yieldDistributorAddress),
    ];
    
    for (const contract of contracts) {
      if (contract.pause) {
        await contract.pause();
      }
    }
    
    console.log('All contracts paused');
  }
  
  async freezeAssets() {
    const vault = client.connectVault(vaultAddress);
    await vault.declareEmergency();
    
    console.log('Assets frozen');
  }
  
  async notifyStakeholders() {
    // Notify investors, regulators, and partners
    await sendEmergencyNotification({
      type: 'SECURITY_INCIDENT',
      message: 'Security incident detected. All operations suspended.',
    });
  }
}
```

### Recovery Procedures

Plan for recovery:

```typescript
// ✅ Good: Recovery procedures
async function recoverFromIncident() {
  // 1. Assess damage
  const assessment = await assessSecurityIncident();
  
  // 2. Fix vulnerabilities
  if (assessment.requiresUpgrade) {
    await upgradeContracts();
  }
  
  // 3. Restore operations gradually
  await restoreOperations();
  
  // 4. Notify stakeholders
  await sendRecoveryNotification();
}
```

## Audit and Compliance

### Code Audits

Regular security audits:

```bash
# ✅ Good: Regular audit schedule
# 1. Internal code review
npm run lint
npm run test
npm run coverage

# 2. Automated security scanning
npm audit
npx slither contracts/

# 3. Professional audit
# Schedule quarterly audits with reputable firms
```

### Compliance Monitoring

Monitor regulatory compliance:

```typescript
// ✅ Good: Compliance monitoring
async function generateComplianceReport() {
  const report = await client.compliance.generateComplianceReport(tokenAddress);
  
  // Check compliance thresholds
  if (report.complianceScore < 0.95) {
    alertComplianceIssue(report);
  }
  
  // Archive report for regulators
  await archiveComplianceReport(report);
  
  return report;
}
```

## Security Checklist

### Pre-Deployment

- [ ] Smart contracts audited by professionals
- [ ] Multi-signature wallets configured
- [ ] Access controls properly implemented
- [ ] Input validation on all functions
- [ ] Reentrancy guards in place
- [ ] Emergency pause mechanisms tested
- [ ] Private keys secured (hardware wallets)
- [ ] Environment variables properly configured

### Post-Deployment

- [ ] Transaction monitoring active
- [ ] Security alerts configured
- [ ] Incident response plan documented
- [ ] Regular security reviews scheduled
- [ ] Compliance monitoring in place
- [ ] Backup and recovery procedures tested
- [ ] Staff security training completed
- [ ] Insurance coverage obtained

### Ongoing Maintenance

- [ ] Regular dependency updates
- [ ] Security patch management
- [ ] Key rotation procedures
- [ ] Audit trail maintenance
- [ ] Compliance report generation
- [ ] Threat intelligence monitoring
- [ ] Security awareness training
- [ ] Disaster recovery testing

## Resources

### Security Tools
- [Slither](https://github.com/crytic/slither) - Static analysis for Solidity
- [MythX](https://mythx.io/) - Security analysis platform
- [OpenZeppelin Defender](https://defender.openzeppelin.com/) - Security operations platform

### Best Practices
- [OpenZeppelin Security Guidelines](https://docs.openzeppelin.com/learn/)
- [ConsenSys Smart Contract Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [OWASP Blockchain Security](https://owasp.org/www-project-blockchain-security/)

### Professional Services
- [Trail of Bits](https://www.trailofbits.com/) - Security auditing
- [ConsenSys Diligence](https://consensys.net/diligence/) - Smart contract audits
- [OpenZeppelin Security](https://openzeppelin.com/security-audits/) - Security audits

---

Security is an ongoing process, not a one-time setup. Regular reviews, updates, and monitoring are essential for maintaining a secure RWA platform.