import ChatBotApiService from './chatBotApiService'
import MessageClassifier, { MessageClassification } from './messageClassifier'
import { ChatMessage } from '@/app/(route)/editor/types/chatBot'
import type { RendererConfigV2 } from '@/app/shared/motiontext'
import type { ClipItem } from '@/app/(route)/editor/types'

export interface ChatBotConfig {
  region: string
  accessKeyId: string
  secretAccessKey: string
}

export interface ScenarioEditResponse {
  hasScenarioChanges: boolean
  updatedScenario?: RendererConfigV2
  updatedClips?: ClipItem[]
  explanation: string
  success: boolean
  errorMessage?: string
}

export default class ScenarioAwareChatBotService {
  private chatBotApiService: ChatBotApiService

  constructor() {
    // API 기반 서비스로 변경, config는 더 이상 필요하지 않음
    this.chatBotApiService = new ChatBotApiService()
  }

  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = [],
    currentScenario?: RendererConfigV2,
    currentClips?: ClipItem[]
  ): Promise<string> {
    try {
      // 1. 메시지 분류
      const classification = MessageClassifier.classifyMessage(message)

      // 2. 자막 관련이면 시나리오 컨텍스트 포함
      if (classification.isSubtitleRelated && currentScenario && currentClips) {
        return await this.handleScenarioMessage(
          message,
          classification,
          conversationHistory,
          currentScenario,
          currentClips
        )
      }

      // 3. 일반 메시지는 기본 처리
      return await this.handleGeneralMessage(message, conversationHistory)
    } catch (error) {
      console.error('ChatBot 메시지 전송 실패:', error)
      throw new Error(
        '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      )
    }
  }

  private async handleScenarioMessage(
    message: string,
    _classification: MessageClassification,
    conversationHistory: ChatMessage[],
    _currentScenario: RendererConfigV2,
    _currentClips: ClipItem[]
  ): Promise<string> {
    // API 서비스 사용 - 시나리오 컨텍스트는 buildScenarioPrompt 없이 직접 전달
    const response = await this.chatBotApiService.sendMessage(
      message,
      conversationHistory
    )
    return response
  }

  private async handleGeneralMessage(
    message: string,
    conversationHistory: ChatMessage[]
  ): Promise<string> {
    // API 서비스 사용
    const response = await this.chatBotApiService.sendMessage(
      message,
      conversationHistory
    )
    return response
  }

  // 시나리오 편집 전용 메서드 (향후 확장용)
  async requestScenarioEdit(
    message: string,
    _currentScenario: RendererConfigV2,
    _currentClips: ClipItem[]
  ): Promise<ScenarioEditResponse> {
    try {
      const classification = MessageClassifier.classifyMessage(message)

      if (!classification.isSubtitleRelated) {
        return {
          hasScenarioChanges: false,
          explanation: '자막 편집과 관련된 요청이 아닙니다.',
          success: false,
        }
      }

      // 실제 편집 로직은 향후 구현
      // 현재는 분석만 수행
      return {
        hasScenarioChanges: false,
        explanation: `${classification.actionType} 작업으로 분류되었습니다. 구체적인 편집 기능은 곧 추가될 예정입니다.`,
        success: true,
      }
    } catch (error) {
      return {
        hasScenarioChanges: false,
        explanation: '편집 요청 처리 중 오류가 발생했습니다.',
        success: false,
        errorMessage:
          error instanceof Error ? error.message : '알 수 없는 오류',
      }
    }
  }
}
