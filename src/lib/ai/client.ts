import Anthropic from '@anthropic-ai/sdk'
import { AI_CONFIG } from './config'

export function isAiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

function createAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured. AI features are disabled.')
  }
  return new Anthropic({ apiKey })
}

export interface AiResponse {
  content: string
  model: string
  inputTokens: number
  outputTokens: number
}

export async function generateAiResponse(params: {
  systemPrompt: string
  userMessage: string
  maxTokens?: number
}): Promise<AiResponse> {
  const client = createAnthropicClient()

  try {
    const response = await client.messages.create({
      model: AI_CONFIG.MODEL,
      max_tokens: params.maxTokens ?? AI_CONFIG.MAX_OUTPUT_TOKENS,
      system: params.systemPrompt,
      messages: [{ role: 'user', content: params.userMessage }],
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    const content = textBlock && 'text' in textBlock ? textBlock.text : ''

    return {
      content,
      model: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    }
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        throw new Error('AI service is temporarily busy. Please try again in a moment.')
      }
      throw new Error('AI service encountered an error. Please try again.')
    }
    throw new Error('Failed to connect to AI service. Please check your connection.')
  }
}
