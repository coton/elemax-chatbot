import type { NextRequest } from 'next/server'
import { client, getInfo, handleRouteError } from '@/app/api/utils/common'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const { user } = await getInfo(request)
    formData.append('user', user)
    const res = await client.fileUpload(formData)
    return new Response(res.data.id as any)
  }
  catch (e: any) {
    return handleRouteError(e)
  }
}
