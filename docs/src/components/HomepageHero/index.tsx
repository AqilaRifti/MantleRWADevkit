import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

export default function HomepageHero(): React.ReactElement {
    return (
        <header className={styles.hero}>
            <div className={styles.heroBackground}>
                <div className={styles.heroGradient} />
                <div className={styles.heroPattern} />
            </div>
            <div className={styles.heroContent}>
                <div className={styles.badge}>
                    <span className={styles.badgeIcon}>🚀</span>
                    <span>Now in Beta</span>
                </div>
                <h1 className={styles.title}>
                    Build Compliant <span className={styles.highlight}>RWA Platforms</span>
                    <br />on Mantle Network
                </h1>
                <p className={styles.subtitle}>
                    The complete SDK for tokenizing real-world assets with built-in compliance,
                    KYC/AML verification, and yield distribution. Production-ready, audited,
                    and optimized for Mantle.
                </p>
                <div className={styles.buttons}>
                    <Link
                        className={styles.primaryButton}
                        to="/docs/getting-started/quick-start"
                    >
                        Get Started
                        <svg className={styles.buttonIcon} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </Link>
                    <Link
                        className={styles.secondaryButton}
                        to="https://github.com/AqilaRifti/MantleRWADevkit"
                    >
                        <svg className={styles.githubIcon} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                        </svg>
                        View on GitHub
                    </Link>
                </div>
                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>ERC-3643</span>
                        <span className={styles.statLabel}>Compliant</span>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.stat}>
                        <span className={styles.statValue}>100%</span>
                        <span className={styles.statLabel}>TypeScript</span>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.stat}>
                        <span className={styles.statValue}>Audited</span>
                        <span className={styles.statLabel}>Contracts</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
