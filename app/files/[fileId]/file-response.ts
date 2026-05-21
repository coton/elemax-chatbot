import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getInfo, handleRouteError } from '@/app/api/utils/common'
import { DIFY_API_URL, DIFY_APP_KEY } from '@/config/server'

const getApiBaseUrl = () => {
  const apiUrl = DIFY_API_URL?.trim()
  if (!apiUrl) { return '' }

  return apiUrl.replace(/\/$/, '')
}

const getFilesBaseUrl = (apiBaseUrl: string) => {
  return apiBaseUrl.replace(/\/v1$/, '')
}

const copyHeader = (headers: Headers, key: string, value: string | null) => {
  if (value) { headers.set(key, value) }
}

const createFileResponse = (upstreamResponse: Response) => {
  const headers = new Headers()
  copyHeader(headers, 'content-type', upstreamResponse.headers.get('content-type'))
  copyHeader(headers, 'content-length', upstreamResponse.headers.get('content-length'))
  copyHeader(headers, 'content-disposition', upstreamResponse.headers.get('content-disposition'))
  copyHeader(headers, 'cache-control', upstreamResponse.headers.get('cache-control') || 'private, no-store')

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers,
  })
}

export const proxyFilePreview = async (
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> | { fileId: string } },
  mode: 'api-preview' | 'signed-file-preview' = 'api-preview',
) => {
  try {
    const { user } = await getInfo(request)

    const apiBaseUrl = getApiBaseUrl()
    if (!apiBaseUrl) {
      return NextResponse.json({ message: 'API URL is not configured' }, { status: 500 })
    }

    const { fileId } = await context.params
    const previewUrl = new URL(`${apiBaseUrl}/files/${encodeURIComponent(fileId)}/preview`)
    const asAttachment = request.nextUrl.searchParams.get('as_attachment')
    if (asAttachment) { previewUrl.searchParams.set('as_attachment', asAttachment) }
    previewUrl.searchParams.set('user', user)

    const previewResponse = await fetch(previewUrl, {
      headers: {
        Authorization: `Bearer ${DIFY_APP_KEY}`,
      },
      cache: 'no-store',
    })

    if (previewResponse.status !== 404 || mode === 'api-preview') {
      return createFileResponse(previewResponse)
    }

    const signedPreviewUrl = new URL(`${getFilesBaseUrl(apiBaseUrl)}/files/${encodeURIComponent(fileId)}/file-preview`)
    signedPreviewUrl.search = request.nextUrl.search

    const signedPreviewResponse = await fetch(signedPreviewUrl, {
      headers: {
        Authorization: `Bearer ${DIFY_APP_KEY}`,
      },
      cache: 'no-store',
    })

    return createFileResponse(signedPreviewResponse)
  }
  catch (error: any) {
    return handleRouteError(error)
  }
}
