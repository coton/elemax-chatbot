import GoogleOnlySignIn from '@/app/components/auth/google-only-sign-in'

const SignInPage = () => {
  return (
    <main className="auth-page flex min-h-screen items-center justify-center px-4">
      <GoogleOnlySignIn />
    </main>
  )
}

export default SignInPage
