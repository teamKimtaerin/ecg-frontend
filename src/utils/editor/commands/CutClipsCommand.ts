import { ClipItem } from '@/app/(route)/editor/types'

/**
 * 클립 잘라내기 Command 클래스
 * - 선택된 클립들을 클립보드에 복사하고 원본에서 삭제
 * - Undo 시 원래 위치에 복원
 */
import { EditorCommand } from '../EditorHistory'

export class CutClipsCommand implements EditorCommand {
  private originalClips: ClipItem[]
  private cutClips: ClipItem[]
  private cutClipIds: string[]
  private setClips: (clips: ClipItem[]) => void
  private setClipboard: (clips: ClipItem[]) => void

  constructor(
    clips: ClipItem[],
    clipIds: string[],
    setClips: (clips: ClipItem[]) => void,
    setClipboard: (clips: ClipItem[]) => void
  ) {
    this.originalClips = [...clips]
    this.cutClipIds = clipIds
    this.cutClips = clips.filter((clip) => clipIds.includes(clip.id))
    this.setClips = setClips
    this.setClipboard = setClipboard
  }

  execute(): void {
    // 클립보드에 복사
    this.setClipboard([...this.cutClips])

    // 원본에서 삭제
    const remainingClips = this.originalClips.filter(
      (clip) => !this.cutClipIds.includes(clip.id)
    )
    this.setClips(remainingClips)
  }

  undo(): void {
    // 원본 상태로 복원
    this.setClips([...this.originalClips])
  }

  get description(): string {
    return `클립 ${this.cutClips.length}개 잘라내기`
  }
}
