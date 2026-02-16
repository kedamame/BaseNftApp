import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { ConnectButton } from '@/components/ConnectButton';

export default function HomePage() {
  const t = useTranslations('Home');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="mb-8 flex items-center gap-4">
        <LocaleSwitcher />
        <ConnectButton />
      </div>
      <h1 className="mb-4 text-4xl font-bold">{t('title')}</h1>
      <p className="mb-8 text-lg text-gray-600">{t('description')}</p>
      <div className="flex gap-4">
        <Link
          href="/campaigns/new"
          className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
        >
          {t('createCampaign')}
        </Link>
        <Link
          href="/campaigns"
          className="rounded-lg border border-gray-300 px-6 py-3 transition-colors hover:bg-gray-50"
        >
          {t('myCampaigns')}
        </Link>
      </div>
    </main>
  );
}
