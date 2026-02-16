'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('Common');

  const switchLocale = () => {
    const nextLocale = locale === 'en' ? 'ja' : 'en';
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <button
      onClick={switchLocale}
      className="rounded border border-gray-300 px-3 py-1 text-sm transition-colors hover:bg-gray-100"
    >
      {t('switchLocale')}
    </button>
  );
}
