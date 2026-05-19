import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const chatComponent = readFileSync('app/components/chat/index.tsx', 'utf8')
const globalStyles = readFileSync('app/styles/globals.css', 'utf8')

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

assert.match(
  chatComponent,
  /chat-input-section[\s\S]*chat-input-section-sidebar/,
  'chat input section should expose responsive classes for small screen layout',
)

assert.match(
  globalStyles,
  /@media \(min-width: 641px\) and \(max-width: 768px\)[\s\S]*\.chat-input-section-sidebar[\s\S]*width:\s*calc\(100vw - 216px\)[\s\S]*margin-left:\s*108px/,
  'chat input section should use the available tablet content width when the sidebar is visible',
)

assert.match(
  globalStyles,
  /@media \(max-width: 640px\)[\s\S]*\.chat-input-section[\s\S]*env\(safe-area-inset-bottom\)[\s\S]*\.chat-input-textarea[\s\S]*padding-right:\s*96px/,
  'chat input section should tighten spacing and respect safe-area on mobile screens',
)
