'use client';

import { useTranslations } from 'next-intl';
import type { WizardData } from './WizardShell';

interface Props {
  data: WizardData;
  onChange: (partial: Partial<WizardData>) => void;
}

const MODES = ['manual', 'random', 'all'] as const;

export function StepBasicInfo({ data, onChange }: Props) {
  const t = useTranslations('Wizard');

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">{t('nameLabel')}</label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={t('namePlaceholder')}
          maxLength={100}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">{t('descriptionLabel')}</label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder={t('descriptionPlaceholder')}
          maxLength={500}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">{t('modeLabel')}</label>
        <div className="space-y-2">
          {MODES.map((mode) => (
            <label
              key={mode}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                data.distributionMode === mode
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="mode"
                value={mode}
                checked={data.distributionMode === mode}
                onChange={() => onChange({ distributionMode: mode })}
                className="mt-0.5"
              />
              <div>
                <div className="text-sm font-medium">
                  {t(`mode${mode.charAt(0).toUpperCase() + mode.slice(1)}` as 'modeManual' | 'modeRandom' | 'modeAll')}
                </div>
                <div className="text-xs text-gray-500">
                  {t(`mode${mode.charAt(0).toUpperCase() + mode.slice(1)}Description` as 'modeManualDescription' | 'modeRandomDescription' | 'modeAllDescription')}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {data.distributionMode === 'random' && (
        <div>
          <label className="mb-1 block text-sm font-medium">{t('randomCountLabel')}</label>
          <input
            type="number"
            min={1}
            value={data.randomCount}
            onChange={(e) => onChange({ randomCount: Math.max(1, parseInt(e.target.value, 10) || 1) })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
}
