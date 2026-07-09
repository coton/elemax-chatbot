import type { FC } from 'react'
import React from 'react'
import { Show } from '@clerk/nextjs'
import BrandImage from '@/app/components/brand/brand-image'
import CustomUserMenu from '@/app/components/header/custom-user-menu'

const ExpandSidebarIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="remixicon h-[18px] w-[18px]">
    <path d="M21 3C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H21ZM20 5H4V19H20V5ZM18 7V17H16V7H18Z" />
  </svg>
)

const NewConversationIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="remixicon h-[18px] w-[18px]">
    <path d="M16.7574 2.99678L14.7574 4.99678H5V18.9968H19V9.23943L21 7.23943V19.9968C21 20.5491 20.5523 20.9968 20 20.9968H4C3.44772 20.9968 3 20.5491 3 19.9968V3.99678C3 3.4445 3.44772 2.99678 4 2.99678H16.7574ZM20.4853 2.09729L21.8995 3.5115L12.7071 12.7039L11.2954 12.7064L11.2929 11.2897L20.4853 2.09729Z" />
  </svg>
)

const ConversationTrail: FC<{
  title: string
  showNewConversation?: boolean
  onCreateNewChat?: () => void
}> = ({
  title,
  showNewConversation,
  onCreateNewChat,
}) => (
  <div className="flex min-w-0 items-center gap-0.5 transition-all duration-200 ease-in-out">
    <div className="shrink-0">
      <span className="relative flex h-8 w-8 grow-0 shrink-0 items-center justify-center overflow-hidden rounded-lg text-[20px]">
        <BrandImage type="avatar" alt="MaxAI" className="h-full w-full object-contain" />
      </span>
    </div>
    <div className="shrink-0 px-1 text-divider-deep">/</div>
    <div className="inline-block min-w-0">
      <div className="flex min-w-0 cursor-pointer items-center rounded-lg px-1.5 py-1 text-text-secondary hover:bg-state-base-hover">
        <div className="system-md-semibold truncate">{title}</div>
      </div>
    </div>
    {showNewConversation && (
      <>
        <div className="flex shrink-0 items-center px-1">
          <div className="h-[14px] w-px bg-divider-regular" />
        </div>
        <button
          type="button"
          className="action-btn action-btn-l shrink-0"
          aria-label="New conversation"
          title="New conversation"
          onClick={() => onCreateNewChat?.()}
        >
          <NewConversationIcon />
        </button>
      </>
    )}
  </div>
)

export interface IHeaderProps {
  title: string
  conversationName?: string
  isMobile?: boolean
  isSidebarCollapsed?: boolean
  onShowSideBar?: () => void
  onToggleSidebar?: () => void
  onCreateNewChat?: () => void
}
const Header: FC<IHeaderProps> = ({
  title,
  conversationName,
  isMobile,
  isSidebarCollapsed,
  onShowSideBar,
  onToggleSidebar,
  onCreateNewChat,
}) => {
  const currentConversationTitle = conversationName || title

  return (
    <div className="app-header sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between bg-[var(--app-panel-bg)] px-3 py-2">
      <div className='flex min-w-0 items-center gap-3'>
        {isMobile && (
          <button
            type="button"
            className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 hover:bg-[#eef0f3] hover:text-gray-800'
            onClick={() => onShowSideBar?.()}
          >
            <ExpandSidebarIcon />
          </button>
        )}
        {!isMobile && isSidebarCollapsed && (
          <div className="flex min-w-0 items-center gap-0.5 transition-all duration-200 ease-in-out">
            <button
              type="button"
              className="action-btn action-btn-l shrink-0"
              aria-label="Expand sidebar"
              title="Expand sidebar"
              onClick={() => onToggleSidebar?.()}
            >
              <ExpandSidebarIcon />
            </button>
            <ConversationTrail
              title={currentConversationTitle}
              showNewConversation
              onCreateNewChat={onCreateNewChat}
            />
          </div>
        )}
        {isMobile && (
          <ConversationTrail title={currentConversationTitle} />
        )}
      </div>
      <div className="flex items-center gap-2">
        {isMobile && (
          <button
            type="button"
            className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 hover:bg-[#eef0f3] hover:text-gray-800'
            onClick={() => onCreateNewChat?.()}
          >
            <NewConversationIcon />
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
