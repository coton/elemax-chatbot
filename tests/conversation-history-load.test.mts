import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const service = readFileSync('service/index.ts', 'utf8')
const messagesRoute = readFileSync('app/api/messages/route.ts', 'utf8')
const conversationsRoute = readFileSync('app/api/conversations/route.ts', 'utf8')
const mainComponent = readFileSync('app/components/index.tsx', 'utf8')

assert.match(
  service,
  /conversation_id: conversationId,[\s\S]*limit: options\?\.limit \|\| 100,[\s\S]*first_id: options\?\.firstId \|\| '',[\s\S]*archive_app_id: options\.archiveAppId/,
  'chat history fetch should use Dify messages first_id pagination and load up to 100 records',
)

assert.match(
  messagesRoute,
  /selectedClient\.getConversationMessages\(user, conversationId as string, firstId, Number\.isFinite\(limit\) \? limit : null\)/,
  'messages route should forward first_id and limit to the Dify SDK',
)

assert.match(
  conversationsRoute,
  /client\.getConversations\(user, null, Number\.isFinite\(limit\) \? limit : null\)/,
  'conversations route should honor the frontend history list limit',
)

assert.match(
  mainComponent,
  /getConversationIdFromStorage\(APP_ID\)[\s\S]*savedConversation[\s\S]*initialConversation = savedConversation \|\| firstConversation/,
  'refresh should restore the saved conversation before falling back to the latest conversation',
)

assert.match(
  mainComponent,
  /historyMessages = Array\.isArray\(data\) \? \[\.\.\.data\] : \[\][\s\S]*historyMessages\.forEach/,
  'Dify history should be copied before it is rendered in API order',
)
