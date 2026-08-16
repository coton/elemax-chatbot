import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const route = readFileSync('app/api/chat-messages/route.ts', 'utf8')
const streamClient = readFileSync('service/base.ts', 'utf8')
const mainComponent = readFileSync('app/components/index.tsx', 'utf8')

test('chat proxy preserves SSE semantics and disables response transformation', () => {
  assert.match(route, /'Content-Type': res\.headers\?\.\['content-type'\] \|\| 'text\/event-stream; charset=utf-8'/)
  assert.match(route, /'Cache-Control': 'no-cache, no-transform'/)
  assert.match(route, /'X-Accel-Buffering': 'no'/)
})

test('stream parser flushes a final SSE event before completing', () => {
  assert.match(streamClient, /createParser/)
  assert.match(streamClient, /parser\.feed\(decoder\.decode\(\)\)/)
  assert.match(streamClient, /parser\.feed\('\\n\\n'\)/)
  assert.match(streamClient, /complete\(\)/)
})

test('every completed stream reconciles with the persisted Dify answer', () => {
  assert.doesNotMatch(mainComponent, /!responseItem\.content\.trim\(\) && responseMessageId && startedConversationId/)
  assert.match(mainComponent, /if \(responseMessageId && nextConversationId\)/)
  assert.match(mainComponent, /recoverCompletedAnswer/)
  assert.match(mainComponent, /fetchChatList\(nextConversationId, \{ limit: 20 \}\)/)
  assert.match(mainComponent, /responseItem\.content = recoveredAnswer/)
  assert.match(mainComponent, /if \(responseItem\.content\.trim\(\)\) \{\s+updateCurrentQA/)
  assert.doesNotMatch(mainComponent, /The answer was saved but could not be displayed/)
  assert.match(mainComponent, /No answer was generated because the workflow failed/)
})
