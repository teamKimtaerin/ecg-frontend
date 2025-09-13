/**
 * Motion Text Renderer 시나리오 생성 유틸리티 (shared)
 */

export interface RendererConfig {
  version: '1.3'
  timebase: { unit: 'seconds' | 'tc'; fps?: number }
  stage: {
    baseAspect: '16:9' | '9:16' | 'auto'
    backgroundColor?: string
    safeArea?: { top?: number; bottom?: number; left?: number; right?: number }
  }
  behavior?: {
    preloadMs?: number
    resizeThrottleMs?: number
    snapToFrame?: boolean
  }
  tracks: Array<{
    id: string
    type: 'subtitle' | 'free'
    layer: number
    defaultStyle?: Record<string, unknown>
    safeArea?: { top?: number; bottom?: number; left?: number; right?: number }
  }>
  cues: Array<{
    id: string
    track: string
    hintTime?: { start?: number; end?: number }
    root: Record<string, unknown>
  }>
}

export interface PluginManifest {
  name: string
  version: string
  pluginApi: string
  targets: string[]
  capabilities?: string[]
  schema: Record<string, SchemaProperty>
}

export interface SchemaProperty {
  type: 'number' | 'string' | 'boolean' | 'select'
  label: string
  description: string
  default: unknown
  min?: number
  max?: number
  step?: number
  enum?: string[]
}

export interface PreviewSettings {
  text: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  pluginParams: Record<string, unknown>
  rotationDeg?: number
  fontSizeRel?: number
}

export type ManifestLoadMode = 'server' | 'local' | 'auto'

export interface ManifestLoadOptions {
  mode?: ManifestLoadMode
  serverBase?: string
  localBase?: string
  fetchImpl?: typeof fetch
}

export async function loadPluginManifest(
  pluginName: string,
  opts: ManifestLoadOptions = {}
): Promise<PluginManifest> {
  try {
    const key = pluginName.includes('@') ? pluginName : `${pluginName}@1.0.0`
    const mode: ManifestLoadMode = opts.mode ?? 'auto'
    const serverBase = (opts.serverBase ?? '').replace(/\/$/, '')
    const localBase = opts.localBase ?? ''
    const f =
      opts.fetchImpl ??
      (typeof fetch !== 'undefined' ? fetch.bind(window) : undefined)
    if (!f)
      throw new Error('No fetch implementation available in this environment')

    const tryUrls: string[] = []
    if (mode === 'server' || mode === 'auto') {
      if (serverBase)
        tryUrls.push(
          `${serverBase}/plugins/${encodeURIComponent(key)}/manifest.json`
        )
      if (serverBase) tryUrls.push(`${serverBase}/plugins/${key}/manifest.json`)
    }
    if (mode === 'local' || mode === 'auto') {
      if (localBase) {
        const base = localBase.endsWith('/') ? localBase : localBase + '/'
        tryUrls.push(`${base}${encodeURIComponent(key)}/manifest.json`)
        tryUrls.push(`${base}${key}/manifest.json`)
      }
      tryUrls.push(`/plugin/${encodeURIComponent(key)}/manifest.json`)
      tryUrls.push(`/plugin/${key}/manifest.json`)
    }

    let lastErr: unknown = null
    for (const url of tryUrls) {
      try {
        const res = await f(url)
        if (!res || !res.ok) continue
        const ct = res.headers.get('content-type') || ''
        if (/json/i.test(ct)) return await res.json()
        try {
          return await res.json()
        } catch {
          continue
        }
      } catch (e) {
        lastErr = e
      }
    }
    throw new Error(
      `Failed to load manifest for ${pluginName}. Tried ${tryUrls.join(', ')}. Last error: ${String(lastErr)}`
    )
  } catch (error) {
    console.error(`Error loading manifest for ${pluginName}:`, error)
    throw error
  }
}

export function getDefaultParameters(
  manifest: PluginManifest
): Record<string, unknown> {
  const params: Record<string, unknown> = {}
  Object.entries(manifest.schema).forEach(([key, property]) => {
    params[key] = property.default
  })
  return params
}

export function generatePreviewScenario(
  pluginName: string,
  settings: PreviewSettings,
  duration: number = 3
): RendererConfig {
  const centerX = settings.position.x + settings.size.width / 2
  const centerY = settings.position.y + settings.size.height / 2
  const normalizedX = Math.max(0, Math.min(1, centerX / 640))
  const normalizedY = Math.max(0, Math.min(1, centerY / 360))
  const relW = Math.max(0, Math.min(1, settings.size.width / 640))
  const relH = Math.max(0, Math.min(1, settings.size.height / 360))

  return {
    version: '1.3',
    timebase: { unit: 'seconds' },
    stage: { baseAspect: '16:9', backgroundColor: 'transparent' },
    tracks: [{ id: 'preview-track', type: 'free', layer: 1 }],
    cues: [
      {
        id: 'preview-cue',
        track: 'preview-track',
        hintTime: { start: 0 },
        root: {
          e_type: 'group',
          layout: {
            position: { x: normalizedX, y: normalizedY },
            anchor: 'cc',
            size: { width: relW, height: relH },
          },
          children: [
            {
              e_type: 'text',
              text: settings.text,
              absStart: 0,
              absEnd: duration,
              layout: {
                position: { x: 0.5, y: 0.5 },
                anchor: 'cc',
                size: { width: 'auto', height: 'auto' },
                overflow: 'visible',
              },
              style: {
                fontSizeRel: settings.fontSizeRel || 0.06,
                fontFamily: 'Arial, sans-serif',
                color: '#ffffff',
                align: 'center',
                whiteSpace: 'nowrap',
              },
              pluginChain: [
                {
                  name: pluginName,
                  params: settings.pluginParams,
                },
              ],
            },
          ],
        },
      },
    ],
  } as RendererConfig
}

export function generateLoopedScenario(
  pluginName: string,
  settings: PreviewSettings,
  duration: number = 3
): RendererConfig {
  // Convert top-left position to center position for group layout
  const centerX = settings.position.x + settings.size.width / 2
  const centerY = settings.position.y + settings.size.height / 2
  const normalizedX = Math.max(0, Math.min(1, centerX / 640))
  const normalizedY = Math.max(0, Math.min(1, centerY / 360))
  const relW = Math.max(0, Math.min(1, settings.size.width / 640))
  const relH = Math.max(0, Math.min(1, settings.size.height / 360))
  const pluginChain = [
    {
      name: pluginName,
      params: settings.pluginParams,
      relStartPct: 0.0,
      relEndPct: 1.0,
    },
  ]
  const scenario = {
    version: '1.3',
    timebase: { unit: 'seconds' },
    stage: { baseAspect: '16:9' },
    tracks: [{ id: 'free', type: 'free', layer: 1 }],
    cues: [
      {
        id: 'preview-cue',
        track: 'free',
        root: {
          e_type: 'group',
          layout: {
            position: { x: normalizedX, y: normalizedY },
            anchor: 'cc',
            size: { width: relW, height: relH },
            transform:
              settings.rotationDeg != null
                ? { rotate: { deg: settings.rotationDeg } }
                : undefined,
            transformOrigin: '50% 50%',
          },
          children: [
            {
              e_type: 'text',
              text: settings.text,
              absStart: 0,
              absEnd: duration,
              layout: {
                position: { x: 0.5, y: 0.5 },
                anchor: 'cc',
                size: { width: 'auto', height: 'auto' },
                overflow: 'visible',
              },
              style: {
                fontSizeRel: settings.fontSizeRel || 0.07,
                fontFamily: 'Arial, sans-serif',
                color: '#ffffff',
                align: 'center',
                whiteSpace: 'nowrap',
              },
              pluginChain: pluginChain,
            },
          ],
        },
      },
    ],
  } as RendererConfig
  return scenario
}

export function validateAndNormalizeParams(
  params: Record<string, unknown>,
  manifest: PluginManifest
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {}
  Object.entries(manifest.schema).forEach(([key, property]) => {
    const value = params[key] ?? property.default
    switch (property.type) {
      case 'number': {
        let numValue = Number(value as number)
        if (!Number.isFinite(numValue)) {
          const d =
            typeof property.default === 'number'
              ? property.default
              : Number(property.default as number)
          numValue = Number.isFinite(d) ? (d as number) : 0
        }
        if (property.min !== undefined)
          numValue = Math.max(property.min, numValue)
        if (property.max !== undefined)
          numValue = Math.min(property.max, numValue)
        normalized[key] = numValue
        break
      }
      case 'boolean':
        normalized[key] = Boolean(value)
        break
      case 'select': {
        const v = String(value)
        const ok = property.enum?.includes(v)
        normalized[key] = ok ? v : String(property.default ?? '')
        break
      }
      case 'string':
      default:
        normalized[key] = String(value ?? property.default ?? '')
        break
    }
  })
  return normalized
}
