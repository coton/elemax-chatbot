import 'server-only'

export const DIFY_APP_KEY = process.env.DIFY_APP_KEY || ''
export const DIFY_API_URL = process.env.DIFY_API_URL || undefined
export const DIFY_CONFIG_UPDATED_AT = process.env.DIFY_CONFIG_UPDATED_AT || ''

export interface ArchivedDifyApp {
  appId: string
  appKey: string
}

export const DIFY_ARCHIVED_APPS: ArchivedDifyApp[] = Array.from({ length: 5 }, (_, index) => {
  const prefix = `DIFY_ARCHIVE_${index + 1}`
  return {
    appId: process.env[`${prefix}_APP_ID`]?.trim() || '',
    appKey: process.env[`${prefix}_APP_KEY`]?.trim() || '',
  }
}).filter(app => app.appId && app.appKey)
