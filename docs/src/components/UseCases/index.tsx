import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

interface UseCase {
    icon: React.ReactNode;
    title: string;
    description: string;
    features: string[];
    href: string;
}

const useCases: UseCase[] = [
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
        ),
        title: 'Real Estate',
        description: 'Tokenize commercial and residential properties with fractional ownership.',
        features: ['Fractional ownership', 'Rental yield distribution', 'Property management'],
        href: '/docs/examples/real-estate',
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
        ),
        title: 'Private Equity',
        description: 'Create compliant security tokens for private equity and venture funds.',
        features: ['Accredited investor verification', 'Lock-up periods', 'Dividend distribution'],
        href: '/docs/examples/private-equity',
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
        ),
        title: 'Commodities',
        description: 'Tokenize precious metals, agricultural products, and other commodities.',
        features: ['Asset-backed tokens', 'Custody integration', 'Real-time pricing'],
        href: '/docs/examples/real-estate',
    },
];

export default function UseCases(): React.ReactElement {
    return (
        <section className={styles.useCases}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Built for Real-World Use Cases</h2>
                    <p className={styles.subtitle}>
                        From real estate to private equity, the SDK supports diverse asset tokenization scenarios
                    </p>
                </div>
                <div className={styles.grid}>
                    {useCases.map((useCase, index) => (
                        <div key={index} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.iconWrapper}>
                                    {useCase.icon}
                                </div>
                                <h3 className={styles.cardTitle}>{useCase.title}</h3>
                            </div>
                            <p className={styles.cardDescription}>{useCase.description}</p>
                            <ul className={styles.featureList}>
                                {useCase.features.map((feature, featureIndex) => (
                                    <li key={featureIndex}>
                                        <svg viewBox="0 0 20 20" fill="currentColor" className={styles.checkIcon}>
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Link to={useCase.href} className={styles.cardLink}>
                                View example
                                <svg viewBox="0 0 20 20" fill="currentColor" className={styles.linkIcon}>
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
