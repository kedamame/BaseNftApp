'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useConnectors } from 'wagmi';
import { useTranslations } from 'next-intl';

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const connectors = useConnectors();
  const t = useTranslations('Common');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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

  const farcasterConnector = connectors.find((c) => c.id === 'farcasterMiniApp');
  const browserConnectors = connectors.filter((c) => c.id !== 'farcasterMiniApp');

  // Inside Farcaster client (no window.ethereum): single button
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

  // No wallets found
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

  // Single connector: simple button
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

  // Multiple connectors: dropdown
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? t('connecting') : t('connectWallet')}
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {browserConnectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => {
                connect({ connector });
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              {connector.icon && (
                <img src={connector.icon} alt="" className="h-5 w-5 rounded" />
              )}
              <span>{connector.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
