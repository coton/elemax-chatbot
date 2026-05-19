import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const questionComponent = readFileSync('app/components/chat/question/index.tsx', 'utf8')
const chatComponent = readFileSync('app/components/chat/index.tsx', 'utf8')
const mainComponent = readFileSync('app/components/index.tsx', 'utf8')

assert.match(
  questionComponent,
  /className="mr-2 gap-1 flex"[\s\S]*style=\{\{ right: toolRightOffset \}\}/,
  'user message tools should render as the left-side hover actionbar requested by design',
)

assert.match(
  questionComponent,
  /setToolRightOffset\(width \+ 8\)/,
  'user message tools should stay visible beside dynamic-width bubbles',
)

assert.match(
  questionComponent,
  /setIsEditing\(true\)[\s\S]*Cancel[\s\S]*Resend/,
  'edit icon should expand an inline editor with Cancel and Resend controls',
)

assert.match(
  chatComponent,
  /onQuestionRetry\?: \(question: ChatItem, content: string\) => void/,
  'question resend should pass edited content to the parent',
)

assert.match(
  chatComponent,
  /onQuestionVariantChange\?: \(question: ChatItem, index: number\) => void/,
  'question messages should expose history switching',
)

assert.match(
  mainComponent,
  /handleQuestionRetry = \(question: ChatItem, content: string\)/,
  'parent should only enter retry flow after Question emits Resend',
)

assert.match(
  mainComponent,
  /appendQuestionVariant[\s\S]*handleRetry\(nextAnswer, content, nextChatList\)/,
  'resend should add a user-message history version and preserve it while generating the new answer version',
)
