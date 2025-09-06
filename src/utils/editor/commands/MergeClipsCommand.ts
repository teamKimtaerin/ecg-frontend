import { ClipItem } from '@/app/(route)/editor/components/ClipComponent'
import { mergeSelectedClips } from '../clipMerger'
import { EditorCommand } from '../EditorHistory'

export class MergeClipsCommand implements EditorCommand {
  private originalClips: ClipItem[]
  private mergedClips: ClipItem[]
  private selectedIds: string[]
  private checkedIds: string[]
  private setClips: (clips: ClipItem[]) => void
  public description: string

  constructor(
    clips: ClipItem[],
    selectedIds: string[],
    checkedIds: string[],
    setClips: (clips: ClipItem[]) => void
  ) {
    this.originalClips = [...clips]
    this.selectedIds = [...selectedIds]
    this.checkedIds = [...checkedIds]
    this.setClips = setClips
    this.mergedClips = []
    this.description = '클립 합치기'
  }

  execute(): void {
    try {
      this.mergedClips = mergeSelectedClips(
        this.originalClips,
        this.selectedIds,
        this.checkedIds
      )
      this.setClips(this.mergedClips)
    } catch (error) {
      console.error('클립 합치기 실행 중 오류:', error)
      throw error
    }
  }

  undo(): void {
    this.setClips(this.originalClips)
  }
}
