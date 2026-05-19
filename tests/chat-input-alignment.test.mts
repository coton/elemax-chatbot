import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const chatComponent = readFileSync('app/components/chat/index.tsx', 'utf8')

assert.match(
  chatComponent,
  /p-\[9px\]/,
  'chat input shell should keep 9px padding around the textarea and icon row',
)

assert.match(
  chatComponent,
  /top-1\/2[\s\S]*-translate-y-1\/2/,
  'chat input send and image controls should be vertically centered instead of bottom-aligned',
)

assert.match(
  chatComponent,
  /min-h-8[\s\S]*leading-8/,
  'chat input textarea text and placeholder should be vertically centered in the single-line state',
)

assert.match(
  chatComponent,
  /flex h-8[\s\S]*items-center/,
  'chat input controls should stay on the same row height as the textarea',
)
