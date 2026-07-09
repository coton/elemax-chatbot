'use client'

import { useState } from 'react'
import { useClerk } from '@clerk/nextjs'
import BrandImage from '@/app/components/brand/brand-image'

const GoogleIcon = () => {
  return (
    <svg
      className="h-5 w-5 shrink-0"
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.8L6.1 33.3C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C36.9 39.3 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  )
}

const GoogleOnlySignIn = () => {
  const clerk = useClerk()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleSignIn = async () => {
    if (isSubmitting) {
      return
    }

    if (!clerk.loaded) {
      setError('Authentication is still loading. Please try again in a moment.')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      await clerk.client.signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
      })
    }
    catch (error) {
      console.error('[auth] unable to start Google sign in', error)
      setError('Unable to start Google sign in. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-card w-full max-w-[420px] rounded-lg border px-6 py-8 shadow-sm">
      <div className="text-center">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full">
          <BrandImage type="avatar" alt="MaxAI" className="h-full w-full object-contain" />
        </span>
        <h1 className="text-xl font-bold leading-7 tracking-normal">
          Sign in to use Max AI
        </h1>
        <p className="mt-2 text-sm leading-5 tracking-normal text-text-tertiary">
          Sign in to save your chat history and continue conversations across devices.
        </p>
      </div>

      <div className="mt-8">
        <button
          type="button"
          className="auth-provider-button flex h-11 w-full items-center justify-center gap-3 rounded-lg border px-4 text-sm font-medium leading-none tracking-normal shadow-sm transition focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          onClick={handleGoogleSignIn}
        >
          <GoogleIcon />
          <span>{isSubmitting ? 'Redirecting...' : 'Continue with Google'}</span>
        </button>

        {error && (
          <p className="mt-4 text-center text-sm font-medium text-red-600">
            {error}
          </p>
        )}
        <div id="clerk-captcha" className="mt-4" />
      </div>
    </section>
  )
}

export default GoogleOnlySignIn
