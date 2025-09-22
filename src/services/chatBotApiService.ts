import { ChatMessage } from '@/app/(route)/editor/types/chatBot'

export interface ChatBotApiRequest {
  prompt: string
  conversation_history?: ChatMessage[]
  max_tokens?: number
  temperature?: number
}

export interface ChatBotApiResponse {
  completion: string
  stop_reason: string
  usage?: {
    input_tokens?: number
    output_tokens?: number
  }
  processing_time_ms?: number
  error?: string
  details?: string
}

export default class ChatBotApiService {
  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    try {
      const request: ChatBotApiRequest = {
        prompt: message,
        conversation_history: conversationHistory,
        max_tokens: 1000,
        temperature: 0.7,
      }

      // 백엔드 API 호출로 변경
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/api/v1/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail?.error || errorData.detail || 'API 호출 실패')
      }

      const data: ChatBotApiResponse = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      return data.completion.trim()
    } catch (error) {
      console.error('ChatBot API 메시지 전송 실패:', error)
      throw new Error(
        error instanceof Error 
          ? error.message 
          : '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      )
    }
  }

}