'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  action?: ReactNode;
}

export function PageHeader({ title, showBack, action }: PageHeaderProps) {
  const t = useTranslations('Common');
  const router = useRouter();

  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
            aria-label={t('back')}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
