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

const escapeReplacement = (value: string) =>
  value.replace(/\$/g, dollarPlaceholder)

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
