'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useClerk, useSignIn, useSignUp } from '@clerk/nextjs'
import Loading from '@/app/components/base/loading'

interface AuthNavigateParams {
  session?: {
    currentTask?: unknown
  } | null
  decorateUrl: (url: string) => string
}

const SSOCallbackPage = () => {
  const clerk = useClerk()
  const { isLoaded: authLoaded, isSignedIn } = useAuth()
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

      window.location.replace(url)
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

    const getSignUpDebugPayload = () => ({
      signInStatus: signIn.status,
      signUpStatus: signUp.status,
      signInIsTransferable: signIn.isTransferable,
      signUpIsTransferable: signUp.isTransferable,
      requiredFields: signUp.requiredFields,
      optionalFields: signUp.optionalFields,
      missingFields: signUp.missingFields,
      unverifiedFields: signUp.unverifiedFields,
      suppliedFields: {
        emailAddress: Boolean(signUp.emailAddress),
        phoneNumber: Boolean(signUp.phoneNumber),
        username: Boolean(signUp.username),
        firstName: Boolean(signUp.firstName),
        lastName: Boolean(signUp.lastName),
        hasPassword: signUp.hasPassword,
        legalAccepted: Boolean(signUp.legalAcceptedAt),
      },
      verifications: {
        emailAddress: {
          status: signUp.verifications.emailAddress?.status,
          strategy: signUp.verifications.emailAddress?.strategy,
          nextAction: signUp.verifications.emailAddress?.nextAction,
          supportedStrategies: signUp.verifications.emailAddress?.supportedStrategies,
          errorCode: signUp.verifications.emailAddress?.error?.code,
        },
        phoneNumber: {
          status: signUp.verifications.phoneNumber?.status,
          strategy: signUp.verifications.phoneNumber?.strategy,
          nextAction: signUp.verifications.phoneNumber?.nextAction,
          supportedStrategies: signUp.verifications.phoneNumber?.supportedStrategies,
          errorCode: signUp.verifications.phoneNumber?.error?.code,
        },
        externalAccount: {
          status: signUp.verifications.externalAccount?.status,
          strategy: signUp.verifications.externalAccount?.strategy,
          errorCode: signUp.verifications.externalAccount?.error?.code,
        },
        web3Wallet: {
          status: signUp.verifications.web3Wallet?.status,
          strategy: signUp.verifications.web3Wallet?.strategy,
          errorCode: signUp.verifications.web3Wallet?.error?.code,
        },
      },
    })

    const hasBlockingSignUpRequirements = () => {
      return signUp.requiredFields.length > 0
        || signUp.missingFields.length > 0
        || signUp.unverifiedFields.length > 0
    }

    const ignoreEmptySignUpRequirements = (context: string) => {
      if (process.env.NODE_ENV === 'development') {
        console.info('[auth:sso-callback] ignoring empty sign up missing requirements', {
          context,
          ...getSignUpDebugPayload(),
        })
      }
    }

    const reportMissingRequirements = (context: string) => {
      const payload = getSignUpDebugPayload()

      console.warn('[auth:sso-callback] sign up missing requirements', {
        context,
        ...payload,
      })

      if (process.env.NODE_ENV === 'development') {
        setError(`Unable to finish sign up. Missing fields: ${payload.missingFields.join(', ') || 'none'}; unverified fields: ${payload.unverifiedFields.join(', ') || 'none'}.`)
        return
      }

      setError('Unable to finish sign up because required signup details are missing. Please try again.')
    }

    const handleCallback = async () => {
      if (!clerk.loaded || !authLoaded || hasRun.current) {
        return
      }

      hasRun.current = true

      if (isSignedIn) {
        window.location.replace('/')
        return
      }

      if (process.env.NODE_ENV === 'development') {
        console.info('[auth:sso-callback] callback auth state', getSignUpDebugPayload())
      }

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

        if (process.env.NODE_ENV === 'development') {
          console.info('[auth:sso-callback] after sign up transfer', getSignUpDebugPayload())
        }

        if (signUp.status === 'complete') {
          const finalizeError = await finalizeSignUp()
          if (finalizeError) {
            setError('Unable to finish sign up. Please try again.')
          }
          return
        }

        if (signUp.status === 'missing_requirements') {
          if (hasBlockingSignUpRequirements()) {
            reportMissingRequirements('after-sign-up-transfer')
            return
          }

          ignoreEmptySignUpRequirements('after-sign-up-transfer')
          window.location.replace('/')
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
        if (hasBlockingSignUpRequirements()) {
          reportMissingRequirements('callback-sign-up-state')
          return
        }

        ignoreEmptySignUpRequirements('callback-sign-up-state')
      }

      if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_new_password') {
        router.push('/sign-in')
        return
      }

      const existingSessionId = signIn.existingSession?.sessionId ?? signUp.existingSession?.sessionId
      if (existingSessionId) {
        await clerk.setActive({
          session: existingSessionId,
          navigate: setNextUrl,
        })
        navigateToNextUrl()
        return
      }

      window.location.replace('/')
    }

    void handleCallback()
  }, [authLoaded, clerk, clerk.loaded, isSignedIn, router, signIn, signUp])

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
