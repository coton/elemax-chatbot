import React from 'react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChatBubbleOvalLeftEllipsisIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { ChatBubbleOvalLeftEllipsisIcon as ChatBubbleOvalLeftEllipsisSolidIcon } from '@heroicons/react/24/solid'
import Button from '@/app/components/base/button'
// import Card from './card'
import type { ConversationItem } from '@/types/app'

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

const MAX_CONVERSATION_LENTH = 20
export type ThemePreference = 'system' | 'light' | 'dark'

const CollapseSidebarIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="remixicon h-[18px] w-[18px]">
    <path d="M21 3C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H21ZM20 5H4V19H20V5ZM8 7V17H6V7H8Z" />
  </svg>
)

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="remixicon h-[18px] w-[18px]">
    <path d="M5 7C5 6.17157 5.67157 5.5 6.5 5.5C7.32843 5.5 8 6.17157 8 7C8 7.82843 7.32843 8.5 6.5 8.5C5.67157 8.5 5 7.82843 5 7ZM6.5 3.5C4.567 3.5 3 5.067 3 7C3 8.933 4.567 10.5 6.5 10.5C8.433 10.5 10 8.933 10 7C10 5.067 8.433 3.5 6.5 3.5ZM12 8H20V6H12V8ZM16 17C16 16.1716 16.6716 15.5 17.5 15.5C18.3284 15.5 19 16.1716 19 17C19 17.8284 18.3284 18.5 17.5 18.5C16.6716 18.5 16 17.8284 16 17ZM17.5 13.5C15.567 13.5 14 15.067 14 17C14 18.933 15.567 20.5 17.5 20.5C19.433 20.5 21 18.933 21 17C21 15.067 19.433 13.5 17.5 13.5ZM4 16V18H12V16H4Z" />
  </svg>
)

const themeButtonClass = (active: boolean) => classNames(
  'rounded-lg px-2 py-1 hover:bg-state-base-hover hover:text-text-secondary',
  active
    ? 'bg-components-segmented-control-item-active-bg text-text-accent-light-mode-only shadow-sm hover:bg-components-segmented-control-item-active-bg hover:text-text-accent-light-mode-only'
    : 'text-text-tertiary',
)

const SettingsMenu = ({
  themePreference,
  onThemeChange,
}: {
  themePreference: ThemePreference
  onThemeChange: (theme: ThemePreference) => void
}) => (
  <div className="w-[224px] rounded-xl border-[0.5px] border-components-panel-border bg-components-panel-bg-blur shadow-lg backdrop-blur-sm">
    <div className="p-1">
      <div className="system-md-regular flex cursor-pointer items-center rounded-lg py-1.5 pl-3 pr-2 text-text-secondary">
        <div className="grow">Theme</div>
        <div className="flex items-center rounded-[10px] bg-components-segmented-control-bg-normal p-0.5">
          <button
            type="button"
            className={themeButtonClass(themePreference === 'system')}
            aria-label="System theme"
            onClick={() => onThemeChange('system')}
          >
            <div className="p-0.5">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="remixicon h-4 w-4"><path d="M4 16H20V5H4V16ZM13 18V20H17V22H7V20H11V18H2.9918C2.44405 18 2 17.5511 2 16.9925V4.00748C2 3.45107 2.45531 3 2.9918 3H21.0082C21.556 3 22 3.44892 22 4.00748V16.9925C22 17.5489 21.5447 18 21.0082 18H13Z" /></svg>
            </div>
          </button>
          <div className="h-[14px] w-px bg-transparent" />
          <button
            type="button"
            className={themeButtonClass(themePreference === 'light')}
            aria-label="Light theme"
            onClick={() => onThemeChange('light')}
          >
            <div className="p-0.5">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="remixicon h-4 w-4"><path d="M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM16.9497 18.364L18.364 16.9497L20.4853 19.0711L19.0711 20.4853L16.9497 18.364ZM19.0711 3.51472L20.4853 4.92893L18.364 7.05025L16.9497 5.63604L19.0711 3.51472ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497ZM23 11V13H20V11H23ZM4 11V13H1V11H4Z" /></svg>
            </div>
          </button>
          <div className="h-[14px] w-px bg-transparent" />
          <button
            type="button"
            className={themeButtonClass(themePreference === 'dark')}
            aria-label="Dark theme"
            onClick={() => onThemeChange('dark')}
          >
            <div className="p-0.5">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="remixicon h-4 w-4"><path d="M10 7C10 10.866 13.134 14 17 14C18.9584 14 20.729 13.1957 21.9995 11.8995C22 11.933 22 11.9665 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C12.0335 2 12.067 2 12.1005 2.00049C10.8043 3.27098 10 5.04157 10 7ZM4 12C4 16.4183 7.58172 20 12 20C15.0583 20 17.7158 18.2839 19.062 15.7621C18.3945 15.9187 17.7035 16 17 16C12.0294 16 8 11.9706 8 7C8 6.29648 8.08133 5.60547 8.2379 4.938C5.71611 6.28423 4 8.9417 4 12Z" /></svg>
            </div>
          </button>
        </div>
      </div>
    </div>
    <div className="w-full h-[0.5px] bg-divider-regular shrink-0 my-0" />
    <div className="p-1">
      <div className="system-md-regular cursor-pointer rounded-lg px-3 py-1.5 text-text-secondary hover:bg-state-base-hover">About</div>
    </div>
  </div>
)

export interface ISidebarProps {
  currentId: string
  title: string
  onCurrentIdChange: (id: string) => void
  onDeleteConversation: (id: string) => void
  onToggleCollapse?: () => void
  onOpenSettings?: () => void
  themePreference: ThemePreference
  onThemeChange: (theme: ThemePreference) => void
  list: ConversationItem[]
}

const Sidebar: FC<ISidebarProps> = ({
  currentId,
  title,
  onCurrentIdChange,
  onDeleteConversation,
  onToggleCollapse,
  onOpenSettings,
  themePreference,
  onThemeChange,
  list,
}) => {
  const { t } = useTranslation()
  const settingsLabel = t('tools.setting')
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  return (
    <div
      className="app-sidebar flex w-full grow flex-col rounded-none border-0 shadow-none pc:w-[236px] tablet:w-[216px] mobile:w-[calc(100vw_-_40px)]"
    >
      <div className="flex shrink-0 items-center gap-3 p-3 pr-2">
        <img
          src="/elemax-logo-170x170px.png"
          alt=""
          className="h-8 w-8 shrink-0 rounded-lg object-contain"
        />
        <div className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-700">{title}</div>
        {onToggleCollapse && (
          <button
            type="button"
            className="action-btn action-btn-l shrink-0"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            onClick={onToggleCollapse}
          >
            <CollapseSidebarIcon />
          </button>
        )}
      </div>
      {list.length < MAX_CONVERSATION_LENTH && (
        <div className="shrink-0 px-3 py-4">
          <Button
            onClick={() => { onCurrentIdChange('-1') }}
            className="group block w-full flex-shrink-0 !justify-center !h-9 !rounded-lg !border-[#d6e4ff] !bg-[#eff6ff] text-primary-600 items-center !text-sm !font-medium hover:!bg-[#dbeafe]"
          >
            <PencilSquareIcon className="mr-2 h-4 w-4" /> {t('app.chat.newChat')}
          </Button>
        </div>
      )}

      <nav className="h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pt-4">
        {list.map((item) => {
          const isCurrent = item.id === currentId
          const ItemIcon
            = isCurrent ? ChatBubbleOvalLeftEllipsisSolidIcon : ChatBubbleOvalLeftEllipsisIcon
          return (
            <div
              onClick={() => onCurrentIdChange(item.id)}
              key={item.id}
              className={classNames(
                isCurrent
                  ? 'bg-[#eaf2ff] text-primary-600 hover:bg-[#eaf2ff]'
                  : 'text-gray-700 hover:bg-[#eef0f3] hover:text-gray-800',
                'group flex items-center rounded-lg p-1 pl-3 text-sm font-medium cursor-pointer',
              )}
            >
              <div className="flex min-w-0 flex-1 items-center">
                <ItemIcon
                  className={classNames(
                    isCurrent
                      ? 'text-primary-600'
                      : 'text-gray-400 group-hover:text-gray-500',
                    'mr-2 h-4 w-4 flex-shrink-0',
                  )}
                  aria-hidden="true"
                />
                <span className="truncate py-1">{item.name}</span>
              </div>
              <button
                type="button"
                className="ml-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 opacity-0 pointer-events-none hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 group-hover:pointer-events-auto focus:opacity-100 focus:pointer-events-auto"
                aria-label={t('app.chat.deleteConversation')}
                title={t('app.chat.deleteConversation')}
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteConversation(item.id)
                }}
              >
                <TrashIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </nav>
      <div className="relative flex flex-shrink-0 items-center justify-between gap-3 p-3">
        {settingsOpen && (
          <div className="absolute bottom-12 left-3 z-30">
            <SettingsMenu
              themePreference={themePreference}
              onThemeChange={onThemeChange}
            />
          </div>
        )}
        <button
          type="button"
          className="action-btn action-btn-l"
          aria-label={settingsLabel === 'tools.setting' ? 'Settings' : settingsLabel}
          title={settingsLabel === 'tools.setting' ? 'Settings' : settingsLabel}
          onClick={() => {
            setSettingsOpen(open => !open)
            onOpenSettings?.()
          }}
        >
          <SettingsIcon />
        </button>
        <div className="flex items-center gap-2 text-xs font-normal text-gray-400">
          <span>POWERED BY</span>
          <img src="/logo-32x32.png" alt="Powered by logo" className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

export default React.memo(Sidebar)
