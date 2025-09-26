import { useState, useCallback, useMemo } from 'react'
import { ChatMessage } from '../types/chatBot'
import ScenarioAwareChatBotService from '@/services/scenarioAwareChatBotService'
import { useEditorStore } from '../store'
import MessageClassifier from '@/services/messageClassifier'
import ScenarioEditParser from '@/services/scenarioEditParser'
import { JsonPatchApplier } from '@/utils/jsonPatch'

const useChatBot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Editor Store에서 현재 시나리오와 클립 데이터 가져오기
  const currentScenario = useEditorStore((state) => state.currentScenario)
  const clips = useEditorStore((state) => state.clips)
  const buildInitialScenario = useEditorStore(
    (state) => state.buildInitialScenario
  )
  const setScenarioFromJson = useEditorStore(
    (state) => state.setScenarioFromJson
  )
  const updateClips = useEditorStore((state) => state.updateClips)

  // ChatBot 서비스 인스턴스 생성 (API 기반으로 변경, 자격 증명 불필요)
  const chatBotService = useMemo(() => new ScenarioAwareChatBotService(), [])

  const sendMessage = useCallback(
    async (content: string) => {
      // 사용자 메시지 추가
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content,
        sender: 'user',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsTyping(true)

      try {
        // 1. 메시지 분류
        const classification = MessageClassifier.classifyMessage(content)

        // 2. 시나리오가 없고 자막 관련 요청이면 시나리오 생성
        let workingScenario = currentScenario
        if (
          classification.isSubtitleRelated &&
          !currentScenario &&
          clips.length > 0
        ) {
          workingScenario = buildInitialScenario(clips)
        }

        // 3. AI 응답 요청 (전체 응답 데이터 포함)
        const fullResponse = await chatBotService.sendMessageWithFullResponse(
          content,
          messages,
          workingScenario || undefined,
          clips.length > 0 ? clips : undefined
        )

        // 4. JSON Patch 우선 처리
        let editApplied = false
        let explanationText = fullResponse.completion.trim()

        if (
          fullResponse.has_scenario_edits &&
          fullResponse.json_patches &&
          fullResponse.json_patches.length > 0
        ) {
          console.log(
            '🔧 JSON Patch 적용 시작:',
            fullResponse.json_patches.length,
            '개 패치'
          )

          // JSON Patch 검증
          const validation = JsonPatchApplier.validatePatches(
            fullResponse.json_patches
          )
          if (!validation.valid) {
            console.warn('⚠️ JSON Patch 검증 실패:', validation.errors)
          }

          // 시나리오 데이터에 JSON Patch 적용
          if (workingScenario) {
            try {
              const updatedScenario = JsonPatchApplier.applyPatches(
                workingScenario,
                fullResponse.json_patches
              )
              setScenarioFromJson(updatedScenario)
              editApplied = true

              console.log('✅ JSON Patch 적용 완료')

              // edit_result의 explanation 사용 (있다면)
              if (fullResponse.edit_result?.explanation) {
                explanationText = fullResponse.edit_result.explanation
              }
            } catch (error) {
              console.error('❌ JSON Patch 적용 실패:', error)
            }
          }
        }

        // 5. JSON Patch가 실패하거나 없는 경우 기존 방식으로 폴백
        if (!editApplied) {
          console.log('📝 기존 ScenarioEditParser 사용')
          const parsedResponse = ScenarioEditParser.parseAIResponse(
            fullResponse.completion
          )

          if (parsedResponse.isEdit) {
            // 클립 변경사항 적용
            if (parsedResponse.clipChanges && clips.length > 0) {
              const updatedClips = ScenarioEditParser.applyClipChanges(
                clips,
                parsedResponse.clipChanges
              )
              updateClips(updatedClips)
            }

            // 시나리오 변경사항 적용
            if (parsedResponse.scenarioChanges && workingScenario) {
              const updatedScenario = ScenarioEditParser.applyScenarioChanges(
                workingScenario,
                parsedResponse.scenarioChanges
              )
              setScenarioFromJson(updatedScenario)
            }
          }

          explanationText = parsedResponse.explanation
        }

        // 6. AI 응답 메시지 추가 (편집 설명)
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: explanationText,
          sender: 'bot',
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, botMessage])
      } catch (error) {
        // 에러 메시지 추가
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content:
            error instanceof Error
              ? error.message
              : '죄송합니다. 일시적인 오류가 발생했습니다.',
          sender: 'bot',
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsTyping(false)
      }
    },
    [
      messages,
      chatBotService,
      currentScenario,
      clips,
      buildInitialScenario,
      updateClips,
      setScenarioFromJson,
    ]
  )

  const openChatBot = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeChatBot = useCallback(() => {
    setIsOpen(false)
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    isTyping,
    isOpen,
    sendMessage,
    openChatBot,
    closeChatBot,
    clearMessages,
  }
}

export default useChatBot
