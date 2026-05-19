import type { IOnCompleted, IOnData, IOnError, IOnFile, IOnMessageEnd, IOnMessageReplace, IOnNodeFinished, IOnNodeStarted, IOnThought, IOnWorkflowFinished, IOnWorkflowStarted } from './base'
import { del, get, post, ssePost } from './base'
import type { Feedbacktype } from '@/types/app'

export const sendChatMessage = async (
  body: Record<string, any>,
  {
    onData,
    onCompleted,
    onThought,
    onFile,
    onError,
    getAbortController,
    onMessageEnd,
    onMessageReplace,
    onWorkflowStarted,
    onNodeStarted,
    onNodeFinished,
    onWorkflowFinished,
  }: {
    onData: IOnData
    onCompleted: IOnCompleted
    onFile: IOnFile
    onThought: IOnThought
    onMessageEnd: IOnMessageEnd
    onMessageReplace: IOnMessageReplace
    onError: IOnError
    getAbortController?: (abortController: AbortController) => void
    onWorkflowStarted: IOnWorkflowStarted
    onNodeStarted: IOnNodeStarted
    onNodeFinished: IOnNodeFinished
    onWorkflowFinished: IOnWorkflowFinished
  },
) => {
  return ssePost('chat-messages', {
    body: {
      ...body,
      response_mode: 'streaming',
    },
  }, { onData, onCompleted, onThought, onFile, onError, getAbortController, onMessageEnd, onMessageReplace, onNodeStarted, onWorkflowStarted, onWorkflowFinished, onNodeFinished })
}

export const fetchConversations = async () => {
  return get('conversations', { params: { limit: 100, first_id: '' } })
}

export const fetchChatList = async (conversationId: string, options?: { signal?: AbortSignal, firstId?: string | null, limit?: number }) => {
  const fetchOptions: Record<string, unknown> = {
    params: { conversation_id: conversationId, limit: options?.limit || 100, first_id: options?.firstId || '' },
  }
  if (options?.signal) { fetchOptions.signal = options.signal }

  return get('messages', fetchOptions)
}

export const fetchSuggestedQuestions = async (messageId: string) => {
  const res = await get(`messages/${messageId}/suggested`, {}, { silent: true }) as { data?: unknown }
  if (!Array.isArray(res?.data)) { return [] }

  return res.data
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map(item => item.trim())
    .slice(0, 3)
}

// init value. wait for server update
export const fetchAppParams = async () => {
  return get('parameters')
}

export const updateFeedback = async ({ url, body }: { url: string, body: Feedbacktype }) => {
  return post(url, { body })
}

export const generationConversationName = async (id: string) => {
  return post(`conversations/${id}/name`, { body: { auto_generate: true } })
}

export const deleteConversation = async (id: string) => {
  return del(`conversations/${id}`)
}
