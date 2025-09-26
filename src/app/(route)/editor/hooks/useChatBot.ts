import { useState, useCallback, useMemo } from 'react'
import { ChatMessage } from '../types/chatBot'
import ScenarioAwareChatBotService from '@/services/scenarioAwareChatBotService'
import { useEditorStore } from '../store'
import MessageClassifier from '@/services/messageClassifier'
import ScenarioEditParser from '@/services/scenarioEditParser'
import { compressScenarioBySelection } from '../utils/scenarioCompressor'

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

  // Selection state
  const selectedClipIds = useEditorStore((state) => state.selectedClipIds)
  const multiSelectedWordIds = useEditorStore(
    (state) => state.multiSelectedWordIds
  )
  const clearSelection = useEditorStore((state) => state.clearSelection)
  const clearGroupSelection = useEditorStore(
    (state) => state.clearGroupSelection
  )

  // Calculate selected counts
  const selectedClipsCount = selectedClipIds.size
  const selectedWordsCount = multiSelectedWordIds.size

  // ChatBot 서비스 인스턴스 생성 (API 기반으로 변경, 자격 증명 불필요)
  const chatBotService = useMemo(() => new ScenarioAwareChatBotService(), [])

  const sendMessage = useCallback(
    async (content: string) => {
      // 최신 선택 상태 가져오기
      const latestState = useEditorStore.getState()
      const currentSelectedClipIds = latestState.selectedClipIds
      const currentMultiSelectedWordIds = latestState.multiSelectedWordIds
      const currentClips = latestState.clips || []

      // 최신 선택 개수 계산
      const currentSelectedClipsCount = currentSelectedClipIds.size
      const currentSelectedWordsCount = currentMultiSelectedWordIds.size

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
          currentClips.length > 0
        ) {
          workingScenario = buildInitialScenario(currentClips)
        }

        // 3. 선택된 클립/워드에 따른 시나리오 압축 (최신 상태 사용)
        console.log('🔍 Selection state (latest):', {
          selectedClipIds: Array.from(currentSelectedClipIds),
          selectedClipsCount: currentSelectedClipsCount,
          multiSelectedWordIds: Array.from(currentMultiSelectedWordIds),
          selectedWordsCount: currentSelectedWordsCount,
          workingScenarioExists: !!workingScenario,
          totalCues: workingScenario?.cues?.length,
        })

        let scenarioToSend = workingScenario
        if (
          workingScenario &&
          (currentSelectedClipIds.size > 0 ||
            currentMultiSelectedWordIds.size > 0)
        ) {
          console.log(
            '✅ Calling compressScenarioBySelection with latest state'
          )
          scenarioToSend = compressScenarioBySelection(
            workingScenario,
            currentSelectedClipIds,
            currentMultiSelectedWordIds,
            currentClips
          )
          console.log(
            `🗜️ Compressed scenario: ${scenarioToSend.cues.length}/${workingScenario.cues.length} cues`
          )
        } else {
          console.log('❌ Skipping compression - no selection or scenario')
        }

        // 4. 디버그 정보 준비 (최신 상태 사용)
        const debugInfo = {
          selectedClipsCount: currentSelectedClipsCount,
          selectedWordsCount: currentSelectedWordsCount,
          originalCuesCount: workingScenario?.cues?.length,
        }

        // 5. AI 응답 요청 (압축된 시나리오 컨텍스트 포함)
        const response = await chatBotService.sendMessage(
          content,
          messages,
          scenarioToSend || undefined,
          currentClips.length > 0 ? currentClips : undefined,
          debugInfo
        )

        // 6. AI 응답 파싱 및 편집 적용
        const parsedResponse = ScenarioEditParser.parseAIResponse(response)

        // 7. 실제 편집 적용
        if (parsedResponse.isEdit) {
          // 클립 변경사항 적용
          if (parsedResponse.clipChanges && currentClips.length > 0) {
            const updatedClips = ScenarioEditParser.applyClipChanges(
              currentClips,
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

        // 8. AI 응답 메시지 추가 (편집 설명)
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: parsedResponse.explanation,
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

  const handleClearSelection = useCallback(() => {
    clearSelection()
    clearGroupSelection()
  }, [clearSelection, clearGroupSelection])

  return {
    messages,
    isTyping,
    isOpen,
    sendMessage,
    openChatBot,
    closeChatBot,
    clearMessages,
    selectedClipsCount,
    selectedWordsCount,
    clearSelection: handleClearSelection,
  }
}

export default useChatBot
