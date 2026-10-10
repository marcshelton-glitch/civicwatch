// Reads a Gemini generateContent response without trusting its shape.
//
// gemini-2.5-flash is a thinking model: thinking tokens are spent out of
// maxOutputTokens before the first visible word, so a small cap can leave a
// single sentence and still report HTTP 200. `finishReason: 'MAX_TOKENS'` is
// the only signal that the text was cut, so callers must look at `truncated`.

/** Cut `text` back to its last complete sentence, so a clipped reply never
 *  ends mid-word. Returns the input unchanged if no sentence end is found. */
export function trimToLastSentence(text) {
  const t = String(text ?? '').trimEnd()
  const end = Math.max(t.lastIndexOf('. '), t.lastIndexOf('.\n'), t.endsWith('.') ? t.length - 1 : -1)
  return end > 0 ? t.slice(0, end + 1) : t
}

export function readGeminiResponse(data) {
  const candidate = data?.candidates?.[0]
  const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : []
  const text = parts
    .filter(p => p && p.thought !== true && typeof p.text === 'string')
    .map(p => p.text)
    .join('')
    .trim()
  const finishReason = candidate?.finishReason ?? null
  const usage = data?.usageMetadata ?? {}

  return {
    text,
    finishReason,
    truncated: finishReason === 'MAX_TOKENS',
    inputTokens: usage.promptTokenCount ?? 0,
    outputTokens: usage.candidatesTokenCount ?? 0,
    thoughtTokens: usage.thoughtsTokenCount ?? 0,
  }
}
