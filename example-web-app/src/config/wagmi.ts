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
const DEPLOYED_ADDRESSES = {
    rwaToken: '0x55cF1E241F89D9c3D4c3947205e232a8155CCCb3',
    kycRegistry: '0xc17EbFdfc5DFfffb76da3204d36FA0eAf0D0744d',
    yieldDistributor: '0xC699372FD575C75397B7611A783baB9432693cC7',
    assetVault: '0x21130B278E39e60165ae3f4677356CBe302E6AD5',
    rwaFactory: '',
    mockUsdc: '',
};

export const contractAddresses = {
    rwaToken: process.env.NEXT_PUBLIC_RWA_TOKEN_ADDRESS || DEPLOYED_ADDRESSES.rwaToken,
    kycRegistry: process.env.NEXT_PUBLIC_KYC_REGISTRY_ADDRESS || DEPLOYED_ADDRESSES.kycRegistry,
    yieldDistributor: process.env.NEXT_PUBLIC_YIELD_DISTRIBUTOR_ADDRESS || DEPLOYED_ADDRESSES.yieldDistributor,
    assetVault: process.env.NEXT_PUBLIC_ASSET_VAULT_ADDRESS || DEPLOYED_ADDRESSES.assetVault,
    rwaFactory: process.env.NEXT_PUBLIC_RWA_FACTORY_ADDRESS || DEPLOYED_ADDRESSES.rwaFactory,
    mockUsdc: process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS || DEPLOYED_ADDRESSES.mockUsdc,
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
