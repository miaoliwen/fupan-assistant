export interface Review {
  id: string
  title: string
  date: string
  category: string
  tags: string
  sections: ReviewSection[]
  actions: ActionItem[]
  createdAt: string
  updatedAt: string
}

export interface ReviewSection {
  id: string
  reviewId: string
  sectionTitle: string
  content: string
  order: number
}

export interface ActionItem {
  id: string
  reviewId: string
  content: string
  status: ActionStatus
  dueDate: string | null
  createdAt: string
  completedAt: string | null
}

export type ActionStatus = 'pending' | 'done' | 'deferred'

export interface Template {
  id: string
  name: string
  description: string
  category: string
  isBuiltIn: boolean
  sections: TemplateSection[]
  createdAt: string
  updatedAt: string
}

export interface TemplateSection {
  id: string
  templateId: string
  title: string
  prompt: string
  placeholder: string
  type: 'text' | 'list'
  required: boolean
  order: number
}

// Category display
export const CATEGORY_LABELS: Record<string, string> = {
  work: '工作',
  project: '项目',
  personal: '个人',
  custom: '自定义',
}

export type Theme = 'light' | 'dark'

// Graph types
export interface GraphNode {
  id: string
  label: string
  type: 'keyword' | 'review'
  count?: number
  category?: string
  date?: string
}

export interface GraphEdge {
  source: string
  target: string
  weight: number
}

// AI Chat
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Insights
export interface InsightData {
  period: string
  summary: {
    currentCount: number
    previousCount: number
    changePercent: number
    streak: number
    actionCompletionRate: number
    prevActionCompletionRate: number
  }
  categories: Record<string, number>
  topKeywords: { word: string; count: number }[]
  recurringThemes: { keyword: string; reviewCount: number }[]
  dailyTrend: { date: string; count: number }[]
}

export interface AISummary {
  summary: string
  highlights: string[]
  patterns: string[]
  suggestions: string[]
}

// Stats
export interface Stats {
  totalReviews: number
  categoryStats: Record<string, number>
  totalActions: number
  doneActions: number
  pendingActions: number
  completionRate: number
  dailyData: { date: string; count: number }[]
  monthlyData: { month: string; count: number }[]
  streak: number
}
