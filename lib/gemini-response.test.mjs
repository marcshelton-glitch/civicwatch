// Run with: node --test lib/gemini-response.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { readGeminiResponse, trimToLastSentence } from './gemini-response.js'

const reply = (parts, finishReason = 'STOP', usage = {}) => ({
  candidates: [{ content: { parts }, finishReason }],
  usageMetadata: usage,
})

test('joins every text part, not just the first', () => {
  const r = readGeminiResponse(reply([{ text: 'One. ' }, { text: 'Two.' }]))
  assert.equal(r.text, 'One. Two.')
  assert.equal(r.truncated, false)
})

test('drops thought parts', () => {
  const r = readGeminiResponse(reply([{ text: 'secret reasoning', thought: true }, { text: 'Answer.' }]))
  assert.equal(r.text, 'Answer.')
})

test('MAX_TOKENS is reported as truncated', () => {
  const r = readGeminiResponse(reply([{ text: 'He voted for the Act of 20' }], 'MAX_TOKENS'))
  assert.equal(r.truncated, true)
  assert.equal(r.finishReason, 'MAX_TOKENS')
})

test('reads token usage including thinking tokens', () => {
  const r = readGeminiResponse(
    reply([{ text: 'x' }], 'STOP', { promptTokenCount: 400, candidatesTokenCount: 600, thoughtsTokenCount: 900 }),
  )
  assert.deepEqual([r.inputTokens, r.outputTokens, r.thoughtTokens], [400, 600, 900])
})

test('empty or malformed responses give empty text, never throw', () => {
  assert.equal(readGeminiResponse({}).text, '')
  assert.equal(readGeminiResponse(null).text, '')
  assert.equal(readGeminiResponse({ candidates: [{}] }).text, '')
})

test('trimToLastSentence never leaves a dangling clause', () => {
  const clipped = 'The record shows consistent priorities. He voted for the Diesel Act of 20'
  assert.equal(trimToLastSentence(clipped), 'The record shows consistent priorities.')
})

test('trimToLastSentence leaves complete text alone', () => {
  assert.equal(trimToLastSentence('All done.'), 'All done.')
  assert.equal(trimToLastSentence('No terminator here'), 'No terminator here')
})

test('503 is retried; 429 and client errors are not', async () => {
  const { isTransientStatus, RETRY_DELAYS_MS } = await import('./gemini-response.js')
  assert.equal(isTransientStatus(503), true)
  assert.equal(isTransientStatus(500), true)
  assert.equal(isTransientStatus(429), false)
  assert.equal(isTransientStatus(400), false)
  assert.equal(isTransientStatus(403), false)
  assert.equal(RETRY_DELAYS_MS.length, 2)
})
