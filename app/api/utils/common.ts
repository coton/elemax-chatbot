import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ChatClient } from 'dify-client'
import { DIFY_API_URL, DIFY_APP_KEY, DIFY_ARCHIVED_APPS } from '@/config/server'

export const buildDifyUser = (clerkUserId: string) => `clerk:${clerkUserId}`
export const buildLegacyDifyUser = (appId: string, clerkUserId: string) => `user_${appId}:${clerkUserId}`

export class UnauthorizedError extends Error {
  status = 401

  constructor() {
    super('Unauthorized')
  }
}

export const getInfo = async (_request?: NextRequest) => {
  const { userId } = await auth()
  if (!userId) {
    throw new UnauthorizedError()
  }

  const user = buildDifyUser(userId)
  return {
    userId,
    user,
  }
}

export const handleRouteError = (error: any) => {
  const status = error?.status || error?.response?.status || 500
  const message = error?.response?.data?.message || error?.message || 'Internal Server Error'

  return NextResponse.json({ message }, { status })
}

export const client = new ChatClient(DIFY_APP_KEY, DIFY_API_URL)

const archivedClients = new Map(
  DIFY_ARCHIVED_APPS.map(app => [app.appId, new ChatClient(app.appKey, DIFY_API_URL)]),
)

export const getArchivedClient = (appId: string) => archivedClients.get(appId)
