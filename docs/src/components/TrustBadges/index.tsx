import React from 'react';
import styles from './styles.module.css';

export default function TrustBadges(): React.ReactElement {
    return (
        <section className={styles.badges}>
            <div className={styles.container}>
                <div className={styles.badgeList}>
                    <a
                        href="https://github.com/AqilaRifti/MantleRWADevkit"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.badge}
                    >
                        <img
                            src="https://img.shields.io/github/stars/AqilaRifti/MantleRWADevkit?style=flat&logo=github&label=Stars&color=65B3AE"
                            alt="GitHub Stars"
                        />
                    </a>
                    <a
                        href="https://www.npmjs.com/package/@mantle-rwa/sdk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.badge}
                    >
                        <img
                            src="https://img.shields.io/npm/v/@mantle-rwa/sdk?style=flat&logo=npm&label=Version&color=65B3AE"
                            alt="npm Version"
                        />
                    </a>
                    <a
                        href="https://www.npmjs.com/package/@mantle-rwa/sdk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.badge}
                    >
                        <img
                            src="https://img.shields.io/npm/dm/@mantle-rwa/sdk?style=flat&logo=npm&label=Downloads&color=65B3AE"
                            alt="npm Downloads"
                        />
                    </a>
                    <a
                        href="https://github.com/AqilaRifti/MantleRWADevkit/blob/main/LICENSE"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.badge}
                    >
                        <img
                            src="https://img.shields.io/github/license/AqilaRifti/MantleRWADevkit?style=flat&label=License&color=65B3AE"
                            alt="License"
                        />
                    </a>
                </div>
                <p className={styles.tagline}>
                    Trusted by developers building the future of tokenized assets
                </p>
            </div>
        </section>
    );
}
