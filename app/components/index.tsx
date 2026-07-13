'use client'
import type { FC } from 'react'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import produce, { setAutoFreeze } from 'immer'
import { useBoolean, useGetState } from 'ahooks'
import useConversation from '@/hooks/use-conversation'
import Toast from '@/app/components/base/toast'
import Sidebar, { type ThemePreference } from '@/app/components/sidebar'
import ConfigSence from '@/app/components/config-scence'
import Header from '@/app/components/header'
import { deleteConversation as deleteConversationRequest, fetchAppParams, fetchChatList, fetchConversations, fetchSuggestedQuestions, generationConversationName, sendChatMessage, stopChatMessage, updateFeedback } from '@/service'
import type { ChatItem, ConversationItem, Feedbacktype, PromptConfig, PromptVariable, VisionFile, VisionSettings } from '@/types/app'
import type { FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { Resolution, TransferMethod, WorkflowRunningStatus } from '@/types/app'
import Chat from '@/app/components/chat'
import { setLocaleOnClient } from '@/i18n/client'
import useBreakpoints, { MediaType } from '@/hooks/use-breakpoints'
import Loading from '@/app/components/base/loading'
import { replaceVarWithValues, userInputsFormToPromptVariables } from '@/utils/prompt'
import AppUnavailable from '@/app/components/app-unavailable'
import { APP_ID, APP_INFO, isShowPrompt, promptTemplate } from '@/config'
import type { Annotation as AnnotationType } from '@/types/log'
import { addFileInfos, sortAgentSorts } from '@/utils/tools'
import {
  appendAnswerVariant,
  getAnswerGroupId,
  getQuestionGroupId,
  isSameAnswerGroup,
  isSameQuestionGroup,
  removeAnswerVariant,
  replaceAnswerVariant,
  setActiveAnswerVariantIndex,
  setActiveQuestionVariantIndex,
  withAnswerHistory,
} from '@/utils/chat-variants'

export interface IMainProps {
  params: any
}

interface ConversationHistorySyncOptions {
  autoGenerateNameForId?: string | null
}

interface StartNewConversationOptions {
  forceReset?: boolean
  inputs?: Record<string, any> | null
  introduction?: string
  suggestedQuestions?: string[]
  promptVariables?: PromptVariable[]
  showInHistory?: boolean
}

const getDefaultPromptInputs = (promptVariables: PromptVariable[] = []) => {
  return promptVariables.reduce<Record<string, any>>((inputs, item) => {
    if (item.default !== undefined) { inputs[item.key] = item.default }
    return inputs
  }, {})
}

const THEME_STORAGE_KEY = 'elemax-theme-preference'
const isThemePreference = (value: string | null): value is ThemePreference => value === 'system' || value === 'light' || value === 'dark'

const Main: FC<IMainProps> = () => {
  const { t } = useTranslation()
  const media = useBreakpoints()
  const isMobile = media === MediaType.mobile
  const hasSetAppConfig = APP_ID

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
  const [isSidebarCollapsed, { toggle: toggleSidebarCollapsed, setTrue: collapseSidebar, setFalse: expandSidebar }] = useBoolean(false)
  const [visionConfig, setVisionConfig] = useState<VisionSettings | undefined>({
    enabled: false,
    number_limits: 2,
    detail: Resolution.low,
    transfer_methods: [TransferMethod.local_file],
  })
  const [fileConfig, setFileConfig] = useState<FileUpload | undefined>()
  const [themePreference, setThemePreference] = useState<ThemePreference>('dark')
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light')
  const [isThemeReady, setIsThemeReady] = useState(false)
  const effectiveTheme = themePreference === 'system' ? systemTheme : themePreference

  useEffect(() => {
    const savedTheme = globalThis.localStorage?.getItem(THEME_STORAGE_KEY) || null
    if (isThemePreference(savedTheme)) { setThemePreference(savedTheme) }

    const mediaQuery = globalThis.matchMedia?.('(prefers-color-scheme: dark)')
    const syncSystemTheme = () => {
      setSystemTheme(mediaQuery?.matches ? 'dark' : 'light')
    }

    syncSystemTheme()
    mediaQuery?.addEventListener('change', syncSystemTheme)
    setIsThemeReady(true)

    return () => {
      mediaQuery?.removeEventListener('change', syncSystemTheme)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.remove('theme-light', 'theme-dark')
    document.documentElement.classList.add(`theme-${effectiveTheme}`)
    document.documentElement.dataset.theme = effectiveTheme
    document.documentElement.style.colorScheme = effectiveTheme
    if (isThemeReady) { globalThis.localStorage?.setItem(THEME_STORAGE_KEY, themePreference) }
  }, [effectiveTheme, isThemeReady, themePreference])

  useEffect(() => {
    document.title = 'Max AI'
  }, [])

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
    newConversationInfo,
    newConversationInputs,
    setNewConversationInputs,
    resetNewConversationInputs,
    setCurrInputs,
    setNewConversationInfo,
    setExistConversationInfo,
  } = useConversation()

  const [conversationIdChangeBecauseOfNew, setConversationIdChangeBecauseOfNew, getConversationIdChangeBecauseOfNew] = useGetState(false)
  const [isChatStarted, { setTrue: setChatStarted, setFalse: setChatNotStarted }] = useBoolean(false)
  const skipNextConversationSwitchChatFetchRef = useRef(false)
  const handleStartChat = (inputs: Record<string, any>) => {
    startNewConversation({ inputs })
  }
  const hasSetInputs = (() => {
    if (!isNewConversation) { return true }

    return isChatStarted
  })()

  const conversationName = currConversationInfo?.name || t('app.chat.newChatDefaultName') as string
  const conversationIntroduction = currConversationInfo?.introduction || ''
  const suggestedQuestions = currConversationInfo?.suggested_questions || []
  const latestConversationIntroduction = newConversationInfo?.introduction || ''
  const latestSuggestedQuestions = newConversationInfo?.suggested_questions || []
  const currentConversation = conversationList.find(item => item.id === currConversationId)
  const isCurrentConversationStale = !isNewConversation && currentConversation?.is_stale_config === true

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

  const getLastAnswerMessageId = (list: ChatItem[]) => {
    return [...list].reverse().find(item => item.isAnswer && !item.feedbackDisabled)?.id || ''
  }

  const handleConversationSwitch = (chatListAbortSignal: AbortSignal) => {
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

    const shouldSkipChatFetch = skipNextConversationSwitchChatFetchRef.current

    if (!isNewConversation && !conversationIdChangeBecauseOfNew && !isResponding && !shouldSkipChatFetch) {
      setIsConversationLoading(true)
      fetchChatList(currConversationId, { signal: chatListAbortSignal, limit: 100 }).then((res: any) => {
        if (!isCurrentSwitch()) { return }

        const { data } = res
        const historyMessages = Array.isArray(data) ? [...data] : []
        const newChatList: ChatItem[] = generateNewChatListWithOpenStatement(notSyncToStateIntroduction, notSyncToStateInputs)

        historyMessages.forEach((item: any) => {
          newChatList.push({
            id: `question-${item.id}`,
            content: item.query,
            isAnswer: false,
            message_files: item.message_files?.filter((file: any) => file.belongs_to === 'user') || [],

          })
          const answerItem: ChatItem = {
            id: item.id,
            content: item.answer,
            agent_thoughts: addFileInfos(item.agent_thoughts ? sortAgentSorts(item.agent_thoughts) : item.agent_thoughts, item.message_files),
            feedback: item.feedback,
            isAnswer: true,
            message_files: item.message_files?.filter((file: any) => file.belongs_to === 'assistant') || [],
          }
          newChatList.push(answerItem)
        })
        const lastAnswerMessageId = getLastAnswerMessageId(newChatList)
        if (lastAnswerMessageId) {
          const lastAnswer = newChatList.find(item => item.id === lastAnswerMessageId)
          if (lastAnswer) { lastAnswer.suggestedQuestionsLoading = true }
        }
        setChatList(newChatList)

        if (lastAnswerMessageId) {
          fetchSuggestedQuestions(lastAnswerMessageId)
            .then((nextSuggestedQuestions) => {
              if (isCurrentSwitch()) { applySuggestedQuestionsToAnswer(lastAnswerMessageId, nextSuggestedQuestions) }
            })
            .catch(() => {
              if (isCurrentSwitch()) { applySuggestedQuestionsToAnswer(lastAnswerMessageId, []) }
            })
        }
      }).catch((error: any) => {
        if (!isCurrentSwitch()) { return }
        if (error?.name === 'AbortError' || chatListAbortSignal.aborted) { return }

        setChatList([])
        notify({ type: 'error', message: error?.message || 'Failed to load conversation' })
      }).finally(() => {
        if (isCurrentSwitch()) { setIsConversationLoading(false) }
      })
    }
    else {
      setIsConversationLoading(false)
    }
    if (shouldSkipChatFetch) { skipNextConversationSwitchChatFetchRef.current = false }

    if (isNewConversation && isChatStarted) { setChatList(generateNewChatListWithOpenStatement()) }
  }

  useEffect(() => {
    const abortController = new AbortController()
    handleConversationSwitch(abortController.signal)

    return () => {
      abortController.abort()
      conversationSwitchRequestIdRef.current += 1
    }
  }, [currConversationId, inited])

  const handleConversationIdChange = async (id: string) => {
    resetMobileFirstMessageTopPosition()
    const idChangeRequestId = conversationIdChangeRequestIdRef.current + 1
    conversationIdChangeRequestIdRef.current = idChangeRequestId
    const isCurrentIdChange = () => conversationIdChangeRequestIdRef.current === idChangeRequestId

    const shouldSyncStartedResponse = isSendLocked && hasStartedRespondingConversationRef.current
    if (isResponding) { cutOffCurrentResponse() }

    if (shouldSyncStartedResponse) {
      await syncStartedRespondingConversation()
      resetRespondingConversationRefs()
    }
    if (!isCurrentIdChange()) { return }

    if (id === '-1') {
      const isResettingCurrentNewConversation = currConversationId === '-1'
      startNewConversation({ forceReset: isResettingCurrentNewConversation })
      clearConversationIdFromStorage(APP_ID)
    }
    else {
      setConversationIdChangeBecauseOfNew(false)
    }
    // trigger handleConversationSwitch
    setCurrConversationId(id, APP_ID)
    unlockSending()
    hideSidebar()
  }

  /*
  * chat info. chat is under conversation.
  */
  const [chatList, setChatList, getChatList] = useGetState<ChatItem[]>([])
  const chatListDomRef = useRef<HTMLDivElement>(null)
  const mainPanelRef = useRef<HTMLDivElement>(null)
  const pendingMobileFirstMessageTopScrollRef = useRef(false)
  const holdMobileFirstMessageTopPositionRef = useRef(false)
  const resetMobileFirstMessageTopPosition = () => {
    pendingMobileFirstMessageTopScrollRef.current = false
    holdMobileFirstMessageTopPositionRef.current = false
  }
  const getMobileConversationTopScroll = React.useCallback((mainPanel: HTMLElement) => {
    const header = mainPanel.querySelector<HTMLElement>('.app-header')
    const viewportOffsetTop = Number.parseFloat(
      document.documentElement.style.getPropertyValue('--mobile-viewport-offset-top'),
    ) || 0
    return Math.max(0, (chatListDomRef.current?.offsetTop ?? 0) - (header?.offsetHeight ?? 0) - viewportOffsetTop)
  }, [])
  useEffect(() => {
    // Scroll the app panel directly so mobile keyboard viewport changes do not
    // leave the newest message or input just below the visible area.
    const mainPanel = mainPanelRef.current
    if (!mainPanel) {
      return
    }

    const shouldScrollFirstMobileMessageToTop = pendingMobileFirstMessageTopScrollRef.current
    if (shouldScrollFirstMobileMessageToTop) { pendingMobileFirstMessageTopScrollRef.current = false }
    const shouldHoldMobileFirstMessageTopPosition = isMobile && holdMobileFirstMessageTopPositionRef.current && chatList.length > 0

    const scrollTimer = window.setTimeout(() => {
      if (shouldScrollFirstMobileMessageToTop) {
        mainPanel.scrollTop = getMobileConversationTopScroll(mainPanel)
        return
      }

      if (shouldHoldMobileFirstMessageTopPosition) {
        return
      }

      mainPanel.scrollTo({
        top: mainPanel.scrollHeight,
        behavior: 'auto',
      })
    }, 50)

    return () => window.clearTimeout(scrollTimer)
  }, [chatList, currConversationId, getMobileConversationTopScroll, isMobile])
  // user can not edit inputs if user had send message
  const canEditInputs = !chatList.some(item => item.isAnswer === false) && isNewConversation
  const createNewChat = (forceReset = false, options: StartNewConversationOptions = {}) => {
    const newConversationItem: ConversationItem = {
      id: '-1',
      name: t('app.chat.newChatDefaultName'),
      inputs: options.inputs ?? newConversationInputs,
      introduction: options.introduction ?? conversationIntroduction,
      suggested_questions: options.suggestedQuestions ?? suggestedQuestions,
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
  const generateNewChatListWithOpenStatement = (
    introduction?: string,
    inputs?: Record<string, any> | null,
    promptVariables: PromptVariable[] = promptConfig?.prompt_variables || [],
  ) => {
    let calculatedIntroduction = introduction || conversationIntroduction || ''
    const calculatedPromptVariables = inputs || currInputs || null
    if (calculatedIntroduction && calculatedPromptVariables) { calculatedIntroduction = replaceVarWithValues(calculatedIntroduction, promptVariables, calculatedPromptVariables) }

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

  const startNewConversation = ({
    forceReset = false,
    inputs = getDefaultPromptInputs(promptConfig?.prompt_variables || []),
    introduction = latestConversationIntroduction,
    suggestedQuestions: nextSuggestedQuestions = latestSuggestedQuestions,
    promptVariables = promptConfig?.prompt_variables || [],
    showInHistory = true,
  }: StartNewConversationOptions = {}) => {
    resetMobileFirstMessageTopPosition()
    setNewConversationInputs(inputs)
    if (showInHistory) {
      createNewChat(forceReset, {
        inputs,
        introduction,
        suggestedQuestions: nextSuggestedQuestions,
      })
    }
    setConversationIdChangeBecauseOfNew(true)
    setChatStarted()
    setChatList(generateNewChatListWithOpenStatement(introduction, inputs, promptVariables))
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
        const firstConversation = conversations[0]
        const savedConversationId = getConversationIdFromStorage(APP_ID)
        const savedConversation = savedConversationId ? conversations.find(item => item.id === savedConversationId) : undefined
        const initialConversation = savedConversation || firstConversation

        // fetch new conversation info
        const { user_input_form, opening_statement: introduction, file_upload, system_parameters, suggested_questions = [] }: any = appParams
        setLocaleOnClient(APP_INFO.default_language, true)
        setNewConversationInfo({
          name: t('app.chat.newChatDefaultName'),
          introduction,
          suggested_questions,
        })
        if (initialConversation) {
          setExistConversationInfo({
            name: initialConversation.name || t('app.chat.newChatDefaultName'),
            introduction: initialConversation.introduction || introduction,
            suggested_questions: initialConversation.suggested_questions || suggested_questions,
          })
        }
        const prompt_variables = userInputsFormToPromptVariables(user_input_form)
        const defaultInputs = getDefaultPromptInputs(prompt_variables)
        setNewConversationInputs(defaultInputs)
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

        if (initialConversation) { setCurrConversationId(initialConversation.id, APP_ID) }
        else if (conversations.length === 0) {
          startNewConversation({
            inputs: defaultInputs,
            introduction,
            suggestedQuestions,
            promptVariables: prompt_variables,
          })
        }

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
  const [isSendLocked, { setTrue: lockSending, setFalse: unlockSending }] = useBoolean(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const sendRequestIdRef = useRef(0)
  const suggestedQuestionsRequestIdRef = useRef(0)
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

  const finishResponseStream = () => {
    abortControllerRef.current = null
    setMessageTaskId('')
    setRespondingFalse()
  }

  const finishCurrentResponse = () => {
    finishResponseStream()
    unlockSending()
    resetRespondingConversationRefs()
  }

  const getPromotedConversationInfo = (conversation: ConversationItem) => ({
    name: conversation.name || t('app.chat.newChatDefaultName'),
    introduction: conversation.introduction || conversationIntroduction,
    suggested_questions: conversation.suggested_questions || suggestedQuestions,
  })

  const promoteNewConversation = (conversationId: string, syncedConversation?: ConversationItem) => {
    if (!conversationId) { return }

    const fallbackConversation: ConversationItem = {
      id: conversationId,
      name: conversationName,
      inputs: currInputs,
      introduction: conversationIntroduction,
      suggested_questions: suggestedQuestions,
    }
    const tempConversation = conversationList.find(item => item.id === '-1')
    const promotedConversation: ConversationItem = {
      id: conversationId,
      name: syncedConversation?.name || tempConversation?.name || fallbackConversation.name,
      inputs: syncedConversation?.inputs ?? tempConversation?.inputs ?? fallbackConversation.inputs,
      introduction: syncedConversation?.introduction ?? tempConversation?.introduction ?? fallbackConversation.introduction,
      suggested_questions: syncedConversation?.suggested_questions || tempConversation?.suggested_questions || fallbackConversation.suggested_questions,
    }

    setConversationList(currentConversationList => produce(currentConversationList, (draft) => {
      const existingConversationIndex = draft.findIndex(item => item.id === conversationId)
      const tempConversationIndex = draft.findIndex(item => item.id === '-1')

      if (existingConversationIndex > -1) {
        draft[existingConversationIndex] = {
          ...draft[existingConversationIndex],
          ...promotedConversation,
          id: conversationId,
        }
        if (tempConversationIndex > -1 && tempConversationIndex !== existingConversationIndex) { draft.splice(tempConversationIndex, 1) }
        return
      }

      if (tempConversationIndex > -1) {
        draft[tempConversationIndex] = promotedConversation
        return
      }

      draft.unshift(promotedConversation)
    }))
    setExistConversationInfo(getPromotedConversationInfo(promotedConversation))
    setConversationIdChangeBecauseOfNew(false)
    resetNewConversationInputs()
    setChatNotStarted()
    skipNextConversationSwitchChatFetchRef.current = true
    setCurrConversationId(conversationId, APP_ID, true)
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
    const isDeletingLastConversation = nextConversationList.length === 0
    const nextConversationId = nextConversationList[0]?.id || '-1'

    if (isDeletingCurrentConversation) { resetMobileFirstMessageTopPosition() }
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
        startNewConversation({ forceReset: true })
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

          const restoredConversationList = isDeletingLastConversation
            ? currentConversationList.filter(item => item.id !== '-1')
            : [...currentConversationList]
          restoredConversationList.splice(
            Math.min(deletedConversationIndex, restoredConversationList.length),
            0,
            deletedConversation,
          )
          return restoredConversationList
        })
      }

      if (isDeletingCurrentConversation && getCurrConversationId() === nextConversationId) {
        setConversationIdChangeBecauseOfNew(false)
        setCurrConversationId(id, APP_ID)
      }

      notify({ type: 'error', message: error?.message || t('app.chat.deleteConversationFailed') })
    }
  }

  const checkCanSend = () => {
    if (isCurrentConversationStale) { return false }

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
  const [hasStopResponded, setHasStopResponded] = useState(false)
  const [isRespondingConIsCurrCon, setIsRespondingConCurrCon, getIsRespondingConIsCurrCon] = useGetState(true)
  const [userQuery, setUserQuery] = useState('')

  const cutOffCurrentResponse = () => {
    sendRequestIdRef.current += 1
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setMessageTaskId('')
    setIsRespondingConCurrCon(true)
    setRespondingFalse()
    unlockSending()
  }

  const removeEmptyTrailingAnswer = () => {
    setChatList(produce(getChatList(), (draft) => {
      const lastItem = draft[draft.length - 1]
      if (!lastItem?.isAnswer) { return }
      if (lastItem.content || lastItem.agent_thoughts?.length || lastItem.workflowProcess) { return }

      draft.pop()
    }))
  }

  const handleStopResponding = async () => {
    if (!isResponding || hasStopResponded) { return }

    const taskId = messageTaskId
    const shouldSyncNewConversation = getConversationIdChangeBecauseOfNew()
    const startedConversationId = respondingConversationIdRef.current || ''
    setHasStopResponded(true)

    const stopResponsePromise = taskId ? stopChatMessage(taskId) : Promise.resolve()
    cutOffCurrentResponse()
    removeEmptyTrailingAnswer()

    try {
      await stopResponsePromise
    }
    catch (error: any) {
      notify({ type: 'error', message: error?.message || 'Failed to stop responding' })
    }

    if (shouldSyncNewConversation && startedConversationId) {
      try {
        const syncedConversations = await syncConversationHistory({
          autoGenerateNameForId: startedConversationId,
        })
        const nextConversation = syncedConversations?.find(item => item.id === startedConversationId)
        promoteNewConversation(startedConversationId, nextConversation)
      }
      catch (error: any) {
        notify({ type: 'error', message: error?.message || 'Failed to load conversation' })
      }
    }

    resetRespondingConversationRefs()
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

  const updateRetryAnswer = (answerGroupId: string, responseItem: ChatItem) => {
    setChatList(produce(getChatList(), (draft) => {
      const currentIndex = draft.findIndex(item => item.isAnswer && isSameAnswerGroup(item, answerGroupId))
      if (currentIndex === -1) { return }

      draft[currentIndex] = replaceAnswerVariant(draft[currentIndex], responseItem.answerVariantId || responseItem.id, responseItem)
    }))
  }

  const finalizeRetryAnswer = (answerGroupId: string, responseItem: ChatItem) => {
    setChatList(produce(getChatList(), (draft) => {
      const currentIndex = draft.findIndex(item => item.isAnswer && isSameAnswerGroup(item, answerGroupId))
      if (currentIndex === -1) { return }

      draft[currentIndex] = replaceAnswerVariant(draft[currentIndex], responseItem.answerVariantId || responseItem.id, responseItem)
    }))
  }

  const removeRetryAnswer = (answerGroupId: string, variantId: string) => {
    setChatList(produce(getChatList(), (draft) => {
      const currentIndex = draft.findIndex(item => item.isAnswer && isSameAnswerGroup(item, answerGroupId))
      if (currentIndex === -1) { return }

      draft[currentIndex] = removeAnswerVariant(draft[currentIndex], variantId)
    }))
  }

  const setSuggestedQuestionsLoading = (messageId: string) => {
    setChatList(produce(getChatList(), (draft) => {
      const current = draft.find(item => item.id === messageId || isSameAnswerGroup(item, messageId))
      if (!current) { return }

      draft.forEach((item) => {
        if (item.isAnswer) {
          item.suggestedQuestions = []
          item.suggestedQuestionsLoading = false
        }
      })
      current.suggestedQuestionsLoading = true
    }))
  }

  const applySuggestedQuestionsToAnswer = (messageId: string, questions: string[]) => {
    setChatList(produce(getChatList(), (draft) => {
      const current = draft.find(item => item.id === messageId || isSameAnswerGroup(item, messageId))
      if (!current) { return }

      draft.forEach((item) => {
        if (item.isAnswer && item.id !== current.id) {
          item.suggestedQuestions = []
          item.suggestedQuestionsLoading = false
        }
      })
      current.suggestedQuestionsLoading = false
      current.suggestedQuestions = questions
    }))
  }

  const loadSuggestedQuestions = async (messageId: string, requestId: number, shouldApply = () => true) => {
    try {
      const nextSuggestedQuestions = await fetchSuggestedQuestions(messageId)
      if (suggestedQuestionsRequestIdRef.current === requestId && shouldApply()) { applySuggestedQuestionsToAnswer(messageId, nextSuggestedQuestions) }
    }
    catch {
      if (suggestedQuestionsRequestIdRef.current === requestId && shouldApply()) { applySuggestedQuestionsToAnswer(messageId, []) }
      // Suggested questions are optional; a failure here should not affect the completed answer.
    }
  }

  const transformToServerFile = (fileItem: any) => {
    return {
      type: 'image',
      transfer_method: fileItem.transferMethod,
      url: fileItem.url,
      upload_file_id: fileItem.id,
    }
  }

  const handleSend = (message: string, files?: VisionFile[], options?: { answerHistory?: ChatItem[], baseChatList?: ChatItem[] }) => {
    if (isCurrentConversationStale) { return false }

    if (isSendLocked) {
      notify({ type: 'info', message: t('app.errorMessage.waitForResponse') })
      return false
    }
    suggestedQuestionsRequestIdRef.current += 1
    setHasStopResponded(false)
    const currentConversationId = getCurrConversationId()
    const isSendingNewConversation = currentConversationId === '-1'
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
      conversation_id: isSendingNewConversation ? null : currentConversationId,
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

    const currentChatList = (options?.baseChatList || getChatList()).map(item =>
      item.isAnswer && (item.suggestedQuestions?.length || item.suggestedQuestionsLoading)
        ? { ...item, suggestedQuestions: [], suggestedQuestionsLoading: false }
        : item,
    )
    const newList = [...currentChatList, questionItem, placeholderAnswerItem]
    const shouldKeepMobileFirstMessageAtTop = isMobile && currentChatList.length === 0
    if (shouldKeepMobileFirstMessageAtTop) {
      pendingMobileFirstMessageTopScrollRef.current = true
      holdMobileFirstMessageTopPositionRef.current = true
    }
    else {
      resetMobileFirstMessageTopPosition()
    }
    setChatList(newList)

    // answer
    const responseItem: ChatItem = {
      id: `${Date.now()}`,
      content: '',
      agent_thoughts: [],
      message_files: [],
      isAnswer: true,
    }
    const answerHistory = options?.answerHistory || []
    const getResponseItem = () => withAnswerHistory(responseItem, answerHistory)
    let hasSetResponseId = false

    const prevTempNewConversationId = currentConversationId || '-1'
    let tempNewConversationId = ''
    const requestId = sendRequestIdRef.current + 1
    sendRequestIdRef.current = requestId
    const isCurrentRequest = () => sendRequestIdRef.current === requestId

    respondingConversationIdRef.current = isSendingNewConversation ? null : currentConversationId
    hasStartedRespondingConversationRef.current = false

    lockSending()
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

        responseItem.content = responseItem.content + message
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
          responseItem: getResponseItem(),
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      async onCompleted(hasError?: boolean) {
        if (!isCurrentRequest()) { return }

        if (hasError) {
          finishCurrentResponse()
          setChatList(produce(getChatList(), (draft) => {
            const placeholderIndex = draft.findIndex(item => item.id === placeholderAnswerId)
            if (placeholderIndex > -1) { draft.splice(placeholderIndex, 1) }
          }))
          return
        }

        const responseMessageId = hasSetResponseId ? responseItem.id : ''
        if (responseMessageId) { setSuggestedQuestionsLoading(responseMessageId) }

        const shouldSyncNewConversation = getConversationIdChangeBecauseOfNew()
        const startedConversationId = tempNewConversationId || respondingConversationIdRef.current || ''
        finishResponseStream()

        let nextConversationId = startedConversationId
        let syncedConversations: ConversationItem[] | undefined

        if (shouldSyncNewConversation && !nextConversationId) {
          try {
            syncedConversations = await syncConversationHistory({
              autoGenerateNameForId: startedConversationId || null,
            })
            nextConversationId = syncedConversations?.[0]?.id || ''
          }
          catch (error: any) {
            notify({ type: 'error', message: error?.message || 'Failed to load conversation' })
          }
        }

        if (!isCurrentRequest()) { return }

        const suggestedRequestId = suggestedQuestionsRequestIdRef.current + 1
        suggestedQuestionsRequestIdRef.current = suggestedRequestId

        if (responseMessageId) { void loadSuggestedQuestions(responseMessageId, suggestedRequestId) }

        if (shouldSyncNewConversation && !nextConversationId) { return }

        const nextConversation = syncedConversations?.find(item => item.id === nextConversationId)
        if (shouldSyncNewConversation && nextConversationId) { promoteNewConversation(nextConversationId, nextConversation) }

        unlockSending()
        resetRespondingConversationRefs()

        if (shouldSyncNewConversation && nextConversationId) {
          const conversationIdToSync = nextConversationId
          void (async () => {
            let latestConversations: ConversationItem[] | undefined
            try {
              latestConversations = await syncConversationHistory({
                autoGenerateNameForId: conversationIdToSync,
              })
            }
            catch (error: any) {
              notify({ type: 'error', message: error?.message || 'Failed to load conversation' })
              return
            }

            const syncedConversation = latestConversations?.find(item => item.id === conversationIdToSync)
            if (syncedConversation && getCurrConversationId() === conversationIdToSync) { setExistConversationInfo(getPromotedConversationInfo(syncedConversation)) }
          })()
        }
      },
      onFile(file) {
        if (!isCurrentRequest()) { return }

        markRespondingConversationStarted(respondingConversationIdRef.current || undefined)

        const lastThought = responseItem.agent_thoughts?.[responseItem.agent_thoughts?.length - 1]
        if (lastThought) { lastThought.message_files = [...(lastThought as any).message_files, { ...file }] }

        updateCurrentQA({
          responseItem: getResponseItem(),
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      onThought(thought) {
        if (!isCurrentRequest()) { return }

        markRespondingConversationStarted(respondingConversationIdRef.current || undefined)

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
            thought.thought = thought.thought || lastThought.thought
            thought.message_files = lastThought.message_files || thought.message_files
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
          responseItem: getResponseItem(),
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      onMessageEnd: (messageEnd) => {
        if (!isCurrentRequest()) { return }

        markRespondingConversationStarted(respondingConversationIdRef.current || undefined)

        if (messageEnd.id && !hasSetResponseId) {
          responseItem.id = messageEnd.id
          hasSetResponseId = true
        }

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

              draft.push(getResponseItem())
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

            draft.push(getResponseItem())
          },
        )
        setChatList(newListWithAnswer)
      },
      onMessageReplace: (messageReplace) => {
        if (!isCurrentRequest()) { return }

        markRespondingConversationStarted(messageReplace.conversation_id || respondingConversationIdRef.current || undefined)
        responseItem.content = messageReplace.answer

        setChatList(produce(
          getChatList(),
          (draft) => {
            const current = draft.find(item => item.id === messageReplace.id)

            if (current) { Object.assign(current, getResponseItem()) }
          },
        ))
      },
      onError(_message, code) {
        if (!isCurrentRequest()) { return }

        finishCurrentResponse()
        if (code === 'aborted') { return }

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
            ...getResponseItem(),
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
            ...getResponseItem(),
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
            ...getResponseItem(),
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
            ...getResponseItem(),
          }
        }))
      },
    })
    return true
  }

  const handleRetry = (answer: ChatItem, overrideQuestionContent?: string, baseChatList?: ChatItem[]) => {
    if (isCurrentConversationStale) { return }

    if (isSendLocked) {
      notify({ type: 'info', message: t('app.errorMessage.waitForResponse') })
      return
    }

    const currentChatList = baseChatList || getChatList()
    const answerGroupId = getAnswerGroupId(answer)
    const answerIndex = currentChatList.findIndex(item => item.isAnswer && isSameAnswerGroup(item, answerGroupId))
    if (answerIndex === -1) { return }

    const questionItem = [...currentChatList.slice(0, answerIndex)].reverse().find(item => !item.isAnswer)
    const retryQuery = overrideQuestionContent?.trim() || questionItem?.content || ''
    if (!retryQuery) {
      notify({ type: 'error', message: 'Unable to retry this message' })
      return
    }

    suggestedQuestionsRequestIdRef.current += 1
    setHasStopResponded(false)

    const currentConversationId = getCurrConversationId()
    const retryVariantId = `answer-retry-${Date.now()}`
    const responseItem: ChatItem = {
      id: retryVariantId,
      answerVariantId: retryVariantId,
      content: '',
      agent_thoughts: [],
      message_files: [],
      isAnswer: true,
      isRetrying: true,
    }

    setChatList(produce(currentChatList, (draft) => {
      draft.forEach((item) => {
        if (item.isAnswer) {
          item.suggestedQuestions = []
          item.suggestedQuestionsLoading = false
        }
      })

      const currentIndex = draft.findIndex(item => item.isAnswer && isSameAnswerGroup(item, answerGroupId))
      if (currentIndex === -1) { return }

      draft[currentIndex] = appendAnswerVariant(draft[currentIndex], responseItem)
    }))

    const retryFiles = (questionItem?.message_files || []).filter(file => file.transfer_method && (file.upload_file_id || file.url))
    const data: Record<string, any> = {
      inputs: {},
      query: retryQuery,
      conversation_id: currentConversationId === '-1' ? null : currentConversationId,
    }

    if (retryFiles.length > 0) {
      data.files = retryFiles.map((item) => {
        if (item.transfer_method === TransferMethod.local_file) {
          return {
            ...item,
            url: '',
          }
        }
        return item
      })
    }

    let hasSetResponseId = false
    const requestId = sendRequestIdRef.current + 1
    sendRequestIdRef.current = requestId
    const isCurrentRequest = () => sendRequestIdRef.current === requestId
    const isStillOnConversation = () => getCurrConversationId() === currentConversationId

    respondingConversationIdRef.current = currentConversationId === '-1' ? null : currentConversationId
    hasStartedRespondingConversationRef.current = false

    lockSending()
    setRespondingTrue()
    sendChatMessage(data, {
      getAbortController: (abortController) => {
        if (isCurrentRequest()) {
          abortControllerRef.current = abortController
          return
        }

        abortController.abort()
      },
      onData: (message: string, _isFirstMessage: boolean, { conversationId: newConversationId, messageId, taskId }: any) => {
        if (!isCurrentRequest()) { return }

        if (message || messageId || newConversationId) { markRespondingConversationStarted(newConversationId || respondingConversationIdRef.current || undefined) }

        responseItem.content = responseItem.content + message
        if (messageId && !hasSetResponseId) {
          responseItem.id = messageId
          hasSetResponseId = true
        }

        setMessageTaskId(taskId)
        if (!isStillOnConversation()) {
          setIsRespondingConCurrCon(false)
          return
        }

        updateRetryAnswer(answerGroupId, responseItem)
      },
      async onCompleted(hasError?: boolean) {
        if (!isCurrentRequest()) { return }

        if (hasError) {
          finishCurrentResponse()
          removeRetryAnswer(answerGroupId, retryVariantId)
          return
        }

        responseItem.isRetrying = false
        finalizeRetryAnswer(answerGroupId, responseItem)

        const responseMessageId = hasSetResponseId ? responseItem.id : ''
        if (responseMessageId) { setSuggestedQuestionsLoading(responseMessageId) }

        finishCurrentResponse()

        const suggestedRequestId = suggestedQuestionsRequestIdRef.current + 1
        suggestedQuestionsRequestIdRef.current = suggestedRequestId

        if (responseMessageId) { void loadSuggestedQuestions(responseMessageId, suggestedRequestId, isStillOnConversation) }
      },
      onFile(file) {
        if (!isCurrentRequest()) { return }

        markRespondingConversationStarted(respondingConversationIdRef.current || undefined)

        const lastThought = responseItem.agent_thoughts?.[responseItem.agent_thoughts?.length - 1]
        if (lastThought) { lastThought.message_files = [...(lastThought as any).message_files, { ...file }] }

        updateRetryAnswer(answerGroupId, responseItem)
      },
      onThought(thought) {
        if (!isCurrentRequest()) { return }

        markRespondingConversationStarted(respondingConversationIdRef.current || undefined)

        const response = responseItem as any
        if (thought.message_id && !hasSetResponseId) {
          response.id = thought.message_id
          hasSetResponseId = true
        }
        if (response.agent_thoughts.length === 0) {
          response.agent_thoughts.push(thought)
        }
        else {
          const lastThought = response.agent_thoughts[response.agent_thoughts.length - 1]
          if (lastThought.id === thought.id) {
            thought.thought = thought.thought || lastThought.thought
            thought.message_files = lastThought.message_files || thought.message_files
            responseItem.agent_thoughts![response.agent_thoughts.length - 1] = thought
          }
          else {
            responseItem.agent_thoughts!.push(thought)
          }
        }
        if (!isStillOnConversation()) {
          setIsRespondingConCurrCon(false)
          return false
        }

        updateRetryAnswer(answerGroupId, responseItem)
      },
      onMessageEnd: (messageEnd) => {
        if (!isCurrentRequest()) { return }

        markRespondingConversationStarted(respondingConversationIdRef.current || undefined)

        if (messageEnd.id && !hasSetResponseId) {
          responseItem.id = messageEnd.id
          hasSetResponseId = true
        }

        if (messageEnd.metadata?.annotation_reply) {
          responseItem.id = messageEnd.id
          responseItem.annotation = ({
            id: messageEnd.metadata.annotation_reply.id,
            authorName: messageEnd.metadata.annotation_reply.account.name,
          } as AnnotationType)
        }

        finalizeRetryAnswer(answerGroupId, responseItem)
      },
      onMessageReplace: (messageReplace) => {
        if (!isCurrentRequest()) { return }

        markRespondingConversationStarted(messageReplace.conversation_id || respondingConversationIdRef.current || undefined)
        responseItem.content = messageReplace.answer
        finalizeRetryAnswer(answerGroupId, responseItem)
      },
      onError(_message, code) {
        if (!isCurrentRequest()) { return }

        finishCurrentResponse()
        if (code === 'aborted') { return }

        removeRetryAnswer(answerGroupId, retryVariantId)
      },
      onWorkflowStarted: ({ workflow_run_id }) => {
        if (!isCurrentRequest()) { return }

        markRespondingConversationStarted(respondingConversationIdRef.current || undefined)

        responseItem.workflow_run_id = workflow_run_id
        responseItem.workflowProcess = {
          status: WorkflowRunningStatus.Running,
          tracing: [],
        }
        updateRetryAnswer(answerGroupId, responseItem)
      },
      onWorkflowFinished: ({ data }) => {
        if (!isCurrentRequest()) { return }
        if (!responseItem.workflowProcess) { return }

        markRespondingConversationStarted(respondingConversationIdRef.current || undefined)

        responseItem.workflowProcess!.status = data.status as WorkflowRunningStatus
        updateRetryAnswer(answerGroupId, responseItem)
      },
      onNodeStarted: ({ data }) => {
        if (!isCurrentRequest()) { return }
        if (!responseItem.workflowProcess?.tracing) { return }

        markRespondingConversationStarted(respondingConversationIdRef.current || undefined)

        responseItem.workflowProcess!.tracing!.push(data as any)
        updateRetryAnswer(answerGroupId, responseItem)
      },
      onNodeFinished: ({ data }) => {
        if (!isCurrentRequest()) { return }
        if (!responseItem.workflowProcess?.tracing) { return }

        markRespondingConversationStarted(respondingConversationIdRef.current || undefined)

        const currentIndex = responseItem.workflowProcess!.tracing!.findIndex(item => item.node_id === data.node_id)
        if (currentIndex === -1) { return }

        responseItem.workflowProcess!.tracing[currentIndex] = data as any
        updateRetryAnswer(answerGroupId, responseItem)
      },
    })
  }

  const handleQuestionVariantChange = (question: ChatItem, index: number) => {
    setChatList(produce(getChatList(), (draft) => {
      const questionGroupId = getQuestionGroupId(question)
      const currentIndex = draft.findIndex(item => !item.isAnswer && isSameQuestionGroup(item, questionGroupId))
      if (currentIndex === -1) { return }

      draft[currentIndex] = setActiveQuestionVariantIndex(draft[currentIndex], index)
    }))
  }

  const handleAnswerVariantChange = (answer: ChatItem, index: number) => {
    setChatList(produce(getChatList(), (draft) => {
      const answerGroupId = getAnswerGroupId(answer)
      const currentIndex = draft.findIndex(item => item.isAnswer && isSameAnswerGroup(item, answerGroupId))
      if (currentIndex === -1) { return }

      draft[currentIndex] = setActiveAnswerVariantIndex(draft[currentIndex], index)
    }))
  }

  const handleFeedback = async (messageId: string, feedback: Feedbacktype) => {
    await updateFeedback({ url: `/messages/${messageId}/feedbacks`, body: feedback })
    const newChatList = chatList.map((item) => {
      if (item.isAnswer && isSameAnswerGroup(item, messageId)) {
        const targetVariant = item.answerVariants?.find(variant => variant.id === messageId || variant.answerVariantId === messageId) || item
        return replaceAnswerVariant(item, messageId, {
          ...targetVariant,
          feedback,
        })
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
        title={APP_INFO.title}
        onCurrentIdChange={handleConversationIdChange}
        onDeleteConversation={handleDeleteConversation}
        onToggleCollapse={isMobile ? undefined : collapseSidebar}
        themePreference={themePreference}
        onThemeChange={setThemePreference}
        currentId={currConversationId}
      />
    )
  }

  if (appUnavailable) { return <AppUnavailable isUnknownReason={isUnknownReason} errMessage={!hasSetAppConfig ? 'Please set NEXT_PUBLIC_APP_ID in .env' : ''} /> }

  if (!APP_ID || !APP_INFO || !promptConfig) { return <Loading type='app' /> }

  const desktopSidebarClassName = [
    'flex shrink-0 flex-col overflow-hidden transition-[width,opacity] duration-200 ease-in-out',
    isSidebarCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-[236px] opacity-100',
  ].join(' ')

  return (
    <div className={`app-shell theme-${effectiveTheme} flex h-full flex-col`}>
      <div className="flex min-h-0 flex-1">
        {/* sidebar */}
        {!isMobile && (
          <div
            className={desktopSidebarClassName}
            aria-hidden={isSidebarCollapsed}
          >
            {renderSidebar()}
          </div>
        )}
        {isMobile && isShowSidebar && (
          <div className='fixed inset-0 z-50' style={{ backgroundColor: 'rgba(35, 56, 118, 0.2)' }} onClick={hideSidebar} >
            <div className='inline-block h-full' onClick={e => e.stopPropagation()}>
              {renderSidebar()}
            </div>
          </div>
        )}
        {/* main */}
        <div className={isMobile ? 'relative min-w-0 grow p-0' : 'relative min-w-0 grow p-2'}>
          <div
            ref={mainPanelRef}
            className={isMobile
              ? 'app-main-panel flex h-full min-w-0 flex-col overflow-y-auto rounded-none border-0 shadow-none'
              : 'app-main-panel flex h-full min-w-0 flex-col overflow-y-auto rounded-2xl border-0 shadow-none'}
          >
            <Header
              title={APP_INFO.title}
              conversationName={conversationName}
              isMobile={isMobile}
              isSidebarCollapsed={isSidebarCollapsed}
              onShowSideBar={showSidebar}
              onToggleSidebar={isSidebarCollapsed ? expandSidebar : toggleSidebarCollapsed}
              onCreateNewChat={() => handleConversationIdChange('-1')}
            />
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
                <div className='chat-scroll-content relative mx-auto mb-3.5 w-full max-w-[768px] grow pb-[180px]' ref={chatListDomRef}>
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
                        onRetry={handleRetry}
                        onQuestionVariantChange={handleQuestionVariantChange}
                        onVariantChange={handleAnswerVariantChange}
                        isResponding={isResponding}
                        hasStopResponded={hasStopResponded}
                        isSendLocked={isSendLocked}
                        onStopResponding={handleStopResponding}
                        checkCanSend={checkCanSend}
                        visionConfig={visionConfig}
                        fileConfig={fileConfig}
                        isSidebarCollapsed={isSidebarCollapsed}
                        isConversationStale={isCurrentConversationStale}
                        onStartLatestConversation={() => handleConversationIdChange('-1')}
                      />
                    )}
                </div>)
            }
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(Main)
