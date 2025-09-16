import { ClipItem, Word } from '@/app/(route)/editor/types'

// real.json segment 타입 정의
interface Segment {
  start_time: number
  end_time: number
  duration: number
  speaker: {
    speaker_id: string
    confidence: number
  }
  emotion?: {
    emotion: string
    confidence: number
  }
  text: string
  words: Array<{
    word: string
    start: number
    end: number
    confidence: number
  }>
}

export interface Metadata {
  filename: string
  duration: number
  sample_rate: number
  processed_at: string
  processing_time: number
  total_segments: number
  unique_speakers: number
  dominant_emotion: string
  avg_confidence: number
  processing_mode: string
  config: MetadataConfig
  subtitle_optimization: boolean
}

export interface MetadataConfig {
  enable_gpu: boolean
  segment_length: number
  language: string
  unified_model: string
  emotion_model: string
}

// 초를 MM:SS 형식으로 변환
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// Segment를 ClipItem으로 변환
export function convertSegmentToClip(
  segment: Segment,
  index: number
): ClipItem {
  const clipId = `clip_${index + 1}_${Date.now()}`

  // words 변환 - ensure text is properly preserved
  const words: Word[] = segment.words.map((word, wordIndex) => ({
    id: `${clipId}_word_${wordIndex}`,
    text: word.word.trim(), // Trim any whitespace
    start: word.start,
    end: word.end,
    isEditable: true,
    confidence: word.confidence,
  }))

  // Ensure text is properly decoded and preserved
  const text = segment.text || words.map((w) => w.text).join(' ')

  return {
    id: clipId,
    timeline: formatTime(segment.start_time),
    speaker: segment.speaker.speaker_id, // Keep original speaker ID for now
    subtitle: text,
    fullText: text,
    duration: `${segment.duration.toFixed(1)}초`,
    thumbnail: '/placeholder-thumb.jpg',
    words,
  }
}

// 전체 segments 배열을 clips 배열로 변환
export function convertSegmentsToClips(segments: Segment[]): ClipItem[] {
  return segments.map((segment, index) => convertSegmentToClip(segment, index))
}

// real.json 전체 데이터 구조
export interface TranscriptionData {
  metadata?: Metadata
  speakers?: Record<string, undefined>
  segments: Segment[]
}

// real.json 데이터를 파싱하고 clips로 변환
export async function loadTranscriptionData(url: string): Promise<ClipItem[]> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(
        `Failed to load transcription data: ${response.statusText}`
      )
    }

    const data: TranscriptionData = await response.json()

    if (!data.segments || !Array.isArray(data.segments)) {
      console.warn('No segments found in transcription data')
      return []
    }

    const clips = convertSegmentsToClips(data.segments)
    return clips
  } catch (error) {
    console.error('Error loading transcription data:', error)
    return []
  }
}
