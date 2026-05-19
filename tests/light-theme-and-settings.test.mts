import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const mainComponent = readFileSync('app/components/index.tsx', 'utf8')
const sidebarComponent = readFileSync('app/components/sidebar/index.tsx', 'utf8')
const answerComponent = readFileSync('app/components/chat/answer/index.tsx', 'utf8')
const globalsCss = readFileSync('app/styles/globals.css', 'utf8')

assert.equal(
  /onOpenSettings/.test(mainComponent + sidebarComponent),
  false,
  'settings button should not call a parent hook that scrolls the chat panel',
)

assert.equal(
  /scrollTo\(\{\s*top:\s*0/.test(mainComponent),
  false,
  'settings interactions should not scroll the main chat panel to the top',
)

assert.match(
  answerComponent,
  /assistant-message-bubble[\s\S]*bg-\[#f9fafb\]/,
  'assistant message bubbles should keep the original base class so dark mode overrides stay unchanged',
)

assert.match(
  globalsCss,
  /\.theme-light\s+\.assistant-message-bubble[\s\S]*background-color:\s*#ffffff\s*!important;/,
  'assistant message bubbles should use #ffffff only in light mode',
)

assert.match(
  globalsCss,
  /\.theme-dark\s+:where\(\[class~="bg-\[#f9fafb\]"\]\)[\s\S]*background-color:\s*var\(--app-panel-muted-bg\)\s*!important;/,
  'assistant message bubbles should keep the existing dark mode color override',
)

assert.match(
  globalsCss,
  /\.theme-light\s+\.new-chat-button[\s\S]*background-color:\s*#ffffff\s*!important;/,
  'the start new chat button should use #ffffff in light mode',
)
