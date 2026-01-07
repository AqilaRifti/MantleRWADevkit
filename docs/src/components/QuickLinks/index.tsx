import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

interface QuickLink {
    icon: React.ReactNode;
    title: string;
    description: string;
    href: string;
}

const quickLinks: QuickLink[] = [
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
        ),
        title: 'Quick Start',
        description: 'Deploy your first RWA token in under 10 minutes with our step-by-step guide.',
        href: '/docs/getting-started/quick-start',
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <line x1="8" y1="7" x2="16" y2="7" />
                <line x1="8" y1="11" x2="16" y2="11" />
                <line x1="8" y1="15" x2="12" y2="15" />
            </svg>
        ),
        title: 'API Reference',
        description: 'Complete documentation for the SDK, React components, and smart contracts.',
        href: '/docs/api/overview',
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
        ),
        title: 'Examples',
        description: 'Real-world examples for real estate, private equity, and full-stack applications.',
        href: '/docs/examples/real-estate',
    },
];

export default function QuickLinks(): React.ReactElement {
    return (
        <section className={styles.quickLinks}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Start Building</h2>
                    <p className={styles.subtitle}>
                        Choose your path to get started with the Mantle RWA SDK
                    </p>
                </div>
                <div className={styles.grid}>
                    {quickLinks.map((link, index) => (
                        <Link key={index} to={link.href} className={styles.card}>
                            <div className={styles.iconWrapper}>
                                {link.icon}
                            </div>
                            <div className={styles.cardContent}>
                                <h3 className={styles.cardTitle}>
                                    {link.title}
                                    <svg viewBox="0 0 20 20" fill="currentColor" className={styles.arrowIcon}>
                                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </h3>
                                <p className={styles.cardDescription}>{link.description}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
