// AI Provider Implementations

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIProviderConfig, AIGenerationRequest, AIGenerationResponse } from '@/types/ai'
import { SECTION_PROMPTS } from '@/types/ai'

// Base interface for all AI providers
interface AIProvider {
  generate(request: AIGenerationRequest, config: AIProviderConfig): Promise<AIGenerationResponse>
  generateStream?(request: AIGenerationRequest, config: AIProviderConfig): AsyncIterable<string>
}

// Build the system prompt with section-specific guidance
function buildPrompt(request: AIGenerationRequest): { system: string; user: string } {
  const sectionGuidance = SECTION_PROMPTS[request.sectionType] || SECTION_PROMPTS.custom

  const system = `You are a professional legal writing assistant specializing in creating high-quality legal documents and reports.

Your task: ${sectionGuidance}

Writing Guidelines:
- Use clear, professional legal language
- Be precise and avoid ambiguity
- Structure content logically with appropriate headings
- Use proper legal citation format where applicable
- Maintain a formal, objective tone
- Support assertions with reasoning
- Be concise while remaining comprehensive`

  let user = ''

  if (request.reportContext) {
    user += `Report Title: ${request.reportContext.title}\n`
    if (request.reportContext.audience) {
      user += `Intended Audience: ${request.reportContext.audience}\n`
    }
    if (request.reportContext.purpose) {
      user += `Purpose: ${request.reportContext.purpose}\n`
    }
    user += '\n'
  }

  if (request.sectionTitle) {
    user += `Section: ${request.sectionTitle}\n\n`
  }

  if (request.existingContent) {
    user += `Existing content in this section:\n---\n${request.existingContent}\n---\n\n`
  }

  if (request.instruction) {
    user += `Specific instructions: ${request.instruction}\n\n`
  } else if (request.existingContent) {
    user += `Please review the existing content above and:\n- Expand on key points with more detail and analysis\n- Add relevant examples, case law, or supporting evidence\n- Improve clarity and structure where needed\n- Fill in any gaps or areas that need more explanation\n- Maintain consistency with the existing content's tone and focus\n\n`
  } else {
    user += `Please generate comprehensive content for this section.\n\n`
  }

  return { system, user: user.trim() }
}

// Anthropic Claude Provider
class AnthropicProvider implements AIProvider {
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async generate(request: AIGenerationRequest, config: AIProviderConfig): Promise<AIGenerationResponse> {
    const { system, user } = buildPrompt(request)

    const response = await this.client.messages.create({
      model: config.model,
      max_tokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.7,
      system,
      messages: [{ role: 'user', content: user }],
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : ''

    return {
      content,
      model: config.model,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    }
  }

  async *generateStream(request: AIGenerationRequest, config: AIProviderConfig): AsyncIterable<string> {
    const { system, user } = buildPrompt(request)

    const stream = await this.client.messages.create({
      model: config.model,
      max_tokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.7,
      system,
      messages: [{ role: 'user', content: user }],
      stream: true,
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text
      }
    }
  }
}

// OpenAI GPT Provider
class OpenAIProvider implements AIProvider {
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  async generate(request: AIGenerationRequest, config: AIProviderConfig): Promise<AIGenerationResponse> {
    const { system, user } = buildPrompt(request)

    const response = await this.client.chat.completions.create({
      model: config.model,
      max_tokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.7,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    })

    return {
      content: response.choices[0]?.message?.content || '',
      model: config.model,
      tokensUsed: response.usage?.total_tokens,
    }
  }

  async *generateStream(request: AIGenerationRequest, config: AIProviderConfig): AsyncIterable<string> {
    const { system, user } = buildPrompt(request)

    const stream = await this.client.chat.completions.create({
      model: config.model,
      max_tokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.7,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      stream: true,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  }
}

// Google Gemini Provider
class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey)
  }

  async generate(request: AIGenerationRequest, config: AIProviderConfig): Promise<AIGenerationResponse> {
    const { system, user } = buildPrompt(request)
    const model = this.client.getGenerativeModel({ model: config.model })

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `${system}\n\n${user}` }] }],
      generationConfig: {
        temperature: config.temperature || 0.7,
        maxOutputTokens: config.maxTokens || 4096,
      },
    })

    const response = await result.response
    return {
      content: response.text(),
      model: config.model,
      tokensUsed: response.usageMetadata?.totalTokenCount,
    }
  }

  async *generateStream(request: AIGenerationRequest, config: AIProviderConfig): AsyncIterable<string> {
    const { system, user } = buildPrompt(request)
    const model = this.client.getGenerativeModel({ model: config.model })

    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: `${system}\n\n${user}` }] }],
      generationConfig: {
        temperature: config.temperature || 0.7,
        maxOutputTokens: config.maxTokens || 4096,
      },
    })

    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (text) {
        yield text
      }
    }
  }
}

// Provider factory
export function createAIProvider(config: AIProviderConfig): AIProvider {
  const apiKey = config.apiKey || getAPIKey(config.provider)

  switch (config.provider) {
    case 'anthropic':
      return new AnthropicProvider(apiKey)
    case 'openai':
      return new OpenAIProvider(apiKey)
    case 'google':
      return new GeminiProvider(apiKey)
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`)
  }
}

// Get API key from environment variables
function getAPIKey(provider: string): string {
  switch (provider) {
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY || ''
    case 'openai':
      return process.env.OPENAI_API_KEY || ''
    case 'google':
      return process.env.GEMINI_API_KEY || ''
    default:
      throw new Error(`No API key found for provider: ${provider}`)
  }
}

// Main generation function
export async function generateContent(
  request: AIGenerationRequest,
  config: AIProviderConfig
): Promise<AIGenerationResponse> {
  const provider = createAIProvider(config)
  return await provider.generate(request, config)
}

// Streaming generation function
export async function* generateContentStream(
  request: AIGenerationRequest,
  config: AIProviderConfig
): AsyncIterable<string> {
  const provider = createAIProvider(config)
  if (!provider.generateStream) {
    throw new Error(`Streaming not supported for provider: ${config.provider}`)
  }
  yield* provider.generateStream(request, config)
}
