import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getInfo, handleRouteError } from '@/app/api/utils/common'
import { API_KEY, API_URL } from '@/config'

const getApiBaseUrl = () => {
  if (!API_URL || API_URL === 'undefined') { return 'https://api.dify.ai/v1' }
  return API_URL.replace(/\/$/, '')
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
        'Authorization': `Bearer ${API_KEY}`,
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
