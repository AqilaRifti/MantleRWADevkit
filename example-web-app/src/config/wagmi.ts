import { http, createConfig } from 'wagmi';
import { mantleSepoliaTestnet, mantle } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// WalletConnect project ID - replace with your own in production
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo';

export const wagmiConfig = createConfig({
    chains: [mantleSepoliaTestnet, mantle],
    connectors: [
        injected(),
        walletConnect({ projectId }),
    ],
    transports: {
        [mantleSepoliaTestnet.id]: http(),
        [mantle.id]: http(),
    },
});

// Contract addresses for the RWA system (deployed on Mantle Sepolia)
export const contractAddresses = {
    // These will be populated after deployment
    rwaToken: process.env.NEXT_PUBLIC_RWA_TOKEN_ADDRESS || '',
    kycRegistry: process.env.NEXT_PUBLIC_KYC_REGISTRY_ADDRESS || '',
    yieldDistributor: process.env.NEXT_PUBLIC_YIELD_DISTRIBUTOR_ADDRESS || '',
    assetVault: process.env.NEXT_PUBLIC_ASSET_VAULT_ADDRESS || '',
    rwaFactory: process.env.NEXT_PUBLIC_RWA_FACTORY_ADDRESS || '',
    // Mock USDC for testnet
    mockUsdc: process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS || '',
} as const;

// Property details for the Miami Luxury Condo tokenization
export const propertyDetails = {
    name: 'Miami Luxury Condo',
    location: 'Miami Beach, FL',
    totalValue: 500000, // $500,000
    totalTokens: 1000,
    tokenPrice: 500, // $500 per token
    tokenSymbol: 'MIAMI',
    tokenName: 'Miami Condo Token',
    expectedYield: 8, // 8% annual yield
    propertyType: 'Residential Condo',
    squareFeet: 2500,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2022,
    description: 'Luxurious oceanfront condo in Miami Beach with stunning views, modern amenities, and prime location. This tokenized property offers fractional ownership with quarterly yield distributions.',
    images: [
        '/assets/property/miami-condo-1.jpg',
        '/assets/property/miami-condo-2.jpg',
        '/assets/property/miami-condo-3.jpg',
    ],
} as const;
