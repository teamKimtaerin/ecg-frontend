import { apiGet } from '@/lib/api/apiClient'
import { AssetItem } from '@/types/asset-store'

export interface AssetsResponse {
  assets: AssetItem[]
}

/**
 * 플러그인 에셋 목록을 가져옵니다.
 */
export async function getAssets(options?: {
  category?: string
  is_pro?: boolean
}): Promise<AssetItem[]> {
  try {
    const queryParams = new URLSearchParams()
    if (options?.category) {
      queryParams.append('category', options.category)
    }
    if (options?.is_pro !== undefined) {
      queryParams.append('is_pro', options.is_pro.toString())
    }

    const endpoint = `/api/v1/assets${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await apiGet(endpoint)

    if (!response.ok) {
      throw new Error(`Failed to fetch assets: ${response.status}`)
    }

    const data: AssetsResponse = await response.json()

    // 플러그인 URL 해석
    const origin = (
      process.env.NEXT_PUBLIC_MOTIONTEXT_PLUGIN_ORIGIN || 'http://localhost:80'
    ).replace(/\/$/, '')

    const resolvedAssets = data.assets.map((asset) => {
      if (asset.pluginKey) {
        const base = `${origin}/plugins/${asset.pluginKey}`
        return {
          ...asset,
          thumbnail: `${base}/${asset.thumbnailPath || 'assets/thumbnail.svg'}`,
          manifestFile: `${base}/manifest.json`,
        }
      }
      return asset
    })

    return resolvedAssets
  } catch (error) {
    console.error('Error fetching assets:', error)
    throw error
  }
}
