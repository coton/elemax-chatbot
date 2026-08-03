import { API_PREFIX } from '@/config'
import Toast from '@/app/components/base/toast'
import type { AnnotationReply, MessageEnd, MessageReplace, ThoughtItem } from '@/app/components/chat/type'
import type { VisionFile } from '@/types/app'
import { createParser } from 'eventsource-parser'

const TIME_OUT = 100000

const ContentType = {
  json: 'application/json',
  stream: 'text/event-stream',
  form: 'application/x-www-form-urlencoded; charset=UTF-8',
  download: 'application/octet-stream', // for download
}

const baseOptions = {
  method: 'GET',
  mode: 'cors',
  credentials: 'include', // always send cookies、HTTP Basic authentication.
  headers: new Headers({
    'Content-Type': ContentType.json,
  }),
  redirect: 'follow',
}

export interface WorkflowStartedResponse {
  task_id: string
  workflow_run_id: string
  event: string
  data: {
    id: string
    workflow_id: string
    sequence_number: number
    created_at: number
  }
}

export interface WorkflowFinishedResponse {
  task_id: string
  workflow_run_id: string
  event: string
  data: {
    id: string
    workflow_id: string
    status: string
    outputs: any
    error: string
    elapsed_time: number
    total_tokens: number
    total_steps: number
    created_at: number
    finished_at: number
  }
}

export interface NodeStartedResponse {
  task_id: string
  workflow_run_id: string
  event: string
  data: {
    id: string
    node_id: string
    node_type: string
    index: number
    predecessor_node_id?: string
    inputs: any
    created_at: number
    extras?: any
  }
}

export interface NodeFinishedResponse {
  task_id: string
  workflow_run_id: string
  event: string
  data: {
    id: string
    node_id: string
    node_type: string
    index: number
    predecessor_node_id?: string
    inputs: any
    process_data: any
    outputs: any
    status: string
    error: string
    elapsed_time: number
    execution_metadata: {
      total_tokens: number
      total_price: number
      currency: string
    }
    created_at: number
  }
}

export interface IOnDataMoreInfo {
  conversationId?: string
  taskId?: string
  messageId: string
  errorMessage?: string
  errorCode?: string
}

export type IOnData = (message: string, isFirstMessage: boolean, moreInfo: IOnDataMoreInfo) => void
export type IOnThought = (though: ThoughtItem) => void
export type IOnFile = (file: VisionFile) => void
export type IOnMessageEnd = (messageEnd: MessageEnd) => void
export type IOnMessageReplace = (messageReplace: MessageReplace) => void
export type IOnAnnotationReply = (messageReplace: AnnotationReply) => void
export type IOnCompleted = (hasError?: boolean) => void
export type IOnError = (msg: string, code?: string) => void
export type IOnWorkflowStarted = (workflowStarted: WorkflowStartedResponse) => void
export type IOnWorkflowFinished = (workflowFinished: WorkflowFinishedResponse) => void
export type IOnNodeStarted = (nodeStarted: NodeStartedResponse) => void
export type IOnNodeFinished = (nodeFinished: NodeFinishedResponse) => void

interface IOtherOptions {
  isPublicAPI?: boolean
  bodyStringify?: boolean
  needAllResponseContent?: boolean
  deleteContentType?: boolean
  silent?: boolean
  onData?: IOnData // for stream
  onThought?: IOnThought
  onFile?: IOnFile
  onMessageEnd?: IOnMessageEnd
  onMessageReplace?: IOnMessageReplace
  onError?: IOnError
  onCompleted?: IOnCompleted // for stream
  getAbortController?: (abortController: AbortController) => void
  onWorkflowStarted?: IOnWorkflowStarted
  onWorkflowFinished?: IOnWorkflowFinished
  onNodeStarted?: IOnNodeStarted
  onNodeFinished?: IOnNodeFinished
}

function unicodeToChar(text: string) {
  return text.replace(/\\u[0-9a-f]{4}/g, (_match, p1) => {
    return String.fromCharCode(parseInt(p1, 16))
  })
}

const handleStream = (
  response: Response,
  onData: IOnData,
  onCompleted?: IOnCompleted,
  onThought?: IOnThought,
  onMessageEnd?: IOnMessageEnd,
  onMessageReplace?: IOnMessageReplace,
  onFile?: IOnFile,
  onWorkflowStarted?: IOnWorkflowStarted,
  onWorkflowFinished?: IOnWorkflowFinished,
  onNodeStarted?: IOnNodeStarted,
  onNodeFinished?: IOnNodeFinished,
  onError?: IOnError,
) => {
  if (!response.ok) { throw new Error('Network response was not ok') }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder('utf-8')
  let isFirstMessage = true
  let isCompleted = false

  const complete = (hasError?: boolean) => {
    if (isCompleted) { return }
    isCompleted = true
    onCompleted?.(hasError)
  }

  const dispatchEvent = (data: string) => {
    let event: Record<string, any>
    try {
      event = JSON.parse(data) as Record<string, any>
    }
    catch (error) {
      onError?.(`Invalid streaming response: ${error}`)
      complete(true)
      return
    }

    if (event.status === 400 || !event.event) {
      onData('', false, {
        conversationId: undefined,
        messageId: '',
        errorMessage: event.message,
        errorCode: event.code,
      })
      complete(true)
      return
    }
    if (event.event === 'message' || event.event === 'agent_message') {
      onData(unicodeToChar(event.answer), isFirstMessage, {
        conversationId: event.conversation_id,
        taskId: event.task_id,
        messageId: event.id,
      })
      isFirstMessage = false
    }
    else if (event.event === 'agent_thought') { onThought?.(event as ThoughtItem) }
    else if (event.event === 'message_file') { onFile?.(event as VisionFile) }
    else if (event.event === 'message_end') { onMessageEnd?.(event as MessageEnd) }
    else if (event.event === 'message_replace') { onMessageReplace?.(event as MessageReplace) }
    else if (event.event === 'workflow_started') { onWorkflowStarted?.(event as WorkflowStartedResponse) }
    else if (event.event === 'workflow_finished') { onWorkflowFinished?.(event as WorkflowFinishedResponse) }
    else if (event.event === 'node_started') { onNodeStarted?.(event as NodeStartedResponse) }
    else if (event.event === 'node_finished') { onNodeFinished?.(event as NodeFinishedResponse) }
  }

  const parser = createParser((parsedEvent) => {
    if (parsedEvent.type === 'event' && !isCompleted) { dispatchEvent(parsedEvent.data) }
  })

  const read = async () => {
    if (!reader) {
      onError?.('Streaming response body is unavailable')
      complete(true)
      return
    }

    try {
      while (true) {
        if (isCompleted) { return }
        const result = await reader.read()
        if (result.done) {
          parser.feed(decoder.decode())
          // Some proxies close immediately after the final SSE data line. A
          // terminating blank line lets the parser dispatch that buffered event.
          parser.feed('\n\n')
          complete()
          return
        }
        parser.feed(decoder.decode(result.value, { stream: true }))
      }
    }
    catch (error: any) {
      if (error?.name === 'AbortError') {
        onError?.('aborted', 'aborted')
        return
      }
      onError?.(`${error}`)
    }
  }

  void read()
}

const baseFetch = (url: string, fetchOptions: any, { needAllResponseContent, silent }: IOtherOptions) => {
  const options = Object.assign({}, baseOptions, fetchOptions)

  const urlPrefix = API_PREFIX

  let urlWithPrefix = `${urlPrefix}${url.startsWith('/') ? url : `/${url}`}`

  const { method, params, body } = options
  // handle query
  if (method === 'GET' && params) {
    const paramsArray: string[] = []
    Object.keys(params).forEach(key =>
      paramsArray.push(`${key}=${encodeURIComponent(params[key])}`),
    )
    if (urlWithPrefix.search(/\?/) === -1) { urlWithPrefix += `?${paramsArray.join('&')}` }

    else { urlWithPrefix += `&${paramsArray.join('&')}` }

    delete options.params
  }

  if (body) { options.body = JSON.stringify(body) }

  // Handle timeout
  return Promise.race([
    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('request timeout'))
      }, TIME_OUT)
    }),
    new Promise((resolve, reject) => {
      globalThis.fetch(urlWithPrefix, options)
        .then((res: any) => {
          const resClone = res.clone()
          // Error handler
          if (!/^(2|3)\d{2}$/.test(res.status)) {
            try {
              const bodyJson = res.json()
              switch (res.status) {
                case 401: {
                  if (!silent) { Toast.notify({ type: 'error', message: 'Invalid token' }) }
                  return
                }
                default:
                  // eslint-disable-next-line no-new
                  new Promise(() => {
                    bodyJson.then((data: any) => {
                      if (!silent) { Toast.notify({ type: 'error', message: data.message }) }
                    })
                  })
              }
            }
            catch (e) {
              if (!silent) { Toast.notify({ type: 'error', message: `${e}` }) }
            }

            return Promise.reject(resClone)
          }

          // handle delete api. Delete api not return content.
          if (res.status === 204) {
            resolve({ result: 'success' })
            return
          }

          // return data
          const data = options.headers.get('Content-type') === ContentType.download ? res.blob() : res.json()

          resolve(needAllResponseContent ? resClone : data)
        })
        .catch((err) => {
          if ((err as { name?: string })?.name === 'AbortError') {
            reject(err)
            return
          }
          if (!silent) { Toast.notify({ type: 'error', message: err }) }
          reject(err)
        })
    }),
  ])
}

export const upload = (fetchOptions: any): Promise<any> => {
  const urlPrefix = API_PREFIX
  const urlWithPrefix = `${urlPrefix}/file-upload`
  const defaultOptions = {
    method: 'POST',
    url: `${urlWithPrefix}`,
    data: {},
  }
  const options = {
    ...defaultOptions,
    ...fetchOptions,
  }
  return new Promise((resolve, reject) => {
    const xhr = options.xhr
    xhr.open(options.method, options.url)
    for (const key in options.headers) { xhr.setRequestHeader(key, options.headers[key]) }

    xhr.withCredentials = true
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) { resolve({ id: xhr.response }) }
        else { reject(xhr) }
      }
    }
    xhr.upload.onprogress = options.onprogress
    xhr.send(options.data)
  })
}

export const ssePost = (
  url: string,
  fetchOptions: any,
  {
    onData,
    onCompleted,
    onThought,
    onFile,
    onMessageEnd,
    onMessageReplace,
    onWorkflowStarted,
    onWorkflowFinished,
    onNodeStarted,
    onNodeFinished,
    onError,
    getAbortController,
  }: IOtherOptions,
) => {
  const options = Object.assign({}, baseOptions, {
    method: 'POST',
  }, fetchOptions)
  const abortController = new AbortController()
  options.signal = abortController.signal
  getAbortController?.(abortController)

  const urlPrefix = API_PREFIX
  const urlWithPrefix = `${urlPrefix}${url.startsWith('/') ? url : `/${url}`}`

  const { body } = options
  if (body) { options.body = JSON.stringify(body) }

  globalThis.fetch(urlWithPrefix, options)
    .then((res: any) => {
      if (!/^(2|3)\d{2}$/.test(res.status)) {
        // eslint-disable-next-line no-new
        new Promise(() => {
          res.json().then((data: any) => {
            Toast.notify({ type: 'error', message: data.message || 'Server Error' })
          })
        })
        onError?.('Server Error')
        return
      }
      const handleError = (message: string, code?: string) => {
        if (code !== 'aborted') { Toast.notify({ type: 'error', message }) }
        onError?.(message, code)
      }
      return handleStream(res, (str: string, isFirstMessage: boolean, moreInfo: IOnDataMoreInfo) => {
        if (moreInfo.errorMessage) {
          Toast.notify({ type: 'error', message: moreInfo.errorMessage })
          return
        }
        onData?.(str, isFirstMessage, moreInfo)
      }, (hasError?: boolean) => {
        onCompleted?.(hasError)
      }, onThought, onMessageEnd, onMessageReplace, onFile, onWorkflowStarted, onWorkflowFinished, onNodeStarted, onNodeFinished, handleError)
    })
    .catch((e) => {
      if (abortController.signal.aborted) {
        onError?.('aborted', 'aborted')
        return
      }
      Toast.notify({ type: 'error', message: e })
      onError?.(e)
    })
}

export const request = (url: string, options = {}, otherOptions?: IOtherOptions) => {
  return baseFetch(url, options, otherOptions || {})
}

export const get = (url: string, options = {}, otherOptions?: IOtherOptions) => {
  return request(url, Object.assign({}, options, { method: 'GET' }), otherOptions)
}

export const post = (url: string, options = {}, otherOptions?: IOtherOptions) => {
  return request(url, Object.assign({}, options, { method: 'POST' }), otherOptions)
}

export const put = (url: string, options = {}, otherOptions?: IOtherOptions) => {
  return request(url, Object.assign({}, options, { method: 'PUT' }), otherOptions)
}

export const del = (url: string, options = {}, otherOptions?: IOtherOptions) => {
  return request(url, Object.assign({}, options, { method: 'DELETE' }), otherOptions)
}
