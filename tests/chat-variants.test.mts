import assert from 'node:assert/strict'
import {
  appendAnswerVariant,
  appendQuestionVariant,
  getActiveAnswerVariant,
  getActiveQuestionVariant,
  removeAnswerVariantAtIndex,
  setActiveAnswerVariantIndex,
  setActiveQuestionVariantIndex,
  withAnswerHistory,
} from '../utils/chat-variants.ts'

interface TestChatItem {
  id: string
  content: string
  isAnswer: boolean
  questionVariantId?: string
  questionGroupId?: string
  activeQuestionVariantIndex?: number
  questionVariants?: TestChatItem[]
  answerGroupId?: string
  activeAnswerVariantIndex?: number
  answerVariants?: TestChatItem[]
}

const baseAnswer: TestChatItem = {
  id: 'answer-1',
  content: 'first answer',
  isAnswer: true,
}

const secondAnswer: TestChatItem = {
  id: 'answer-2',
  content: 'second answer',
  isAnswer: true,
}

const thirdAnswer: TestChatItem = {
  id: 'answer-3',
  content: 'third answer',
  isAnswer: true,
}

const withSecondVariant = appendAnswerVariant(baseAnswer, secondAnswer)
assert.equal(withSecondVariant.answerVariants?.length, 2)
assert.equal(withSecondVariant.activeAnswerVariantIndex, 1)
assert.equal(getActiveAnswerVariant(withSecondVariant).content, 'second answer')

const withThirdVariant = appendAnswerVariant(withSecondVariant, thirdAnswer)
assert.equal(withThirdVariant.answerVariants?.length, 3)
assert.equal(withThirdVariant.activeAnswerVariantIndex, 2)
assert.equal(getActiveAnswerVariant(withThirdVariant).id, 'answer-3')

const movedBack = setActiveAnswerVariantIndex(withThirdVariant, 1)
assert.equal(movedBack.activeAnswerVariantIndex, 1)
assert.equal(getActiveAnswerVariant(movedBack).content, 'second answer')

const clamped = setActiveAnswerVariantIndex(withThirdVariant, 99)
assert.equal(clamped.activeAnswerVariantIndex, 2)
assert.equal(getActiveAnswerVariant(clamped).content, 'third answer')

const removedThird = removeAnswerVariantAtIndex(withThirdVariant, 2)
assert.equal(removedThird.answerVariants?.length, 2)
assert.equal(removedThird.activeAnswerVariantIndex, 1)
assert.equal(getActiveAnswerVariant(removedThird).content, 'second answer')

const editedBranchAnswer = withAnswerHistory({
  id: 'answer-edited',
  content: 'edited branch answer',
  isAnswer: true,
}, [baseAnswer])
assert.equal(editedBranchAnswer.id, 'answer-edited')
assert.equal(editedBranchAnswer.answerGroupId, 'answer-edited')
assert.equal(editedBranchAnswer.answerVariants?.length, 2)
assert.equal(editedBranchAnswer.activeAnswerVariantIndex, 1)
assert.equal(editedBranchAnswer.answerVariants?.[0].id, 'answer-1')
assert.equal(getActiveAnswerVariant(editedBranchAnswer).content, 'edited branch answer')

const baseQuestion: TestChatItem = {
  id: 'question-1',
  content: 'first question',
  isAnswer: false,
}

const editedQuestion: TestChatItem = {
  id: 'question-2',
  questionVariantId: 'question-2',
  content: 'edited question',
  isAnswer: false,
}

const withEditedQuestion = appendQuestionVariant(baseQuestion, editedQuestion)
assert.equal(withEditedQuestion.id, 'question-1')
assert.equal(withEditedQuestion.questionVariants?.length, 2)
assert.equal(withEditedQuestion.activeQuestionVariantIndex, 1)
assert.equal(getActiveQuestionVariant(withEditedQuestion).content, 'edited question')

const originalQuestionVisible = setActiveQuestionVariantIndex(withEditedQuestion, 0)
assert.equal(originalQuestionVisible.activeQuestionVariantIndex, 0)
assert.equal(getActiveQuestionVariant(originalQuestionVisible).content, 'first question')
