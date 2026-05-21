'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'
import Loading from '@/app/components/base/loading'

const SSOCallbackPage = () => {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-white px-4" aria-busy>
      <Loading />
      <p className="mt-3 text-sm text-gray-500">Getting your account ready...</p>
      <div id="clerk-captcha" className="mt-4" />
      <AuthenticateWithRedirectCallback
        signInUrl="/sign-in"
        signUpUrl="/sign-in"
        signInForceRedirectUrl="/"
        signUpForceRedirectUrl="/"
        signInFallbackRedirectUrl="/"
        signUpFallbackRedirectUrl="/"
      />
    </main>
  )
}

export default SSOCallbackPage
