import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, handleRouteError } from '@/app/api/utils/common'

export async function DELETE(request: NextRequest, { params }: {
  params: Promise<{ conversationId: string }>
}) {
  try {
    const { conversationId } = await params

    if (conversationId === '-1') {
      return NextResponse.json({
        message: 'Temporary conversation cannot be deleted.',
      }, { status: 400 })
    }

    const { user } = await getInfo(request)
    await client.deleteConversation(conversationId, user)

    return new Response(null, { status: 204 })
  }
  catch (error: any) {
    return handleRouteError(error)
  }
}
