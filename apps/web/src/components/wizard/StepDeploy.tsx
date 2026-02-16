'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useDeployCampaign, type DeployStep } from '@/hooks/useDeployCampaign';
import type { WizardData } from './WizardShell';

interface Props {
  data: WizardData;
}

const STEP_KEYS: Record<DeployStep, string> = {
  deploy: 'deployStep',
  'grant-role': 'grantRoleStep',
  save: 'saveStep',
  done: 'deployDone',
};

export function StepDeploy({ data }: Props) {
  const t = useTranslations('Wizard');
  const [currentStep, setCurrentStep] = useState<DeployStep>('deploy');
  const { mutate, data: result, error, isPending } = useDeployCampaign(setCurrentStep);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    mutate({
      name: data.name,
      description: data.description || undefined,
      metadataUri: data.metadataUri,
      distributionMode: data.distributionMode,
      randomCount: data.distributionMode === 'random' ? data.randomCount : undefined,
      recipients: data.recipients,
    });
  }, [mutate, data]);

  return (
    <div className="space-y-6 text-center">
      <h3 className="text-lg font-medium">{t('deployTitle')}</h3>

      {isPending && (
        <div className="space-y-3">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <p className="text-sm text-gray-600">{t(STEP_KEYS[currentStep])}</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">{t('deployError')}</p>
          <p className="mt-1 text-xs text-red-500">{error.message}</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <p className="font-medium text-green-700">{t('deployDone')}</p>
          <Link
            href={`/campaigns/${result.campaignId}`}
            className="inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            {t('viewCampaign')}
          </Link>
        </div>
      )}
    </div>
  );
}
