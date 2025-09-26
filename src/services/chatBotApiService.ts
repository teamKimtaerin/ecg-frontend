import { ChatMessage } from '@/app/(route)/editor/types/chatBot'
import type { RendererConfigV2 } from '@/app/shared/motiontext'
import type { ClipItem } from '@/app/(route)/editor/types'

export interface ChatBotApiRequest {
  prompt: string
  conversation_history?: ChatMessage[]
  scenario_data?: RendererConfigV2
  clips_data?: ClipItem[]
  max_tokens?: number
  temperature?: number
  use_langchain?: boolean
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

  // 시나리오 편집 관련 필드
  edit_result?: {
    type:
      | 'text_edit'
      | 'style_edit'
      | 'animation_request'
      | 'info_request'
      | 'error'
    success: boolean
    explanation: string
    error?: string
  }
  json_patches?: Array<{
    op: 'replace' | 'add' | 'remove'
    path: string
    value?: any
  }>
  has_scenario_edits?: boolean
}

export default class ChatBotApiService {
  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = [],
    scenarioData?: RendererConfigV2,
    clipsData?: ClipItem[]
  ): Promise<string> {
    try {
      const request: ChatBotApiRequest = {
        prompt: message,
        conversation_history: conversationHistory,
        scenario_data: scenarioData,
        clips_data: clipsData,
        max_tokens: 1000,
        temperature: 0.7,
        use_langchain: true, // LangChain 사용하여 시나리오 인식 기능 활성화
      }

      // ChatBot API 호출 (배포 환경에서는 NEXT_PUBLIC_API_URL 사용)

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ho-it.site'
      const response = await fetch(`${apiUrl}/api/v1/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.detail?.error || errorData.detail || 'API 호출 실패'
        )
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

  // 전체 응답 데이터를 반환하는 새로운 메서드
  async sendMessageWithFullResponse(
    message: string,
    conversationHistory: ChatMessage[] = [],
    scenarioData?: RendererConfigV2,
    clipsData?: ClipItem[]
  ): Promise<ChatBotApiResponse> {
    try {
      const request: ChatBotApiRequest = {
        prompt: message,
        conversation_history: conversationHistory,
        scenario_data: scenarioData,
        clips_data: clipsData,
        max_tokens: 1000,
        temperature: 0.7,
        use_langchain: true,
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ho-it.site'
      const response = await fetch(`${apiUrl}/api/v1/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.detail?.error || errorData.detail || 'API 호출 실패'
        )
      }

      const data: ChatBotApiResponse = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      return data
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
