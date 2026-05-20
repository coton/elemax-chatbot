import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const mainComponent = readFileSync('app/components/index.tsx', 'utf8')
const sidebarComponent = readFileSync('app/components/sidebar/index.tsx', 'utf8')
const chatComponent = readFileSync('app/components/chat/index.tsx', 'utf8')
const answerComponent = readFileSync('app/components/chat/answer/index.tsx', 'utf8')
const questionComponent = readFileSync('app/components/chat/question/index.tsx', 'utf8')
const toastComponent = readFileSync('app/components/base/toast/index.tsx', 'utf8')
const globalsCss = readFileSync('app/styles/globals.css', 'utf8')
const userMenuCss = readFileSync('app/components/header/custom-user-menu.module.css', 'utf8')

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
  answerComponent,
  /const trimmedFeedbackContent = feedbackContent\.trim\(\)[\s\S]*Feedback content cannot be empty[\s\S]*content: trimmedFeedbackContent/,
  'dislike feedback submit should reject blank content before sending feedback',
)

assert.match(
  toastComponent,
  /z-\[1100\]/,
  'toast notifications should appear above modal overlays such as feedback dialogs',
)

assert.match(
  globalsCss,
  /\.theme-light\s+\.assistant-message-bubble[\s\S]*color:\s*var\(--app-text-secondary\)\s*!important;[\s\S]*background-color:\s*#fcfcfd\s*!important;/,
  'assistant message bubbles should use the light review color and secondary text in light mode',
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

assert.match(
  sidebarComponent,
  /new-chat-button[\s\S]*hover:!bg-\[#eef0f3\]/,
  'the start new chat button hover should match the light history list hover color',
)

assert.match(
  globalsCss,
  /\.theme-light\s+\.new-chat-button:hover[\s\S]*background-color:\s*#eef0f3\s*!important;/,
  'light mode should keep the start new chat hover aligned with history list hover',
)

assert.match(
  chatComponent,
  /hover:bg-\[#eef0f3\]/,
  'suggested question hover should match the light history list hover color',
)

assert.match(
  questionComponent,
  /user-message-bubble[\s\S]*text-text-secondary[\s\S]*StreamdownMarkdown content=\{content\} className="!text-text-secondary"/,
  'user message bubbles should use the same light text color as answer bubbles',
)

assert.match(
  globalsCss,
  /\.theme-light\s+\.user-message-bubble,[\s\S]*background-color:\s*#e3eefd\s*!important;[\s\S]*\.theme-light\s+\.user-message-bubble,[\s\S]*color:\s*var\(--app-text-secondary\)\s*!important;/,
  'user message bubbles should use the reviewed light background and answer text color',
)

assert.match(
  userMenuCss,
  /:global\(\.theme-light\) \.avatarButton \{[\s\S]*border-color:\s*#d0d5dd;/,
  'light mode user avatar should have an explicit visible border',
)
