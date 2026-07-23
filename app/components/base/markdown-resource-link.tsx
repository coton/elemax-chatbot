'use client'

import type { AnchorHTMLAttributes } from 'react'
import { RiExternalLinkLine, RiFilePdf2Fill } from '@remixicon/react'
import cn from '@/utils/classnames'

const PDF_RESOURCE_HOST = 'cdn.elemaxai.com'
const PDF_RESOURCE_PATH_PREFIX = '/manufacturer-product-pdfs/'

export const isTrustedPdfResource = (href?: string) => {
  if (!href) {
    return false
  }

  try {
    const url = new URL(href)
    return url.protocol === 'https:'
      && url.hostname === PDF_RESOURCE_HOST
      && url.port === ''
      && url.username === ''
      && url.password === ''
      && url.pathname.startsWith(PDF_RESOURCE_PATH_PREFIX)
      && url.pathname.toLowerCase().endsWith('.pdf')
  }
  catch {
    return false
  }
}

type MarkdownResourceLinkProps = Pick<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href' | 'children' | 'className' | 'title'
>

const MarkdownResourceLink = ({ href, children, className, title }: MarkdownResourceLinkProps) => {
  if (!isTrustedPdfResource(href)) {
    return (
      <a
        href={href}
        className={className}
        title={title}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    )
  }

  return (
    <a
      href={href}
      className={cn(
        'my-1 inline-flex max-w-full items-center gap-2 rounded-md border-[0.5px] border-components-panel-border bg-components-panel-on-panel-item-bg px-3 py-2 text-left no-underline shadow-xs transition-colors hover:bg-state-base-hover',
        className,
      )}
      title={title}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open PDF: ${typeof children === 'string' ? children : 'document'}`}
    >
      <RiFilePdf2Fill className="h-5 w-5 shrink-0 text-[#EA3434]" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block break-words text-sm font-medium leading-5 text-text-primary">
          {children}
        </span>
        <span className="block text-xs leading-4 text-text-tertiary">PDF document</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-text-secondary">
        Open
        <RiExternalLinkLine className="h-4 w-4" aria-hidden="true" />
      </span>
    </a>
  )
}

export default MarkdownResourceLink
