import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const resourceLink = readFileSync('app/components/base/markdown-resource-link.tsx', 'utf8')
const streamdownMarkdown = readFileSync('app/components/base/streamdown-markdown.tsx', 'utf8')

test('only trusted ELEMAX manufacturer PDFs receive resource-button rendering', () => {
  assert.match(resourceLink, /url\.protocol === 'https:'/)
  assert.match(resourceLink, /url\.hostname === PDF_RESOURCE_HOST/)
  assert.match(resourceLink, /url\.username === ''/)
  assert.match(resourceLink, /url\.password === ''/)
  assert.match(resourceLink, /url\.pathname\.startsWith\(PDF_RESOURCE_PATH_PREFIX\)/)
  assert.match(resourceLink, /url\.pathname\.toLowerCase\(\)\.endsWith\('\.pdf'\)/)
})

test('PDF links open safely without exposing the current window', () => {
  assert.match(resourceLink, /target="_blank"/)
  assert.match(resourceLink, /rel="noopener noreferrer"/)
  assert.match(resourceLink, /Open PDF:/)
})

test('message Markdown uses the PDF-aware link component', () => {
  assert.match(streamdownMarkdown, /components=\{\{ a: MarkdownResourceLink \}\}/)
})
