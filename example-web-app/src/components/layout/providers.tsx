'use client';
import React from 'react';
import { ActiveThemeProvider } from '../active-theme';
import { Web3Provider } from '../web3-provider';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <ActiveThemeProvider initialTheme={activeThemeValue}>
      <Web3Provider>
        {children}
      </Web3Provider>
    </ActiveThemeProvider>
  );
}
