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
    <div className='flex items-start justify-end' key={id}>
      <div>
        <div className={`${s.question} relative text-sm text-gray-900`}>
          <div
            className={'mr-2 py-3 px-4 bg-[#262c4a] text-gray-100 rounded-tl-2xl rounded-b-2xl'}
          >
            {imgSrcs && imgSrcs.length > 0 && (
              <ImageGallery srcs={imgSrcs} />
            )}
            <StreamdownMarkdown content={content} />
          </div>
        </div>
      </div>
      <div className='w-10 h-10 shrink-0 mr-2 overflow-hidden rounded-full bg-[#262c4a] text-center leading-10 text-sm font-semibold text-white'>
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
