export interface RealJson {
  segments: Array<{
    start_time: number | string
    end_time: number | string
    text: string
    speaker?: { speaker_id?: string }
  }>
}

export type RendererConfig = {
  version: '1.3'
  timebase: { unit: 'seconds' }
  stage: { baseAspect: '16:9' }
  tracks: Array<{ id: string; type: 'free' | 'subtitle'; layer: number }>
  cues: Array<{
    id: string
    track: string
    hintTime?: { start?: number; end?: number }
    root: Record<string, unknown>
  }>
}

function toSeconds(v: number | string): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string' && v.includes(':')) {
    const parts = v.split(':').map(Number)
    if (parts.length === 3)
      return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0)
    if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0)
  }
  return Number(v) || 0
}

export function buildScenarioFromReal(
  real: RealJson,
  opts?: { fontSizeRel?: number; bottomMargin?: number }
): RendererConfig {
  console.log('[buildScenarioFromReal] Starting conversion with data:', {
    segmentsCount: real.segments?.length || 0,
    opts,
  })

  const stageW = 640
  const stageH = 360
  const marginY = opts?.bottomMargin ?? 32
  const boxW = Math.round(stageW * 0.88)
  const boxH = 64
  const centerX = Math.round(stageW / 2)
  const centerY = Math.max(0, Math.min(stageH, stageH - marginY - boxH / 2))
  const fontSizeRel = opts?.fontSizeRel ?? 0.07
  const pluginName = 'elastic@1.0.0'

  const cues = (real.segments || [])
    .map((seg, i) => {
      const start = toSeconds(seg.start_time)
      const end = toSeconds(seg.end_time)
      const text = seg.text || ''

      console.log(`[buildScenarioFromReal] Processing segment ${i}:`, {
        start_time: seg.start_time,
        end_time: seg.end_time,
        text: seg.text,
        convertedStart: start,
        convertedEnd: end,
        finalText: text,
        isValid: end > start,
      })

      // Skip segments with invalid timing or empty text
      if (end <= start) {
        console.warn(
          `[buildScenarioFromReal] Skipping segment ${i} - invalid timing: start=${start}, end=${end}`
        )
        return null
      }

      if (!text.trim()) {
        console.warn(
          `[buildScenarioFromReal] Skipping segment ${i} - empty text`
        )
        return null
      }

      return {
        id: `cue-${i}`,
        track: 'editor',
        hintTime: { start, end },
        root: {
          e_type: 'group',
          layout: {
            position: { x: centerX / stageW, y: centerY / stageH },
            anchor: 'cc',
            size: { width: boxW / stageW, height: boxH / stageH },
          },
          children: [
            {
              e_type: 'text',
              text,
              absStart: start,
              absEnd: Math.max(end, start + 0.1), // Ensure absEnd is always greater than absStart
              layout: {
                position: { x: 0.5, y: 0.5 },
                anchor: 'cc',
                size: { width: 'auto', height: 'auto' },
                overflow: 'visible',
              },
              style: {
                fontSizeRel,
                fontFamily: 'Arial, sans-serif',
                color: '#ffffff',
                align: 'center',
                whiteSpace: 'nowrap',
              },
              pluginChain: [
                { name: pluginName, params: {}, relStartPct: 0, relEndPct: 1 },
              ],
            },
          ],
        },
      }
    })
    .filter((cue): cue is NonNullable<typeof cue> => cue !== null)

  const config = {
    version: '1.3' as const,
    timebase: { unit: 'seconds' as const },
    stage: { baseAspect: '16:9' as const },
    tracks: [{ id: 'editor', type: 'free' as const, layer: 1 }],
    cues,
  }

  console.log('[buildScenarioFromReal] Generated scenario config:', {
    totalCues: cues.length,
    config,
  })

  return config
}
