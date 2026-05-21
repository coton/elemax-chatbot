import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, handleRouteError } from '@/app/api/utils/common'

export async function GET(request: NextRequest) {
  try {
    const { user } = await getInfo(request)
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Number(limitParam) : null
    console.log('[conversations] GET user:', user)
    const { data }: any = await client.getConversations(user, null, Number.isFinite(limit) ? limit : null)
    console.log('[conversations] GET response count:', Array.isArray(data?.data) ? data.data.length : 'N/A')
    return NextResponse.json(data)
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
