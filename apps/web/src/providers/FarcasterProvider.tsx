'use client';

import { useEffect, type ReactNode } from 'react';
import sdk from '@farcaster/miniapp-sdk';
import { useConnect } from 'wagmi';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const { connect } = useConnect();

  useEffect(() => {
    // Dismiss the splash screen unconditionally
    sdk.actions.ready();

    // Auto-connect the Farcaster wallet when running inside a Farcaster client.
    // This avoids requiring the user to manually tap "Connect" in the miniapp.
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

  return <>{children}</>;
}
