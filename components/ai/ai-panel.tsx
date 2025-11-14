'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Loader2 } from 'lucide-react'
import type { AIProvider, AIModel, AIGenerationRequest } from '@/types/ai'
import { AI_PROVIDERS, DEFAULT_AI_CONFIG } from '@/types/ai'

interface AIPanelProps {
  sectionType: string
  sectionTitle?: string
  existingContent?: string
  reportContext?: {
    title: string
    audience?: string
    purpose?: string
  }
  onContentGenerated: (content: string) => void
}

export function AIPanel({ sectionType, sectionTitle, existingContent, reportContext, onContentGenerated }: AIPanelProps) {
  const [provider, setProvider] = useState<AIProvider>(DEFAULT_AI_CONFIG.provider)
  const [model, setModel] = useState<AIModel>(DEFAULT_AI_CONFIG.model)
  const [instruction, setInstruction] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')

  const selectedProvider = AI_PROVIDERS.find((p) => p.id === provider)
  const availableModels = selectedProvider?.models || []

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider)
    // Set to first model of new provider
    const firstModel = AI_PROVIDERS.find((p) => p.id === newProvider)?.models[0]
    if (firstModel) {
      setModel(firstModel.id)
    }
  }

  const handleGenerate = async (useStreaming: boolean = true) => {
    setIsGenerating(true)
    setGeneratedContent('')

    const request: AIGenerationRequest = {
      sectionType,
      sectionTitle,
      existingContent,
      reportContext,
      instruction: instruction.trim() || undefined,
    }

    try {
      if (useStreaming) {
        const response = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            request,
            config: { provider, model },
            stream: true,
          }),
        })

        if (!response.ok) throw new Error('Generation failed')

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) throw new Error('No reader available')

        let accumulated = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') break
              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  accumulated += parsed.content
                  setGeneratedContent(accumulated)
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      } else {
        const response = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            request,
            config: { provider, model },
            stream: false,
          }),
        })

        if (!response.ok) throw new Error('Generation failed')
        const data = await response.json()
        setGeneratedContent(data.content)
      }
    } catch (error) {
      console.error('Generation error:', error)
      alert('Failed to generate content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleInsert = () => {
    if (generatedContent) {
      onContentGenerated(generatedContent)
      setGeneratedContent('')
      setInstruction('')
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/10">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-violet-600" />
        <h3 className="font-semibold">AI Assistant</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium mb-1 block">Provider</label>
          <Select value={provider} onValueChange={(v) => handleProviderChange(v as AIProvider)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_PROVIDERS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Model</label>
          <Select value={model} onValueChange={(v) => setModel(v as AIModel)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <div>
                    <div>{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">
            Custom Instructions (Optional)
          </label>
          <Textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g., Focus on case law from the 9th Circuit, include statistical analysis..."
            rows={3}
            disabled={isGenerating}
          />
        </div>

        <Button
          onClick={() => handleGenerate(true)}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Content
            </>
          )}
        </Button>

        {generatedContent && (
          <div className="space-y-2">
            <div className="p-3 bg-background border rounded text-sm max-h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans">{generatedContent}</pre>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleInsert} className="flex-1">
                Insert into Section
              </Button>
              <Button
                onClick={() => setGeneratedContent('')}
                variant="outline"
                className="flex-1"
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
