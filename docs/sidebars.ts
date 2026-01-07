import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Introduction',
    },
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/installation',
        'getting-started/quick-start',
        'getting-started/configuration',
        'getting-started/first-deployment',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/kyc-integration',
        'guides/yield-distribution',
        'guides/compliance',
        'guides/security-best-practices',
        'guides/deployment',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/overview',
        {
          type: 'category',
          label: 'SDK',
          items: [
            'api/sdk/rwa-client',
            'api/sdk/token-module',
            'api/sdk/kyc-module',
            'api/sdk/yield-module',
            'api/sdk/compliance-module',
          ],
        },
        {
          type: 'category',
          label: 'React Components',
          items: [
            'api/react/overview',
            'api/react/kyc-flow',
            'api/react/investor-dashboard',
            'api/react/token-mint-form',
            'api/react/yield-calculator',
          ],
        },
        {
          type: 'category',
          label: 'Smart Contracts',
          items: [
            'api/contracts/overview',
            'api/contracts/rwa-token',
            'api/contracts/kyc-registry',
            'api/contracts/yield-distributor',
            'api/contracts/asset-vault',
            'api/contracts/rwa-factory',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      items: [
        'examples/real-estate',
        'examples/private-equity',
        'examples/full-stack-app',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
      ],
    },
    {
      type: 'category',
      label: 'Resources',
      items: [
        'resources/faq',
        'resources/troubleshooting',
        'resources/changelog',
      ],
    },
  ],
};

export default sidebars;
