import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const streamdownMarkdown = readFileSync('app/components/base/streamdown-markdown.tsx', 'utf8')
const markdownStyles = readFileSync('app/styles/markdown.scss', 'utf8')

assert.match(
  streamdownMarkdown,
  /className=\{`markdown-body streamdown-markdown/,
  'message Markdown should use the shared markdown-body styles instead of rendering as unstyled Streamdown output',
)

assert.match(
  streamdownMarkdown,
  /remarkPlugins=\{\[RemarkBreaks\]\}/,
  'message Markdown should preserve model line breaks while using Streamdown',
)

assert.match(
  streamdownMarkdown,
  /preprocessLaTeX\(content\)/,
  'message Markdown should normalize common LLM LaTeX delimiters before rendering',
)

assert.match(
  markdownStyles,
  /\.markdown-body table \{[\s\S]*border-collapse:\s*separate;[\s\S]*border-radius:\s*8px;/,
  'message Markdown tables should use Dify-style rounded separated borders',
)

assert.match(
  markdownStyles,
  /\.theme-dark \.markdown-body \{[\s\S]*--markdown-table-header-bg:[\s\S]*--markdown-table-cell-text:/,
  'message Markdown tables should define dark-mode table colors',
)

assert.match(
  markdownStyles,
  /\[data-streamdown="table-header"\][\s\S]*background-color:\s*var\(--markdown-table-header-bg\)/,
  'Streamdown table output should be bridged to the shared Markdown table colors',
)
