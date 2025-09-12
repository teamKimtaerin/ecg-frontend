/**
 * Local plugin loader for MotionText (shared)
 */
import type { RendererConfig } from './scenarioGenerator'
import {
  configurePluginSource,
  registerExternalPlugin,
} from 'motiontext-renderer'

export interface TLHandle {
  pause?: () => TLHandle
  progress?: (p: number) => TLHandle
  repeat?: (n: number) => TLHandle
  kill?: () => void
}
export type ProgressFn = (p: number) => void

export interface GsapLike {
  timeline?: (opts?: unknown) => TLHandle
  utils?: { random: (min: number, max: number) => number }
}

export interface PluginContext {
  gsap?: GsapLike
  assets?: { getUrl: (p: string) => string }
}

export interface PluginRuntime {
  name?: string
  version?: string
  init?: (
    el: HTMLElement,
    opts: Record<string, unknown>,
    ctx: PluginContext
  ) => void
  animate?: (
    el: HTMLElement,
    opts: Record<string, unknown>,
    ctx: PluginContext,
    duration: number
  ) => TLHandle | ProgressFn | void
  cleanup?: (el: HTMLElement) => void
}

export interface PluginRuntimeModule {
  default?: PluginRuntime
  evalChannels?: (
    spec: unknown,
    p: number,
    ctx: PluginContext
  ) => Record<string, unknown>
}

const cache = new Map<string, PluginRuntimeModule>()
const registeredPlugins = new Set<string>()

const LOCAL_PLUGINS = [
  'fadein@1.0.0',
  'elastic@1.0.0',
  'glitch@1.0.0',
  'magnetic@1.0.0',
  'rotation@1.0.0',
  'scalepop@1.0.0',
  'slideup@1.0.0',
  'typewriter@1.0.0',
]

export function configurePluginLoader() {
  console.log('[PluginLoader] Configuring plugin source for local mode')
  configurePluginSource({ mode: 'local', localBase: '/plugin/' })
}

function resolveKey(name: string): string {
  return name.includes('@') ? name : `${name}@1.0.0`
}

export async function loadLocalPlugin(
  name: string
): Promise<PluginRuntimeModule> {
  if (!name) throw new Error('Plugin name is required')
  const key = resolveKey(name)
  if (cache.has(key)) return cache.get(key) as PluginRuntimeModule

  const url = new URL(
    `/plugin/${encodeURIComponent(key)}/index.mjs`,
    window.location.origin
  ).toString()
  const mod: PluginRuntimeModule = await import(
    /* webpackIgnore: true */ /* @vite-ignore */ url
  )
  cache.set(key, mod)

  if (!registeredPlugins.has(key)) {
    try {
      const manifestResponse = await fetch(
        `/plugin/${encodeURIComponent(key)}/manifest.json`
      )
      const manifest = manifestResponse.ok
        ? await manifestResponse.json()
        : { version: '1.0.0' }
      const pluginNameWithoutVersion = key.split('@')[0]
      registerExternalPlugin({
        name: pluginNameWithoutVersion,
        version: manifest.version || '1.0.0',
        module: mod,
        baseUrl: `/plugin/${encodeURIComponent(key)}/`,
        manifest: manifest,
      })
      registeredPlugins.add(key)
      console.log(
        `[PluginLoader] Registered plugin with motiontext-renderer: ${key}@${manifest.version}`
      )
    } catch (error) {
      console.error(`[PluginLoader] Failed to register plugin ${key}:`, error)
    }
  }

  return mod
}

export async function preloadAllPlugins() {
  console.log('[PluginLoader] Preloading all local plugins...')
  for (const pluginName of LOCAL_PLUGINS) {
    try {
      await loadLocalPlugin(pluginName)
    } catch (error) {
      console.warn(`[PluginLoader] Failed to load plugin ${pluginName}:`, error)
    }
  }
  console.log('[PluginLoader] Plugin preloading complete')
}

function extractPluginNames(scenario: RendererConfig): Set<string> {
  const pluginNames = new Set<string>()
  scenario.cues?.forEach((cue) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const traverse = (node: any): void => {
      if (node?.plugin?.name) pluginNames.add(node.plugin.name)
      if (Array.isArray(node?.pluginChain)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        node.pluginChain.forEach((p: any) => {
          if (p.name) pluginNames.add(p.name)
        })
      }
      if (Array.isArray(node?.children)) node.children.forEach(traverse)
    }
    traverse(cue.root)
  })
  return pluginNames
}

export async function preloadPluginsForScenario(scenario: RendererConfig) {
  console.log('[PluginLoader] Preloading plugins for scenario...')
  const requiredPlugins = extractPluginNames(scenario)
  console.log('[PluginLoader] Required plugins:', Array.from(requiredPlugins))
  for (const pluginName of requiredPlugins) {
    try {
      await loadLocalPlugin(pluginName)
    } catch (error) {
      console.warn(
        `[PluginLoader] Failed to load required plugin ${pluginName}:`,
        error
      )
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== 'undefined' && (window as any).__motionTextPlugins) {
    console.log(
      '[PluginLoader] Available plugins:',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.keys((window as any).__motionTextPlugins)
    )
  }
}

let gsapCache: GsapLike | undefined

export function getGsap(): GsapLike | undefined {
  try {
    if (typeof window !== 'undefined') {
      const w = window as unknown as { gsap?: GsapLike }
      if (w.gsap) return w.gsap
    }
  } catch {}
  return undefined
}

export async function ensureGsap(): Promise<GsapLike | undefined> {
  if (gsapCache) return gsapCache
  const g = getGsap()
  if (g) {
    gsapCache = g
    return g
  }
  try {
    const mod = (await import('gsap')) as unknown as { default?: GsapLike }
    const gs = mod && mod.default ? mod.default : undefined
    if (gs && typeof window !== 'undefined') {
      ;(window as unknown as { gsap?: GsapLike }).gsap = gs
    }
    gsapCache = gs
    return gs
  } catch {
    return undefined
  }
}
