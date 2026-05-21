'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'

const SSOCallbackPage = () => {
  return (
    <AuthenticateWithRedirectCallback
      redirectUrl="/"
      signInUrl="/sign-in"
      signUpUrl="/sign-in"
    />
  )
}

export default SSOCallbackPage
