'use client'
import type { FC } from 'react'
import React from 'react'
import type { ChatItem } from '@/types/app'
import StreamdownMarkdown from '@/app/components/base/streamdown-markdown'
import ImageGallery from '@/app/components/base/image-gallery'
import { getActiveQuestionVariant, getActiveQuestionVariantIndex, getQuestionVariantCount } from '@/utils/chat-variants'

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
  onVariantChange?: (question: ChatItem, index: number) => void
}

const Question: FC<IQuestionProps> = ({ item, userAvatarInitial = 'U', userAvatarUrl, imgSrcs, onVariantChange }) => {
  const activeItem = getActiveQuestionVariant(item) as ChatItem
  const { id, content } = activeItem
  const variantCount = getQuestionVariantCount(item)
  const activeVariantIndex = getActiveQuestionVariantIndex(item)

  const handlePreviousVariant = () => {
    onVariantChange?.(item, activeVariantIndex - 1)
  }

  const handleNextVariant = () => {
    onVariantChange?.(item, activeVariantIndex + 1)
  }

  return (
    <div className='mb-2 flex justify-end last:mb-0' key={id}>
      <div className="relative mr-4 flex max-w-full items-start">
        <div className="w-full rounded-2xl bg-background-gradient-bg-fill-chat-bubble-bg-3 px-4 py-3 text-sm text-text-primary">
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
