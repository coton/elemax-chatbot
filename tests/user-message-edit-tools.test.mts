import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const questionComponent = readFileSync('app/components/chat/question/index.tsx', 'utf8')
const answerComponent = readFileSync('app/components/chat/answer/index.tsx', 'utf8')
const chatComponent = readFileSync('app/components/chat/index.tsx', 'utf8')
const mainComponent = readFileSync('app/components/index.tsx', 'utf8')

assert.doesNotMatch(
  questionComponent,
  /group-hover:flex|components-actionbar|action-btn|toolRightOffset|ResizeObserver/,
  'user messages should not render any hover quick-tool actionbar',
)

assert.doesNotMatch(
  questionComponent,
  /copy-to-clipboard|CopyIcon|RetryQuestionIcon|aria-label="Copy message"|aria-label="Edit and resend message"/,
  'user messages should not expose copy or edit/resend hover tools',
)

assert.doesNotMatch(
  questionComponent,
  /isEditing|setIsEditing|Cancel|Resend/,
  'user message inline edit controls should be removed with the hover quick tools',
)

assert.match(
  questionComponent,
  /onVariantChange\?: \(question: ChatItem, index: number\) => void/,
  'question messages should still expose history switching',
)

assert.match(
  questionComponent,
  /variantCount > 1[\s\S]*aria-label="Previous question"[\s\S]*aria-label="Next question"/,
  'question history navigation should remain available when variants exist',
)

assert.match(
  answerComponent,
  /answer-actionbar[\s\S]*group-hover:flex/,
  'assistant message hover tools should remain unchanged',
)

assert.doesNotMatch(
  answerComponent,
  /RegenerateIcon|aria-label="Retry answer"/,
  'assistant hover tools should not show the retry icon',
)

assert.match(
  answerComponent,
  /onRetry\?: \(answer: ChatItem\) => void/,
  'assistant retry prop should remain available even though the hover icon is hidden',
)

assert.match(
  chatComponent,
  /onRetry\?: \(answer: ChatItem\) => void[\s\S]*onRetry={onRetry}/,
  'chat should keep forwarding assistant retry logic',
)

assert.match(
  mainComponent,
  /handleRetry = \(answer: ChatItem[\s\S]*onRetry={handleRetry}/,
  'parent should keep assistant retry logic wired',
)

assert.doesNotMatch(
  chatComponent,
  /onQuestionRetry/,
  'chat should not pass user-message edit/resend callbacks',
)

assert.doesNotMatch(
  mainComponent,
  /handleQuestionRetry|onQuestionRetry=/,
  'parent should not wire user-message edit/resend handlers',
)

assert.match(
  mainComponent,
  /handleQuestionVariantChange = \(question: ChatItem, index: number\)/,
  'parent should continue to handle question history switching',
)

assert.doesNotMatch(
  mainComponent,
  /appendQuestionVariant/,
  'question resend should not add a history version to the original user message',
)
