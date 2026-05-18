'use client'
import type { FC } from 'react'
import React from 'react'
import type { IChatItem } from '../type'
import s from '../style.module.css'

import StreamdownMarkdown from '@/app/components/base/streamdown-markdown'
import ImageGallery from '@/app/components/base/image-gallery'

type IQuestionProps = Pick<IChatItem, 'id' | 'content' | 'useCurrentUserAvatar'> & {
  imgSrcs?: string[]
  userAvatarInitial?: string
  userAvatarUrl?: string
}

const Question: FC<IQuestionProps> = ({ id, content, userAvatarInitial = 'U', userAvatarUrl, imgSrcs }) => {
  return (
    <div className='mb-2 flex justify-end last:mb-0' key={id}>
      <div className='group relative mr-4 flex max-w-full items-start overflow-x-hidden pl-14'>
        <div className={`${s.question} relative text-sm text-gray-900`}>
          <div
            className='rounded-2xl bg-[#e1effe] px-4 py-3 text-gray-900'
          >
            {imgSrcs && imgSrcs.length > 0 && (
              <ImageGallery srcs={imgSrcs} />
            )}
            <StreamdownMarkdown content={content} />
          </div>
        </div>
      </div>
      <div className='h-10 w-10 shrink-0 overflow-hidden rounded-full border border-black/5 bg-[#f2f4f7] text-center text-sm font-semibold leading-10 text-gray-600'>
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
