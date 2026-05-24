export interface ThoughtBlock {
  content: string
  title?: string
  isComplete: boolean
}

const thoughtTagRegex = /<(think|thought)\b[^>]*>([\s\S]*?)(<\/\1>|$)/i
const thinkDetailsRegex = /<details\b(?=[^>]*\bdata-think(?:=(?:"true"|'true'|true))?)[^>]*>([\s\S]*?)(<\/details>|$)/i
const summaryRegex = /<summary\b[^>]*>([\s\S]*?)(<\/summary>|$)/i
const htmlTagRegex = /<[^>]+>/g

const stripHtmlTags = (value: string) =>
  value.replace(htmlTagRegex, '').trim()

const extractDetailsContent = (rawContent: string) => {
  const summaryMatch = rawContent.match(summaryRegex)
  if (!summaryMatch) {
    return {
      title: undefined,
      content: rawContent.trim(),
    }
  }

  return {
    title: stripHtmlTags(summaryMatch[1]),
    content: rawContent.replace(summaryMatch[0], '').trim(),
  }
}

export const splitThoughtContent = (content: string) => {
  const thoughts: ThoughtBlock[] = []
  let answer = content

  const extractNextMatch = () => {
    const tagMatch = answer.match(thoughtTagRegex)
    const detailsMatch = answer.match(thinkDetailsRegex)

    if (!tagMatch && !detailsMatch) { return false }

    const tagIndex = tagMatch?.index ?? Number.POSITIVE_INFINITY
    const detailsIndex = detailsMatch?.index ?? Number.POSITIVE_INFINITY
    const shouldUseDetails = detailsIndex < tagIndex
    const match = shouldUseDetails ? detailsMatch! : tagMatch!
    const matchIndex = match.index ?? 0
    const matchedText = match[0]
    const isComplete = shouldUseDetails ? !!match[2] : !!match[3]
    const rawThoughtContent = shouldUseDetails ? match[1] : match[2]
    const detailsContent = shouldUseDetails ? extractDetailsContent(rawThoughtContent) : undefined

    thoughts.push({
      title: detailsContent?.title,
      content: (detailsContent?.content ?? rawThoughtContent).trim(),
      isComplete,
    })
    answer = `${answer.slice(0, matchIndex)}${answer.slice(matchIndex + matchedText.length)}`
    return true
  }

  let hasNextMatch = extractNextMatch()
  while (hasNextMatch) {
    hasNextMatch = extractNextMatch()
  }

  return {
    thoughts: thoughts.filter(item => item.content),
    answer: answer.trim(),
  }
}
