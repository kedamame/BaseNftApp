'use client';

import { useEffect, type ReactNode } from 'react';
import sdk from '@farcaster/miniapp-sdk';

export function FarcasterProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Must be called unconditionally to dismiss the splash screen.
    // sdk handles the no-op case when not running inside a Farcaster client.
    sdk.actions.ready();
  }, []);

  return <>{children}</>;
}
