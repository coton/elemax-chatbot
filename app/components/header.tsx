import type { FC } from 'react'
import React from 'react'
import { Show } from '@clerk/nextjs'
import { Bars3BottomLeftIcon } from '@heroicons/react/24/outline'
import {
  Bars3Icon,
  PencilSquareIcon,
} from '@heroicons/react/24/solid'
import CustomUserMenu from '@/app/components/header/custom-user-menu'
export interface IHeaderProps {
  title: string
  isMobile?: boolean
  isSidebarCollapsed?: boolean
  onShowSideBar?: () => void
  onToggleSidebar?: () => void
  onCreateNewChat?: () => void
}
const Header: FC<IHeaderProps> = ({
  title,
  isMobile,
  isSidebarCollapsed,
  onShowSideBar,
  onToggleSidebar,
  onCreateNewChat,
}) => {
  return (
    <div className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between bg-[var(--app-panel-bg)] p-3">
      <div className='flex min-w-0 items-center gap-3'>
        {isMobile && (
          <button
            type="button"
            className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 hover:bg-[#eef0f3] hover:text-gray-800'
            onClick={() => onShowSideBar?.()}
          >
            <Bars3Icon className="h-4 w-4" />
          </button>
        )}
        {!isMobile && isSidebarCollapsed && (
          <button
            type="button"
            className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 hover:bg-[#eef0f3] hover:text-gray-800'
            aria-label="Expand sidebar"
            title="Expand sidebar"
            onClick={() => onToggleSidebar?.()}
          >
            <Bars3BottomLeftIcon className="h-4 w-4" />
          </button>
        )}
        <div className={`flex min-w-0 items-center gap-2 ${!isMobile && !isSidebarCollapsed ? 'opacity-0 pointer-events-none' : ''}`}>
          <img
            src="/elemax-logo-170x170px.png"
            alt={title}
            className="h-8 w-8 shrink-0 rounded-lg object-contain"
          />
          <div className="truncate text-sm text-gray-700 font-semibold">{title}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isMobile && (
          <button
            type="button"
            className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 hover:bg-[#eef0f3] hover:text-gray-800'
            onClick={() => onCreateNewChat?.()}
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>
        )}
        <Show when="signed-in">
          <CustomUserMenu />
        </Show>
      </div>
    </div>
  )
}

export default React.memo(Header)
