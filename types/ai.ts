// AI Provider Configuration Types

export type AIProvider = 'anthropic' | 'openai' | 'google'

export type AIModel =
  // Anthropic Claude (Latest - 2025)
  | 'claude-sonnet-4-5-20250929'
  | 'claude-opus-4-1-20250514'
  | 'claude-haiku-4-5-20250513'
  // OpenAI GPT
  | 'gpt-5'
  | 'gpt-5-turbo'
  | 'gpt-4-turbo'
  // Google Gemini
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'

export interface AIProviderConfig {
  provider: AIProvider
  model: AIModel
  apiKey?: string // Optional - falls back to env var
  temperature?: number
  maxTokens?: number
}

export interface AIGenerationRequest {
  sectionType: string
  sectionTitle?: string
  existingContent?: string
  reportContext?: {
    title: string
    audience?: string
    purpose?: string
  }
  instruction?: string // User's custom prompt
}

export interface AIGenerationResponse {
  content: string
  model: string
  tokensUsed?: number
}

export interface AIProviderInfo {
  id: AIProvider
  name: string
  models: {
    id: AIModel
    name: string
    description: string
    costPer1kTokens: number
  }[]
}

// Available AI Providers
export const AI_PROVIDERS: AIProviderInfo[] = [
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    models: [
      {
        id: 'claude-sonnet-4-5-20250929',
        name: 'Claude Sonnet 4.5',
        description: 'Most intelligent model, best for complex legal analysis and reasoning',
        costPer1kTokens: 0.015,
      },
      {
        id: 'claude-opus-4-1-20250514',
        name: 'Claude Opus 4.1',
        description: 'Most powerful model, excellent for comprehensive legal writing',
        costPer1kTokens: 0.075,
      },
      {
        id: 'claude-haiku-4-5-20250513',
        name: 'Claude Haiku 4.5',
        description: 'Fast and efficient, perfect for quick drafts and summaries',
        costPer1kTokens: 0.0008,
      },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI GPT',
    models: [
      {
        id: 'gpt-5',
        name: 'GPT-5',
        description: 'Most advanced OpenAI model, exceptional reasoning',
        costPer1kTokens: 0.02,
      },
      {
        id: 'gpt-5-turbo',
        name: 'GPT-5 Turbo',
        description: 'Faster GPT-5 variant, optimized for speed',
        costPer1kTokens: 0.015,
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: 'Previous generation, still very capable',
        costPer1kTokens: 0.01,
      },
    ],
  },
  {
    id: 'google',
    name: 'Google Gemini',
    models: [
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description: 'Google\'s most advanced model, multimodal capabilities',
        costPer1kTokens: 0.0005,
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Ultra-fast variant, optimized for quick responses',
        costPer1kTokens: 0.0003,
      },
    ],
  },
]

// Default configuration
export const DEFAULT_AI_CONFIG: AIProviderConfig = {
  provider: 'anthropic',
  model: 'claude-sonnet-4-5-20250929',
  temperature: 0.7,
  maxTokens: 4096,
}

// Section-specific prompts
export const SECTION_PROMPTS: Record<string, string> = {
  title_page: 'Generate a professional title page with appropriate legal document formatting.',
  executive_summary: 'Write a concise executive summary highlighting key findings and recommendations. Use clear, professional language appropriate for legal stakeholders.',
  table_of_contents: 'Generate a well-structured table of contents with appropriate section numbering.',
  introduction: 'Write an introduction that provides context, outlines the scope, and states the purpose of this legal document.',
  background: 'Provide comprehensive background information, including relevant facts, history, and context necessary for understanding the matter.',
  analysis: 'Conduct a thorough legal analysis, examining relevant statutes, case law, and applying them to the facts at hand.',
  findings: 'Present clear, numbered findings based on the evidence and analysis. Be precise and objective.',
  discussion: 'Discuss the implications of the findings, addressing key issues and potential counterarguments.',
  methodology: 'Describe the methodology used in conducting this research or analysis, including sources and analytical frameworks.',
  recommendations: 'Provide specific, actionable recommendations based on the analysis and findings.',
  conclusion: 'Summarize the key points and provide a clear, conclusive statement.',
  appendix: 'Format supplementary materials, exhibits, or supporting documentation.',
  exhibit: 'Describe and reference the exhibit with appropriate legal citation format.',
  references: 'Compile and format all references using appropriate legal citation style (Bluebook).',
  glossary: 'Define key terms and legal concepts used throughout the document.',
  acknowledgments: 'Draft professional acknowledgments for contributors and sources.',
  custom: 'Generate content for this custom section based on its title and context.',
}
