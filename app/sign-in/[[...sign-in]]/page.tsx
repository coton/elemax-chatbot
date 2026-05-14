import GoogleOnlySignIn from '@/app/components/auth/google-only-sign-in'

const SignInPage = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <GoogleOnlySignIn path="/sign-in" />
    </main>
  )
}

export default SignInPage
