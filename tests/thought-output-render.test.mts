import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { splitThoughtContent } from '../app/components/chat/answer/thought-content.ts'

const answer = readFileSync('app/components/chat/answer/index.tsx', 'utf8')
const thoughtContent = readFileSync('app/components/chat/answer/thought-content.ts', 'utf8')
const thoughtOutput = readFileSync('app/components/chat/answer/thought-output.tsx', 'utf8')
const globals = readFileSync('app/styles/globals.css', 'utf8')
const chat = readFileSync('app/components/index.tsx', 'utf8')

assert.ok(
  thoughtContent.includes('const thoughtTagRegex = /<(think|thought)\\b'),
  'thought output should recognize streamed <think> and <thought> blocks',
)

assert.ok(
  thoughtContent.includes('const thinkDetailsRegex = /<details\\b(?=[^>]*\\bdata-think'),
  'thought output should recognize existing details[data-think] blocks',
)

assert.deepEqual(
  splitThoughtContent('<think>step one</think>final answer'),
  {
    thoughts: [{ content: 'step one', isComplete: true, title: undefined }],
    answer: 'final answer',
  },
  'thought parser should split completed streamed think tags from the final answer',
)

assert.deepEqual(
  splitThoughtContent('<details data-think="true"><summary>Thought(1.2s)</summary>thinking</details>answer'),
  {
    thoughts: [{ content: 'thinking', isComplete: true, title: 'Thought(1.2s)' }],
    answer: 'answer',
  },
  'thought parser should preserve the title from details[data-think] summaries',
)

assert.deepEqual(
  splitThoughtContent('<think>still streaming'),
  {
    thoughts: [{ content: 'still streaming', isComplete: false, title: undefined }],
    answer: '',
  },
  'thought parser should surface incomplete streamed thoughts before the closing tag arrives',
)

assert.match(
  thoughtOutput,
  /<details[\s\S]*data-think="true"[\s\S]*<summary[\s\S]*ThoughtChevronIcon[\s\S]*StreamdownMarkdown/,
  'thought output should render thinking content as a collapsible markdown block',
)

assert.match(
  thoughtOutput,
  /formatThoughtElapsedTime[\s\S]*toFixed\(1\)[\s\S]*`\$\{baseTitle\}\(\$\{formatThoughtElapsedTime\(elapsedMs\)\}\)`/,
  'thought output should display elapsed thinking time in the Thought title',
)

assert.match(
  thoughtOutput,
  /window\.setInterval\(updateElapsed, 100\)/,
  'thought output should refresh the current thinking time while streaming',
)

assert.match(
  thoughtOutput,
  /const isThinkingFinished = thought\.isComplete \|\| !isStreaming[\s\S]*React\.useState\(!isThinkingFinished\)[\s\S]*if \(isThinkingFinished\) \{ setIsOpen\(false\) \}/,
  'thought output should stay open while thinking and collapse automatically when thinking finishes',
)

assert.match(
  answer,
  /<ThoughtOutput content=\{item\.thought\} isStreaming=\{isStreaming\} forceThought \/>/,
  'agent thought text should render through the thought disclosure UI',
)

assert.match(
  answer,
  /<ThoughtOutput content=\{content\} isStreaming=\{isStreaming\} \/>/,
  'answer text should split inline thought blocks from final answer content',
)

assert.doesNotMatch(
  chat,
  /lastThought\)\s*\{\s*lastThought\.thought = lastThought\.thought \+ message/,
  'streamed answer chunks should not be appended into the last thought',
)

assert.match(
  globals,
  /\.thought-disclosure \.thought-markdown\.markdown-body \{[\s\S]*background-color:\s*transparent;/,
  'thought markdown should inherit theme colors and keep its panel background',
)
