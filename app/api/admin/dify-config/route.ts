import { timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { DIFY_CONFIG_UPDATED_AT } from '@/config/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const matchesSecret = (actual: string | null, expected: string | undefined) => {
  if (!actual || !expected) { return false }
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
}

const authorize = (request: NextRequest) => matchesSecret(
  request.headers.get('x-elemax-automation-key'),
  process.env.ELEMAX_AUTOMATION_API_KEY,
)

const vercelUrl = (path: string) => {
  const url = new URL(path, 'https://api.vercel.com')
  if (process.env.VERCEL_TEAM_ID) { url.searchParams.set('teamId', process.env.VERCEL_TEAM_ID) }
  return url
}

const vercelRequest = async (url: URL, init?: RequestInit) => {
  const token = process.env.VERCEL_API_TOKEN
  if (!token) { throw new Error('VERCEL_API_TOKEN is not configured') }
  const response = await fetch(url, {
    ...init,
    headers: {
      'authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(`Vercel API ${response.status}: ${payload?.error?.message || payload?.message || 'request failed'}`)
  }
  return payload
}

export async function GET(request: NextRequest) {
  if (!authorize(request)) { return NextResponse.json({ error: 'invalid_automation_credential' }, { status: 401 }) }
  return NextResponse.json({
    status: 'ready',
    data: { updatedAt: DIFY_CONFIG_UPDATED_AT || null },
  })
}

export async function POST(request: NextRequest) {
  if (!authorize(request)) { return NextResponse.json({ error: 'invalid_automation_credential' }, { status: 401 }) }

  try {
    const body = await request.json().catch(() => ({}))
    const updatedAt = typeof body.updatedAt === 'string' && body.updatedAt.trim()
      ? body.updatedAt.trim()
      : new Date().toISOString()
    const parsedUpdatedAt = Date.parse(updatedAt)
    if (!Number.isFinite(parsedUpdatedAt)) {
      return NextResponse.json({ error: 'updatedAt must be an ISO 8601 timestamp' }, { status: 400 })
    }
    const currentTimestamp = Date.parse(DIFY_CONFIG_UPDATED_AT)
    if (Number.isFinite(currentTimestamp) && parsedUpdatedAt < currentTimestamp) {
      return NextResponse.json({ error: 'updatedAt cannot be earlier than the current value' }, { status: 409 })
    }

    const projectId = process.env.VERCEL_PROJECT_ID
    if (!projectId) { throw new Error('VERCEL_PROJECT_ID is not configured') }
    const envList = await vercelRequest(vercelUrl(`/v9/projects/${encodeURIComponent(projectId)}/env`))
    const variable = envList.envs?.find((item: any) => item.key === 'DIFY_CONFIG_UPDATED_AT'
      && (!Array.isArray(item.target) || item.target.includes('production')))
    if (!variable?.id) {
      throw new Error('Production DIFY_CONFIG_UPDATED_AT does not exist in the Vercel project')
    }

    await vercelRequest(vercelUrl(`/v9/projects/${encodeURIComponent(projectId)}/env/${encodeURIComponent(variable.id)}`), {
      method: 'PATCH',
      body: JSON.stringify({
        value: new Date(parsedUpdatedAt).toISOString(),
        target: ['production'],
        type: variable.type || 'encrypted',
      }),
    })

    const project = await vercelRequest(vercelUrl(`/v9/projects/${encodeURIComponent(projectId)}`))
    const repoId = project.link?.repoId
    if (!repoId) { throw new Error('Vercel project is not connected to a Git repository') }
    const deployment = await vercelRequest(vercelUrl('/v13/deployments'), {
      method: 'POST',
      body: JSON.stringify({
        name: project.name,
        project: project.id,
        target: 'production',
        gitSource: {
          type: project.link.type || 'github',
          repoId,
          ref: project.link.productionBranch || 'main',
        },
      }),
    })

    return NextResponse.json({
      status: 'deploying',
      data: {
        updatedAt: new Date(parsedUpdatedAt).toISOString(),
        deploymentId: deployment.id || null,
      },
    })
  }
  catch (error) {
    return NextResponse.json({
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
