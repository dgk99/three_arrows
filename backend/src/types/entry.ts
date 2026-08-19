export interface MemoLine {
  id: string
  text: string
  order: number
}

export interface ProgressStage {
  id: string
  label: string
  date: string | null
  order: number
  done: boolean
  isDefault: boolean
}

export interface Photo {
  id: string
  url: string
  uploadedAt: string
}

export interface Attachment {
  id: string
  fileName: string
  url: string
  fileType: string
  uploadedAt: string
}

export interface Entry {
  id: string
  title: string
  scheduledDate: string | null
  stages: ProgressStage[]
  memos: MemoLine[]
  photos: Photo[]
  attachments: Attachment[]
  createdAt: string
  updatedAt: string
}
