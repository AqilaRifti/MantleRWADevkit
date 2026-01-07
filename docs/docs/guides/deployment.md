# Deployment Guide

This comprehensive guide covers deploying your RWA tokenization platform to production, including smart contracts, backend services, and frontend applications.

## Overview

Deploying a production RWA platform involves several components:
- Smart contracts on Mantle Network
- Backend API services
- Frontend web application
- Database and storage systems
- Monitoring and security infrastructure

## Prerequisites

### Development Environment

```bash
# Required tools
node --version  # v18 or higher
npm --version   # v9 or higher
git --version   # v2.30 or higher

# Install dependencies
npm install -g @mantle-rwa/cli
npm install -g hardhat
npm install -g vercel  # or your preferred deployment platform
```

### Environment Setup

```bash
# Clone your project
git clone https://github.com/your-org/your-rwa-platform
cd your-rwa-platform

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Required Environment Variables

```bash
# .env
# Network Configuration
MANTLE_RPC_URL=https://rpc.mantle.xyz
MANTLE_TESTNET_RPC_URL=https://rpc.testnet.mantle.xyz
PRIVATE_KEY=your_deployer_private_key

# Contract Addresses (will be populated after deployment)
TOKEN_CONTRACT_ADDRESS=
KYC_REGISTRY_ADDRESS=
ASSET_VAULT_ADDRESS=
YIELD_DISTRIBUTOR_ADDRESS=
RWA_FACTORY_ADDRESS=

# API Keys
ETHERSCAN_API_KEY=your_etherscan_api_key
INFURA_API_KEY=your_infura_api_key

# KYC Providers
PERSONA_API_KEY=your_persona_api_key
SYNAPS_API_KEY=your_synaps_api_key
JUMIO_API_TOKEN=your_jumio_token

# Payment Processors
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
CIRCLE_API_KEY=your_circle_api_key

# Database
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://host:port

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
WEBHOOK_SECRET=your_webhook_secret

# Monitoring
SENTRY_DSN=your_sentry_dsn
DATADOG_API_KEY=your_datadog_api_key
```

## Smart Contract Deployment

### 1. Testnet Deployment

First, deploy to Mantle Testnet for testing:

```bash
# Deploy to testnet
npx hardhat deploy --network mantle-testnet

# Verify contracts
npx hardhat verify --network mantle-testnet <contract-address> <constructor-args>
```

### 2. Production Deployment Script

Create a comprehensive deployment script:

```typescript
// scripts/deploy-production.ts
import { ethers } from 'hardhat';
import { writeFileSync } from 'fs';

async function main() {
  console.log('Starting production deployment...');
  
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);
  
  const balance = await deployer.getBalance();
  console.log('Account balance:', ethers.utils.formatEther(balance), 'MNT');
  
  if (balance.lt(ethers.utils.parseEther('1'))) {
    throw new Error('Insufficient balance for deployment');
  }
  
  // Deploy contracts in order
  const deploymentResults = {};
  
  // 1. Deploy KYC Registry
  console.log('Deploying KYC Registry...');
  const KYCRegistry = await ethers.getContractFactory('KYCRegistry');
  const kycRegistry = await KYCRegistry.deploy();
  await kycRegistry.deployed();
  deploymentResults.kycRegistry = kycRegistry.address;
  console.log('KYC Registry deployed to:', kycRegistry.address);
  
  // 2. Deploy RWA Token
  console.log('Deploying RWA Token...');
  const RWAToken = await ethers.getContractFactory('RWAToken');
  const rwaToken = await RWAToken.deploy(
    'Real Estate Token',
    'RET',
    ethers.utils.parseEther('1000000'), // 1M total supply
    kycRegistry.address
  );
  await rwaToken.deployed();
  deploymentResults.rwaToken = rwaToken.address;
  console.log('RWA Token deployed to:', rwaToken.address);
  
  // 3. Deploy Asset Vault
  console.log('Deploying Asset Vault...');
  const AssetVault = await ethers.getContractFactory('AssetVault');
  const assetVault = await AssetVault.deploy(
    [deployer.address], // Initial signers
    1 // Threshold
  );
  await assetVault.deployed();
  deploymentResults.assetVault = assetVault.address;
  console.log('Asset Vault deployed to:', assetVault.address);
  
  // 4. Deploy Yield Distributor
  console.log('Deploying Yield Distributor...');
  const YieldDistributor = await ethers.getContractFactory('YieldDistributor');
  const yieldDistributor = await YieldDistributor.deploy(rwaToken.address);
  await yieldDistributor.deployed();
  deploymentResults.yieldDistributor = yieldDistributor.address;
  console.log('Yield Distributor deployed to:', yieldDistributor.address);
  
  // 5. Deploy RWA Factory
  console.log('Deploying RWA Factory...');
  const RWAFactory = await ethers.getContractFactory('RWAFactory');
  const rwaFactory = await RWAFactory.deploy();
  await rwaFactory.deployed();
  deploymentResults.rwaFactory = rwaFactory.address;
  console.log('RWA Factory deployed to:', rwaFactory.address);
  
  // Configure contracts
  console.log('Configuring contracts...');
  
  // Grant roles
  const ISSUER_ROLE = await rwaToken.ISSUER_ROLE();
  await rwaToken.grantRole(ISSUER_ROLE, deployer.address);
  
  const KYC_ADMIN_ROLE = await kycRegistry.KYC_ADMIN_ROLE();
  await kycRegistry.grantRole(KYC_ADMIN_ROLE, deployer.address);
  
  // Save deployment results
  const deploymentInfo = {
    network: 'mantle',
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: deploymentResults,
    gasUsed: {
      // Track gas usage for each contract
    },
  };
  
  writeFileSync(
    'deployment-results.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log('Deployment completed successfully!');
  console.log('Results saved to deployment-results.json');
  
  return deploymentResults;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 3. Execute Production Deployment

```bash
# Deploy to Mantle mainnet
npx hardhat run scripts/deploy-production.ts --network mantle

# Verify all contracts
npm run verify:production
```

### 4. Contract Verification

```typescript
// scripts/verify-contracts.ts
import { run } from 'hardhat';
import deploymentResults from '../deployment-results.json';

async function verifyContracts() {
  const contracts = deploymentResults.contracts;
  
  try {
    // Verify KYC Registry
    await run('verify:verify', {
      address: contracts.kycRegistry,
      constructorArguments: [],
    });
    
    // Verify RWA Token
    await run('verify:verify', {
      address: contracts.rwaToken,
      constructorArguments: [
        'Real Estate Token',
        'RET',
        ethers.utils.parseEther('1000000'),
        contracts.kycRegistry,
      ],
    });
    
    // Verify other contracts...
    
    console.log('All contracts verified successfully!');
  } catch (error) {
    console.error('Verification failed:', error);
  }
}

verifyContracts();
```

## Backend API Deployment

### 1. Containerization

Create a Dockerfile for your backend:

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

### 2. Docker Compose for Local Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=rwa_platform
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 3. Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rwa-api
  labels:
    app: rwa-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rwa-api
  template:
    metadata:
      labels:
        app: rwa-api
    spec:
      containers:
      - name: api
        image: your-registry/rwa-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: rwa-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: rwa-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: rwa-api-service
spec:
  selector:
    app: rwa-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 4. Database Migrations

```typescript
// migrations/001_initial_schema.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('wallet_address').unique().notNullable();
    table.string('email').unique();
    table.jsonb('kyc_data');
    table.enum('kyc_status', ['pending', 'verified', 'rejected']).defaultTo('pending');
    table.enum('accreditation_tier', ['none', 'retail', 'accredited', 'institutional']).defaultTo('none');
    table.timestamps(true, true);
  });

  // Transactions table
  await knex.schema.createTable('transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('tx_hash').unique().notNullable();
    table.string('from_address').notNullable();
    table.string('to_address').notNullable();
    table.decimal('amount', 36, 18).notNullable();
    table.string('token_address').notNullable();
    table.enum('type', ['mint', 'transfer', 'burn', 'yield_claim']).notNullable();
    table.integer('block_number').notNullable();
    table.timestamp('block_timestamp').notNullable();
    table.timestamps(true, true);
  });

  // Payments table
  await knex.schema.createTable('payments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('payment_intent_id').unique().notNullable();
    table.string('investor_address').notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 3).notNullable();
    table.enum('status', ['pending', 'completed', 'failed', 'refunded']).defaultTo('pending');
    table.string('tx_hash');
    table.jsonb('metadata');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('payments');
  await knex.schema.dropTable('transactions');
  await knex.schema.dropTable('users');
}
```

## Frontend Deployment

### 1. Build Configuration

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  env: {
    NEXT_PUBLIC_MANTLE_RPC_URL: process.env.NEXT_PUBLIC_MANTLE_RPC_URL,
    NEXT_PUBLIC_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_TOKEN_ADDRESS,
    NEXT_PUBLIC_KYC_REGISTRY_ADDRESS: process.env.NEXT_PUBLIC_KYC_REGISTRY_ADDRESS,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
```

### 2. Vercel Deployment

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_MANTLE_RPC_URL": "@mantle_rpc_url",
    "NEXT_PUBLIC_TOKEN_ADDRESS": "@token_address",
    "NEXT_PUBLIC_KYC_REGISTRY_ADDRESS": "@kyc_registry_address"
  },
  "functions": {
    "pages/api/**/*.js": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

Deploy to Vercel:

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_MANTLE_RPC_URL production
vercel env add NEXT_PUBLIC_TOKEN_ADDRESS production
# ... add all required environment variables
```

### 3. AWS Deployment with CDK

```typescript
// infrastructure/frontend-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for static assets
    const bucket = new s3.Bucket(this, 'RWAFrontendBucket', {
      bucketName: 'rwa-platform-frontend',
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'RWADistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // Deploy built assets
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('./out')],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // Output the CloudFront URL
    new cdk.CfnOutput(this, 'DistributionUrl', {
      value: distribution.distributionDomainName,
    });
  }
}
```

## Infrastructure as Code

### 1. Terraform Configuration

```hcl
# infrastructure/main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "rwa-platform-vpc"
  }
}

# Subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "rwa-platform-private-${count.index + 1}"
  }
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "rwa-platform-public-${count.index + 1}"
  }
}

# RDS Database
resource "aws_db_instance" "postgres" {
  identifier     = "rwa-platform-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true
  
  db_name  = "rwa_platform"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = true
  deletion_protection = false

  tags = {
    Name = "rwa-platform-db"
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "main" {
  name       = "rwa-platform-cache-subnet"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "rwa-platform-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]

  tags = {
    Name = "rwa-platform-redis"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "rwa-platform"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "rwa-platform"
  }
}
```

### 2. Deployment Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run security audit
        run: npm audit --audit-level high

  deploy-contracts:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Deploy contracts
        run: npx hardhat deploy --network mantle
        env:
          PRIVATE_KEY: ${{ secrets.DEPLOYER_PRIVATE_KEY }}
          MANTLE_RPC_URL: ${{ secrets.MANTLE_RPC_URL }}
      
      - name: Verify contracts
        run: npm run verify:production
        env:
          ETHERSCAN_API_KEY: ${{ secrets.ETHERSCAN_API_KEY }}

  deploy-backend:
    needs: [test, deploy-contracts]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: rwa-platform-api
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster rwa-platform \
            --service rwa-api \
            --force-new-deployment

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build frontend
        run: npm run build
        env:
          NEXT_PUBLIC_MANTLE_RPC_URL: ${{ secrets.NEXT_PUBLIC_MANTLE_RPC_URL }}
          NEXT_PUBLIC_TOKEN_ADDRESS: ${{ secrets.NEXT_PUBLIC_TOKEN_ADDRESS }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Monitoring and Observability

### 1. Application Monitoring

```typescript
// monitoring/setup.ts
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new ProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});

// Custom metrics
import { StatsD } from 'node-statsd';

const statsd = new StatsD({
  host: process.env.STATSD_HOST || 'localhost',
  port: parseInt(process.env.STATSD_PORT || '8125'),
});

export function trackMetric(name: string, value: number, tags?: string[]) {
  statsd.gauge(name, value, tags);
}

export function trackEvent(name: string, tags?: string[]) {
  statsd.increment(name, 1, tags);
}
```

### 2. Health Checks

```typescript
// health/checks.ts
import { Request, Response } from 'express';
import { ethers } from 'ethers';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy';
  message?: string;
  responseTime?: number;
}

export async function healthCheck(req: Request, res: Response) {
  const checks: HealthCheck[] = [];
  
  // Database check
  try {
    const start = Date.now();
    await db.raw('SELECT 1');
    checks.push({
      name: 'database',
      status: 'healthy',
      responseTime: Date.now() - start,
    });
  } catch (error) {
    checks.push({
      name: 'database',
      status: 'unhealthy',
      message: error.message,
    });
  }
  
  // Redis check
  try {
    const start = Date.now();
    await redis.ping();
    checks.push({
      name: 'redis',
      status: 'healthy',
      responseTime: Date.now() - start,
    });
  } catch (error) {
    checks.push({
      name: 'redis',
      status: 'unhealthy',
      message: error.message,
    });
  }
  
  // Blockchain connectivity check
  try {
    const start = Date.now();
    const provider = new ethers.providers.JsonRpcProvider(process.env.MANTLE_RPC_URL);
    await provider.getBlockNumber();
    checks.push({
      name: 'blockchain',
      status: 'healthy',
      responseTime: Date.now() - start,
    });
  } catch (error) {
    checks.push({
      name: 'blockchain',
      status: 'unhealthy',
      message: error.message,
    });
  }
  
  const allHealthy = checks.every(check => check.status === 'healthy');
  const statusCode = allHealthy ? 200 : 503;
  
  res.status(statusCode).json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks,
  });
}
```

### 3. Alerting Configuration

```yaml
# monitoring/alerts.yml
groups:
  - name: rwa-platform
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"
      
      - alert: DatabaseConnectionFailure
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failure"
          description: "PostgreSQL database is not responding"
      
      - alert: BlockchainConnectivityIssue
        expr: blockchain_connection_status == 0
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Blockchain connectivity issue"
          description: "Unable to connect to Mantle network"
```

## Security Hardening

### 1. Network Security

```bash
# Security group rules (AWS)
# Allow HTTPS traffic
aws ec2 authorize-security-group-ingress \
  --group-id sg-12345678 \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Allow SSH from specific IP
aws ec2 authorize-security-group-ingress \
  --group-id sg-12345678 \
  --protocol tcp \
  --port 22 \
  --cidr 203.0.113.0/24
```

### 2. SSL/TLS Configuration

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    location / {
        proxy_pass http://api:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Environment Security

```bash
# Use secrets management
export DATABASE_URL=$(aws secretsmanager get-secret-value \
  --secret-id rwa-platform/database-url \
  --query SecretString --output text)

export PRIVATE_KEY=$(aws secretsmanager get-secret-value \
  --secret-id rwa-platform/deployer-key \
  --query SecretString --output text)
```

## Production Checklist

### Pre-Deployment

- [ ] All tests passing (unit, integration, e2e)
- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] Load testing completed
- [ ] Backup and recovery procedures tested
- [ ] Monitoring and alerting configured
- [ ] SSL certificates installed and configured
- [ ] Environment variables secured
- [ ] Database migrations tested
- [ ] Contract deployment tested on testnet

### Deployment

- [ ] Smart contracts deployed and verified
- [ ] Backend services deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] Database migrations applied
- [ ] DNS records updated
- [ ] CDN configured and cached
- [ ] Load balancer configured
- [ ] Auto-scaling configured

### Post-Deployment

- [ ] Health checks passing
- [ ] Monitoring dashboards showing green
- [ ] Error rates within acceptable limits
- [ ] Performance metrics meeting SLAs
- [ ] User acceptance testing completed
- [ ] Documentation updated
- [ ] Team notified of deployment
- [ ] Rollback plan confirmed

### Ongoing Maintenance

- [ ] Regular security updates
- [ ] Performance monitoring
- [ ] Cost optimization
- [ ] Backup verification
- [ ] Disaster recovery testing
- [ ] Compliance audits
- [ ] User feedback collection

---

Following this deployment guide ensures your RWA platform is production-ready, secure, and scalable. Remember to regularly review and update your deployment processes as your platform evolves.