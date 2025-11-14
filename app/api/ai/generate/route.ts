import { NextRequest, NextResponse } from 'next/server'
import { generateContent, generateContentStream } from '@/lib/ai/providers'
import type { AIGenerationRequest, AIProviderConfig } from '@/types/ai'
import { DEFAULT_AI_CONFIG } from '@/types/ai'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { request: genRequest, config, stream } = body as {
      request: AIGenerationRequest
      config?: Partial<AIProviderConfig>
      stream?: boolean
    }

    // Merge user config with defaults
    const finalConfig: AIProviderConfig = {
      ...DEFAULT_AI_CONFIG,
      ...config,
    }

    // Streaming response
    if (stream) {
      const encoder = new TextEncoder()
      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of generateContentStream(genRequest, finalConfig)) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        },
      })

      return new NextResponse(customReadable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    // Non-streaming response
    const result = await generateContent(genRequest, finalConfig)
    return NextResponse.json(result)
  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate content' },
      { status: 500 }
    )
  }
}
