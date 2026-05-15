import type { NextRequest } from 'next/server'
import { proxyFilePreview } from '../file-response'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> | { fileId: string } },
) {
  return proxyFilePreview(request, context, 'signed-file-preview')
}
