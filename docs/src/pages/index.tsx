import React from 'react';
import Layout from '@theme/Layout';
import HomepageHero from '@site/src/components/HomepageHero';
import FeatureCards from '@site/src/components/FeatureCards';
import CodePreview from '@site/src/components/CodePreview';
import TrustBadges from '@site/src/components/TrustBadges';
import QuickLinks from '@site/src/components/QuickLinks';
import UseCases from '@site/src/components/UseCases';
import Community from '@site/src/components/Community';

export default function Home(): React.ReactElement {
  return (
    <Layout
      title="Build Compliant RWA Platforms"
      description="The complete SDK for tokenizing real-world assets on Mantle Network. ERC-3643 compliant, production-ready, with built-in KYC/AML and yield distribution."
    >
      <HomepageHero />
      <TrustBadges />
      <FeatureCards />
      <CodePreview />
      <QuickLinks />
      <UseCases />
      <Community />
    </Layout>
  );
}
