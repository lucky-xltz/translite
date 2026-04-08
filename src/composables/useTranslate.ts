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
        const choice = chunk.choices[0]
        if (choice?.finish_reason === 'stop') {
          break
        }
        
        const content = choice?.delta?.content
        if (content) {
          fullText += content
          onChunk?.(content)
        }
      }

      if (!fullText.trim()) {
        throw new Error('翻译结果为空，请检查 API 配置是否正确')
      }

      return fullText.trim()
    } catch (err) {
      let errorMessage = '未知错误'
      
      if (err instanceof Error) {
        errorMessage = err.message
        
        if (errorMessage.includes('image.png') || errorMessage.includes('does not support image')) {
          errorMessage = '当前模型不支持图像输入。请确保使用纯文本模型，或检查 API 配置。'
        } else if (errorMessage.includes('Incorrect API key') || errorMessage.includes('Invalid API key')) {
          errorMessage = 'API Key 无效，请检查配置的 API Key 是否正确'
        } else if (errorMessage.includes('model not found') || errorMessage.includes('Model not found')) {
          errorMessage = `模型 "${config.model}" 未找到，请检查模型名称是否正确`
        } else if (errorMessage.includes('connection') || errorMessage.includes('ECONNREFUSED')) {
          errorMessage = '无法连接到 API 服务器，请检查 API 地址是否正确，服务是否正在运行'
        }
      }
      
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
