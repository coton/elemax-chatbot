import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const chatComponent = readFileSync('app/components/chat/index.tsx', 'utf8')
const globalStyles = readFileSync('app/styles/globals.css', 'utf8')
const rootLayout = readFileSync('app/layout.tsx', 'utf8')

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
  chatComponent,
  /visualViewport[\s\S]*--mobile-keyboard-inset-bottom[\s\S]*onFocus=\{handleTextareaFocus\}/,
  'chat input should track the mobile visual viewport so it can stay above the soft keyboard',
)

assert.match(
  chatComponent,
  /refreshMobileKeyboardInsetSoon[\s\S]*window\.requestAnimationFrame\(refreshMobileKeyboardInset\)[\s\S]*e\.key === 'Enter' \|\| e\.code === 'Enter'[\s\S]*handleSend/,
  'chat input should refresh the keyboard inset when users send with the mobile keyboard Enter key',
)

assert.match(
  chatComponent,
  /inputSectionRef[\s\S]*focus\(\{ preventScroll: true \}\)[\s\S]*scrollContainer\.scrollTop = scrollContainer\.scrollHeight[\s\S]*syncMobileInputPositionSoon\(\{ focusTextarea: true, scrollToBottom: true \}\)/,
  'chat input should refocus and keep the mobile panel scrolled to the bottom after sending',
)

assert.match(
  globalStyles,
  /@media \(min-width: 641px\) and \(max-width: 768px\)[\s\S]*\.chat-input-section-sidebar[\s\S]*width:\s*calc\(100vw - 216px\)[\s\S]*margin-left:\s*108px/,
  'chat input section should use the available tablet content width when the sidebar is visible',
)

assert.match(
  globalStyles,
  /@media \(max-width: 640px\)[\s\S]*\.chat-scroll-content[\s\S]*var\(--mobile-keyboard-inset-bottom, 0px\)[\s\S]*\.chat-input-section[\s\S]*calc\(var\(--mobile-keyboard-inset-bottom, 0px\) \+ max\(0\.75rem, env\(safe-area-inset-bottom\)\)\)[\s\S]*\.chat-input-textarea[\s\S]*padding-right:\s*96px/,
  'chat input section should tighten spacing and respect safe-area and keyboard insets on mobile screens',
)

assert.match(
  globalStyles,
  /@media \(max-width: 640px\)[\s\S]*\.app-header[\s\S]*env\(safe-area-inset-top\)/,
  'mobile header should remain sticky while respecting top safe-area',
)

assert.match(
  globalStyles,
  /@media \(max-width: 640px\)[\s\S]*input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\):not\(\[type="file"\]\),[\s\S]*textarea:not\(\[data-no-mobile-zoom\]\),[\s\S]*select:not\(\[data-no-mobile-zoom\]\)[\s\S]*font-size:\s*16px/,
  'mobile form controls should keep a 16px computed font size to prevent iOS focus zoom',
)

assert.match(
  rootLayout,
  /export const viewport[\s\S]*initialScale:\s*1[\s\S]*maximumScale:\s*1[\s\S]*viewportFit:\s*'cover'/,
  'root layout should lock the initial viewport scale for mobile keyboard focus',
)

assert.match(
  rootLayout,
  /app-viewport/,
  'root layout should use a dynamic viewport shell instead of a fixed h-screen wrapper',
)
