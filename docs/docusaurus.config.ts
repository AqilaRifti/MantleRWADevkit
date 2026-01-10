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

  url: 'https://mantle-rwa-devkit-docs.vercel.app',
  baseUrl: '/',

  organizationName: 'AqilaRifti',
  projectName: 'MantleRWADevkit',

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
          editUrl: 'https://github.com/AqilaRifti/MantleRWADevkit/tree/main/docs/',
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
      content: '🚀 Mantle RWA Devkit is in beta. <a href="/docs/getting-started/quick-start">Get started</a> or <a href="https://github.com/AqilaRifti/MantleRWADevkit">star us on GitHub</a>!',
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
          href: 'https://github.com/AqilaRifti/MantleRWADevkit',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
        {
          href: 'https://github.com/AqilaRifti/MantleRWADevkit/discussions',
          position: 'right',
          className: 'header-discord-link',
          'aria-label': 'GitHub Discussions',
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
              label: 'GitHub Discussions',
              href: 'https://github.com/AqilaRifti/MantleRWADevkit/discussions',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/AqilaRifti/MantleRWADevkit',
            },
            {
              label: 'Live Demo',
              href: 'https://mantle-rwa-devkit-demo.vercel.app/',
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
      copyright: `© ${new Date().getFullYear()} Aqila Rifti. Built for developers, by developers.`,
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
