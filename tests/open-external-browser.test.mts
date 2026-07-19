import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const signInComponent = readFileSync(
  new URL('../app/components/auth/google-only-sign-in.tsx', import.meta.url),
  'utf8',
)

test('offers an Android system browser intent for embedded browsers', () => {
  assert.match(signInComponent, /embeddedBrowserPlatform === 'android'/)
  assert.match(signInComponent, /action=android\.intent\.action\.VIEW/)
  assert.match(signInComponent, /category=android\.intent\.category\.BROWSABLE/)
  assert.match(signInComponent, /S\.browser_fallback_url=/)
  assert.match(signInComponent, /href=\{androidBrowserIntent\}[\s\S]*Open in browser/)
})

test('keeps a manual fallback for platforms that cannot launch a browser', () => {
  assert.match(signInComponent, /Use the top-right menu to open this page in your system browser/)
  assert.match(signInComponent, /Copy app link/)
})
