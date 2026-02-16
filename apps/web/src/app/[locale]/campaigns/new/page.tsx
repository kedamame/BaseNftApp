'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/ui/PageHeader';
import { WizardShell } from '@/components/wizard/WizardShell';

export default function NewCampaignPage() {
  const t = useTranslations('Wizard');

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <PageHeader title={t('title')} showBack />
      <WizardShell />
    </main>
  );
}
