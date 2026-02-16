'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { WizardData } from './WizardShell';

interface Props {
  data: WizardData;
  onEdit: (step: number) => void;
}

function decodeDataUri(uri: string): { name?: string; image?: string } | null {
  if (!uri.startsWith('data:application/json;base64,')) return null;
  try {
    const b64 = uri.split(',')[1];
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export function StepReview({ data, onEdit }: Props) {
  const t = useTranslations('Wizard');
  const tc = useTranslations('Common');

  const decoded = useMemo(
    () => decodeDataUri(data.metadataUri),
    [data.metadataUri],
  );

  const metadataDisplay = decoded?.name
    ? `${decoded.name} (data URI)`
    : data.metadataUri;

  const rows = [
    { label: t('reviewName'), value: data.name, step: 0 },
    { label: t('reviewDescription'), value: data.description || '-', step: 0 },
    { label: t('reviewMode'), value: data.distributionMode, step: 0 },
    {
      label: t('reviewRecipients'),
      value: `${data.recipients.length}`,
      step: 1,
    },
    { label: t('reviewUri'), value: metadataDisplay, step: 2 },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{t('reviewTitle')}</h3>
      <div className="divide-y rounded-lg border">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="text-xs text-gray-500">{row.label}</div>
              <div className="text-sm font-medium break-all">{row.value}</div>
            </div>
            <button
              onClick={() => onEdit(row.step)}
              className="text-xs text-blue-600 hover:underline"
            >
              {tc('edit')}
            </button>
          </div>
        ))}
      </div>

      {decoded?.image?.startsWith('data:image/') && (
        <div className="flex justify-center">
          <img
            src={decoded.image}
            alt="NFT preview"
            className="h-32 w-32 rounded-lg border object-cover"
          />
        </div>
      )}
    </div>
  );
}
