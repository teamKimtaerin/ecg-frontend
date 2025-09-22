import BedrockService, { ClaudeRequest } from './bedrockService'
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
  private bedrockService: BedrockService

  constructor(config: ChatBotConfig) {
    this.bedrockService = new BedrockService(config)
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
    classification: MessageClassification,
    conversationHistory: ChatMessage[],
    currentScenario: RendererConfigV2,
    currentClips: ClipItem[]
  ): Promise<string> {
    const contextPrompt = this.buildScenarioPrompt(
      message,
      classification,
      conversationHistory,
      currentScenario,
      currentClips
    )

    const request: ClaudeRequest = {
      prompt: contextPrompt,
      maxTokens: 2000,
      temperature: 0.3, // 더 정확한 편집을 위해 낮은 temperature
      stopSequences: ['\n\nHuman:', '\n\n사용자:'],
    }

    const response = await this.bedrockService.invokeClaude(request)
    return response.completion.trim()
  }

  private async handleGeneralMessage(
    message: string,
    conversationHistory: ChatMessage[]
  ): Promise<string> {
    const contextPrompt = this.buildGeneralPrompt(message, conversationHistory)

    const request: ClaudeRequest = {
      prompt: contextPrompt,
      maxTokens: 1000,
      temperature: 0.7,
      stopSequences: ['\n\nHuman:', '\n\n사용자:'],
    }

    const response = await this.bedrockService.invokeClaude(request)
    return response.completion.trim()
  }

  private buildScenarioPrompt(
    currentMessage: string,
    classification: MessageClassification,
    conversationHistory: ChatMessage[],
    currentScenario: RendererConfigV2,
    currentClips: ClipItem[]
  ): string {
    const systemPrompt = `당신은 ECG(Easy Caption Generator)의 전문 자막 편집 AI 어시스턴트 "둘리"입니다.

## 🎯 주요 역할
1. 자막 편집 명령을 정확히 이해하고 실행
2. MotionText 시나리오 구조를 완벽히 이해
3. 사용자의 편집 요청을 구체적으로 분석하여 실행 가능한 수정사항 제공
4. 변경사항을 명확하게 설명

## 📊 현재 편집 상태 정보

### 분류된 요청 정보:
- 요청 타입: ${classification.actionType}
- 신뢰도: ${classification.confidence}
- 추출된 정보: ${JSON.stringify(classification.extractedDetails, null, 2)}

### 현재 자막 클립 정보:
${currentClips
  .map(
    (clip, index) => `
클립 ${index + 1} (ID: ${clip.id}):
- 화자: ${clip.speaker}
- 전체 텍스트: "${clip.fullText}"
- 단어 수: ${clip.words.length}개
- 타이밍: ${clip.words[0]?.start || 0}초 ~ ${clip.words[clip.words.length - 1]?.end || 0}초
`
  )
  .join('')}


## 📝 응답 형식 (중요!)
사용자가 구체적인 편집을 요청할 때는 반드시 아래 JSON 형식으로 응답해주세요:

\`\`\`json
{
  "type": "scenario_edit",
  "explanation": "사용자에게 보여줄 설명 텍스트",
  "changes": {
    "clips": [
      {
        "id": "clip_id",
        "updates": {
          "fullText": "새로운 전체 텍스트",
          "subtitle": "새로운 자막 텍스트", 
          "words": [
            {
              "id": "word_id",
              "text": "수정된 단어",
              "start": 새로운_시작시간,
              "end": 새로운_종료시간
            }
          ]
        }
      }
    ],
  }
}
\`\`\`

**일반적인 사용법 질문**일 때는 JSON 없이 평문으로 친절하게 설명해주세요.

## 🔧 편집 가능한 작업들
- **텍스트 수정**: clips[].fullText, subtitle, words[].text 변경
- **타이밍 조정**: words[].start, words[].end 시간 수정  
- **스타일 적용**: 폰트, 색상, 크기 등 텍스트 스타일 변경
- **애니메이션 효과**: 페이드, 슬라이드 등 다양한 효과 추가

**중요**: 편집 요청 시 JSON 형식으로만 응답하고, 사용법 질문 시에는 일반 텍스트로 응답하세요.`

    // 대화 히스토리 구성
    let conversationContext = ''
    if (conversationHistory.length > 0) {
      conversationContext = conversationHistory
        .slice(-4) // 최근 4개 메시지만 포함 (시나리오 데이터가 크므로)
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

  private buildGeneralPrompt(
    currentMessage: string,
    conversationHistory: ChatMessage[]
  ): string {
    const systemPrompt = `당신은 ECG(Easy Caption Generator) 자막 편집 도구의 AI 어시스턴트 "둘리"입니다.

## 🎯 주요 역할
1. ECG 도구 사용법 안내
2. 자막 편집 관련 질문에 친절하고 정확하게 답변
3. 자막 작업 효율성 개선 팁 제공
4. 기술적 문제 해결 도움

## ✨ ECG 주요 기능
- **AI 음성 인식**: 자동 자막 생성으로 빠른 시작
- **실시간 편집**: 드래그 앤 드롭으로 쉬운 자막 편집
- **다양한 애니메이션**: 살아있는 자막 효과들
- **화자 분리**: 여러 화자 구분 및 관리
- **GPU 가속 렌더링**: 빠른 영상 내보내기
- **무료 리소스**: 다양한 스타일과 템플릿

## 💡 답변 스타일
- 친근하고 도움이 되는 톤
- 간결하면서도 충분한 정보 제공
- 단계별 설명이 필요한 경우 명확한 순서로 안내
- 실용적인 팁과 함께 설명

사용자의 질문에 ECG 사용법 중심으로 도움이 되는 답변을 해주세요.`

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

  // 시나리오 편집 전용 메서드 (향후 확장용)
  async requestScenarioEdit(
    message: string,
    currentScenario: RendererConfigV2,
    currentClips: ClipItem[]
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
