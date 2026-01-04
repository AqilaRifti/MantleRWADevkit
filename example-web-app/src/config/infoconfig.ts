import type { InfobarContent } from '@/components/ui/infobar';

export const propertyInfoContent: InfobarContent = {
  title: 'Property Details',
  sections: [
    {
      title: 'Overview',
      description:
        'View detailed information about the tokenized property including location, valuation, token distribution, and expected yields. This page provides comprehensive property data for potential investors.',
      links: []
    },
    {
      title: 'Token Information',
      description:
        'Each property is represented by ERC-20 tokens on the Mantle Network. Token holders receive proportional ownership rights and quarterly yield distributions based on their holdings.',
      links: []
    }
  ]
};

export const investorInfoContent: InfobarContent = {
  title: 'Investor Portal',
  sections: [
    {
      title: 'Overview',
      description:
        'The Investor Portal allows you to view your token holdings, claim yield distributions, and manage your investment portfolio. Connect your wallet to access your personalized dashboard.',
      links: []
    },
    {
      title: 'Token Holdings',
      description:
        'View your current token balance, transaction history, and portfolio value. Your holdings are securely stored on the Mantle blockchain and can be verified on-chain.',
      links: []
    },
    {
      title: 'Yield Distribution',
      description:
        'Quarterly yield distributions are automatically calculated based on your token holdings. Claim your yields directly to your connected wallet through the portal.',
      links: []
    }
  ]
};

export const adminInfoContent: InfobarContent = {
  title: 'Admin Dashboard',
  sections: [
    {
      title: 'Overview',
      description:
        'The Admin Dashboard provides tools for managing the RWA tokenization platform including token minting, yield distribution, and KYC verification management.',
      links: []
    },
    {
      title: 'Token Minting',
      description:
        'Mint new property tokens to verified investors. Only KYC-approved addresses can receive tokens. The minting process is recorded on-chain for full transparency.',
      links: []
    },
    {
      title: 'Yield Management',
      description:
        'Configure and distribute quarterly yields to token holders. Set distribution amounts, review pending distributions, and execute payouts to all eligible holders.',
      links: []
    }
  ]
};


export const productInfoContent: InfobarContent = {
  title: 'Product Management',
  sections: [
    {
      title: 'Overview',
      description:
        'The Products page allows you to manage your product catalog. You can view all products in a table format with server-side functionality including sorting, filtering, pagination, and search capabilities.',
      links: []
    },
    {
      title: 'Adding Products',
      description:
        'To add a new product, click the "Add New" button in the page header. You will be taken to a form where you can enter product details including name, description, price, and category.',
      links: []
    }
  ]
};
