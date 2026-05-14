import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ChatClient } from 'dify-client'
import { API_KEY, API_URL, APP_ID } from '@/config'

const userPrefix = `user_${APP_ID}:`

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

  const user = userPrefix + userId
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

export const client = new ChatClient(API_KEY, API_URL || undefined)
