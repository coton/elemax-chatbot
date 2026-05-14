'use client'
import type { FC } from 'react'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import produce, { setAutoFreeze } from 'immer'
import { useBoolean, useGetState } from 'ahooks'
import useConversation from '@/hooks/use-conversation'
import Toast from '@/app/components/base/toast'
import Sidebar from '@/app/components/sidebar'
import ConfigSence from '@/app/components/config-scence'
import Header from '@/app/components/header'
import { deleteConversation as deleteConversationRequest, fetchAppParams, fetchChatList, fetchConversations, generationConversationName, sendChatMessage, updateFeedback } from '@/service'
import type { ChatItem, ConversationItem, Feedbacktype, PromptConfig, VisionFile, VisionSettings } from '@/types/app'
import type { FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { Resolution, TransferMethod, WorkflowRunningStatus } from '@/types/app'
import Chat from '@/app/components/chat'
import { setLocaleOnClient } from '@/i18n/client'
import useBreakpoints, { MediaType } from '@/hooks/use-breakpoints'
import Loading from '@/app/components/base/loading'
import { replaceVarWithValues, userInputsFormToPromptVariables } from '@/utils/prompt'
import AppUnavailable from '@/app/components/app-unavailable'
import { API_KEY, APP_ID, APP_INFO, isShowPrompt, promptTemplate } from '@/config'
import type { Annotation as AnnotationType } from '@/types/log'
import { addFileInfos, sortAgentSorts } from '@/utils/tools'

export interface IMainProps {
  params: any
}

interface ConversationHistorySyncOptions {
  autoGenerateNameForId?: string | null
}

const Main: FC<IMainProps> = () => {
  const { t } = useTranslation()
  const media = useBreakpoints()
  const isMobile = media === MediaType.mobile
  const hasSetAppConfig = APP_ID && API_KEY

  /*
  * app info
  */
  const [appUnavailable, setAppUnavailable] = useState<boolean>(false)
  const [isUnknownReason, setIsUnknownReason] = useState<boolean>(false)
  const [promptConfig, setPromptConfig] = useState<PromptConfig | null>(null)
  const [inited, setInited] = useState<boolean>(false)
  const [isConversationLoading, setIsConversationLoading] = useState<boolean>(false)
  // in mobile, show sidebar by click button
  const [isShowSidebar, { setTrue: showSidebar, setFalse: hideSidebar }] = useBoolean(false)
  const [visionConfig, setVisionConfig] = useState<VisionSettings | undefined>({
    enabled: false,
    number_limits: 2,
    detail: Resolution.low,
    transfer_methods: [TransferMethod.local_file],
  })
  const [fileConfig, setFileConfig] = useState<FileUpload | undefined>()

  useEffect(() => {
    if (APP_INFO?.title) { document.title = `${APP_INFO.title} - Powered by Dify` }
  }, [APP_INFO?.title])

  // onData change thought (the produce obj). https://github.com/immerjs/immer/issues/576
  useEffect(() => {
    setAutoFreeze(false)
    return () => {
      setAutoFreeze(true)
    }
  }, [])

  /*
  * conversation info
  */
  const {
    conversationList,
    setConversationList,
    currConversationId,
    getCurrConversationId,
    setCurrConversationId,
    getConversationIdFromStorage,
    clearConversationIdFromStorage,
    isNewConversation,
    currConversationInfo,
    currInputs,
    newConversationInputs,
    resetNewConversationInputs,
    setCurrInputs,
    setNewConversationInfo,
    setExistConversationInfo,
  } = useConversation()

  const [conversationIdChangeBecauseOfNew, setConversationIdChangeBecauseOfNew, getConversationIdChangeBecauseOfNew] = useGetState(false)
  const [isChatStarted, { setTrue: setChatStarted, setFalse: setChatNotStarted }] = useBoolean(false)
  const handleStartChat = (inputs: Record<string, any>) => {
    createNewChat()
    setConversationIdChangeBecauseOfNew(true)
    setCurrInputs(inputs)
    setChatStarted()
    // parse variables in introduction
    setChatList(generateNewChatListWithOpenStatement('', inputs))
  }
  const hasSetInputs = (() => {
    if (!isNewConversation) { return true }

    return isChatStarted
  })()

  const conversationName = currConversationInfo?.name || t('app.chat.newChatDefaultName') as string
  const conversationIntroduction = currConversationInfo?.introduction || ''
  const suggestedQuestions = currConversationInfo?.suggested_questions || []

  const syncConversationHistory = async ({
    autoGenerateNameForId,
  }: ConversationHistorySyncOptions = {}) => {
    const syncRequestId = conversationHistorySyncRequestIdRef.current + 1
    conversationHistorySyncRequestIdRef.current = syncRequestId
    const isCurrentSync = () => conversationHistorySyncRequestIdRef.current === syncRequestId

    const { data: conversations, error } = await fetchConversations() as { data: ConversationItem[], error?: string }
    if (error) { throw new Error(error) }

    let latestConversations = conversations
    let generateNameError: any
    if (autoGenerateNameForId && conversations.some(item => item.id === autoGenerateNameForId)) {
      try {
        const generatedConversation: any = await generationConversationName(autoGenerateNameForId)
        if (!isCurrentSync()) { return latestConversations }

        latestConversations = produce(conversations, (draft) => {
          const targetConversation = draft.find(item => item.id === autoGenerateNameForId)
          if (targetConversation) { targetConversation.name = generatedConversation.name }
        })
      }
      catch (error: any) {
        generateNameError = error
      }
    }

    if (!isCurrentSync()) { return latestConversations }

    setConversationList(latestConversations)

    if (generateNameError) { throw generateNameError }

    return latestConversations
  }

  const handleConversationSwitch = () => {
    if (!inited) { return }

    // update inputs of current conversation
    let notSyncToStateIntroduction = ''
    let notSyncToStateInputs: Record<string, any> | undefined | null = {}
    if (!isNewConversation) {
      const item = conversationList.find(item => item.id === currConversationId)
      notSyncToStateInputs = item?.inputs || {}
      setCurrInputs(notSyncToStateInputs as any)
      notSyncToStateIntroduction = item?.introduction || ''
      setExistConversationInfo({
        name: item?.name || '',
        introduction: notSyncToStateIntroduction,
        suggested_questions: suggestedQuestions,
      })
    }
    else {
      notSyncToStateInputs = newConversationInputs
      setCurrInputs(notSyncToStateInputs)
    }

    // update chat list of current conversation
    const switchRequestId = conversationSwitchRequestIdRef.current + 1
    conversationSwitchRequestIdRef.current = switchRequestId
    const isCurrentSwitch = () => conversationSwitchRequestIdRef.current === switchRequestId

    if (!isNewConversation && !conversationIdChangeBecauseOfNew && !isResponding) {
      setIsConversationLoading(true)
      fetchChatList(currConversationId).then((res: any) => {
        if (!isCurrentSwitch()) { return }

        const { data } = res
        const newChatList: ChatItem[] = generateNewChatListWithOpenStatement(notSyncToStateIntroduction, notSyncToStateInputs)

        data.forEach((item: any) => {
          newChatList.push({
            id: `question-${item.id}`,
            content: item.query,
            isAnswer: false,
            message_files: item.message_files?.filter((file: any) => file.belongs_to === 'user') || [],

          })
          newChatList.push({
            id: item.id,
            content: item.answer,
            agent_thoughts: addFileInfos(item.agent_thoughts ? sortAgentSorts(item.agent_thoughts) : item.agent_thoughts, item.message_files),
            feedback: item.feedback,
            isAnswer: true,
            message_files: item.message_files?.filter((file: any) => file.belongs_to === 'assistant') || [],
          })
        })
        setChatList(newChatList)
      }).catch((error: any) => {
        if (!isCurrentSwitch()) { return }

        setChatList([])
        notify({ type: 'error', message: error?.message || 'Failed to load conversation' })
      }).finally(() => {
        if (isCurrentSwitch()) { setIsConversationLoading(false) }
      })
    }
    else {
      setIsConversationLoading(false)
    }

    if (isNewConversation && isChatStarted) { setChatList(generateNewChatListWithOpenStatement()) }
  }
  useEffect(handleConversationSwitch, [currConversationId, inited])

  const handleConversationIdChange = async (id: string) => {
    const idChangeRequestId = conversationIdChangeRequestIdRef.current + 1
    conversationIdChangeRequestIdRef.current = idChangeRequestId
    const isCurrentIdChange = () => conversationIdChangeRequestIdRef.current === idChangeRequestId

    const shouldSyncStartedResponse = isResponding && hasStartedRespondingConversationRef.current
    if (isResponding) { cutOffCurrentResponse() }

    if (shouldSyncStartedResponse) {
      await syncStartedRespondingConversation()
      resetRespondingConversationRefs()
    }
    if (!isCurrentIdChange()) { return }

    if (id === '-1') {
      const isResettingCurrentNewConversation = currConversationId === '-1'
      createNewChat(isResettingCurrentNewConversation)
      setConversationIdChangeBecauseOfNew(true)
      setChatNotStarted()

      if (isResettingCurrentNewConversation) { setChatList([]) }
    }
    else {
      setConversationIdChangeBecauseOfNew(false)
    }
    // trigger handleConversationSwitch
    setCurrConversationId(id, APP_ID)
    hideSidebar()
  }

  /*
  * chat info. chat is under conversation.
  */
  const [chatList, setChatList, getChatList] = useGetState<ChatItem[]>([])
  const chatListDomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // scroll to bottom with page-level scrolling
    if (chatListDomRef.current) {
      setTimeout(() => {
        chatListDomRef.current?.scrollIntoView({
          behavior: 'auto',
          block: 'end',
        })
      }, 50)
    }
  }, [chatList, currConversationId])
  // user can not edit inputs if user had send message
  const canEditInputs = !chatList.some(item => item.isAnswer === false) && isNewConversation
  const createNewChat = (forceReset = false) => {
    const newConversationItem: ConversationItem = {
      id: '-1',
      name: t('app.chat.newChatDefaultName'),
      inputs: newConversationInputs,
      introduction: conversationIntroduction,
      suggested_questions: suggestedQuestions,
    }

    setConversationList(currentConversationList => produce(currentConversationList, (draft) => {
      if (!forceReset && draft.some(item => item.id === '-1')) { return }

      const existingNewConversationIndex = draft.findIndex(item => item.id === '-1')

      if (existingNewConversationIndex > -1) {
        draft[existingNewConversationIndex] = newConversationItem
        return
      }

      draft.unshift(newConversationItem)
    }))
  }

  // sometime introduction is not applied to state
  const generateNewChatListWithOpenStatement = (introduction?: string, inputs?: Record<string, any> | null) => {
    let calculatedIntroduction = introduction || conversationIntroduction || ''
    const calculatedPromptVariables = inputs || currInputs || null
    if (calculatedIntroduction && calculatedPromptVariables) { calculatedIntroduction = replaceVarWithValues(calculatedIntroduction, promptConfig?.prompt_variables || [], calculatedPromptVariables) }

    const openStatement = {
      id: `${Date.now()}`,
      content: calculatedIntroduction,
      isAnswer: true,
      feedbackDisabled: true,
      isOpeningStatement: isShowPrompt,
      suggestedQuestions,
    }
    if (calculatedIntroduction) { return [openStatement] }

    return []
  }

  // init
  useEffect(() => {
    if (!hasSetAppConfig) {
      setAppUnavailable(true)
      return
    }
    (async () => {
      try {
        const [conversationData, appParams] = await Promise.all([fetchConversations(), fetchAppParams()])
        // handle current conversation id
        const { data: conversations, error } = conversationData as { data: ConversationItem[], error: string }
        if (error) {
          Toast.notify({ type: 'error', message: error })
          throw new Error(error)
          return
        }
        const _conversationId = getConversationIdFromStorage(APP_ID)
        const currentConversation = conversations.find(item => item.id === _conversationId)
        const isNotNewConversation = !!currentConversation

        // fetch new conversation info
        const { user_input_form, opening_statement: introduction, file_upload, system_parameters, suggested_questions = [] }: any = appParams
        setLocaleOnClient(APP_INFO.default_language, true)
        setNewConversationInfo({
          name: t('app.chat.newChatDefaultName'),
          introduction,
          suggested_questions,
        })
        if (isNotNewConversation) {
          setExistConversationInfo({
            name: currentConversation.name || t('app.chat.newChatDefaultName'),
            introduction,
            suggested_questions,
          })
        }
        const prompt_variables = userInputsFormToPromptVariables(user_input_form)
        setPromptConfig({
          prompt_template: promptTemplate,
          prompt_variables,
        } as PromptConfig)
        const outerFileUploadEnabled = !!file_upload?.enabled
        setVisionConfig({
          ...file_upload?.image,
          enabled: !!(outerFileUploadEnabled && file_upload?.image?.enabled),
          image_file_size_limit: system_parameters?.system_parameters || 0,
        })
        setFileConfig({
          enabled: outerFileUploadEnabled,
          allowed_file_types: file_upload?.allowed_file_types,
          allowed_file_extensions: file_upload?.allowed_file_extensions,
          allowed_file_upload_methods: file_upload?.allowed_file_upload_methods,
          number_limits: file_upload?.number_limits,
          fileUploadConfig: file_upload?.fileUploadConfig,
        })
        setConversationList(conversations as ConversationItem[])

        if (isNotNewConversation) { setCurrConversationId(_conversationId, APP_ID, false) }

        setInited(true)
      }
      catch (e: any) {
        if (e.status === 404) {
          setAppUnavailable(true)
        }
        else {
          setIsUnknownReason(true)
          setAppUnavailable(true)
        }
      }
    })()
  }, [])

  const [isResponding, { setTrue: setRespondingTrue, setFalse: setRespondingFalse }] = useBoolean(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const sendRequestIdRef = useRef(0)
  const conversationSwitchRequestIdRef = useRef(0)
  const conversationHistorySyncRequestIdRef = useRef(0)
  const conversationIdChangeRequestIdRef = useRef(0)
  const respondingConversationIdRef = useRef<string | null>(null)
  const hasStartedRespondingConversationRef = useRef(false)
  const { notify } = Toast
  const logError = (message: string) => {
    notify({ type: 'error', message })
  }

  const markRespondingConversationStarted = (conversationId?: string) => {
    hasStartedRespondingConversationRef.current = true
    if (conversationId) { respondingConversationIdRef.current = conversationId }
  }

  const resetRespondingConversationRefs = () => {
    respondingConversationIdRef.current = null
    hasStartedRespondingConversationRef.current = false
  }

  const syncStartedRespondingConversation = async () => {
    if (!hasStartedRespondingConversationRef.current) { return }

    try {
      await syncConversationHistory({
        autoGenerateNameForId: getConversationIdChangeBecauseOfNew() ? respondingConversationIdRef.current : null,
      })
      setConversationIdChangeBecauseOfNew(false)
      resetNewConversationInputs()
    }
    catch (error: any) {
      notify({ type: 'error', message: error?.message || 'Failed to load conversation' })
    }
  }

  const handleDeleteConversation = async (id: string) => {
    if (id === '-1') { return }

    if (id === currConversationId && isResponding) {
      notify({ type: 'info', message: t('app.errorMessage.waitForResponse') })
      return
    }

    // eslint-disable-next-line no-alert
    if (!globalThis.confirm(t('app.chat.deleteConversationConfirm'))) { return }

    const previousConversationList = conversationList
    const deletedConversationIndex = previousConversationList.findIndex(item => item.id === id)
    const deletedConversation = previousConversationList[deletedConversationIndex]
    const nextConversationList = previousConversationList.filter(item => item.id !== id)
    const isDeletingCurrentConversation = id === currConversationId
    const nextConversationId = nextConversationList[0]?.id || '-1'

    setConversationList(nextConversationList)

    if (isDeletingCurrentConversation) {
      setConversationIdChangeBecauseOfNew(false)
      setChatNotStarted()

      if (nextConversationList.length > 0) {
        setCurrConversationId(nextConversationList[0].id, APP_ID)
      }
      else {
        clearConversationIdFromStorage(APP_ID)
        setCurrConversationId('-1', APP_ID, false)
        setChatList([])
      }
    }

    try {
      await deleteConversationRequest(id)

      notify({ type: 'success', message: t('app.chat.deleteConversationSuccess') })
    }
    catch (error: any) {
      if (deletedConversation) {
        setConversationList((currentConversationList) => {
          if (currentConversationList.some(item => item.id === id)) { return currentConversationList }

          const restoredConversationList = [...currentConversationList]
          restoredConversationList.splice(
            Math.min(deletedConversationIndex, restoredConversationList.length),
            0,
            deletedConversation,
          )
          return restoredConversationList
        })
      }

      if (isDeletingCurrentConversation && getCurrConversationId() === nextConversationId) { setCurrConversationId(id, APP_ID) }

      notify({ type: 'error', message: error?.message || t('app.chat.deleteConversationFailed') })
    }
  }

  const checkCanSend = () => {
    if (currConversationId !== '-1') { return true }

    if (!currInputs || !promptConfig?.prompt_variables) { return true }

    let emptyRequiredInput = false
    promptConfig.prompt_variables.forEach((item) => {
      if (item.required && !currInputs[item.key]) {
        emptyRequiredInput = true
      }
    })

    if (emptyRequiredInput) {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return true
  }

  const [controlFocus, setControlFocus] = useState(0)
  const [openingSuggestedQuestions, setOpeningSuggestedQuestions] = useState<string[]>([])
  const [messageTaskId, setMessageTaskId] = useState('')
  const [hasStopResponded, setHasStopResponded, getHasStopResponded] = useGetState(false)
  const [isRespondingConIsCurrCon, setIsRespondingConCurrCon, getIsRespondingConIsCurrCon] = useGetState(true)
  const [userQuery, setUserQuery] = useState('')

  const cutOffCurrentResponse = () => {
    sendRequestIdRef.current += 1
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setMessageTaskId('')
    setIsRespondingConCurrCon(true)
    setRespondingFalse()
  }

  const updateCurrentQA = ({
    responseItem,
    questionId,
    placeholderAnswerId,
    questionItem,
  }: {
    responseItem: ChatItem
    questionId: string
    placeholderAnswerId: string
    questionItem: ChatItem
  }) => {
    // closesure new list is outdated.
    const newListWithAnswer = produce(
      getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
      (draft) => {
        if (!draft.find(item => item.id === questionId)) { draft.push({ ...questionItem }) }

        draft.push({ ...responseItem })
      },
    )
    setChatList(newListWithAnswer)
  }

  const transformToServerFile = (fileItem: any) => {
    return {
      type: 'image',
      transfer_method: fileItem.transferMethod,
      url: fileItem.url,
      upload_file_id: fileItem.id,
    }
  }

  const handleSend = async (message: string, files?: VisionFile[]) => {
    if (isResponding) {
      notify({ type: 'info', message: t('app.errorMessage.waitForResponse') })
      return
    }
    const toServerInputs: Record<string, any> = {}
    if (currInputs) {
      Object.keys(currInputs).forEach((key) => {
        const value = currInputs[key]
        if (value.supportFileType) { toServerInputs[key] = transformToServerFile(value) }

        else if (value[0]?.supportFileType) { toServerInputs[key] = value.map((item: any) => transformToServerFile(item)) }

        else { toServerInputs[key] = value }
      })
    }

    const data: Record<string, any> = {
      inputs: toServerInputs,
      query: message,
      conversation_id: isNewConversation ? null : currConversationId,
    }

    if (files && files?.length > 0) {
      data.files = files.map((item) => {
        if (item.transfer_method === TransferMethod.local_file) {
          return {
            ...item,
            url: '',
          }
        }
        return item
      })
    }

    // question
    const questionId = `question-${Date.now()}`
    const questionItem = {
      id: questionId,
      content: message,
      isAnswer: false,
      message_files: (files || []).filter((f: any) => f.type === 'image'),
    }

    const placeholderAnswerId = `answer-placeholder-${Date.now()}`
    const placeholderAnswerItem = {
      id: placeholderAnswerId,
      content: '',
      isAnswer: true,
    }

    const newList = [...getChatList(), questionItem, placeholderAnswerItem]
    setChatList(newList)

    let isAgentMode = false

    // answer
    const responseItem: ChatItem = {
      id: `${Date.now()}`,
      content: '',
      agent_thoughts: [],
      message_files: [],
      isAnswer: true,
    }
    let hasSetResponseId = false

    const prevTempNewConversationId = getCurrConversationId() || '-1'
    let tempNewConversationId = ''
    const requestId = sendRequestIdRef.current + 1
    sendRequestIdRef.current = requestId
    const isCurrentRequest = () => sendRequestIdRef.current === requestId

    respondingConversationIdRef.current = isNewConversation ? null : currConversationId
    hasStartedRespondingConversationRef.current = false

    setRespondingTrue()
    sendChatMessage(data, {
      getAbortController: (abortController) => {
        if (isCurrentRequest()) {
          abortControllerRef.current = abortController
          return
        }

        abortController.abort()
      },
      onData: (message: string, isFirstMessage: boolean, { conversationId: newConversationId, messageId, taskId }: any) => {
        if (!isCurrentRequest()) { return }

        if (message || messageId || newConversationId) { markRespondingConversationStarted(newConversationId || respondingConversationIdRef.current || undefined) }

        if (!isAgentMode) {
          responseItem.content = responseItem.content + message
        }
        else {
          const lastThought = responseItem.agent_thoughts?.[responseItem.agent_thoughts?.length - 1]
          if (lastThought) { lastThought.thought = lastThought.thought + message } // need immer setAutoFreeze
        }
        if (messageId && !hasSetResponseId) {
          responseItem.id = messageId
          hasSetResponseId = true
        }

        if (isFirstMessage && newConversationId) { tempNewConversationId = newConversationId }

        setMessageTaskId(taskId)
        // has switched to other conversation
        if (prevTempNewConversationId !== getCurrConversationId()) {
          setIsRespondingConCurrCon(false)
          return
        }
        updateCurrentQA({
          responseItem,
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      async onCompleted(hasError?: boolean) {
        if (!isCurrentRequest()) { return }

        if (hasError) {
          abortControllerRef.current = null
          setRespondingFalse()
          resetRespondingConversationRefs()
          setChatList(produce(getChatList(), (draft) => {
            const placeholderIndex = draft.findIndex(item => item.id === placeholderAnswerId)
            if (placeholderIndex > -1) { draft.splice(placeholderIndex, 1) }
          }))
          return
        }

        let syncedConversations: ConversationItem[] | undefined
        try {
          if (getConversationIdChangeBecauseOfNew()) {
            syncedConversations = await syncConversationHistory({
              autoGenerateNameForId: tempNewConversationId || respondingConversationIdRef.current,
            })
          }
        }
        catch (error: any) {
          notify({ type: 'error', message: error?.message || 'Failed to load conversation' })
        }
        if (!isCurrentRequest()) { return }

        const syncedConversationId = getConversationIdChangeBecauseOfNew() ? syncedConversations?.[0]?.id : undefined
        const nextConversationId = tempNewConversationId || respondingConversationIdRef.current || syncedConversationId
        setConversationIdChangeBecauseOfNew(false)
        resetNewConversationInputs()
        setChatNotStarted()
        if (nextConversationId) { setCurrConversationId(nextConversationId, APP_ID, true) }
        setRespondingFalse()
        resetRespondingConversationRefs()
        abortControllerRef.current = null
        setMessageTaskId('')
      },
      onFile(file) {
        if (!isCurrentRequest()) { return }

        markRespondingConversationStarted(respondingConversationIdRef.current || undefined)

        const lastThought = responseItem.agent_thoughts?.[responseItem.agent_thoughts?.length - 1]
        if (lastThought) { lastThought.message_files = [...(lastThought as any).message_files, { ...file }] }

        updateCurrentQA({
          responseItem,
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      onThought(thought) {
        if (!isCurrentRequest()) { return }

        markRespondingConversationStarted(respondingConversationIdRef.current || undefined)

        isAgentMode = true
        const response = responseItem as any
        if (thought.message_id && !hasSetResponseId) {
          response.id = thought.message_id
          hasSetResponseId = true
        }
        // responseItem.id = thought.message_id;
        if (response.agent_thoughts.length === 0) {
          response.agent_thoughts.push(thought)
        }
        else {
          const lastThought = response.agent_thoughts[response.agent_thoughts.length - 1]
          // thought changed but still the same thought, so update.
          if (lastThought.id === thought.id) {
            thought.thought = lastThought.thought
            thought.message_files = lastThought.message_files
            responseItem.agent_thoughts![response.agent_thoughts.length - 1] = thought
          }
          else {
            responseItem.agent_thoughts!.push(thought)
          }
        }
        // has switched to other conversation
        if (prevTempNewConversationId !== getCurrConversationId()) {
          setIsRespondingConCurrCon(false)
          return false
        }

        updateCurrentQA({
          responseItem,
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      onMessageEnd: (messageEnd) => {
        if (!isCurrentRequest()) { return }

        markRespondingConversationStarted(respondingConversationIdRef.current || undefined)

        if (messageEnd.metadata?.annotation_reply) {
          responseItem.id = messageEnd.id
          responseItem.annotation = ({
            id: messageEnd.metadata.annotation_reply.id,
            authorName: messageEnd.metadata.annotation_reply.account.name,
          } as AnnotationType)
          const newListWithAnswer = produce(
            getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
            (draft) => {
              if (!draft.find(item => item.id === questionId)) { draft.push({ ...questionItem }) }

              draft.push({
                ...responseItem,
              })
            },
          )
          setChatList(newListWithAnswer)
          return
        }
        // not support show citation
        // responseItem.citation = messageEnd.retriever_resources
        const newListWithAnswer = produce(
          getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
          (draft) => {
            if (!draft.find(item => item.id === questionId)) { draft.push({ ...questionItem }) }

            draft.push({ ...responseItem })
          },
        )
        setChatList(newListWithAnswer)
      },
      onMessageReplace: (messageReplace) => {
        if (!isCurrentRequest()) { return }

        markRespondingConversationStarted(messageReplace.conversation_id || respondingConversationIdRef.current || undefined)

        setChatList(produce(
          getChatList(),
          (draft) => {
            const current = draft.find(item => item.id === messageReplace.id)

            if (current) { current.content = messageReplace.answer }
          },
        ))
      },
      onError(_message, code) {
        if (!isCurrentRequest()) { return }

        abortControllerRef.current = null
        setMessageTaskId('')
        setRespondingFalse()
        if (code === 'aborted') { return }

        resetRespondingConversationRefs()

        // role back placeholder answer
        setChatList(produce(getChatList(), (draft) => {
          const placeholderIndex = draft.findIndex(item => item.id === placeholderAnswerId)
          if (placeholderIndex > -1) { draft.splice(placeholderIndex, 1) }
        }))
      },
      onWorkflowStarted: ({ workflow_run_id }) => {
        if (!isCurrentRequest()) { return }

        markRespondingConversationStarted(respondingConversationIdRef.current || undefined)

        responseItem.workflow_run_id = workflow_run_id
        responseItem.workflowProcess = {
          status: WorkflowRunningStatus.Running,
          tracing: [],
        }
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          if (currentIndex === -1) { return }

          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
      onWorkflowFinished: ({ data }) => {
        if (!isCurrentRequest()) { return }
        if (!responseItem.workflowProcess) { return }

        markRespondingConversationStarted(respondingConversationIdRef.current || undefined)

        responseItem.workflowProcess!.status = data.status as WorkflowRunningStatus
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          if (currentIndex === -1) { return }

          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
      onNodeStarted: ({ data }) => {
        if (!isCurrentRequest()) { return }
        if (!responseItem.workflowProcess?.tracing) { return }

        markRespondingConversationStarted(respondingConversationIdRef.current || undefined)

        responseItem.workflowProcess!.tracing!.push(data as any)
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          if (currentIndex === -1) { return }

          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
      onNodeFinished: ({ data }) => {
        if (!isCurrentRequest()) { return }
        if (!responseItem.workflowProcess?.tracing) { return }

        markRespondingConversationStarted(respondingConversationIdRef.current || undefined)

        const currentIndex = responseItem.workflowProcess!.tracing!.findIndex(item => item.node_id === data.node_id)
        if (currentIndex === -1) { return }

        responseItem.workflowProcess!.tracing[currentIndex] = data as any
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          if (currentIndex === -1) { return }

          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
    })
  }

  const handleFeedback = async (messageId: string, feedback: Feedbacktype) => {
    await updateFeedback({ url: `/messages/${messageId}/feedbacks`, body: { rating: feedback.rating } })
    const newChatList = chatList.map((item) => {
      if (item.id === messageId) {
        return {
          ...item,
          feedback,
        }
      }
      return item
    })
    setChatList(newChatList)
    notify({ type: 'success', message: t('common.api.success') })
  }

  const renderSidebar = () => {
    if (!APP_ID || !APP_INFO || !promptConfig) { return null }
    return (
      <Sidebar
        list={conversationList}
        onCurrentIdChange={handleConversationIdChange}
        onDeleteConversation={handleDeleteConversation}
        currentId={currConversationId}
        copyRight={APP_INFO.copyright || APP_INFO.title}
      />
    )
  }

  if (appUnavailable) { return <AppUnavailable isUnknownReason={isUnknownReason} errMessage={!hasSetAppConfig ? 'Please set APP_ID and API_KEY in config/index.tsx' : ''} /> }

  if (!APP_ID || !APP_INFO || !promptConfig) { return <Loading type='app' /> }

  return (
    <div className='bg-gray-100'>
      <Header
        title={APP_INFO.title}
        isMobile={isMobile}
        onShowSideBar={showSidebar}
        onCreateNewChat={() => handleConversationIdChange('-1')}
      />
      <div className="flex rounded-t-2xl bg-white overflow-hidden">
        {/* sidebar */}
        {!isMobile && renderSidebar()}
        {isMobile && isShowSidebar && (
          <div className='fixed inset-0 z-50' style={{ backgroundColor: 'rgba(35, 56, 118, 0.2)' }} onClick={hideSidebar} >
            <div className='inline-block' onClick={e => e.stopPropagation()}>
              {renderSidebar()}
            </div>
          </div>
        )}
        {/* main */}
        <div className='flex-grow flex flex-col h-[calc(100vh_-_3rem)] overflow-y-auto'>
          <ConfigSence
            conversationName={conversationName}
            hasSetInputs={hasSetInputs}
            isPublicVersion={isShowPrompt}
            siteInfo={APP_INFO}
            promptConfig={promptConfig}
            onStartChat={handleStartChat}
            canEditInputs={canEditInputs}
            savedInputs={currInputs as Record<string, any>}
            onInputsChange={setCurrInputs}
          ></ConfigSence>

          {
            hasSetInputs && (
              <div className='relative grow pc:w-[794px] max-w-full mobile:w-full pb-[180px] mx-auto mb-3.5' ref={chatListDomRef}>
                {isConversationLoading
                  ? (
                    <div className='flex min-h-[240px] h-full items-center justify-center'>
                      <Loading />
                    </div>
                  )
                  : (
                    <Chat
                      chatList={chatList}
                      onSend={handleSend}
                      onFeedback={handleFeedback}
                      isResponding={isResponding}
                      checkCanSend={checkCanSend}
                      visionConfig={visionConfig}
                      fileConfig={fileConfig}
                    />
                  )}
              </div>)
          }
        </div>
      </div>
    </div>
  )
}

export default React.memo(Main)
