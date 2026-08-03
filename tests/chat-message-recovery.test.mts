import assert from 'node:assert/strict'
import test from 'node:test'
import { findPersistedAnswer, recoverCompletedAnswer } from '../utils/chat-message-recovery.ts'

test('finds the persisted answer by Dify message id', () => {
  assert.equal(
    findPersistedAnswer({ data: [{ id: 'message-1', answer: '完整答案' }] }, 'message-1'),
    '完整答案',
  )
})

test('ignores empty and unrelated persisted messages', () => {
  assert.equal(findPersistedAnswer({ data: [{ id: 'other', answer: 'answer' }] }, 'message-1'), '')
  assert.equal(findPersistedAnswer({ data: [{ id: 'message-1', answer: '   ' }] }, 'message-1'), '')
})

test('retries history reads until the completed answer is available', async () => {
  let requests = 0
  const answer = await recoverCompletedAnswer(async () => {
    requests += 1
    return requests === 1
      ? { data: [{ id: 'message-1', answer: '' }] }
      : { data: [{ id: 'message-1', answer: '恢复后的答案' }] }
  }, 'message-1', { attempts: 3, retryDelayMs: 0 })

  assert.equal(answer, '恢复后的答案')
  assert.equal(requests, 2)
})

test('returns an empty string after bounded recovery failures', async () => {
  const answer = await recoverCompletedAnswer(async () => {
    throw new Error('temporary history failure')
  }, 'message-1', { attempts: 2, retryDelayMs: 0 })

  assert.equal(answer, '')
})
