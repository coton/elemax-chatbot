'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useSignUp } from '@clerk/nextjs'

const ContinueSignInPage = () => {
  const { signUp } = useSignUp()
  const router = useRouter()
  const [firstName, setFirstName] = useState(signUp.firstName ?? '')
  const [lastName, setLastName] = useState(signUp.lastName ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const needsFirstName = signUp.missingFields.includes('first_name')
  const needsLastName = signUp.missingFields.includes('last_name')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setError('')
    setIsSubmitting(true)

    const { error: updateError } = await signUp.update({
      firstName: needsFirstName ? firstName : undefined,
      lastName: needsLastName ? lastName : undefined,
    })

    if (updateError) {
      setError('Unable to update your profile. Please try again.')
      setIsSubmitting(false)
      return
    }

    if (signUp.status === 'complete') {
      const { error: finalizeError } = await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            return
          }

          const url = decorateUrl('/')
          if (url.startsWith('http')) {
            window.location.href = url
            return
          }

          router.push(url)
        },
      })

      if (finalizeError) {
        setError('Unable to finish sign up. Please try again.')
        setIsSubmitting(false)
      }

      return
    }

    if (signUp.status === 'missing_requirements') {
      setError('Please complete the required fields to continue.')
      setIsSubmitting(false)
      return
    }

    router.push('/sign-in')
  }

  return (
    <main className="auth-page flex min-h-screen items-center justify-center px-4">
      <section className="auth-card w-full max-w-[420px] rounded-lg border px-6 py-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-xl font-bold leading-7 tracking-normal">
            Complete your profile
          </h1>
          <p className="mt-2 text-sm leading-5 tracking-normal text-text-tertiary">
            Add the required details to finish creating your account.
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {needsFirstName && (
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">First name</span>
              <input
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm shadow-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                value={firstName}
                onChange={event => setFirstName(event.target.value)}
                required
              />
            </label>
          )}

          {needsLastName && (
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Last name</span>
              <input
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm shadow-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                value={lastName}
                onChange={event => setLastName(event.target.value)}
                required
              />
            </label>
          )}

          <div id="clerk-captcha" />

          {error && (
            <p className="text-sm font-medium text-red-600">{error}</p>
          )}

          <button
            type="submit"
            className="auth-primary-button flex h-11 w-full items-center justify-center rounded-lg px-4 text-sm font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default ContinueSignInPage
