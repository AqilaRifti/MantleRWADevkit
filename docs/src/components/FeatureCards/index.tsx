import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

interface Feature {
    icon: React.ReactNode;
    title: string;
    description: string;
    link?: string;
}

const features: Feature[] = [
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
            </svg>
        ),
        title: 'Compliance-First',
        description: 'ERC-3643 (T-REX) compliant security tokens with built-in KYC/AML verification and modular compliance modules for global regulatory requirements.',
        link: '/docs/guides/compliance',
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
        ),
        title: 'Production Ready',
        description: 'Audited smart contracts, comprehensive test coverage, gas-optimized implementations, and UUPS upgradeable proxies for enterprise deployments.',
        link: '/docs/guides/deployment',
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
                <line x1="12" y1="2" x2="12" y2="22" />
            </svg>
        ),
        title: 'Developer Experience',
        description: 'TypeScript SDK with full type safety, React components with dark/light themes, and extensive documentation to accelerate your development.',
        link: '/docs/api/overview',
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
        ),
        title: 'Mantle Optimized',
        description: 'Low transaction costs, fast finality, Ethereum compatibility, and robust infrastructure. Built specifically for the Mantle Network ecosystem.',
        link: 'https://mantle.xyz',
    },
];

export default function FeatureCards(): React.ReactElement {
    return (
        <section className={styles.features}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Why Mantle RWA SDK?</h2>
                    <p className={styles.subtitle}>
                        Everything you need to build compliant real-world asset platforms
                    </p>
                </div>
                <div className={styles.grid}>
                    {features.map((feature, index) => (
                        <div key={index} className={styles.card}>
                            <div className={styles.iconWrapper}>
                                {feature.icon}
                            </div>
                            <h3 className={styles.cardTitle}>{feature.title}</h3>
                            <p className={styles.cardDescription}>{feature.description}</p>
                            {feature.link && (
                                <Link to={feature.link} className={styles.cardLink}>
                                    Learn more
                                    <svg viewBox="0 0 20 20" fill="currentColor" className={styles.linkIcon}>
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
