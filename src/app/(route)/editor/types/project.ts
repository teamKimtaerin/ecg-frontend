export interface ProjectData {
  id: string
  name: string
  clips: import('./index').ClipItem[]
  settings: ProjectSettings
  createdAt: Date
  updatedAt: Date
}

export interface ProjectSettings {
  autoSaveEnabled: boolean
  autoSaveInterval: number // seconds
  defaultSpeaker: string
  exportFormat: 'srt' | 'vtt' | 'ass'
}

export interface SavedProject {
  id: string
  name: string
  lastModified: Date
  size: number // in bytes
}

export interface ProjectStorage {
  saveProject: (project: ProjectData) => Promise<void>
  loadProject: (id: string) => Promise<ProjectData | null>
  listProjects: () => Promise<SavedProject[]>
  deleteProject: (id: string) => Promise<void>
  exportProject: (id: string, format: 'srt' | 'vtt' | 'ass') => Promise<string>
}
