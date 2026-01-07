import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Mantle RWA SDK',
  tagline: 'Build compliant real-world asset tokenization platforms on Mantle Network',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://rwa-sdk.mantle.xyz',
  baseUrl: '/',

  organizationName: 'mantle-network',
  projectName: 'mantle-rwa-sdk',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['en'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        searchBarShortcutHint: true,
        docsRouteBasePath: '/docs',
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/mantle-network/mantle-rwa-sdk/tree/main/docs/',
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
      disableSwitch: false,
    },
    announcementBar: {
      id: 'beta_announcement',
      content: '🚀 Mantle RWA SDK is in beta. <a href="/docs/getting-started/quick-start">Get started</a> or <a href="https://github.com/mantle-network/mantle-rwa-sdk">star us on GitHub</a>!',
      backgroundColor: '#65B3AE',
      textColor: '#000000',
      isCloseable: true,
    },
    navbar: {
      title: 'Mantle RWA SDK',
      logo: {
        alt: 'Mantle RWA SDK',
        src: 'img/logo.svg',
        srcDark: 'img/logo-dark.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/docs/api/overview',
          label: 'API',
          position: 'left',
        },
        {
          to: '/docs/examples/real-estate',
          label: 'Examples',
          position: 'left',
        },
        {
          href: 'https://github.com/mantle-network/mantle-rwa-sdk',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
        {
          href: 'https://discord.gg/0xMantle',
          position: 'right',
          className: 'header-discord-link',
          'aria-label': 'Discord community',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started/quick-start',
            },
            {
              label: 'API Reference',
              to: '/docs/api/overview',
            },
            {
              label: 'Examples',
              to: '/docs/examples/real-estate',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/0xMantle',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/0xMantle',
            },
            {
              label: 'GitHub Discussions',
              href: 'https://github.com/mantle-network/mantle-rwa-sdk/discussions',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'Mantle Network',
              href: 'https://mantle.xyz',
            },
            {
              label: 'Changelog',
              to: '/docs/resources/changelog',
            },
            {
              label: 'FAQ',
              to: '/docs/resources/faq',
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Mantle Network. Built for developers, by developers.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['solidity', 'bash', 'json', 'typescript'],
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
