import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const headerComponent = readFileSync('app/components/header.tsx', 'utf8')

assert.match(
  headerComponent,
  /h-8 w-8 grow-0 shrink-0 items-center justify-center overflow-hidden rounded-lg text-\[20px\]/,
  'collapsed header app icon should stay compact',
)

assert.doesNotMatch(
  headerComponent,
  /h-10 w-10[\s\S]*border-\[0\.5px\] border-divider-regular/,
  'collapsed header app icon should not keep the oversized bordered frame',
)

assert.match(
  headerComponent,
  /isMobile[\s\S]*<ConversationTrail title=\{currentConversationTitle\} \/>/,
  'mobile auto-collapsed header should use the same compact conversation trail',
)

assert.match(
  headerComponent,
  /app-header sticky top-0 z-30/,
  'mobile header should have a sticky top app-header class for safe-area styling',
)

assert.doesNotMatch(
  headerComponent,
  /Bars3Icon|PencilSquareIcon/,
  'mobile header controls should use the same svg icons as the desktop collapsed header',
)

assert.match(
  headerComponent,
  /isMobile[\s\S]*<ExpandSidebarIcon \/>[\s\S]*isMobile[\s\S]*<NewConversationIcon \/>/,
  'mobile toggle and new chat buttons should reuse the desktop collapsed svg icons',
)
