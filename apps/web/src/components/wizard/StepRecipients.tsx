'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { isAddress } from 'viem';
import type { WizardData } from './WizardShell';

interface Props {
  data: WizardData;
  onChange: (partial: Partial<WizardData>) => void;
}

export function StepRecipients({ data, onChange }: Props) {
  const t = useTranslations('Wizard');
  const [rawText, setRawText] = useState(() =>
    data.recipients.map((r) => `${r.address},${r.amount}`).join('\n'),
  );
  const [invalidCount, setInvalidCount] = useState(0);

  const parseRecipients = useCallback(
    (text: string) => {
      setRawText(text);
      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const valid: { address: string; amount: number }[] = [];
      let invalid = 0;

      for (const line of lines) {
        const parts = line.split(',').map((p) => p.trim());
        const address = parts[0];
        const amount = parts[1] ? parseInt(parts[1], 10) : 1;

        if (address && isAddress(address) && amount > 0) {
          valid.push({ address, amount });
        } else {
          invalid++;
        }
      }

      setInvalidCount(invalid);
      onChange({ recipients: valid });
    },
    [onChange],
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">{t('recipientsLabel')}</label>
        <textarea
          value={rawText}
          onChange={(e) => parseRecipients(e.target.value)}
          placeholder={t('recipientsPlaceholder')}
          rows={8}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">{t('recipientsHelp')}</p>
      </div>

      <div className="flex items-center gap-4 text-sm">
        {data.recipients.length > 0 && (
          <span className="text-green-600">
            {t('recipientsParsed', { count: data.recipients.length })}
          </span>
        )}
        {invalidCount > 0 && (
          <span className="text-red-500">
            {t('recipientsInvalid', { count: invalidCount })}
          </span>
        )}
      </div>
    </div>
  );
}
