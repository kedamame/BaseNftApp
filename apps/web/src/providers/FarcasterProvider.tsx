'use client';

import { useEffect, type ReactNode } from 'react';
import sdk from '@farcaster/miniapp-sdk';
import { useConnect } from 'wagmi';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';

// Inner component that uses wagmi hooks — must be rendered inside WagmiProvider
function FarcasterAutoConnect() {
  const { connect } = useConnect();

  useEffect(() => {
    sdk.context
      .then((context) => {
        if (context) {
          connect({ connector: farcasterMiniApp() });
        }
      })
      .catch(() => {
        // Not running inside a Farcaster client — skip auto-connect
      });
  }, [connect]);

  return null;
}

// Outer provider: calls ready() immediately, then delegates auto-connect
// to FarcasterAutoConnect which must be placed inside WagmiProvider.
export function FarcasterProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Must be called unconditionally to dismiss the splash screen.
    sdk.actions.ready();
  }, []);

  return <>{children}</>;
}

export { FarcasterAutoConnect };
