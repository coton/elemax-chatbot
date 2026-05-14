import { Show } from '@clerk/nextjs'

import type { IMainProps } from '@/app/components'
import Main from '@/app/components'
import GoogleSignInButton from '@/app/components/auth/google-sign-in-button'
import { APP_INFO } from '@/config'

const SignedOutHome = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <section className="w-full max-w-sm rounded-lg bg-white px-6 py-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-gray-900">{APP_INFO.title}</h1>
          {APP_INFO.description && (
            <p className="mt-2 text-sm text-gray-500">{APP_INFO.description}</p>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <GoogleSignInButton />
        </div>
      </section>
    </main>
  )
}

const App = ({
  params,
}: IMainProps) => {
  return (
    <Show when="signed-in" fallback={<SignedOutHome />}>
      <Main params={params} />
    </Show>
  )
}

export default App
