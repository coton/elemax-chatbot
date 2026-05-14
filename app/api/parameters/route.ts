import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, handleRouteError } from '@/app/api/utils/common'

export async function GET(request: NextRequest) {
  try {
    const { user } = await getInfo(request)
    const { data } = await client.getApplicationParameters(user)
    return NextResponse.json(data as object)
  }
  catch (error: any) {
    if (error?.status) {
      return handleRouteError(error)
    }

    return NextResponse.json([])
  }
}
