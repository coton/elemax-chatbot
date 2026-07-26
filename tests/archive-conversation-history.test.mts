import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const serverConfig = readFileSync('config/server.ts', 'utf8')
const apiCommon = readFileSync('app/api/utils/common.ts', 'utf8')
const conversationsRoute = readFileSync('app/api/conversations/route.ts', 'utf8')
const messagesRoute = readFileSync('app/api/messages/route.ts', 'utf8')
const mainComponent = readFileSync('app/components/index.tsx', 'utf8')
const sidebar = readFileSync('app/components/sidebar/index.tsx', 'utf8')
const globalStyles = readFileSync('app/styles/globals.css', 'utf8')

test('archived Dify apps use indexed server-only configuration', () => {
  assert.match(serverConfig, /DIFY_ARCHIVE_\$\{index \+ 1\}/)
  assert.match(serverConfig, /\.filter\(app => app\.appId && app\.appKey\)/)
  assert.doesNotMatch(serverConfig, /NEXT_PUBLIC_DIFY_ARCHIVE/)
})

test('active and archived Dify users derive from the same Clerk user id', () => {
  assert.match(apiCommon, /buildDifyUser = \(appId: string, clerkUserId: string\)/)
  assert.match(apiCommon, /`user_\$\{appId\}:\$\{clerkUserId\}`/)
  assert.match(conversationsRoute, /buildDifyUser\(archive\.appId, userId\)/)
})

test('conversation API marks archive records read-only and routes message history by app', () => {
  assert.match(conversationsRoute, /source: 'archive'/)
  assert.match(conversationsRoute, /is_read_only: true/)
  assert.match(conversationsRoute, /is_stale_config: true/)
  assert.match(messagesRoute, /archive_app_id/)
  assert.match(messagesRoute, /getArchivedClient\(archiveAppId\)/)
})

test('archive conversations are visibly separated and cannot use active-app actions', () => {
  assert.match(sidebar, /Previous version history/)
  assert.match(sidebar, /!item\.is_read_only/)
  assert.match(mainComponent, /feedbackDisabled: isCurrentConversationArchived/)
  assert.match(mainComponent, /archiveAppId: currentConversation\?\.archive_app_id/)
})

test('conversation list keeps a visible, bounded scrollbar', () => {
  assert.match(sidebar, /app-sidebar flex h-full min-h-0/)
  assert.match(sidebar, /conversation-list-scrollbar min-h-0 flex-1/)
  assert.match(sidebar, /overflow-y-scroll/)
  assert.match(mainComponent, /flex h-full min-h-0 shrink-0 flex-col overflow-hidden/)
  assert.match(globalStyles, /\.conversation-list-scrollbar\s*\{[\s\S]*scrollbar-gutter: stable/)
  assert.match(globalStyles, /\.conversation-list-scrollbar::\s*-webkit-scrollbar-thumb/)
})
