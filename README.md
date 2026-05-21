# Conversation Web App Template
This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Config App
Create a file named `.env.local` in the current directory and copy the contents from `.env.example`. Setting the following content:
```
# APP ID: This is the unique identifier for your app. You can find it in the app's detail page URL. 
# For example, in the URL `https://cloud.dify.ai/app/xxx/workflow`, the value `xxx` is your APP ID.
NEXT_PUBLIC_APP_ID=

# Dify Backend Service API key.
# Use DIFY_* instead of NEXT_PUBLIC_* because Dify API keys are secrets.
# In Next.js, every NEXT_PUBLIC_* variable is bundled into frontend JavaScript
# and can be read from the browser. Keep the app key server-side only.
DIFY_APP_KEY=

# APP URL: This is the API's base URL. If you're using the Dify cloud service, set it to: https://api.dify.ai/v1.
DIFY_API_URL=

# Clerk auth.
# Use pk_live_... and sk_live_... on the main/production deployment.
# Use test keys only for local development or Vercel Preview.
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
CLERK_SECRET_KEY=sk_live_...
```

Config more in `config/index.ts` file:   
```js
export const APP_INFO: AppInfo = {
  title: 'Chat APP',
  description: '',
  copyright: '',
  privacy_policy: '',
  default_language: 'zh-Hans'
}

export const isShowPrompt = true
export const promptTemplate = ''
```

## Getting Started
First, install dependencies:
```bash
npm install
# or
yarn
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Using Docker

```
docker build . -t <DOCKER_HUB_REPO>/webapp-conversation:latest
# now you can access it in port 3000
docker run -p 3000:3000 <DOCKER_HUB_REPO>/webapp-conversation:latest
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

This repository is ready for Vercel Git automatic deployments.

### Automatic deployment

1. Push this project to GitHub, GitLab, or Bitbucket.
2. In Vercel, create a new project and import this repository.
3. If importing from a larger parent repository, set **Root Directory** to:

```bash
apps/elemax-chatbot
```

4. Keep the framework as **Next.js**. The build settings are pinned in `vercel.json`:

```bash
Install Command: pnpm install --frozen-lockfile
Build Command: pnpm build
Node.js Version: 20.x
```

5. Add these Environment Variables in Vercel. For the `main` branch Production deployment, use the production Clerk instance keys (`pk_live_...` / `sk_live_...`). Use test keys only for local development or Vercel Preview:

```bash
NEXT_PUBLIC_APP_ID=
DIFY_APP_KEY=
DIFY_API_URL=https://api.dify.ai/v1
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
CLERK_SECRET_KEY=sk_live_...
```

`DIFY_APP_KEY` is the Dify Backend Service API key shown in Dify's **Backend Service API -> API Key** dialog. It is intentionally server-only and must not use a `NEXT_PUBLIC_` prefix.

After the project is connected, Vercel will automatically create preview deployments for pull requests and production deployments for pushes to the production branch configured in Vercel.

> ⚠️ If you are using [Vercel Hobby](https://vercel.com/pricing), your message will be truncated due to the limitation of vercel.


The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
