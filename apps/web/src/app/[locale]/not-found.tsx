import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('Common');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-2xl font-bold">404</h1>
      <p className="text-gray-600">{t('notFound')}</p>
      <p className="mt-2 text-sm text-gray-400">{t('notFoundDescription')}</p>
    </main>
  );
}
