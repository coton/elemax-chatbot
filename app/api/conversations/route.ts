import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, handleRouteError } from '@/app/api/utils/common'

export async function GET(request: NextRequest) {
  try {
    const { user } = await getInfo(request)
    const { data }: any = await client.getConversations(user)
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
