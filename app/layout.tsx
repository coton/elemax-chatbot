import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata, Viewport } from 'next'
import { getLocaleOnServer } from '@/i18n/server'

import './styles/globals.css'
import './styles/markdown.scss'

const themeInitializer = `
(() => {
  try {
    const storageKey = 'elemax-theme-preference';
    const savedTheme = window.localStorage.getItem(storageKey);
    const preference = savedTheme === 'system' || savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark';
    const effectiveTheme = preference === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : preference;

    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add('theme-' + effectiveTheme);
    document.documentElement.dataset.theme = effectiveTheme;
    document.documentElement.style.colorScheme = effectiveTheme;
  }
  catch {
    document.documentElement.classList.add('theme-dark');
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.style.colorScheme = 'dark';
  }
})();
`

export const metadata: Metadata = {
  title: 'Max AI',
  icons: {
    icon: '/favicon.ico?v=elemax',
    shortcut: '/favicon.ico?v=elemax',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

const LocaleLayout = async ({
  children,
}: {
  children: React.ReactNode
}) => {
  const locale = await getLocaleOnServer()
  return (
    <html lang={locale ?? 'en'} className="h-full theme-dark" data-theme="dark" style={{ colorScheme: 'dark' }} suppressHydrationWarning>
      <body className="h-full">
        <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
        <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-in">
          <div className="overflow-hidden">
            <div className="app-viewport w-screen min-w-[300px]">
              {children}
            </div>
          </div>
        </ClerkProvider>
      </body>
    </html>
  )
}

export default LocaleLayout
