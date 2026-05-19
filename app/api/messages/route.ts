import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, handleRouteError } from '@/app/api/utils/common'

export async function GET(request: NextRequest) {
  try {
    const { user } = await getInfo(request)
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')
    const firstId = searchParams.get('first_id')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Number(limitParam) : null
    console.log('[messages] GET user:', user, 'conversation_id:', conversationId)
    const { data }: any = await client.getConversationMessages(user, conversationId as string, firstId, Number.isFinite(limit) ? limit : null)
    console.log('[messages] GET response data count:', Array.isArray(data?.data) ? data.data.length : 'N/A', 'has_more:', data?.has_more)
    return NextResponse.json(data)
  }
  catch (error: any) {
    return handleRouteError(error)
  }
}
