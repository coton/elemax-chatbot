import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const answerComponent = readFileSync('app/components/chat/answer/index.tsx', 'utf8')
const mainComponent = readFileSync('app/components/index.tsx', 'utf8')

assert.doesNotMatch(
  answerComponent,
  /WorkflowProcess|workflowProcess/,
  'workflow process details should not be rendered in assistant answers',
)

assert.match(
  mainComponent,
  /onWorkflowStarted[\s\S]*onWorkflowFinished/,
  'workflow lifecycle events should remain handled while their process UI is hidden',
)
