'use client';

import { useTranslations } from 'next-intl';
import type { WizardData } from './WizardShell';

interface Props {
  data: WizardData;
  onEdit: (step: number) => void;
}

export function StepReview({ data, onEdit }: Props) {
  const t = useTranslations('Wizard');
  const tc = useTranslations('Common');

  const rows = [
    { label: t('reviewName'), value: data.name, step: 0 },
    { label: t('reviewDescription'), value: data.description || '-', step: 0 },
    { label: t('reviewMode'), value: data.distributionMode, step: 0 },
    {
      label: t('reviewRecipients'),
      value: `${data.recipients.length}`,
      step: 1,
    },
    { label: t('reviewUri'), value: data.metadataUri, step: 2 },
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
    </div>
  );
}
