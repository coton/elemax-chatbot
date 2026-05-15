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
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <section className="w-full max-w-[420px] rounded-lg border border-gray-200 bg-white px-6 py-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-xl font-bold leading-7 tracking-normal text-gray-900">
            Complete your profile
          </h1>
          <p className="mt-2 text-sm leading-5 tracking-normal text-gray-500">
            Add the required details to finish creating your account.
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {needsFirstName && (
            <label className="block">
              <span className="text-sm font-medium text-gray-700">First name</span>
              <input
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                value={firstName}
                onChange={event => setFirstName(event.target.value)}
                required
              />
            </label>
          )}

          {needsLastName && (
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Last name</span>
              <input
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
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
            className="flex h-11 w-full items-center justify-center rounded-lg bg-gray-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
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
