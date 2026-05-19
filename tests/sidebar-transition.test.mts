import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const mainComponent = readFileSync('app/components/index.tsx', 'utf8')

assert.match(
  mainComponent,
  /transition-\[width,opacity\][\s\S]*duration-200[\s\S]*ease-in-out/,
  'desktop sidebar should animate collapse and expand with an ease-in-out transition',
)

assert.doesNotMatch(
  mainComponent,
  /!isMobile && !isSidebarCollapsed && \(/,
  'desktop sidebar wrapper should stay mounted so the collapse transition can run',
)
