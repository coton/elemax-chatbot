import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getInfo, handleRouteError } from '@/app/api/utils/common'
import { DIFY_API_URL, DIFY_APP_KEY } from '@/config/server'

const getApiBaseUrl = () => {
  if (!DIFY_API_URL) { return 'https://api.dify.ai/v1' }
  return DIFY_API_URL.replace(/\/$/, '')
}

export async function POST(request: NextRequest, { params }: {
  params: Promise<{ messageId: string }>
}) {
  try {
    const body = await request.json()
    const {
      rating,
      content,
    } = body
    const { messageId } = await params
    const { user } = await getInfo(request)
    const response = await fetch(`${getApiBaseUrl()}/messages/${messageId}/feedbacks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_APP_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rating,
        ...(content !== undefined ? { content } : {}),
        user,
      }),
    })
    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  }
  catch (error: any) {
    return handleRouteError(error)
  }
}
