'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClerk, useSignIn, useSignUp } from '@clerk/nextjs'
import Loading from '@/app/components/base/loading'

interface AuthNavigateParams {
  session?: {
    currentTask?: unknown
  } | null
  decorateUrl: (url: string) => string
}

const SSOCallbackPage = () => {
  const clerk = useClerk()
  const { signIn } = useSignIn()
  const { signUp } = useSignUp()
  const router = useRouter()
  const hasRun = useRef(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let nextUrl: string | null = null

    const setNextUrl = ({ session, decorateUrl }: AuthNavigateParams) => {
      if (session?.currentTask) {
        return
      }

      nextUrl = decorateUrl('/')
    }

    const navigateToNextUrl = () => {
      const url = nextUrl ?? '/'

      if (url.startsWith('http')) {
        window.location.href = url
        return
      }

      router.replace(url)
      router.refresh()
    }

    const finalizeSignIn = async () => {
      const { error: finalizeError } = await signIn.finalize({
        navigate: setNextUrl,
      })

      if (!finalizeError) {
        navigateToNextUrl()
      }

      return finalizeError
    }

    const finalizeSignUp = async () => {
      const { error: finalizeError } = await signUp.finalize({
        navigate: setNextUrl,
      })

      if (!finalizeError) {
        navigateToNextUrl()
      }

      return finalizeError
    }

    const handleCallback = async () => {
      if (!clerk.loaded || hasRun.current) {
        return
      }

      hasRun.current = true

      if (signIn.status === 'complete') {
        const finalizeError = await finalizeSignIn()
        if (finalizeError) {
          setError('Unable to finish sign in. Please try again.')
        }
        return
      }

      if (signUp.isTransferable) {
        const { error: transferError } = await signIn.create({ transfer: true })
        if (transferError) {
          setError('Unable to continue sign in. Please try again.')
          return
        }

        if ((signIn.status as string) === 'complete') {
          const finalizeError = await finalizeSignIn()
          if (finalizeError) {
            setError('Unable to finish sign in. Please try again.')
          }
          return
        }

        router.push('/sign-in')
        return
      }

      if (
        signIn.status === 'needs_first_factor'
        && !signIn.supportedFirstFactors.every(factor => factor.strategy === 'enterprise_sso')
      ) {
        router.push('/sign-in')
        return
      }

      if (signIn.isTransferable) {
        const { error: transferError } = await signUp.create({ transfer: true })
        if (transferError) {
          setError('Unable to create your account. Please try again.')
          return
        }

        if (signUp.status === 'complete') {
          const finalizeError = await finalizeSignUp()
          if (finalizeError) {
            setError('Unable to finish sign up. Please try again.')
          }
          return
        }

        if (signUp.status === 'missing_requirements') {
          router.push('/sign-in/continue')
          return
        }

        setError('Unable to finish sign up. Please try again.')
        return
      }

      if (signUp.status === 'complete') {
        const finalizeError = await finalizeSignUp()
        if (finalizeError) {
          setError('Unable to finish sign up. Please try again.')
        }
        return
      }

      if (signUp.status === 'missing_requirements') {
        router.push('/sign-in/continue')
        return
      }

      if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_new_password') {
        router.push('/sign-in')
        return
      }

      const existingSessionId = signIn.existingSession?.sessionId ?? signUp.existingSession?.sessionId
      if (existingSessionId) {
        await clerk.setActive({ session: existingSessionId })
        navigateToNextUrl()
        return
      }

      router.replace('/')
      router.refresh()
    }

    void handleCallback()
  }, [clerk, clerk.loaded, router, signIn, signUp])

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-white px-4" aria-busy={!error}>
      <Loading />
      <p className="mt-3 text-sm text-gray-500">Getting your account ready...</p>
      <div id="clerk-captcha" className="mt-4" />
      {error && (
        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-red-600">{error}</p>
          <button
            type="button"
            className="mt-3 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-50"
            onClick={() => router.push('/sign-in')}
          >
            Back to sign in
          </button>
        </div>
      )}
    </main>
  )
}

export default SSOCallbackPage
