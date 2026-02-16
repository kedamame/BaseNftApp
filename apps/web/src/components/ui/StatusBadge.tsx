'use client';

import { useTranslations } from 'next-intl';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-blue-100 text-blue-700',
  DISTRIBUTING: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  QUEUED: 'bg-gray-100 text-gray-700',
  PROCESSING: 'bg-yellow-100 text-yellow-700',
};

const STATUS_KEYS: Record<string, string> = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  DISTRIBUTING: 'distributing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  QUEUED: 'draft',
  PROCESSING: 'distributing',
};

export function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('Campaign');
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-700';
  const key = STATUS_KEYS[status] || 'draft';

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {t(key)}
    </span>
  );
}
