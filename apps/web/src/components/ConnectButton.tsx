'use client';

import { useAccount, useConnect, useDisconnect, useConnectors } from 'wagmi';
import { useTranslations } from 'next-intl';

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const connectors = useConnectors();
  const t = useTranslations('Common');

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    );
  }

  // Filter out farcasterMiniApp connector in browser context (window.ethereum check)
  const browserConnectors = connectors.filter((c) => c.id !== 'farcasterMiniApp');
  const farcasterConnector = connectors.find((c) => c.id === 'farcasterMiniApp');

  // Inside Farcaster client: show a single connect button using farcaster connector
  if (farcasterConnector && typeof window !== 'undefined' && !window.ethereum) {
    return (
      <button
        onClick={() => connect({ connector: farcasterConnector })}
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? t('connecting') : t('connectWallet')}
      </button>
    );
  }

  // Browser context: show available injected wallets
  if (browserConnectors.length === 0) {
    return (
      <a
        href="https://metamask.io"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-300"
      >
        {t('installWallet')}
      </a>
    );
  }

  if (browserConnectors.length === 1) {
    return (
      <button
        onClick={() => connect({ connector: browserConnectors[0] })}
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? t('connecting') : t('connectWallet')}
      </button>
    );
  }

  // Multiple connectors: show each one
  return (
    <div className="flex gap-2">
      {browserConnectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-3 py-2 text-xs text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {connector.name}
        </button>
      ))}
    </div>
  );
}
