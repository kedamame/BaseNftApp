'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCampaign } from '@/hooks/useCampaign';
import { apiClient } from '@/lib/api-client';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useState } from 'react';

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const t = useTranslations('Detail');
  const tc = useTranslations('Campaigns');
  const tCommon = useTranslations('Common');
  const { data: campaign, isLoading, error, refetch } = useCampaign(params.id);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  const handleDistribute = async () => {
    setActionError(null);
    setActionPending(true);
    try {
      await apiClient.post(`/api/campaigns/${encodeURIComponent(params.id)}/distribute`);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setActionPending(false);
    }
  };

  const handleRetry = async () => {
    setActionError(null);
    setActionPending(true);
    try {
      await apiClient.post(`/api/campaigns/${encodeURIComponent(params.id)}/retry`);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setActionPending(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-lg px-4 py-6">
        <div className="py-12 text-center text-gray-500">{tCommon('loading')}</div>
      </main>
    );
  }

  if (error || !campaign) {
    return (
      <main className="mx-auto max-w-lg px-4 py-6">
        <div className="py-12 text-center text-red-500">{tCommon('error')}</div>
      </main>
    );
  }

  const completedBatches = campaign.distributions.filter((d) => d.status === 'COMPLETED').length;
  const totalBatches = campaign.distributions.length;

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <PageHeader title={campaign.name} showBack />

      <div className="space-y-6">
        {/* Status & Info */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <StatusBadge status={campaign.status} />
            <span className="text-xs text-gray-500">
              {new Date(campaign.createdAt).toLocaleDateString()}
            </span>
          </div>
          {campaign.description && (
            <p className="mt-2 text-sm text-gray-600">{campaign.description}</p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">{tc('mode')}: </span>
              <span className="font-medium">{tc(campaign.distributionMode.toLowerCase() as 'manual' | 'random' | 'all')}</span>
            </div>
            <div>
              <span className="text-gray-500">{tc('totalSupply')}: </span>
              <span className="font-medium">{campaign.totalSupply}</span>
            </div>
            {campaign.contractAddress && (
              <div className="col-span-2">
                <span className="text-gray-500">{tc('contractAddress')}: </span>
                <span className="font-mono text-xs break-all">{campaign.contractAddress}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {campaign.status === 'ACTIVE' && (
          <button
            onClick={handleDistribute}
            disabled={actionPending}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {actionPending ? tCommon('loading') : tc('distribute')}
          </button>
        )}
        {campaign.status === 'FAILED' && (
          <button
            onClick={handleRetry}
            disabled={actionPending}
            className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {actionPending ? tCommon('loading') : tc('retryFailed')}
          </button>
        )}
        {actionError && (
          <p className="text-sm text-red-500">{actionError}</p>
        )}

        {/* Distribution Progress */}
        {campaign.status === 'DISTRIBUTING' && totalBatches > 0 && (
          <div className="rounded-lg border p-4">
            <p className="mb-2 text-sm font-medium">
              {tc('progress', { completed: completedBatches, total: totalBatches })}
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${totalBatches > 0 ? (completedBatches / totalBatches) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Recipients Table */}
        <div>
          <h3 className="mb-2 text-sm font-medium">{t('recipientTable')}</h3>
          {campaign.recipients.length === 0 ? (
            <p className="text-sm text-gray-500">{t('noRecipients')}</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">{tCommon('address')}</th>
                    <th className="px-3 py-2 text-right font-medium">{tCommon('amount')}</th>
                    <th className="px-3 py-2 text-center font-medium">{tCommon('status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {campaign.recipients.map((r) => (
                    <tr key={r.id}>
                      <td className="px-3 py-2 font-mono text-xs">
                        {r.address.slice(0, 6)}...{r.address.slice(-4)}
                      </td>
                      <td className="px-3 py-2 text-right">{r.amount}</td>
                      <td className="px-3 py-2 text-center">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
