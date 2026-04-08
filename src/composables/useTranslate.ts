import { ref } from 'vue'
import OpenAI from 'openai'
import type { TranslateConfig } from '@/types'
import { SYSTEM_PROMPT, DEFAULT_BASE_URL } from '@/types'

export function useTranslate() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function translate(
    text: string,
    config: TranslateConfig,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    if (!text.trim()) {
      throw new Error('请输入需要翻译的内容')
    }

    if (!config.apiKey) {
      throw new Error('请先配置 API Key')
    }

    isLoading.value = true
    error.value = null

    try {
      const openai = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseUrl || DEFAULT_BASE_URL,
        dangerouslyAllowBrowser: true
      })

      const stream = await openai.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text }
        ],
        temperature: 0.2,
        stream: true,
        stream_options: { include_usage: true }
      })

      let fullText = ''

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          fullText += content
          onChunk?.(content)
        }
      }

      if (!fullText.trim()) {
        throw new Error('翻译结果为空')
      }

      return fullText.trim()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      error.value = errorMessage
      throw new Error(`翻译失败: ${errorMessage}`)
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    translate
  }
}
