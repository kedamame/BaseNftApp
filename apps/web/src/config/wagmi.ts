import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { injected, walletConnect } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    farcasterMiniApp(),
    injected(),
    ...(process.env.NEXT_PUBLIC_WC_PROJECT_ID
      ? [walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID })]
      : []),
  ],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
  },
  ssr: true,
});
