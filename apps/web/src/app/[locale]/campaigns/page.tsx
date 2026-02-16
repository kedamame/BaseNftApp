'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useCampaigns } from '@/hooks/useCampaigns';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';

export default function CampaignsPage() {
  const t = useTranslations('Campaigns');
  const tc = useTranslations('Common');
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCampaigns();

  const campaigns = data?.pages.flatMap((page) => page.campaigns);

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <PageHeader
        title={t('title')}
        action={
          <Link
            href="/campaigns/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            {t('createNew')}
          </Link>
        }
      />

      {isLoading && (
        <div className="py-12 text-center text-gray-500">{tc('loading')}</div>
      )}

      {error && (
        <div className="py-12 text-center text-red-500">{tc('error')}</div>
      )}

      {campaigns && campaigns.length === 0 && (
        <EmptyState
          title={t('empty')}
          description={t('emptyDescription')}
          action={
            <Link
              href="/campaigns/new"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              {t('createNew')}
            </Link>
          }
        />
      )}

      {campaigns && campaigns.length > 0 && (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/campaigns/${campaign.id}`}
              className="block rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{campaign.name}</h3>
                <StatusBadge status={campaign.status} />
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                <span>{t('recipientCount', { count: campaign._count.recipients })}</span>
                <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}

          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              {isFetchingNextPage ? tc('loading') : t('loadMore')}
            </button>
          )}
        </div>
      )}
    </main>
  );
}
