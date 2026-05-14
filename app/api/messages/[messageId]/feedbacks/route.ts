import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, handleRouteError } from '@/app/api/utils/common'

export async function POST(request: NextRequest, { params }: {
  params: Promise<{ messageId: string }>
}) {
  try {
    const body = await request.json()
    const {
      rating,
    } = body
    const { messageId } = await params
    const { user } = await getInfo(request)
    const { data } = await client.messageFeedback(messageId, rating, user)
    return NextResponse.json(data)
  }
  catch (error: any) {
    return handleRouteError(error)
  }
}
