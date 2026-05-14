import { ClerkProvider } from '@clerk/nextjs'
import { getLocaleOnServer } from '@/i18n/server'

import './styles/globals.css'
import './styles/markdown.scss'

const LocaleLayout = async ({
  children,
}: {
  children: React.ReactNode
}) => {
  const locale = await getLocaleOnServer()
  return (
    <html lang={locale ?? 'en'} className="h-full">
      <body className="h-full">
        <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-in">
          <div className="overflow-x-auto">
            <div className="w-screen h-screen min-w-[300px]">
              {children}
            </div>
          </div>
        </ClerkProvider>
      </body>
    </html>
  )
}

export default LocaleLayout
