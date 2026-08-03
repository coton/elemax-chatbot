interface PersistedMessage {
  id?: string
  answer?: string
}

interface MessageHistoryResponse {
  data?: PersistedMessage[]
}

interface RecoverCompletedAnswerOptions {
  attempts?: number
  retryDelayMs?: number
}

const wait = (delayMs: number) => new Promise(resolve => setTimeout(resolve, delayMs))

export const findPersistedAnswer = (response: unknown, messageId: string) => {
  const messages = (response as MessageHistoryResponse | undefined)?.data
  if (!Array.isArray(messages)) { return '' }

  const answer = messages.find(message => message.id === messageId)?.answer
  return typeof answer === 'string' && answer.trim() ? answer : ''
}

export const recoverCompletedAnswer = async (
  fetchMessages: () => Promise<unknown>,
  messageId: string,
  {
    attempts = 3,
    retryDelayMs = 150,
  }: RecoverCompletedAnswerOptions = {},
) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const answer = findPersistedAnswer(await fetchMessages(), messageId)
      if (answer) { return answer }
    }
    catch {
      // The streamed response is already complete. Retry the history read so a
      // transient recovery failure does not replace the original chat error path.
    }

    if (attempt < attempts - 1 && retryDelayMs > 0) { await wait(retryDelayMs) }
  }

  return ''
}
