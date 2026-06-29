export type DiaryEntry = {
  id: string
  date: string
  time: string
  title?: string
  preview: string
  fullText: string
  tags: string[]
  linkCount: number
  imageCount: number
  images?: string[]
}
