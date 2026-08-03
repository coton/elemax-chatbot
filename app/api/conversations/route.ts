import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { buildLegacyDifyUser, client, getArchivedClient, getInfo, handleRouteError } from '@/app/api/utils/common'
import { DIFY_ARCHIVED_APPS, DIFY_CONFIG_UPDATED_AT } from '@/config/server'

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
    const { userId, user } = await getInfo(request)
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Number(limitParam) : null
    console.log('[conversations] GET user:', user)
    const { data }: any = await client.getConversations(user, null, Number.isFinite(limit) ? limit : null)
    console.log('[conversations] GET response count:', Array.isArray(data?.data) ? data.data.length : 'N/A')
    const activePayload = markStaleConversations(data)
    const activeConversations = Array.isArray(activePayload?.data)
      ? activePayload.data.map((conversation: any) => ({
        ...conversation,
        source: 'active',
      }))
      : []

    const archivedResults = await Promise.allSettled(
      DIFY_ARCHIVED_APPS.map(async (archive) => {
        const archiveClient = getArchivedClient(archive.appId)
        if (!archiveClient) { return [] }

        const archiveUser = buildLegacyDifyUser(archive.appId, userId)
        const { data: archiveData }: any = await archiveClient.getConversations(
          archiveUser,
          null,
          Number.isFinite(limit) ? limit : null,
        )
        return Array.isArray(archiveData?.data)
          ? archiveData.data.map((conversation: any) => ({
            ...conversation,
            source: 'archive',
            archive_app_id: archive.appId,
            is_read_only: true,
            is_stale_config: true,
          }))
          : []
      }),
    )
    const archivedConversations = archivedResults.flatMap(result =>
      result.status === 'fulfilled' ? result.value : [],
    )

    return NextResponse.json({
      ...activePayload,
      data: [...activeConversations, ...archivedConversations],
      archive_errors: archivedResults.filter(result => result.status === 'rejected').length,
    })
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
