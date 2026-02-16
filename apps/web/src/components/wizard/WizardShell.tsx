'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { isAddress } from 'viem';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { StepBasicInfo } from './StepBasicInfo';
import { StepRecipients } from './StepRecipients';
import { StepMetadata } from './StepMetadata';
import { StepReview } from './StepReview';
import { StepDeploy } from './StepDeploy';

export interface WizardData {
  name: string;
  description: string;
  distributionMode: 'manual' | 'random' | 'all';
  randomCount: number;
  recipients: { address: string; amount: number }[];
  metadataUri: string;
}

const INITIAL_DATA: WizardData = {
  name: '',
  description: '',
  distributionMode: 'all',
  randomCount: 1,
  recipients: [],
  metadataUri: '',
};

export function WizardShell() {
  const t = useTranslations('Wizard');
  const tc = useTranslations('Common');
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);

  const steps = [
    t('stepBasicInfo'),
    t('stepRecipients'),
    t('stepMetadata'),
    t('stepReview'),
    t('stepDeploy'),
  ];

  const canGoNext = (): boolean => {
    switch (step) {
      case 0:
        return data.name.trim().length > 0;
      case 1:
        return data.recipients.length > 0 && data.recipients.every((r) => isAddress(r.address));
      case 2: {
        try {
          const url = new URL(data.metadataUri.trim());
          return ['https:', 'ipfs:'].includes(url.protocol);
        } catch {
          return false;
        }
      }
      case 3:
        return true;
      default:
        return false;
    }
  };

  const next = () => {
    if (step < steps.length - 1 && canGoNext()) setStep(step + 1);
  };
  const back = () => {
    if (step > 0 && step < 4) setStep(step - 1);
  };

  const update = (partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  return (
    <div>
      <StepIndicator steps={steps} currentStep={step} />

      {step === 0 && <StepBasicInfo data={data} onChange={update} />}
      {step === 1 && <StepRecipients data={data} onChange={update} />}
      {step === 2 && <StepMetadata data={data} onChange={update} />}
      {step === 3 && <StepReview data={data} onEdit={setStep} />}
      {step === 4 && <StepDeploy data={data} />}

      {step < 4 && (
        <div className="mt-6 flex justify-between">
          <button
            onClick={back}
            disabled={step === 0}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {'\u2190'} {tc('back')}
          </button>
          <button
            onClick={next}
            disabled={!canGoNext()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {step === 3 ? tc('confirm') : tc('next')} {'\u2192'}
          </button>
        </div>
      )}
    </div>
  );
}
