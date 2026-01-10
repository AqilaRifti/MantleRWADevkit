# Mantle RWA Devkit — Video Script

**Duration:** 3-5 minutes  
**Tone:** Professional, developer-focused, energetic

---

## INTRO (0:00 - 0:20)

**[Screen: Mantle RWA Devkit logo/title]**

> "Tokenizing real-world assets shouldn't require months of development and a team of compliance experts."

**[Screen: Problem bullets appearing]**

> "Building compliant security tokens means dealing with KYC verification, transfer restrictions, accredited investor checks, and yield distributions — all while navigating complex regulations."

**[Screen: Solution reveal]**

> "Mantle RWA Devkit solves this. It's a complete, open-source toolkit for building compliant RWA platforms on Mantle Network."

---

## WHAT IT IS (0:20 - 0:50)

**[Screen: Architecture diagram]**

> "The devkit includes four layers:"

**[Highlight each layer as mentioned]**

> "Smart contracts built on the ERC-3643 standard — the gold standard for security tokens."

> "A TypeScript SDK that wraps all contract interactions with full type safety."

> "Pre-built React components for KYC flows, investor dashboards, and token operations."

> "And comprehensive documentation to get you started fast."

---

## LIVE DEMO (0:50 - 2:30)

**[Screen: Browser showing demo app]**

> "Let me show you how it works."

### Connect Wallet (0:50 - 1:00)

**[Click Connect Wallet, MetaMask popup]**

> "First, connect your wallet. We're on Mantle Sepolia testnet."

### KYC Flow (1:00 - 1:30)

**[Navigate to KYC section]**

> "Before any investor can hold tokens, they need to be KYC verified."

**[Show KYCFlow component]**

> "This component handles the entire verification flow. It connects to your KYC provider — Persona, Synaps, Jumio, or a custom integration."

**[Show verified status]**

> "Once verified, the investor's status is recorded on-chain. Notice we store only a hash of their identity data — actual PII stays with your KYC provider."

### Transfer Restrictions (1:30 - 2:00)

**[Attempt transfer to unverified address]**

> "Here's where it gets interesting. Let me try to transfer tokens to an unverified address."

**[Show error: "Recipient not KYC verified"]**

> "Blocked. The smart contract checks both sender AND recipient verification status on every transfer. No exceptions."

**[Transfer to verified address]**

> "But transfer to a verified address? Works perfectly."

### Yield Distribution (2:00 - 2:30)

**[Navigate to Yield section]**

> "Asset managers can distribute yield to all token holders with one transaction."

**[Show distribution creation]**

> "Create a distribution, specify the payment token — USDC, USDT, whatever — and the claim window."

**[Show yield calculator]**

> "The system takes a snapshot of all balances and calculates each holder's proportional share automatically."

---

## CODE WALKTHROUGH (2:30 - 3:30)

**[Screen: VS Code with SDK code]**

> "Let's look at the code."

### Initialize Client

```typescript
const client = new RWAClient({
  network: 'mantle-sepolia',
  privateKey: process.env.PRIVATE_KEY,
});
```

> "Initialize the client with your network and credentials."

### Check KYC

```typescript
const registry = client.kyc.connect(REGISTRY_ADDRESS);
const isVerified = await registry.isVerified(address);
```

> "Check if any address is KYC verified."

### Mint Tokens

```typescript
const token = client.token.connect(TOKEN_ADDRESS);
await token.mint(recipient, '1000');
```

> "Mint tokens to verified investors."

### React Components

```tsx
<KYCFlow
  registryAddress={REGISTRY_ADDRESS}
  onComplete={(tier) => handleVerified(tier)}
/>
```

> "Drop in React components for instant UI."

---

## WHY MANTLE (3:30 - 3:50)

**[Screen: Mantle benefits]**

> "Why build on Mantle?"

> "Gas costs are 90% lower than Ethereum mainnet. That makes micro-distributions actually viable."

> "Fast finality means better user experience."

> "And full EVM compatibility means you can use all your existing tools."

---

## CLOSING (3:50 - 4:10)

**[Screen: Links and resources]**

> "Mantle RWA Devkit is open source, MIT licensed, and ready to use today."

**[Show URLs]**

> "Check out the live demo at mantle-rwa-devkit-demo.vercel.app"

> "Read the docs at mantle-rwa-devkit-docs.vercel.app"

> "And star the repo on GitHub."

**[Screen: Final logo/tagline]**

> "Mantle RWA Devkit — Compliant tokenization, simplified."

---

## B-ROLL SUGGESTIONS

- Scrolling through smart contract code
- Terminal showing deployment commands
- React components rendering
- MetaMask transaction confirmations
- Architecture diagram animation
- Token transfer being blocked/allowed

## SCREEN RECORDINGS NEEDED

1. Wallet connection flow
2. KYC verification process
3. Token minting
4. Failed transfer (unverified recipient)
5. Successful transfer (verified recipient)
6. Yield distribution creation
7. Yield claiming
8. Code editor with SDK examples

## LINKS TO DISPLAY

- Demo: https://mantle-rwa-devkit-demo.vercel.app/
- Docs: https://mantle-rwa-devkit-docs.vercel.app/
- GitHub: https://github.com/AqilaRifti/MantleRWADevkit
