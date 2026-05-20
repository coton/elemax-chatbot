import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getInfo, handleRouteError } from '@/app/api/utils/common'
import { API_KEY, API_URL } from '@/config'

const getApiBaseUrl = () => {
  if (!API_URL || API_URL === 'undefined') { return 'https://api.dify.ai/v1' }
  return API_URL.replace(/\/$/, '')
}

export async function POST(request: NextRequest, { params }: {
  params: Promise<{ conversationId: string }>
}) {
  try {
    const { conversationId } = await params
    const { user } = await getInfo(request)
    const response = await fetch(`${getApiBaseUrl()}/chat-messages/${conversationId}/stop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user }),
    })
    const data = await response.json()

    if (!response.ok) { return NextResponse.json(data, { status: response.status }) }

    return NextResponse.json(data)
  }
  catch (error: any) {
    return handleRouteError(error)
  }
}
