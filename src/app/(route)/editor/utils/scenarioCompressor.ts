/**
 * 선택된 클립만 포함하는 압축된 시나리오 생성 유틸리티
 */

import type { RendererConfigV2 } from '@/app/shared/motiontext'
import type { ClipItem } from '../types'

/**
 * 선택된 클립 ID들을 기반으로 시나리오를 압축
 * tracks, stage, define 등은 그대로 유지하고 cues만 필터링
 */
export function compressScenarioWithSelectedCues(
  scenario: RendererConfigV2,
  selectedClipIds: Set<string>,
  clips: ClipItem[]
): RendererConfigV2 {
  if (selectedClipIds.size === 0) {
    // 선택된 클립이 없으면 전체 시나리오 반환
    return scenario
  }

  // 선택된 클립들의 cue ID 추출 (cue-${clip.id} 형태)
  const selectedCueIds = new Set<string>()

  Array.from(selectedClipIds).forEach(clipId => {
    const clip = clips.find(c => c.id === clipId)
    if (clip) {
      selectedCueIds.add(`cue-${clip.id}`)
    }
  })

  // cues 필터링 - 선택된 cue만 포함
  const filteredCues = scenario.cues.filter(cue =>
    selectedCueIds.has(cue.id)
  )

  // 압축된 시나리오 생성
  const compressedScenario: RendererConfigV2 = {
    ...scenario,
    cues: filteredCues,
  }

  return compressedScenario
}

/**
 * 선택된 워드들을 기반으로 시나리오를 압축 (향후 확장용)
 */
export function compressScenarioWithSelectedWords(
  scenario: RendererConfigV2,
  selectedWordIds: Set<string>,
  clips: ClipItem[]
): RendererConfigV2 {
  console.log('📝 compressScenarioWithSelectedWords:', {
    selectedWordIdsArray: Array.from(selectedWordIds),
    selectedWordIdsSize: selectedWordIds.size
  })

  if (selectedWordIds.size === 0) {
    console.log('❌ No selected words - returning original scenario')
    return scenario
  }

  // 선택된 워드들이 포함된 클립들의 cue ID 추출
  const selectedCueIds = new Set<string>()

  clips.forEach(clip => {
    console.log(`🔍 Checking clip ${clip.id} with ${clip.words.length} words:`,
      clip.words.map(w => ({ id: w.id, text: w.text }))
    )

    const hasSelectedWord = clip.words.some(word => {
      const isSelected = selectedWordIds.has(word.id)
      console.log(`  Word "${word.text}" (${word.id}): ${isSelected ? '✅ SELECTED' : '❌ not selected'}`)
      return isSelected
    })

    if (hasSelectedWord) {
      const cueId = `cue-${clip.id}`
      selectedCueIds.add(cueId)
      console.log(`✅ Added cue: ${cueId}`)
    }
  })

  console.log('🎯 Selected cue IDs:', Array.from(selectedCueIds))

  // cues 필터링
  const filteredCues = scenario.cues.filter(cue => {
    const isIncluded = selectedCueIds.has(cue.id)
    console.log(`Cue ${cue.id}: ${isIncluded ? '✅ INCLUDED' : '❌ excluded'}`)
    return isIncluded
  })

  console.log(`📊 Final compression result: ${filteredCues.length}/${scenario.cues.length} cues`)

  return {
    ...scenario,
    cues: filteredCues,
  }
}

/**
 * 클립 또는 워드 선택에 따라 적절한 압축 방식 선택
 */
export function compressScenarioBySelection(
  scenario: RendererConfigV2,
  selectedClipIds: Set<string>,
  selectedWordIds: Set<string>,
  clips: ClipItem[]
): RendererConfigV2 {
  console.log('🗜️ compressScenarioBySelection called:', {
    selectedClipIds: Array.from(selectedClipIds),
    selectedWordIds: Array.from(selectedWordIds),
    clipsCount: clips.length,
    totalCues: scenario.cues.length
  })

  // 클립 선택이 우선순위
  if (selectedClipIds.size > 0) {
    console.log('📋 Using clip-based compression')
    return compressScenarioWithSelectedCues(scenario, selectedClipIds, clips)
  }

  // 워드 선택이 있는 경우
  if (selectedWordIds.size > 0) {
    console.log('📝 Using word-based compression')
    return compressScenarioWithSelectedWords(scenario, selectedWordIds, clips)
  }

  // 선택이 없으면 전체 시나리오 반환
  console.log('❌ No selection - returning full scenario')
  return scenario
}