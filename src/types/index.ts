export interface TranslateConfig {
  apiKey: string
  model: string
  baseUrl: string
  autoStart: boolean
  hotkey: string
}

export interface ToastOptions {
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

export const DEFAULT_MODEL = 'Qwen3.5-0.8B'
export const DEFAULT_BASE_URL = 'http://127.0.0.1:8000/v1'

export const SYSTEM_PROMPT = `你是一个专业的翻译助手。你的任务是进行中英互译。
规则：
1. 如果用户输入的是中文，请将其翻译成地道、流畅的英文。
2. 如果用户输入的是英文，请将其翻译成自然、准确的中文。
3. 如果输入包含中英混合，请将中文翻译成英文，英文翻译成中文，或者将其统一翻译为另一种主导语言，保持语句通顺。
4. 只输出翻译结果！不要包含任何解释、注音、问候语或其他多余内容。
5. 请尽量保留原始文本的排版、换行和格式。`
