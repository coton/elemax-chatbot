import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, handleRouteError } from '@/app/api/utils/common'
import { DIFY_CONFIG_UPDATED_AT } from '@/config/server'

const configUpdatedAt = Date.parse(DIFY_CONFIG_UPDATED_AT.trim())

const markStaleConversations = (payload: any) => {
  if (!Number.isFinite(configUpdatedAt) || !Array.isArray(payload?.data)) { return payload }

  return {
    ...payload,
    data: payload.data.map((conversation: any) => ({
      ...conversation,
      is_stale_config: typeof conversation.created_at === 'number'
        && conversation.created_at * 1000 < configUpdatedAt,
    })),
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await getInfo(request)
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Number(limitParam) : null
    console.log('[conversations] GET user:', user)
    const { data }: any = await client.getConversations(user, null, Number.isFinite(limit) ? limit : null)
    console.log('[conversations] GET response count:', Array.isArray(data?.data) ? data.data.length : 'N/A')
    return NextResponse.json(markStaleConversations(data))
  }
  catch (error: any) {
    if (error?.status) {
      return handleRouteError(error)
    }

    return NextResponse.json({
      data: [],
      error: error.message,
    })
  }
}
