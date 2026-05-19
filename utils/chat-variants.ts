interface VariantCarrier {
  id: string
  content: string
  isAnswer: boolean
  questionGroupId?: string
  activeQuestionVariantIndex?: number
  questionVariants?: VariantCarrier[]
  answerGroupId?: string
  activeAnswerVariantIndex?: number
  answerVariants?: VariantCarrier[]
  [key: string]: any
}

const clampIndex = (index: number, length: number) => {
  if (length <= 0) { return 0 }
  return Math.min(Math.max(index, 0), length - 1)
}

const stripVariantState = <T extends VariantCarrier>(item: T): T => {
  const {
    questionGroupId: _questionGroupId,
    questionVariants: _questionVariants,
    activeQuestionVariantIndex: _activeQuestionVariantIndex,
    answerGroupId: _answerGroupId,
    answerVariants: _answerVariants,
    activeAnswerVariantIndex: _activeAnswerVariantIndex,
    ...variant
  } = item

  return variant as T
}

export const getQuestionGroupId = <T extends VariantCarrier>(item: T) => item.questionGroupId || item.id

export const getQuestionVariants = <T extends VariantCarrier>(item: T): T[] => {
  if (item.questionVariants?.length) { return item.questionVariants.map(variant => stripVariantState(variant as T)) }

  return [stripVariantState(item)]
}

export const getActiveQuestionVariantIndex = <T extends VariantCarrier>(item: T) => {
  const variants = getQuestionVariants(item)
  return clampIndex(item.activeQuestionVariantIndex ?? variants.length - 1, variants.length)
}

export const getActiveQuestionVariant = <T extends VariantCarrier>(item: T): T => {
  const variants = getQuestionVariants(item)
  return variants[getActiveQuestionVariantIndex(item)] || stripVariantState(item)
}

export const getQuestionVariantCount = <T extends VariantCarrier>(item: T) => getQuestionVariants(item).length

const applyActiveQuestionVariant = <T extends VariantCarrier>(item: T, variants: T[], activeIndex: number): T => {
  const nextActiveIndex = clampIndex(activeIndex, variants.length)
  const activeVariant = variants[nextActiveIndex] || stripVariantState(item)
  const questionGroupId = getQuestionGroupId(item)

  return {
    ...item,
    ...activeVariant,
    id: questionGroupId,
    questionGroupId,
    questionVariants: variants.map(variant => stripVariantState(variant)),
    activeQuestionVariantIndex: nextActiveIndex,
  }
}

export const appendQuestionVariant = <T extends VariantCarrier>(item: T, variant: T): T => {
  const variants = [
    ...getQuestionVariants(item),
    stripVariantState(variant),
  ]

  return applyActiveQuestionVariant(item, variants, variants.length - 1)
}

export const setActiveQuestionVariantIndex = <T extends VariantCarrier>(item: T, index: number): T => {
  return applyActiveQuestionVariant(item, getQuestionVariants(item), index)
}

export const isSameQuestionGroup = <T extends VariantCarrier>(item: T, groupId: string) => {
  return getQuestionGroupId(item) === groupId || item.id === groupId || item.questionVariants?.some(variant => variant.id === groupId || variant.questionVariantId === groupId)
}

export const getAnswerGroupId = <T extends VariantCarrier>(item: T) => item.answerGroupId || item.id

export const getAnswerVariants = <T extends VariantCarrier>(item: T): T[] => {
  if (item.answerVariants?.length) { return item.answerVariants.map(variant => stripVariantState(variant as T)) }

  return [stripVariantState(item)]
}

export const getActiveAnswerVariantIndex = <T extends VariantCarrier>(item: T) => {
  const variants = getAnswerVariants(item)
  return clampIndex(item.activeAnswerVariantIndex ?? variants.length - 1, variants.length)
}

export const getActiveAnswerVariant = <T extends VariantCarrier>(item: T): T => {
  const variants = getAnswerVariants(item)
  return variants[getActiveAnswerVariantIndex(item)] || stripVariantState(item)
}

export const getAnswerVariantCount = <T extends VariantCarrier>(item: T) => getAnswerVariants(item).length

const applyActiveVariant = <T extends VariantCarrier>(item: T, variants: T[], activeIndex: number): T => {
  const nextActiveIndex = clampIndex(activeIndex, variants.length)
  const activeVariant = variants[nextActiveIndex] || stripVariantState(item)
  const answerGroupId = getAnswerGroupId(item)

  return {
    ...item,
    ...activeVariant,
    id: answerGroupId,
    answerGroupId,
    answerVariants: variants.map(variant => stripVariantState(variant)),
    activeAnswerVariantIndex: nextActiveIndex,
  }
}

export const appendAnswerVariant = <T extends VariantCarrier>(item: T, variant: T): T => {
  const variants = [
    ...getAnswerVariants(item),
    stripVariantState(variant),
  ]

  return applyActiveVariant(item, variants, variants.length - 1)
}

export const replaceActiveAnswerVariant = <T extends VariantCarrier>(item: T, variant: T): T => {
  const variants = getAnswerVariants(item)
  const activeIndex = getActiveAnswerVariantIndex(item)
  variants[activeIndex] = stripVariantState(variant)

  return applyActiveVariant(item, variants, activeIndex)
}

export const replaceAnswerVariant = <T extends VariantCarrier>(item: T, variantId: string, variant: T): T => {
  const variants = getAnswerVariants(item)
  const targetIndex = variants.findIndex(answerVariant => answerVariant.id === variantId || answerVariant.answerVariantId === variantId)
  if (targetIndex === -1) { return item }

  variants[targetIndex] = stripVariantState(variant)

  return applyActiveVariant(item, variants, getActiveAnswerVariantIndex(item))
}

export const removeAnswerVariantAtIndex = <T extends VariantCarrier>(item: T, index: number): T => {
  const variants = getAnswerVariants(item)
  if (variants.length <= 1) { return item }

  const targetIndex = clampIndex(index, variants.length)
  variants.splice(targetIndex, 1)

  return applyActiveVariant(item, variants, Math.min(targetIndex, variants.length - 1))
}

export const removeAnswerVariant = <T extends VariantCarrier>(item: T, variantId: string): T => {
  const variants = getAnswerVariants(item)
  const targetIndex = variants.findIndex(answerVariant => answerVariant.id === variantId || answerVariant.answerVariantId === variantId)
  if (targetIndex === -1) { return item }

  return removeAnswerVariantAtIndex(item, targetIndex)
}

export const setActiveAnswerVariantIndex = <T extends VariantCarrier>(item: T, index: number): T => {
  return applyActiveVariant(item, getAnswerVariants(item), index)
}

export const isSameAnswerGroup = <T extends VariantCarrier>(item: T, groupId: string) => {
  return getAnswerGroupId(item) === groupId || item.id === groupId || item.answerVariants?.some(variant => variant.id === groupId)
}
