'use client';

import { useEffect, type ReactNode } from 'react';
import sdk from '@farcaster/miniapp-sdk';

export function FarcasterProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const init = async () => {
      try {
        const context = await sdk.context;
        if (context) {
          sdk.actions.ready();
        }
      } catch {
        // Not running inside a Farcaster client — skip initialization
      }
    };
    init();
  }, []);

  return <>{children}</>;
}
