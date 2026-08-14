import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const mainComponent = readFileSync('app/components/index.tsx', 'utf8')
const chatComponent = readFileSync('app/components/chat/index.tsx', 'utf8')

assert.match(
  mainComponent,
  /const sendLockRef = useRef\(false\)[\s\S]*const lockSending = \(\) => \{[\s\S]*sendLockRef\.current = true[\s\S]*const unlockSending = \(\) => \{[\s\S]*sendLockRef\.current = false/,
  'send locking must update a synchronous ref as well as React state',
)

assert.match(
  mainComponent,
  /const handleSend = \([\s\S]*?if \(sendLockRef\.current\) \{[\s\S]*?waitForResponse[\s\S]*?return false/,
  'a second submission must be rejected synchronously before it can replace the active request id',
)

assert.match(
  chatComponent,
  /<button[\s\S]*?disabled=\{isSendLocked\}[\s\S]*?onClick=\{handleSend\}/,
  'the send button must be disabled while a response is active',
)
