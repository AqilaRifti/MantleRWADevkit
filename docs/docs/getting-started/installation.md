---
sidebar_position: 1
title: Installation
description: Install the Mantle RWA SDK and its dependencies
keywords: [installation, setup, npm, yarn, pnpm]
---

# Installation

This guide covers installing the Mantle RWA SDK packages and their prerequisites.

## Prerequisites

Before installing the SDK, ensure you have the following:

### System Requirements

- **Node.js**: Version 18.0 or higher
- **Package Manager**: npm, yarn, or pnpm
- **TypeScript**: Version 5.0+ (recommended)

### Verify Node.js Version

```bash
node --version
# Should output v18.0.0 or higher
```

If you need to install or update Node.js, we recommend using [nvm](https://github.com/nvm-sh/nvm):

```bash
# Install nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js 20
nvm install 20
nvm use 20
```

## Install Packages

### Core SDK

The core SDK provides all the functionality for interacting with RWA contracts:

```bash npm2yarn
npm install @mantle-rwa/sdk
```

### React Components (Optional)

If you're building a React application, install the React components package:

```bash npm2yarn
npm install @mantle-rwa/react
```

### Smart Contracts (Optional)

For direct contract interaction or custom deployments:

```bash npm2yarn
npm install @mantle-rwa/contracts
```

## Peer Dependencies

The SDK requires the following peer dependencies:

```bash npm2yarn
npm install viem@^2.0.0
```

For React components, you'll also need:

```bash npm2yarn
npm install react@^18.0.0 react-dom@^18.0.0
```

## Full Installation

Install everything at once:

```bash npm2yarn
npm install @mantle-rwa/sdk @mantle-rwa/react viem
```

## TypeScript Configuration

For the best development experience, ensure your `tsconfig.json` includes:

```json title="tsconfig.json"
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

## Verify Installation

Create a simple test file to verify the installation:

```typescript title="test-install.ts"
import { RWAClient } from '@mantle-rwa/sdk';

// This should compile without errors
const client = new RWAClient({
  network: 'mantle-sepolia',
});

console.log('SDK installed successfully!');
```

Run the test:

```bash
npx tsx test-install.ts
```

## Troubleshooting

### Module Resolution Errors

If you encounter module resolution errors, ensure your bundler supports ESM modules. For Vite or Next.js, this should work out of the box.

For webpack, you may need to add:

```javascript title="webpack.config.js"
module.exports = {
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
};
```

### TypeScript Errors

If TypeScript can't find type definitions, try:

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Version Conflicts

If you have version conflicts with `viem`, ensure you're using a compatible version:

```bash
npm ls viem
# Should show viem@2.x.x
```

## Next Steps

Now that you have the SDK installed, proceed to the [Quick Start](/docs/getting-started/quick-start) guide to deploy your first RWA token.
