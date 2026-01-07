import React, { useState } from 'react';
import styles from './styles.module.css';

const codeExample = `import { RWAClient } from '@mantle-rwa/sdk';

// Initialize the SDK
const client = new RWAClient({
  network: 'mantle-sepolia',
  privateKey: process.env.PRIVATE_KEY,
});

// Deploy a complete RWA system
const deployment = await client.deployRWASystem({
  tokenName: 'Real Estate Token',
  tokenSymbol: 'RET',
  initialSupply: '1000000',
});

console.log('Token deployed:', deployment.token.address);`;

export default function CodePreview(): React.ReactElement {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(codeExample);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <section className={styles.codePreview}>
            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.textContent}>
                        <h2 className={styles.title}>Get Started in Minutes</h2>
                        <p className={styles.description}>
                            Deploy your first compliant RWA token with just a few lines of code.
                            The SDK handles all the complexity of ERC-3643 compliance, KYC integration,
                            and smart contract deployment.
                        </p>
                        <ul className={styles.features}>
                            <li>
                                <svg viewBox="0 0 20 20" fill="currentColor" className={styles.checkIcon}>
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Full TypeScript support with type inference
                            </li>
                            <li>
                                <svg viewBox="0 0 20 20" fill="currentColor" className={styles.checkIcon}>
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Automatic gas estimation and optimization
                            </li>
                            <li>
                                <svg viewBox="0 0 20 20" fill="currentColor" className={styles.checkIcon}>
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Built-in compliance and KYC verification
                            </li>
                        </ul>
                    </div>
                    <div className={styles.codeContent}>
                        <div className={styles.codeHeader}>
                            <div className={styles.dots}>
                                <span className={styles.dot} />
                                <span className={styles.dot} />
                                <span className={styles.dot} />
                            </div>
                            <span className={styles.fileName}>deploy.ts</span>
                            <button
                                className={styles.copyButton}
                                onClick={handleCopy}
                                aria-label="Copy code"
                            >
                                {copied ? (
                                    <>
                                        <svg viewBox="0 0 20 20" fill="currentColor" className={styles.copyIcon}>
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <svg viewBox="0 0 20 20" fill="currentColor" className={styles.copyIcon}>
                                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                        </svg>
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>
                        <pre className={styles.code}>
                            <code>{codeExample}</code>
                        </pre>
                    </div>
                </div>
            </div>
        </section>
    );
}
