import { SignIn } from '@clerk/nextjs'

interface GoogleOnlySignInProps {
  path?: string
}

const clerkAppearance = {
  elements: {
    rootBox: 'w-full',
    cardBox: 'mx-auto w-full max-w-[420px] rounded-lg border border-gray-200 shadow-sm',
    card: 'px-6 py-8',
    headerTitle: 'text-gray-900',
    headerSubtitle: 'text-gray-500',
    socialButtonsBlockButton: 'h-11 border border-gray-300 text-gray-900 shadow-sm transition hover:bg-gray-50',
    socialButtonsBlockButtonText: 'text-sm font-medium',
    dividerRow: 'hidden',
    formFieldRow: 'hidden',
    formButtonPrimary: 'hidden',
    footerAction: 'hidden',
  },
  layout: {
    socialButtonsPlacement: 'top' as const,
  },
}

const GoogleOnlySignIn = ({ path }: GoogleOnlySignInProps) => {
  const routingProps = path
    ? { path, routing: 'path' as const }
    : { routing: 'hash' as const }

  return (
    <SignIn
      {...routingProps}
      appearance={clerkAppearance}
      fallbackRedirectUrl="/"
      signInUrl="/sign-in"
      signUpFallbackRedirectUrl="/"
      signUpUrl="/sign-in"
      oauthFlow="redirect"
    />
  )
}

export default GoogleOnlySignIn
