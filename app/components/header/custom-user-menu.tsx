'use client'

import type { FC } from 'react'
import React, { useState } from 'react'
import { useClerk, useUser } from '@clerk/nextjs'
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { PortalToFollowElem, PortalToFollowElemContent, PortalToFollowElemTrigger } from '@/app/components/base/portal-to-follow-elem'
import classNames from '@/utils/classnames'

import s from './custom-user-menu.module.css'

const getInitial = (value?: string | null) => {
  const trimmed = value?.trim()

  if (!trimmed) { return 'U' }

  return trimmed.charAt(0).toUpperCase()
}

const CustomUserMenu: FC = () => {
  const { t } = useTranslation()
  const { signOut } = useClerk()
  const { isLoaded, isSignedIn, user } = useUser()
  const [open, setOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  if (!isLoaded || !isSignedIn || !user) { return null }

  const email = user.primaryEmailAddress?.emailAddress || ''
  const displayName = user.fullName || user.username || email || 'Account'
  const secondaryText = user.fullName || user.username ? email : ''
  const avatarInitial = getInitial(user.fullName || user.username || email)
  const shouldUseImage = user.hasImage && user.imageUrl

  const handleSignOut = async () => {
    if (isSigningOut) { return }

    setIsSigningOut(true)
    await signOut({ redirectUrl: '/sign-in' })
  }

  return (
    <PortalToFollowElem
      open={open}
      onOpenChange={setOpen}
      placement='bottom-end'
      offset={8}
    >
      <PortalToFollowElemTrigger
        asChild
        onClick={() => setOpen(value => !value)}
      >
        <button
          type='button'
          className={s.avatarButton}
          aria-label={t('common.account.userMenu') as string}
          aria-haspopup='menu'
          aria-expanded={open}
        >
          {shouldUseImage
            ? (
              <img
                src={user.imageUrl}
                alt=''
                className={s.avatarImage}
              />
            )
            : (
              <span className={s.avatarFallback}>{avatarInitial}</span>
            )}
        </button>
      </PortalToFollowElemTrigger>
      <PortalToFollowElemContent className='z-[1000]'>
        <div
          className={s.menuPanel}
          role='menu'
          aria-label={t('common.account.userMenu') as string}
        >
          <div className={s.profileRow}>
            <div className={s.profileAvatar}>
              {shouldUseImage
                ? (
                  <img
                    src={user.imageUrl}
                    alt={displayName}
                    className={s.profileAvatarImage}
                  />
                )
                : (
                  <span className={s.profileAvatarFallback}>{avatarInitial}</span>
                )}
            </div>
            <div className={s.profileText}>
              <div className={s.profileName}>{displayName}</div>
              {secondaryText && <div className={s.profileEmail}>{secondaryText}</div>}
            </div>
          </div>

          <div className={s.menuDivider} />

          <button
            type='button'
            className={classNames(s.menuItem, s.menuItemDestructive)}
            onClick={handleSignOut}
            disabled={isSigningOut}
            role='menuitem'
          >
            <ArrowRightOnRectangleIcon className={s.menuItemIcon} aria-hidden='true' />
            <span>{isSigningOut ? t('common.account.signingOut') : t('common.account.signOut')}</span>
          </button>
        </div>
      </PortalToFollowElemContent>
    </PortalToFollowElem>
  )
}

export default React.memo(CustomUserMenu)
