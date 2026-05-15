import type { FC } from 'react'
import React from 'react'
import { Show } from '@clerk/nextjs'
import {
  Bars3Icon,
  PencilSquareIcon,
} from '@heroicons/react/24/solid'
import CustomUserMenu from '@/app/components/header/custom-user-menu'
export interface IHeaderProps {
  title: string
  isMobile?: boolean
  onShowSideBar?: () => void
  onCreateNewChat?: () => void
}
const Header: FC<IHeaderProps> = ({
  title,
  isMobile,
  onShowSideBar,
  onCreateNewChat,
}) => {
  return (
    <div className="shrink-0 flex items-center justify-between h-12 px-3 bg-gray-100">
      <div className='flex min-w-0 items-center gap-3'>
        {isMobile && (
          <div
            className='flex items-center justify-center h-8 w-8 cursor-pointer'
            onClick={() => onShowSideBar?.()}
          >
            <Bars3Icon className="h-4 w-4 text-gray-500" />
          </div>
        )}
        <div className='flex min-w-0 items-center gap-2'>
          <img
            src="/elemax-logo-170x170px.png"
            alt={title}
            className="h-8 w-8 shrink-0 rounded-lg object-contain"
          />
          <div className="truncate text-sm text-gray-800 font-bold">{title}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isMobile && (
          <div className='flex items-center justify-center h-8 w-8 cursor-pointer' onClick={() => onCreateNewChat?.()} >
            <PencilSquareIcon className="h-4 w-4 text-gray-500" />
          </div>
        )}
        <Show when="signed-in">
          <CustomUserMenu />
        </Show>
      </div>
    </div>
  )
}

export default React.memo(Header)
