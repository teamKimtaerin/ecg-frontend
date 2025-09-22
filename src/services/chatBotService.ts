import BedrockService, { ClaudeRequest } from './bedrockService'
import { ChatMessage } from '@/app/(route)/editor/types/chatBot'

export interface ChatBotConfig {
  region: string
  accessKeyId: string
  secretAccessKey: string
}

export default class ChatBotService {
  private bedrockService: BedrockService

  constructor(config: ChatBotConfig) {
    this.bedrockService = new BedrockService(config)
  }

  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    try {
      // 대화 맥락을 위한 프롬프트 구성
      const contextPrompt = this.buildContextPrompt(
        message,
        conversationHistory
      )

      const request: ClaudeRequest = {
        prompt: contextPrompt,
        maxTokens: 1000,
        temperature: 0.7,
        stopSequences: ['\n\nHuman:', '\n\n사용자:'],
      }

      const response = await this.bedrockService.invokeClaude(request)
      return response.completion.trim()
    } catch (error) {
      console.error('ChatBot 메시지 전송 실패:', error)
      throw new Error(
        '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      )
    }
  }

  private buildContextPrompt(
    currentMessage: string,
    conversationHistory: ChatMessage[]
  ): string {
    const systemPrompt = `당신은 ECG(Easy Caption Generator) 자막 편집 도구의 AI 어시스턴트 "둘리"입니다.

주요 역할:
1. 자막 편집 관련 질문에 친절하고 정확하게 답변
2. ECG 도구의 기능 사용법 안내
3. 자막 작업 효율성 개선 팁 제공
4. 기술적 문제 해결 도움

답변 스타일:
- 친근하고 도움이 되는 톤
- 간결하면서도 충분한 정보 제공
- 단계별 설명이 필요한 경우 명확한 순서로 안내
- 한국어로 자연스럽게 대화

ECG 주요 기능:
- 자동 자막 생성 (AI 음성 인식)
- 실시간 자막 편집
- 다양한 애니메이션 효과
- 화자 분리 및 관리
- GPU 가속 렌더링
- 드래그 앤 드롭 편집`

    // 대화 히스토리 구성
    let conversationContext = ''
    if (conversationHistory.length > 0) {
      conversationContext = conversationHistory
        .slice(-6) // 최근 6개 메시지만 포함
        .map((msg) => {
          const role = msg.sender === 'user' ? 'Human' : 'Assistant'
          return `${role}: ${msg.content}`
        })
        .join('\n\n')
      conversationContext += '\n\n'
    }

    return `${systemPrompt}

${conversationContext}Human: ${currentMessage}`
  }
}
