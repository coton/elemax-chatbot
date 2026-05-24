'use client'
import type { FC } from 'react'
import type { FeedbackFunc } from '../type'
import type { ChatItem, VisionFile } from '@/types/app'
import type { Emoji } from '@/types/tools'
import React from 'react'
import { createPortal } from 'react-dom'
import copy from 'copy-to-clipboard'
import WorkflowProcess from '@/app/components/workflow/workflow-process'
import Toast from '@/app/components/base/toast'
import ImageGallery from '../../base/image-gallery'
import LoadingAnim from '../loading-anim'
import s from '../style.module.css'
import Thought from '../thought'
import ThoughtOutput from './thought-output'
import { getActiveAnswerVariant, getActiveAnswerVariantIndex, getAnswerVariantCount } from '@/utils/chat-variants'

const LikeIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="remixicon h-4 w-4">
    <path d="M14.5998 8.00033H21C22.1046 8.00033 23 8.89576 23 10.0003V12.1047C23 12.3659 22.9488 12.6246 22.8494 12.8662L19.755 20.3811C19.6007 20.7558 19.2355 21.0003 18.8303 21.0003H2C1.44772 21.0003 1 20.5526 1 20.0003V10.0003C1 9.44804 1.44772 9.00033 2 9.00033H5.48184C5.80677 9.00033 6.11143 8.84246 6.29881 8.57701L11.7522 0.851355C11.8947 0.649486 12.1633 0.581978 12.3843 0.692483L14.1984 1.59951C15.25 2.12534 15.7931 3.31292 15.5031 4.45235L14.5998 8.00033ZM7 10.5878V19.0003H18.1606L21 12.1047V10.0003H14.5998C13.2951 10.0003 12.3398 8.77128 12.6616 7.50691L13.5649 3.95894C13.6229 3.73105 13.5143 3.49353 13.3039 3.38837L12.6428 3.0578L7.93275 9.73038C7.68285 10.0844 7.36341 10.3746 7 10.5878ZM5 11.0003H3V19.0003H5V11.0003Z" />
  </svg>
)

const DislikeIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="remixicon h-4 w-4">
    <path d="M9.40017 16H3C1.89543 16 1 15.1046 1 14V11.8957C1 11.6344 1.05118 11.3757 1.15064 11.1342L4.24501 3.61925C4.3993 3.24455 4.76447 3 5.16969 3H22C22.5523 3 23 3.44772 23 4V14C23 14.5523 22.5523 15 22 15H18.5182C18.1932 15 17.8886 15.1579 17.7012 15.4233L12.2478 23.149C12.1053 23.3508 11.8367 23.4184 11.6157 23.3078L9.80163 22.4008C8.74998 21.875 8.20687 20.6874 8.49694 19.548L9.40017 16ZM17 13.4125V5H5.83939L3 11.8957V14H9.40017C10.7049 14 11.6602 15.229 11.3384 16.4934L10.4351 20.0414C10.3771 20.2693 10.4857 20.5068 10.6961 20.612L11.3572 20.9425L16.0673 14.27C16.3172 13.9159 16.6366 13.6257 17 13.4125ZM19 13H21V5H19V13Z" />
  </svg>
)

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="remixicon h-4 w-4">
    <path d="M7 4V2H17V4H20.0066C20.5552 4 21 4.44495 21 4.9934V21.0066C21 21.5552 20.5551 22 20.0066 22H3.9934C3.44476 22 3 21.5551 3 21.0066V4.9934C3 4.44476 3.44495 4 3.9934 4H7ZM7 6H5V20H19V6H17V8H7V6ZM9 4V6H15V4H9Z" />
  </svg>
)

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="remixicon h-5 w-5">
    <path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z" />
  </svg>
)

const ChevronRightIcon = ({ className = '' }: { className?: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} data-icon="ChevronRight" aria-hidden="true">
    <g id="chevron-right">
      <path id="Icon" d="M5.25 10.5L8.75 7L5.25 3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
)

interface IAnswerProps {
  item: ChatItem
  feedbackDisabled: boolean
  onFeedback?: FeedbackFunc
  onRetry?: (answer: ChatItem) => void
  onVariantChange?: (answer: ChatItem, index: number) => void
  isResponding?: boolean
  isSendLocked?: boolean
  allToolIcons?: Record<string, string | Emoji>
  suggestionClick?: (suggestion: string) => void
}

// The component needs to maintain its own state to control whether to display input component
const Answer: FC<IAnswerProps> = ({
  item,
  feedbackDisabled = false,
  onFeedback,
  onVariantChange,
  isResponding,
  allToolIcons,
}) => {
  const activeItem = getActiveAnswerVariant(item) as ChatItem
  const { id, content, feedback, agent_thoughts, workflowProcess } = activeItem
  const isAgentMode = !!agent_thoughts && agent_thoughts.length > 0
  const isStreaming = !!isResponding || !!activeItem.isRetrying
  const variantCount = getAnswerVariantCount(item)
  const activeVariantIndex = getActiveAnswerVariantIndex(item)

  const feedbackEnabled = !feedbackDisabled && !item.feedbackDisabled
  const feedbackActionEnabled = feedbackEnabled && !isStreaming
  const activeRating = feedback?.rating
  const [feedbackDialogOpen, setFeedbackDialogOpen] = React.useState(false)
  const [feedbackContent, setFeedbackContent] = React.useState('')
  const [feedbackSubmitting, setFeedbackSubmitting] = React.useState(false)

  const handleCopy = () => {
    if (copy(content || '')) { Toast.notify({ type: 'success', message: 'Copied successfully' }) }
  }

  const handleLike = () => {
    if (!feedbackEnabled) { return }
    onFeedback?.(id, { rating: 'like' })
  }

  const handleDislike = () => {
    if (!feedbackEnabled) { return }
    setFeedbackContent(feedback?.content || '')
    setFeedbackDialogOpen(true)
  }

  const handleCancelFeedback = () => {
    if (feedbackSubmitting) { return }
    setFeedbackDialogOpen(false)
  }

  const handleSubmitFeedback = async () => {
    if (!feedbackEnabled || feedbackSubmitting) { return }

    const trimmedFeedbackContent = feedbackContent.trim()
    if (!trimmedFeedbackContent) {
      Toast.notify({ type: 'warning', message: 'Feedback content cannot be empty' })
      return
    }

    setFeedbackSubmitting(true)
    try {
      await onFeedback?.(id, { rating: 'dislike', content: trimmedFeedbackContent })
      setFeedbackDialogOpen(false)
    }
    finally {
      setFeedbackSubmitting(false)
    }
  }

  React.useEffect(() => {
    if (!feedbackDialogOpen) { return }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !feedbackSubmitting) { setFeedbackDialogOpen(false) }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [feedbackDialogOpen, feedbackSubmitting])

  const getImgs = (list?: VisionFile[]) => {
    if (!list) { return [] }
    return list.filter(file => file.type === 'image' && file.belongs_to === 'assistant')
  }

  const handlePreviousVariant = () => {
    onVariantChange?.(item, activeVariantIndex - 1)
  }

  const handleNextVariant = () => {
    onVariantChange?.(item, activeVariantIndex + 1)
  }

  const agentModeAnswer = (
    <div>
      {agent_thoughts?.map((item, index) => (
        <div key={index}>
          {item.thought && (
            <ThoughtOutput content={item.thought} isStreaming={isStreaming} forceThought />
          )}
          {/* {item.tool} */}
          {/* perhaps not use tool */}
          {!!item.tool && (
            <Thought
              thought={item}
              allToolIcons={allToolIcons || {}}
              isFinished={!!item.observation || !isResponding}
            />
          )}

          {getImgs(item.message_files).length > 0 && (
            <ImageGallery srcs={getImgs(item.message_files).map(item => item.url)} />
          )}
        </div>
      ))}
      {!!content && (
        <ThoughtOutput content={content} isStreaming={isStreaming} />
      )}
    </div>
  )

  return (
    <div key={id}>
      <div className="mb-2 flex last:mb-0">
        <div className={`${s.answerIcon} relative h-10 w-10 shrink-0`}>
          {isResponding
            && (
              <div className={s.typeingIcon}>
                <LoadingAnim type="avatar" />
              </div>
            )}
        </div>
        <div className={`${s.answerWrap} chat-answer-container group ml-4 w-0 grow pb-4`}>
          <div className={`${s.answer} relative text-sm text-text-secondary`}>
            <div className={`assistant-message-bubble relative inline-block max-w-full rounded-2xl bg-[#f9fafb] px-4 py-3 text-text-secondary ${workflowProcess ? 'w-full' : ''}`}>
              {workflowProcess && (
                <WorkflowProcess data={workflowProcess} hideInfo />
              )}
              {(isStreaming && (isAgentMode ? (!content && (agent_thoughts || []).filter(item => !!item.thought || !!item.tool).length === 0) : !content))
                ? (
                  <div className="flex items-center justify-center w-6 h-5">
                    <LoadingAnim type="text" />
                  </div>
                )
                : (isAgentMode
                  ? agentModeAnswer
                  : (
                    <ThoughtOutput content={content} isStreaming={isStreaming} />
                  ))}
              {variantCount > 1 && (
                <div className="flex items-center justify-center pt-3.5 text-sm">
                  <button
                    type="button"
                    className={activeVariantIndex > 0 ? 'opacity-100' : 'opacity-30'}
                    disabled={activeVariantIndex <= 0}
                    aria-label="Previous answer"
                    onClick={handlePreviousVariant}
                  >
                    <ChevronRightIcon className="h-[14px] w-[14px] rotate-180 text-text-primary" />
                  </button>
                  <span className="px-2 text-xs text-text-primary">{activeVariantIndex + 1} /{variantCount}</span>
                  <button
                    type="button"
                    className={activeVariantIndex < variantCount - 1 ? 'opacity-100' : 'opacity-30'}
                    disabled={activeVariantIndex >= variantCount - 1}
                    aria-label="Next answer"
                    onClick={handleNextVariant}
                  >
                    <ChevronRightIcon className="h-[14px] w-[14px] text-text-primary" />
                  </button>
                </div>
              )}
              <div className="absolute flex justify-end gap-1 -bottom-4 right-2" style={{}}>
                {feedbackActionEnabled && (
                  <div className="answer-actionbar ml-1 items-center gap-0.5 rounded-[10px] border-[0.5px] border-components-actionbar-border bg-components-actionbar-bg p-0.5 shadow-md backdrop-blur-sm hidden group-hover:flex">
                    <button
                      type="button"
                      className={`action-btn action-btn-m ${activeRating === 'like' ? 'action-btn-active' : ''}`}
                      aria-pressed={activeRating === 'like'}
                      onClick={handleLike}
                    >
                      <LikeIcon />
                    </button>
                    <button
                      type="button"
                      className={`action-btn action-btn-m hover:bg-state-destructive-hover hover:text-text-destructive ${activeRating === 'dislike' ? 'action-btn-destructive' : ''}`}
                      aria-pressed={activeRating === 'dislike'}
                      onClick={handleDislike}
                    >
                      <DislikeIcon />
                    </button>
                  </div>
                )}
                <div className="answer-actionbar ml-1 hidden items-center gap-0.5 rounded-[10px] border-[0.5px] border-components-actionbar-border bg-components-actionbar-bg p-0.5 shadow-md backdrop-blur-sm group-hover:flex">
                  <button type="button" className="action-btn action-btn-m" aria-label="Copy message" onClick={handleCopy}>
                    <CopyIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {feedbackDialogOpen && createPortal(
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-[2px]"
          role="presentation"
          onClick={handleCancelFeedback}
        >
          <div
            className="flex max-h-[80%] w-full max-w-[480px] flex-col rounded-2xl border-[0.5px] border-components-panel-border bg-components-panel-bg-blur shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-dialog-title"
            onClick={event => event.stopPropagation()}
          >
            <div className="relative shrink-0 p-6 pb-3 pr-14 text-text-primary">
              <div id="feedback-dialog-title" className="text-[20px] font-semibold leading-7">Provide Feedback</div>
              <div className="system-xs-regular mt-1 text-text-tertiary">Please tell us what went wrong with this response</div>
              <button
                type="button"
                className="absolute right-5 top-5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-text-tertiary hover:bg-state-base-hover hover:text-text-secondary"
                aria-label="Close feedback dialog"
                disabled={feedbackSubmitting}
                onClick={handleCancelFeedback}
              >
                <CloseIcon />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-3">
              <div className="space-y-3">
                <div>
                  <label className="mb-2 block text-[13px] font-semibold leading-5 text-text-secondary" htmlFor={`feedback-content-${id}`}>Feedback Content</label>
                  <textarea
                    id={`feedback-content-${id}`}
                    className="min-h-20 w-full resize-y appearance-none rounded-md border border-transparent bg-components-panel-on-panel-item-bg px-3 py-2 text-[13px] leading-5 text-text-secondary caret-primary-600 outline-none placeholder:text-text-tertiary hover:border-components-panel-border hover:bg-components-panel-on-panel-item-bg focus:border-state-accent-border focus:bg-components-panel-on-panel-item-bg focus:shadow-xs"
                    placeholder="Please describe what went wrong or how we can improve..."
                    rows={4}
                    value={feedbackContent}
                    disabled={feedbackSubmitting}
                    autoFocus
                    onChange={event => setFeedbackContent(event.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="flex shrink-0 justify-between p-6 pt-5">
              <div />
              <div className="flex items-center">
                <button type="button" className="btn disabled:btn-disabled btn-secondary btn-medium" disabled={feedbackSubmitting} onClick={handleCancelFeedback}>Cancel</button>
                <button type="button" className="btn disabled:btn-disabled btn-primary btn-medium ml-2" disabled={feedbackSubmitting} onClick={handleSubmitFeedback}>Submit</button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
export default React.memo(Answer)
