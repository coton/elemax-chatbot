import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const conversationsRoute = readFileSync('app/api/conversations/route.ts', 'utf8')
const mainComponent = readFileSync('app/components/index.tsx', 'utf8')
const chatComponent = readFileSync('app/components/chat/index.tsx', 'utf8')

assert.match(
  conversationsRoute,
  /conversation\.created_at \* 1000 < configUpdatedAt/,
  'conversations created before the configured Dify update time should be marked stale',
)

assert.match(
  mainComponent,
  /isCurrentConversationStale[\s\S]*is_stale_config === true/,
  'the active conversation should expose its stale configuration state',
)

assert.match(
  mainComponent,
  /const handleSend[\s\S]*if \(isCurrentConversationStale\) \{ return false \}/,
  'stale conversations should not send another message with the old Dify configuration',
)

assert.match(
  mainComponent,
  /introduction = latestConversationIntroduction[\s\S]*suggestedQuestions: nextSuggestedQuestions = latestSuggestedQuestions/,
  'starting a new conversation should use the latest Dify presentation parameters',
)

assert.match(
  chatComponent,
  /Max AI has been updated[\s\S]*Start a new chat to use the latest version\.[\s\S]*Start a new chat with the latest version/,
  'stale conversations should replace the input with a clear update notice and action',
)
