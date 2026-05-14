import { Show } from '@clerk/nextjs'

import type { IMainProps } from '@/app/components'
import Main from '@/app/components'
import GoogleOnlySignIn from '@/app/components/auth/google-only-sign-in'

const SignedOutHome = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <GoogleOnlySignIn />
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
