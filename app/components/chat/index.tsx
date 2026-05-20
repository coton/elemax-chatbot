'use client'
import type { FC } from 'react'
import React, { useEffect, useRef } from 'react'
import cn from 'classnames'
import { useTranslation } from 'react-i18next'
import Textarea from 'rc-textarea'
import { useUser } from '@clerk/nextjs'
import Answer from './answer'
import Question from './question'
import type { FeedbackFunc } from './type'
import type { ChatItem, VisionFile, VisionSettings } from '@/types/app'
import { TransferMethod } from '@/types/app'
import Tooltip from '@/app/components/base/tooltip'
import Toast from '@/app/components/base/toast'
import ChatImageUploader from '@/app/components/base/image-uploader/chat-image-uploader'
import ImageList from '@/app/components/base/image-uploader/image-list'
import { useImageFiles } from '@/app/components/base/image-uploader/hooks'
import FileUploaderInAttachmentWrapper from '@/app/components/base/file-uploader-in-attachment'
import type {
  FileEntity,
  FileUpload,
} from '@/app/components/base/file-uploader-in-attachment/types'
import { getProcessedFiles } from '@/app/components/base/file-uploader-in-attachment/utils'

const SendIcon = () => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    className="remixicon h-4 w-4"
  >
    <path d="M3 12.9999H9V10.9999H3V1.84558C3 1.56944 3.22386 1.34558 3.5 1.34558C3.58425 1.34558 3.66714 1.36687 3.74096 1.40747L22.2034 11.5618C22.4454 11.6949 22.5337 11.9989 22.4006 12.2409C22.3549 12.324 22.2865 12.3924 22.2034 12.4381L3.74096 22.5924C3.499 22.7255 3.19497 22.6372 3.06189 22.3953C3.02129 22.3214 3 22.2386 3 22.1543V12.9999Z" />
  </svg>
)

export interface IChatProps {
  chatList: ChatItem[]
  /**
   * Whether to display the editing area and rating status
   */
  feedbackDisabled?: boolean
  /**
   * Whether to display the input area
   */
  isHideSendInput?: boolean
  onFeedback?: FeedbackFunc
  onRetry?: (answer: ChatItem) => void
  onQuestionVariantChange?: (question: ChatItem, index: number) => void
  onVariantChange?: (answer: ChatItem, index: number) => void
  checkCanSend?: () => boolean
  onSend?: (message: string, files: VisionFile[]) => boolean | void
  useCurrentUserAvatar?: boolean
  isResponding?: boolean
  controlClearQuery?: number
  visionConfig?: VisionSettings
  fileConfig?: FileUpload
  isSidebarCollapsed?: boolean
  isSendLocked?: boolean
}

const Chat: FC<IChatProps> = ({
  chatList,
  feedbackDisabled = false,
  isHideSendInput = false,
  onFeedback,
  onRetry,
  onQuestionVariantChange,
  onVariantChange,
  checkCanSend,
  onSend = () => {},
  useCurrentUserAvatar,
  isResponding,
  controlClearQuery,
  visionConfig,
  fileConfig,
  isSidebarCollapsed = false,
  isSendLocked = false,
}) => {
  const { t } = useTranslation()
  const { user } = useUser()
  const { notify } = Toast
  const isUseInputMethod = useRef(false)
  const userEmail = user?.primaryEmailAddress?.emailAddress || ''
  const userDisplayName = user?.fullName || user?.username || userEmail
  const userAvatarInitial = (userDisplayName || 'U')
    .trim()
    .charAt(0)
    .toUpperCase()
  const userAvatarUrl = user?.hasImage ? user.imageUrl : ''

  const [query, setQuery] = React.useState('')
  const queryRef = useRef('')

  const handleContentChange = (e: any) => {
    const value = e.target.value
    setQuery(value)
    queryRef.current = value
  }

  const logError = (message: string) => {
    notify({ type: 'error', message, duration: 3000 })
  }

  const valid = () => {
    const query = queryRef.current
    if (!query || query.trim() === '') {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return true
  }

  useEffect(() => {
    if (controlClearQuery) {
      setQuery('')
      queryRef.current = ''
    }
  }, [controlClearQuery])
  const {
    files,
    onUpload,
    onRemove,
    onReUpload,
    onImageLinkLoadError,
    onImageLinkLoadSuccess,
    onClear,
  } = useImageFiles()

  const [attachmentFiles, setAttachmentFiles] = React.useState<FileEntity[]>(
    [],
  )
  const attachmentFileConfig = React.useMemo(() => {
    if (!fileConfig?.enabled) {
      return undefined
    }

    const allowedFileUploadMethods
      = fileConfig.allowed_file_upload_methods?.filter(
        method => method !== TransferMethod.local_file,
      ) ?? []
    if (!allowedFileUploadMethods.length) {
      return undefined
    }

    return {
      ...fileConfig,
      allowed_file_upload_methods: allowedFileUploadMethods,
    }
  }, [fileConfig])

  const handleSend = () => {
    if (!valid() || (checkCanSend && !checkCanSend())) {
      return
    }
    const hasPendingImageUploads = files.some(
      file => file.progress !== -1 && file.progress < 100,
    )
    const hasPendingAttachmentUploads = attachmentFiles.some(
      file => file.progress !== -1 && file.progress < 100,
    )
    if (hasPendingImageUploads || hasPendingAttachmentUploads) {
      logError(t('app.errorMessage.waitForFileUpload'))
      return
    }
    const imageFiles: VisionFile[] = files
      .filter(file => file.progress !== -1)
      .map(fileItem => ({
        type: 'image',
        transfer_method: fileItem.type,
        url: fileItem.url,
        upload_file_id: fileItem.fileId,
      }))
    const docAndOtherFiles: VisionFile[] = getProcessedFiles(attachmentFiles)
    const combinedFiles: VisionFile[] = [...imageFiles, ...docAndOtherFiles]
    const isSendAccepted = onSend(queryRef.current, combinedFiles) !== false
    if (!isSendAccepted) {
      return
    }
    if (
      !files.find(
        item => item.type === TransferMethod.local_file && !item.fileId,
      )
    ) {
      if (files.length) {
        onClear()
      }
      if (!isResponding) {
        setQuery('')
        queryRef.current = ''
      }
    }
    if (
      !attachmentFiles.find(
        item =>
          item.transferMethod === TransferMethod.local_file && !item.uploadedId,
      )
    ) {
      setAttachmentFiles([])
    }
  }

  const handleKeyUp = (e: any) => {
    if (e.code === 'Enter') {
      e.preventDefault()
      // prevent send message when using input method enter
      if (!e.shiftKey && !isUseInputMethod.current) {
        handleSend()
      }
    }
  }

  const handleKeyDown = (e: any) => {
    isUseInputMethod.current = e.nativeEvent.isComposing
    if (e.code === 'Enter' && !e.shiftKey) {
      const result = query.replace(/\n$/, '')
      setQuery(result)
      queryRef.current = result
      e.preventDefault()
    }
  }

  const suggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    queryRef.current = suggestion
    handleSend()
  }

  const suggestedQuestionSource = [...chatList]
    .reverse()
    .find(
      item =>
        item.isAnswer
        && (item.suggestedQuestionsLoading
          || (item.suggestedQuestions?.length ?? 0) > 0),
    )

  const renderSuggestedQuestions = () => {
    if (!suggestedQuestionSource) {
      return null
    }

    const { suggestedQuestions = [], suggestedQuestionsLoading = false }
      = suggestedQuestionSource

    return (
      <div className="mb-3">
        <div className="flex items-center gap-6">
          <div className="suggested-question-divider h-px flex-1 bg-[#e5e7eb]" />
          <div className="shrink-0 text-xs font-semibold text-gray-400">
            TRY TO ASK
          </div>
          <div className="suggested-question-divider h-px flex-1 bg-[#e5e7eb]" />
        </div>
        <div className="mt-[10px] flex flex-wrap items-center justify-center gap-3">
          {suggestedQuestionsLoading
            ? [0, 1, 2].map(index => (
              <div
                key={index}
                className="h-9 animate-pulse rounded-lg border border-[#e5e7eb] bg-[#f3f4f6]"
                style={{ width: [120, 142, 112][index] }}
              />
            ))
            : suggestedQuestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="flex h-9 max-w-full items-center justify-center rounded-lg border border-components-panel-border bg-components-panel-on-panel-item-bg px-4 py-2 text-xs font-semibold leading-5 text-text-secondary shadow-sm transition-colors hover:bg-[#eef0f3] active:bg-state-base-hover"
                onClick={() => suggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(!feedbackDisabled && 'px-3.5', 'h-full')}>
      {/* Chat List */}
      <div className="h-full space-y-2 pt-6">
        {chatList.map((item) => {
          if (item.isAnswer) {
            const isLast = item.id === chatList[chatList.length - 1].id
            return (
              <Answer
                key={item.id}
                item={item}
                feedbackDisabled={feedbackDisabled}
                onFeedback={onFeedback}
                onRetry={onRetry}
                onVariantChange={onVariantChange}
                isResponding={isResponding && isLast}
                isSendLocked={isSendLocked}
                suggestionClick={suggestionClick}
              />
            )
          }
          return (
            <Question
              key={item.id}
              item={item}
              useCurrentUserAvatar={useCurrentUserAvatar}
              userAvatarInitial={userAvatarInitial}
              userAvatarUrl={userAvatarUrl}
              imgSrcs={
                item.message_files && item.message_files?.length > 0
                  ? item.message_files.map(item => item.url)
                  : []
              }
              onVariantChange={onQuestionVariantChange}
            />
          )
        })}
      </div>
      {!isHideSendInput && (
        <div
          className={cn(
            'chat-input-section fixed z-10 bottom-4 left-1/2 max-w-full -translate-x-1/2 transform px-4 mobile:w-full tablet:w-[768px] pc:w-[768px]',
            !isSidebarCollapsed && 'chat-input-section-sidebar',
            isSidebarCollapsed && 'chat-input-section-collapsed',
          )}
        >
          {renderSuggestedQuestions()}
          <div className="chat-input-panel relative z-10 overflow-hidden rounded-xl border border-[#d0d5dd] bg-white/95 shadow-md backdrop-blur-sm">
            <div className="chat-input-scroll relative max-h-[158px] overflow-x-hidden overflow-y-auto p-[9px]">
              {visionConfig?.enabled && files.length > 0 && (
                <div className="mb-1">
                  <ImageList
                    list={files}
                    onRemove={onRemove}
                    onReUpload={onReUpload}
                    onImageLinkLoadSuccess={onImageLinkLoadSuccess}
                    onImageLinkLoadError={onImageLinkLoadError}
                  />
                </div>
              )}
              {attachmentFileConfig?.enabled && (
                <div className="mb-1">
                  <FileUploaderInAttachmentWrapper
                    fileConfig={attachmentFileConfig}
                    value={attachmentFiles}
                    onChange={setAttachmentFiles}
                  />
                </div>
              )}
              <Textarea
                className="chat-input-textarea block w-full max-h-none min-h-8 resize-none appearance-none bg-transparent px-1 py-0 pr-[112px] text-base leading-8 text-gray-900 outline-none placeholder:text-gray-400"
                placeholder={t('app.chat.inputPlaceholder')}
                value={query}
                onChange={handleContentChange}
                onKeyUp={handleKeyUp}
                onKeyDown={handleKeyDown}
                autoSize
              />
            </div>
            <div className="chat-input-actions absolute right-[9px] top-1/2 flex h-8 -translate-y-1/2 items-center gap-1.5">
              {visionConfig?.enabled && (
                <ChatImageUploader
                  settings={visionConfig}
                  onUpload={onUpload}
                  disabled={files.length >= visionConfig.number_limits}
                />
              )}
              <Tooltip
                selector="send-tip"
                htmlContent={
                  <div>
                    <div>{t('common.operation.send')} Enter</div>
                    <div>{t('common.operation.lineBreak')} Shift Enter</div>
                  </div>
                }
              >
                <button
                  type="button"
                  className="btn disabled:btn-disabled btn-primary h-8 w-8 p-0"
                  style={{ backgroundColor: 'rgb(28, 100, 242)' }}
                  onClick={handleSend}
                >
                  <SendIcon />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(Chat)
