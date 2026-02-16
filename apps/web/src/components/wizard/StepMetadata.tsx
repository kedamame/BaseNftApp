'use client';

import { useTranslations } from 'next-intl';
import type { WizardData } from './WizardShell';

interface Props {
  data: WizardData;
  onChange: (partial: Partial<WizardData>) => void;
}

export function StepMetadata({ data, onChange }: Props) {
  const t = useTranslations('Wizard');

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">{t('metadataUriLabel')}</label>
        <input
          type="url"
          value={data.metadataUri}
          onChange={(e) => onChange({ metadataUri: e.target.value })}
          placeholder={t('metadataUriPlaceholder')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">{t('metadataUriHelp')}</p>
      </div>
    </div>
  );
}
