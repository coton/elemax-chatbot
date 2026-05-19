'use client'
import type { FC } from 'react'
import React from 'react'
import copy from 'copy-to-clipboard'
import type { ChatItem } from '@/types/app'
import StreamdownMarkdown from '@/app/components/base/streamdown-markdown'
import ImageGallery from '@/app/components/base/image-gallery'
import Toast from '@/app/components/base/toast'
import { getActiveQuestionVariant, getActiveQuestionVariantIndex, getQuestionVariantCount } from '@/utils/chat-variants'

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="remixicon h-4 w-4">
    <path d="M7 4V2H17V4H20.0066C20.5552 4 21 4.44495 21 4.9934V21.0066C21 21.5552 20.5551 22 20.0066 22H3.9934C3.44476 22 3 21.5551 3 21.0066V4.9934C3 4.44476 3.44495 4 3.9934 4H7ZM7 6H5V20H19V6H17V8H7V6ZM9 4V6H15V4H9Z" />
  </svg>
)

const RetryQuestionIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="remixicon h-4 w-4">
    <path d="M6.41421 15.89L16.5563 5.74785L15.1421 4.33363L5 14.4758V15.89H6.41421ZM7.24264 17.89H3V13.6473L14.435 2.21231C14.8256 1.82179 15.4587 1.82179 15.8492 2.21231L18.6777 5.04074C19.0682 5.43126 19.0682 6.06443 18.6777 6.45495L7.24264 17.89ZM3 19.89H21V21.89H3V19.89Z" />
  </svg>
)

const ChevronRightIcon = ({ className = '' }: { className?: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} data-icon="ChevronRight" aria-hidden="true">
    <g id="chevron-right">
      <path id="Icon" d="M5.25 10.5L8.75 7L5.25 3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
)

interface IQuestionProps {
  item: ChatItem
  useCurrentUserAvatar?: boolean
  imgSrcs?: string[]
  userAvatarInitial?: string
  userAvatarUrl?: string
  isSendLocked?: boolean
  onRetry?: (question: ChatItem, content: string) => void
  onVariantChange?: (question: ChatItem, index: number) => void
}

const Question: FC<IQuestionProps> = ({ item, userAvatarInitial = 'U', userAvatarUrl, imgSrcs, isSendLocked, onRetry, onVariantChange }) => {
  const activeItem = getActiveQuestionVariant(item) as ChatItem
  const { id, content } = activeItem
  const [isEditing, setIsEditing] = React.useState(false)
  const [draftContent, setDraftContent] = React.useState(content)
  const bubbleRef = React.useRef<HTMLDivElement>(null)
  const [toolRightOffset, setToolRightOffset] = React.useState(198)
  const variantCount = getQuestionVariantCount(item)
  const activeVariantIndex = getActiveQuestionVariantIndex(item)

  React.useEffect(() => {
    if (!isEditing) { setDraftContent(content) }
  }, [content, isEditing])

  React.useEffect(() => {
    const updateToolOffset = () => {
      const width = bubbleRef.current?.offsetWidth
      if (width) { setToolRightOffset(width + 8) }
    }

    updateToolOffset()

    const resizeObserver = bubbleRef.current && typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateToolOffset)
      : null
    if (bubbleRef.current) { resizeObserver?.observe(bubbleRef.current) }

    return () => {
      resizeObserver?.disconnect()
    }
  }, [content, draftContent, isEditing])

  const handleCopy = () => {
    if (copy(content || '')) { Toast.notify({ type: 'success', message: 'Copied successfully' }) }
  }

  const handleStartEdit = () => {
    setDraftContent(content)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setDraftContent(content)
    setIsEditing(false)
  }

  const handleResend = () => {
    const nextContent = draftContent.trim()
    if (!nextContent) { return }

    setIsEditing(false)
    onRetry?.(item, nextContent)
  }

  const handlePreviousVariant = () => {
    onVariantChange?.(item, activeVariantIndex - 1)
  }

  const handleNextVariant = () => {
    onVariantChange?.(item, activeVariantIndex + 1)
  }

  return (
    <div className='mb-2 flex justify-end last:mb-0' key={id}>
      <div className='group relative mr-4 flex max-w-full items-start overflow-x-hidden pl-14'>
        <div className="mr-2 gap-1 flex">
          <div
            className="absolute z-20 hidden gap-0.5 rounded-[10px] border-[0.5px] border-components-actionbar-border bg-components-actionbar-bg p-0.5 shadow-md backdrop-blur-sm group-hover:flex"
            style={{ right: toolRightOffset }}
          >
            <button type="button" className="action-btn action-btn-m" aria-label="Copy message" onClick={handleCopy}>
              <CopyIcon />
            </button>
            <button type="button" className="action-btn action-btn-m" aria-label="Edit and resend message" disabled={isSendLocked} onClick={handleStartEdit}>
              <RetryQuestionIcon />
            </button>
          </div>
        </div>
        <div ref={bubbleRef} className="w-full rounded-2xl bg-background-gradient-bg-fill-chat-bubble-bg-3 px-4 py-3 text-sm text-text-primary">
          {isEditing
            ? (
              <div className="flex flex-col gap-2 rounded-xl border border-components-chat-input-border bg-components-panel-bg-blur p-[9px] shadow-md">
                <div className="max-h-[158px] overflow-y-auto overflow-x-hidden">
                  <textarea
                    className="body-lg-regular w-full p-1 leading-6 text-text-tertiary outline-none"
                    style={{ height: '28px' }}
                    value={draftContent}
                    onChange={e => setDraftContent(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" className="btn disabled:btn-disabled btn-ghost btn-medium" onClick={handleCancelEdit}>Cancel</button>
                  <button type="button" className="btn disabled:btn-disabled btn-primary btn-medium" disabled={!draftContent.trim() || isSendLocked} onClick={handleResend}>Resend</button>
                </div>
              </div>
            )
            : (
              <>
                {imgSrcs && imgSrcs.length > 0 && (
                  <ImageGallery srcs={imgSrcs} />
                )}
                <StreamdownMarkdown content={content} className="!text-text-primary" />
                {variantCount > 1 && (
                  <div className="flex items-center justify-center pt-3.5 text-sm">
                    <button
                      type="button"
                      className={activeVariantIndex > 0 ? 'opacity-100' : 'opacity-30'}
                      disabled={activeVariantIndex <= 0}
                      aria-label="Previous question"
                      onClick={handlePreviousVariant}
                    >
                      <ChevronRightIcon className="h-[14px] w-[14px] rotate-180 text-text-primary" />
                    </button>
                    <span className="px-2 text-xs text-text-primary">{activeVariantIndex + 1} /{variantCount}</span>
                    <button
                      type="button"
                      className={activeVariantIndex < variantCount - 1 ? 'opacity-100' : 'opacity-30'}
                      disabled={activeVariantIndex >= variantCount - 1}
                      aria-label="Next question"
                      onClick={handleNextVariant}
                    >
                      <ChevronRightIcon className="h-[14px] w-[14px] text-text-primary" />
                    </button>
                  </div>
                )}
              </>
            )}
        </div>
        <div className="mt-1 h-[18px]" />
      </div>
      <div className='h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#f2f4f7] text-center text-sm font-semibold leading-10 text-gray-600'>
        {userAvatarUrl
          ? (
            <img
              src={userAvatarUrl}
              alt=''
              className='h-full w-full object-cover'
            />
          )
          : userAvatarInitial}
      </div>
    </div>
  )
}

export default React.memo(Question)
