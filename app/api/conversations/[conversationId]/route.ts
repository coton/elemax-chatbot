import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { buildLegacyDifyUser, client, getArchivedClient, getInfo, handleRouteError } from '@/app/api/utils/common'

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

    const { userId, user: activeUser } = await getInfo(request)
    const archiveAppId = request.nextUrl.searchParams.get('archive_app_id')
    const selectedClient = archiveAppId ? getArchivedClient(archiveAppId) : client

    if (!selectedClient) {
      return NextResponse.json({
        message: 'Archived application is not configured.',
      }, { status: 400 })
    }

    const user = archiveAppId ? buildLegacyDifyUser(archiveAppId, userId) : activeUser
    await selectedClient.deleteConversation(conversationId, user)

    return new Response(null, { status: 204 })
  }
  catch (error: any) {
    return handleRouteError(error)
  }
}
