import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Web3Provider } from '@/providers/Web3Provider';
import { FarcasterProvider } from '@/providers/FarcasterProvider';
import '@/app/globals.css';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? '';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Home' });

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
      images: APP_URL ? [`${APP_URL}/api/og`] : [],
    },
    other: {
      'fc:miniapp': JSON.stringify({
        version: '1',
        imageUrl: `${APP_URL}/api/og`,
        buttonTitle: 'Open App',
        splashImageUrl: `${APP_URL}/splash.png`,
        splashBackgroundColor: '#1E40AF',
      }),
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <NextIntlClientProvider messages={messages}>
          <FarcasterProvider>
            <Web3Provider>{children}</Web3Provider>
          </FarcasterProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
