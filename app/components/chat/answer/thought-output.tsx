'use client'
import type { FC } from 'react'
import React, { useMemo } from 'react'
import StreamdownMarkdown from '@/app/components/base/streamdown-markdown'
import type { ThoughtBlock } from './thought-content'
import { splitThoughtContent } from './thought-content'

const formatThoughtElapsedTime = (elapsedMs: number) =>
  `${(elapsedMs / 1000).toFixed(1)}s`

const titleHasElapsedTime = (title: string) =>
  /\([^)]*\d+(?:\.\d+)?s\)$/i.test(title)

const ThoughtChevronIcon = () => (
  <svg className="mr-2 h-3 w-3 transition-transform duration-300 group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
)

interface ThoughtDisclosureProps {
  thought: ThoughtBlock
  isStreaming?: boolean
}

const ThoughtDisclosure: FC<ThoughtDisclosureProps> = ({ thought, isStreaming }) => {
  const isThinkingFinished = thought.isComplete || !isStreaming
  const [isOpen, setIsOpen] = React.useState(!isThinkingFinished)
  const startedAtRef = React.useRef(Date.now())
  const [elapsedMs, setElapsedMs] = React.useState(0)
  const baseTitle = thought.title || 'Thought'
  const hasElapsedTime = titleHasElapsedTime(baseTitle)
  const shouldKeepTiming = !!isStreaming && !thought.isComplete && !hasElapsedTime
  const title = hasElapsedTime
    ? baseTitle
    : `${baseTitle}(${formatThoughtElapsedTime(elapsedMs)})`

  React.useEffect(() => {
    if (!shouldKeepTiming) { return }

    const updateElapsed = () => setElapsedMs(Date.now() - startedAtRef.current)
    updateElapsed()
    const timer = window.setInterval(updateElapsed, 100)
    return () => window.clearInterval(timer)
  }, [shouldKeepTiming])

  React.useEffect(() => {
    if (isThinkingFinished) { setIsOpen(false) }
  }, [isThinkingFinished])

  return (
    <details
      data-think="true"
      className="thought-disclosure group mb-3"
      open={isOpen}
      onToggle={event => setIsOpen(event.currentTarget.open)}
    >
      <summary className="flex cursor-pointer select-none list-none items-center whitespace-nowrap pl-2 font-bold text-text-secondary">
        <span className="flex min-w-0 shrink-0 items-center">
          <ThoughtChevronIcon />
          <span className="truncate">{title}</span>
          {isStreaming && !thought.isComplete && (
            <span className="ml-2 h-1.5 w-1.5 rounded-full bg-divider-regular" aria-hidden="true" />
          )}
        </span>
      </summary>
      <div className="ml-2 border-l border-components-panel-border bg-components-segmented-control-bg-normal p-3 text-text-secondary">
        <StreamdownMarkdown content={thought.content} className="thought-markdown !text-text-secondary" />
      </div>
    </details>
  )
}

interface ThoughtOutputProps {
  content: string
  isStreaming?: boolean
  forceThought?: boolean
}

const ThoughtOutput: FC<ThoughtOutputProps> = ({ content, isStreaming, forceThought }) => {
  const { thoughts, answer } = useMemo(() => {
    const splitContent = splitThoughtContent(content)
    if (!forceThought || splitContent.thoughts.length > 0 || !splitContent.answer) { return splitContent }

    return {
      thoughts: [{
        content: splitContent.answer,
        isComplete: !isStreaming,
      }],
      answer: '',
    }
  }, [content, forceThought, isStreaming])

  return (
    <>
      {thoughts.map((thought, index) => (
        <ThoughtDisclosure
          key={`${index}-${thought.title || 'thought'}`}
          thought={thought}
          isStreaming={isStreaming}
        />
      ))}
      {!!answer && (
        <StreamdownMarkdown content={answer} />
      )}
    </>
  )
}

export default React.memo(ThoughtOutput)
