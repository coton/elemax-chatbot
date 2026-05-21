'use client'
import { useMemo } from 'react'
import RemarkBreaks from 'remark-breaks'
import { Streamdown } from 'streamdown'
import 'katex/dist/katex.min.css'

interface StreamdownMarkdownProps {
  content: string
  className?: string
}

const codeBlockRegex = /```[\s\S]*?```/g
const dollarPlaceholder = '_STREAMDOWN_MARKDOWN_DOLLAR_'
const tableDelimiterCellRegex = /^:?-{3,}:?$/

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
  const processedContent = useMemo(() => preprocessLaTeX(content), [content])

  return (
    <div className={`markdown-body streamdown-markdown ${className}`.trim()}>
      <Streamdown remarkPlugins={[RemarkBreaks]}>{processedContent}</Streamdown>
    </div>
  )
}

export default StreamdownMarkdown
