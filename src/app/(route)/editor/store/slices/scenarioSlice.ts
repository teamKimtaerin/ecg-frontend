import type { StateCreator } from 'zustand'
import type { RendererConfigV2 } from '@/app/shared/motiontext'
import {
  buildInitialScenarioFromClips,
  type NodeIndexEntry,
} from '../../utils/initialScenario'
import { videoSegmentManager } from '@/utils/video/segmentManager'
import { computeTimeOffsetSeconds } from '@/app/shared/motiontext'

export interface ScenarioSlice {
  currentScenario: RendererConfigV2 | null
  nodeIndex: Record<string, NodeIndexEntry>
  scenarioVersion: number

  // Build initial scenario from clips
  buildInitialScenario: (
    clips: import('../../types').ClipItem[],
    opts?: Parameters<typeof buildInitialScenarioFromClips>[1]
  ) => RendererConfigV2

  // Update hooks (per word)
  updateWordBaseTime: (
    wordId: string,
    startAbsSec: number,
    endAbsSec: number
  ) => void
  refreshWordPluginChain: (wordId: string) => void

  // Update caption default style and/or boxStyle
  updateCaptionDefaultStyle: (updates: {
    style?: Record<string, unknown>
    boxStyle?: Record<string, unknown>
  }) => void

  // Update group node style and/or boxStyle for specific clip
  updateGroupNodeStyle: (
    clipId: string,
    updates: {
      style?: Record<string, unknown>
      boxStyle?: Record<string, unknown>
    }
  ) => void

  // Set scenario from arbitrary JSON (editor apply)
  setScenarioFromJson: (config: RendererConfigV2) => void
}

export const createScenarioSlice: StateCreator<ScenarioSlice> = (set, get) => ({
  currentScenario: null,
  nodeIndex: {},
  scenarioVersion: 0,

  buildInitialScenario: (clips, opts) => {
    // Get insertedTexts from TextInsertionSlice
    const fullState = get() as any
    const insertedTexts = fullState.insertedTexts || []

    // Merge insertedTexts into options
    const mergedOpts = {
      ...opts,
      insertedTexts,
    }

    const { config, index } = buildInitialScenarioFromClips(clips, mergedOpts)
    set({
      currentScenario: config,
      nodeIndex: index,
      scenarioVersion: (get().scenarioVersion || 0) + 1,
    })
    return config
  },

  updateWordBaseTime: (wordId, startAbsSec, endAbsSec) => {
    let { currentScenario, nodeIndex } = get()
    if (!currentScenario) {
      // Lazily build a scenario so baseTime updates can apply even if overlay hasn't initialized
      try {
        const anyGet = get() as unknown as {
          clips?: import('../../types').ClipItem[]
          deletedClipIds?: Set<string>
          buildInitialScenario?: ScenarioSlice['buildInitialScenario']
          insertedTexts?: any[]
        }
        const clipsAll = anyGet.clips || []
        const deleted = anyGet.deletedClipIds || new Set<string>()
        const activeClips = clipsAll.filter((c) => !deleted.has(c.id))
        anyGet.buildInitialScenario?.(activeClips)
        // Refresh local refs
        currentScenario = get().currentScenario
        nodeIndex = get().nodeIndex
      } catch {
        // If we cannot build, skip
      }
    }
    if (!currentScenario) return
    const entry = nodeIndex[wordId]
    if (!entry) return
    const cue = currentScenario.cues[entry.cueIndex]
    const childIdx = entry.path[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const node: any = cue?.root?.children?.[childIdx]
    if (!node) return
    const sAdj =
      videoSegmentManager.mapToAdjustedTime(startAbsSec) ?? startAbsSec
    const eAdj = videoSegmentManager.mapToAdjustedTime(endAbsSec) ?? endAbsSec
    node.baseTime = [Number(sAdj), Number(eAdj)]
    // When baseTime changes, offsets must be recomputed for tracks
    get().refreshWordPluginChain(wordId)
  },

  refreshWordPluginChain: (wordId) => {
    const state = get() as ScenarioSlice & {
      wordAnimationTracks: Map<
        string,
        Array<{
          assetId: string
          assetName: string
          pluginKey?: string
          params?: Record<string, unknown>
          timing: { start: number; end: number }
        }>
      >
    }
    let { currentScenario, nodeIndex } = state
    const { wordAnimationTracks } = state
    if (!currentScenario) {
      // Lazily build initial scenario if missing so pluginChain updates don't get dropped
      try {
        const anyGet = get() as unknown as {
          clips?: import('../../types').ClipItem[]
          deletedClipIds?: Set<string>
          buildInitialScenario?: ScenarioSlice['buildInitialScenario']
          insertedTexts?: any[]
        }
        const clipsAll = anyGet.clips || []
        const deleted = anyGet.deletedClipIds || new Set<string>()
        const activeClips = clipsAll.filter((c) => !deleted.has(c.id))
        anyGet.buildInitialScenario?.(activeClips)
        currentScenario = get().currentScenario
        nodeIndex = get().nodeIndex
      } catch {
        // If building fails, we cannot proceed
      }
    }
    if (!currentScenario) return
    const entry = nodeIndex[wordId]
    if (!entry) return
    const cue = currentScenario.cues[entry.cueIndex]
    const childIdx = entry.path[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const node: any = cue?.root?.children?.[childIdx]
    if (!node) return
    const baseTime: [number, number] = node.baseTime ||
      cue.root.displayTime || [0, 0]
    const tracks = wordAnimationTracks?.get(wordId) || []
    const pluginChain = tracks.map((t) => {
      const name =
        (t.pluginKey || t.assetName || '').split('@')[0] || t.assetName
      const startAdj =
        videoSegmentManager.mapToAdjustedTime(t.timing.start) ?? t.timing.start
      const endAdj =
        videoSegmentManager.mapToAdjustedTime(t.timing.end) ?? t.timing.end
      const { timeOffset } = computeTimeOffsetSeconds(
        baseTime,
        startAdj,
        endAdj
      )
      return {
        name,
        params: t.params || {},
        baseTime,
        timeOffset, // seconds relative to baseTime[0]
      }
    })
    node.pluginChain = pluginChain
    // Make word node visible if it has any animations
    node.style = {
      ...(node.style || {}),
      opacity: pluginChain.length > 0 ? 1 : (node.style?.opacity ?? 0),
    }
    set({
      currentScenario: { ...currentScenario },
      scenarioVersion: (get().scenarioVersion || 0) + 1,
    })
  },

  updateCaptionDefaultStyle: (updates) => {
    let { currentScenario } = get()

    // Lazily build scenario if it doesn't exist
    if (!currentScenario) {
      try {
        const anyGet = get() as unknown as {
          clips?: import('../../types').ClipItem[]
          deletedClipIds?: Set<string>
          buildInitialScenario?: ScenarioSlice['buildInitialScenario']
          insertedTexts?: any[]
        }
        const clipsAll = anyGet.clips || []
        const deleted = anyGet.deletedClipIds || new Set<string>()
        const activeClips = clipsAll.filter((c) => !deleted.has(c.id))
        anyGet.buildInitialScenario?.(activeClips)
        currentScenario = get().currentScenario
      } catch {
        return // Cannot proceed without scenario
      }
    }

    if (!currentScenario?.tracks) return

    // Find caption track and update its defaultStyle and/or defaultBoxStyle
    const captionTrackIndex = currentScenario.tracks.findIndex(
      (track) => track.id === 'caption' || track.type === 'subtitle'
    )

    if (captionTrackIndex === -1) return

    const updatedScenario = { ...currentScenario }
    updatedScenario.tracks = [...currentScenario.tracks]

    // Also update cues to clear individual styles when applying global format
    if (currentScenario.cues) {
      updatedScenario.cues = currentScenario.cues.map((cue) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const root = (cue as any).root
        if (!root) return cue

        // Clear individual styles when applying global format
        const updatedRoot = { ...root }
        // Always clear individual styles when any global style update is applied
        if (updates.style !== undefined) {
          updatedRoot.style = undefined
        }
        if (updates.boxStyle !== undefined) {
          updatedRoot.boxStyle = undefined
        }

        return {
          ...cue,
          root: updatedRoot,
        }
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedTrack: any = {
      ...currentScenario.tracks[captionTrackIndex],
    }

    // Update defaultStyle if provided
    if (updates.style) {
      updatedTrack.defaultStyle = {
        ...(currentScenario.tracks[captionTrackIndex].defaultStyle || {}),
        ...updates.style,
      }
    }

    // Update defaultBoxStyle if provided
    if (updates.boxStyle) {
      updatedTrack.defaultBoxStyle = {
        ...(updatedTrack.defaultBoxStyle || {}),
        ...updates.boxStyle,
      }
    }

    updatedScenario.tracks[captionTrackIndex] = updatedTrack

    set({
      currentScenario: updatedScenario,
      scenarioVersion: (get().scenarioVersion || 0) + 1,
    })
  },

  updateGroupNodeStyle: (clipId, updates) => {
    console.log('updateGroupNodeStyle called with:', { clipId, updates })
    let { currentScenario } = get()

    // Lazily build scenario if it doesn't exist
    if (!currentScenario) {
      try {
        const anyGet = get() as unknown as {
          clips?: import('../../types').ClipItem[]
          deletedClipIds?: Set<string>
          buildInitialScenario?: ScenarioSlice['buildInitialScenario']
          insertedTexts?: any[]
        }
        const clipsAll = anyGet.clips || []
        const deleted = anyGet.deletedClipIds || new Set<string>()
        const activeClips = clipsAll.filter((c) => !deleted.has(c.id))
        anyGet.buildInitialScenario?.(activeClips)
        currentScenario = get().currentScenario
      } catch {
        return // Cannot proceed without scenario
      }
    }

    if (!currentScenario?.cues) {
      console.warn('No current scenario or cues found')
      return
    }

    // The group node ID is created as `clip-${clipId}` in initialScenario.ts
    // Since clipId is already in format "clip-X", the final ID becomes "clip-clip-X"
    const groupNodeId = `clip-${clipId}`
    console.log('Looking for group node with ID:', groupNodeId)

    // Debug: Log all existing group node IDs
    const existingGroupIds = currentScenario.cues
      .map((cue) => (cue as { root?: { id?: string } }).root?.id)
      .filter(Boolean)
    console.log('Existing group node IDs:', existingGroupIds)

    let found = false
    const updatedCues = currentScenario.cues.map((cue, cueIndex) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const root = (cue as any).root
      if (!root || root.id !== groupNodeId) return cue

      found = true
      console.log('Found matching group node:', root.id)

      // Create completely new objects to ensure deep immutability
      let newStyle: Record<string, unknown> | null = null
      let newBoxStyle: Record<string, unknown> | null = null

      // Handle style updates (text styles) - apply even if style is undefined or empty
      if (updates.style !== undefined) {
        // Convert string reference to object if needed
        let currentStyle = root.style || {}
        if (typeof currentStyle === 'string') {
          // For now, start with empty object for string references
          currentStyle = {}
        }

        newStyle = {
          ...currentStyle,
          ...updates.style,
        }
        console.log('Applied style updates:', newStyle)
      } else {
        // Preserve existing style if no updates
        newStyle = root.style ? { ...root.style } : null
      }

      // Handle boxStyle updates (container styles) - apply even if boxStyle is undefined or empty
      if (updates.boxStyle !== undefined) {
        let currentBoxStyle = root.boxStyle || {}
        if (typeof currentBoxStyle === 'string') {
          // For now, start with empty object for string references
          currentBoxStyle = {}
        }

        newBoxStyle = {
          ...currentBoxStyle,
          ...updates.boxStyle,
        }
        console.log('Applied boxStyle updates:', newBoxStyle)
      } else {
        // Preserve existing boxStyle if no updates
        newBoxStyle = root.boxStyle ? { ...root.boxStyle } : null
      }

      // Create completely new root object
      const updatedRoot = {
        ...root,
        ...(newStyle !== null && { style: newStyle }),
        ...(newBoxStyle !== null && { boxStyle: newBoxStyle }),
      }

      // Create completely new cue object
      const updatedCue = {
        ...cue,
        root: updatedRoot,
      }

      console.log(`Updated cue ${cueIndex} root:`, updatedRoot)
      return updatedCue
    })

    if (!found) {
      console.warn(
        `Group node for clip ${clipId} not found. Available IDs:`,
        existingGroupIds
      )
      return
    }

    // Create completely new scenario object to ensure reference change
    const newScenario = {
      ...currentScenario,
      cues: updatedCues,
    }

    console.log('Successfully updated group node style')
    console.log('Original scenario reference:', currentScenario)
    console.log('New scenario reference:', newScenario)
    console.log('References are different:', currentScenario !== newScenario)

    set({
      currentScenario: newScenario,
      scenarioVersion: (get().scenarioVersion || 0) + 1,
    })
  },

  setScenarioFromJson: (config) => {
    // Rebuild a minimal index for children by id under each cue root
    const index: Record<string, NodeIndexEntry> = {}
    config.cues?.forEach((cue, cueIndex) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const children = (cue as any)?.root?.children as Array<any> | undefined
      if (Array.isArray(children)) {
        children.forEach((child, childIdx) => {
          if (child && typeof child.id === 'string') {
            index[child.id] = { cueIndex, path: [childIdx] }
          }
        })
      }
    })
    set({
      currentScenario: config,
      nodeIndex: index,
      scenarioVersion: (get().scenarioVersion || 0) + 1,
    })
  },
})
