import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, handleRouteError } from '@/app/api/utils/common'

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ messageId: string }>
  },
) {
  try {
    const { user } = await getInfo(request)
    const { messageId } = await params
    const { data } = await client.sendRequest(
      'GET',
      `/messages/${messageId}/suggested`,
      null,
      { user },
    )

    return NextResponse.json(data)
  }
  catch (error: any) {
    return handleRouteError(error)
  }
}
