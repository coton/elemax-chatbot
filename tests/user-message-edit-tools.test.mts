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
  /group relative mr-4 flex max-w-full items-start overflow-visible pl-14/,
  'user message hover tools should not be clipped by the message wrapper',
)

assert.match(
  questionComponent,
  /setIsEditing\(true\)[\s\S]*Cancel[\s\S]*Resend/,
  'edit icon should expand an inline editor with Cancel and Resend controls',
)

assert.match(
  questionComponent,
  /isEditing \? 'w-0 grow' : ''/,
  'inline question editor should expand to the available conversation width',
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
  'parent should handle edit resend after Question emits Resend',
)

assert.match(
  mainComponent,
  /baseChatList = questionIndex === -1[\s\S]*currentChatList\.filter\(\(_, index\) => index !== questionIndex && index !== attachedAnswerIndex\)/,
  'question resend should remove the original user message and attached answer from their old position',
)

assert.match(
  mainComponent,
  /handleSend\(content, question\.message_files \|\| \[\], \{\s*baseChatList,[\s\S]*answerHistory: attachedAnswer \? \[attachedAnswer\] : \[\],\s*\}\)/,
  'question resend should append a new bottom message while carrying the attached answer as history',
)

assert.doesNotMatch(
  mainComponent,
  /appendQuestionVariant/,
  'question resend should not add a history version to the original user message',
)
