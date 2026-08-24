'use client'
import { useMemo } from 'react'
import RemarkBreaks from 'remark-breaks'
import { Streamdown } from 'streamdown'
import 'katex/dist/katex.min.css'
import MarkdownResourceLink, { isTrustedPdfResource } from './markdown-resource-link'

interface StreamdownMarkdownProps {
  content: string
  className?: string
}

const codeBlockRegex = /```[\s\S]*?```/g
const dollarPlaceholder = '_STREAMDOWN_MARKDOWN_DOLLAR_'
const tableDelimiterCellRegex = /^:?-{3,}:?$/
const markdownLinkUrlRegex = /\]\((https?:\/\/[^)\n]+)\)/g

// CDN PDF URLs may be stored un-percent-encoded (raw spaces / Chinese file names),
// which breaks CommonMark link parsing — react-markdown renders the whole
// `[title](url)` as plain text, so no PDF card is shown and the link is not
// clickable. Encode these URLs before markdown parsing. Encoding is idempotent:
// already percent-encoded sequences (%20, %E7...)) are left untouched.
const cdnPdfUrlRegex = /(https:\/\/cdn\.elemaxai\.com\/manufacturer-product-pdfs\/[^\n]*?\.pdf)/g

const encodeUrl = (value: string) => {
  let out = ''
  let i = 0
  while (i < value.length) {
    const ch = value[i]
    if (ch === '%' && /^[0-9A-Fa-f]{2}$/.test(value.slice(i + 1, i + 3))) {
      out += ch + value.slice(i + 1, i + 3)
      i += 3
    }
    else if (/[A-Za-z0-9\-._~!$&'()*+,;=:@/]/.test(ch)) {
      out += ch
      i += 1
    }
    else {
      out += encodeURIComponent(ch)
      i += 1
    }
  }
  return out
}

const encodeCdnPdfUrls = (content: string) =>
  content.replace(cdnPdfUrlRegex, match => encodeUrl(match))

const escapeReplacement = (value: string) =>
  value.replace(/\$/g, dollarPlaceholder)

const splitPipeTableCells = (line: string) => {
  const trimmedLine = line.trim()
  const withoutLeadingPipe = trimmedLine.startsWith('|') ? trimmedLine.slice(1) : trimmedLine
  const withoutOuterPipes = withoutLeadingPipe.endsWith('|') ? withoutLeadingPipe.slice(0, -1) : withoutLeadingPipe

  return withoutOuterPipes.split('|').map(cell => cell.trim())
}

const normalizeTableDelimiterRows = (content: string) => {
  const lines = content.split('\n')

  return lines.map((line, index) => {
    if (index === 0 || !line.includes('|')) { return line }

    const headerLine = lines[index - 1]
    if (!headerLine.includes('|')) { return line }

    const headerCells = splitPipeTableCells(headerLine)
    if (headerCells.length < 2) { return line }

    const delimiterCells = splitPipeTableCells(line)
    const expandedDelimiterCells = delimiterCells.flatMap(cell => cell.split(/\s+/).filter(Boolean))
    if (
      expandedDelimiterCells.length !== headerCells.length
      || !expandedDelimiterCells.every(cell => tableDelimiterCellRegex.test(cell))
    ) { return line }

    const indent = line.match(/^\s*/)?.[0] || ''
    return `${indent}| ${expandedDelimiterCells.join(' | ')} |`
  }).join('\n')
}

const preprocessLaTeX = (content: string) => {
  const codeBlocks = content.match(codeBlockRegex) || []
  let codeBlockIndex = 0
  let processedContent = content.replace(
    codeBlockRegex,
    () => `CODE_BLOCK_PLACEHOLDER_${codeBlockIndex++}`,
  )

  processedContent = encodeCdnPdfUrls(processedContent)

  processedContent = processedContent
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, equation) => `$$${equation}$$`)
    .replace(/\\\((.*?)\\\)/g, (_, equation) => `$$${equation}$$`)

  processedContent = normalizeTableDelimiterRows(processedContent)

  codeBlocks.forEach((block, index) => {
    processedContent = processedContent.replace(
      `CODE_BLOCK_PLACEHOLDER_${index}`,
      escapeReplacement(block),
    )
  })

  return processedContent.replace(new RegExp(dollarPlaceholder, 'g'), '$')
}

export function StreamdownMarkdown({ content, className = '' }: StreamdownMarkdownProps) {
  const hasBrandResources = useMemo(
    () => [...content.matchAll(markdownLinkUrlRegex)].some(match => isTrustedPdfResource(match[1])),
    [content],
  )
  const hasProcurementContact = content.includes('procurement@elemax.com')
  const processedContent = useMemo(
    () => preprocessLaTeX(
      hasBrandResources
        ? content.replaceAll('厂商产品资料', '品牌产品资料')
        : content,
    ),
    [content, hasBrandResources],
  )

  return (
    <div className={`markdown-body streamdown-markdown ${className}`.trim()}>
      <Streamdown
        components={{ a: MarkdownResourceLink }}
        remarkPlugins={[RemarkBreaks]}
      >
        {processedContent}
      </Streamdown>
      {hasBrandResources && !hasProcurementContact && (
        <p className="mt-4 border-t border-divider-subtle pt-3 text-sm leading-6 text-text-secondary">
          需要具体型号的参数表、GB 证书复印件或正式报价？请联系
          {' '}
          <a
            href="mailto:procurement@elemax.com"
            className="font-medium text-text-accent no-underline hover:underline"
          >
            procurement@elemax.com
          </a>
          ，ELEMAX 采购顾问将协助您获取所需资料并对接报价。
        </p>
      )}
    </div>
  )
}

export default StreamdownMarkdown
