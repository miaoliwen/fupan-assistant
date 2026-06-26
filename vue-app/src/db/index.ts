import { openDB, type IDBPDatabase } from 'idb'
import type { Review, ReviewSection, ActionItem, Template, TemplateSection } from '@/types'

const DB_NAME = 'fupan-db'
const DB_VERSION = 1

let dbInstance: IDBPDatabase | null = null

export async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Reviews store
      if (!db.objectStoreNames.contains('reviews')) {
        const reviewStore = db.createObjectStore('reviews', { keyPath: 'id' })
        reviewStore.createIndex('date', 'date', { unique: false })
        reviewStore.createIndex('category', 'category', { unique: false })
        reviewStore.createIndex('title', 'title', { unique: false })
      }

      // Review sections store
      if (!db.objectStoreNames.contains('sections')) {
        const sectionStore = db.createObjectStore('sections', { keyPath: 'id' })
        sectionStore.createIndex('reviewId', 'reviewId', { unique: false })
      }

      // Action items store
      if (!db.objectStoreNames.contains('actions')) {
        const actionStore = db.createObjectStore('actions', { keyPath: 'id' })
        actionStore.createIndex('reviewId', 'reviewId', { unique: false })
        actionStore.createIndex('status', 'status', { unique: false })
        actionStore.createIndex('dueDate', 'dueDate', { unique: false })
      }

      // Templates store
      if (!db.objectStoreNames.contains('templates')) {
        const templateStore = db.createObjectStore('templates', { keyPath: 'id' })
        templateStore.createIndex('category', 'category', { unique: false })
        templateStore.createIndex('isBuiltIn', 'isBuiltIn', { unique: false })
      }

      // Template sections store
      if (!db.objectStoreNames.contains('templateSections')) {
        const tsStore = db.createObjectStore('templateSections', { keyPath: 'id' })
        tsStore.createIndex('templateId', 'templateId', { unique: false })
      }
    },
  })

  return dbInstance
}

// ==================== Reviews ====================

export async function getAllReviews(params?: {
  limit?: number
  offset?: number
  category?: string
  search?: string
}): Promise<{ reviews: Review[]; total: number }> {
  const db = await getDB()
  const tx = db.transaction(['reviews', 'sections', 'actions'], 'readonly')
  const reviewStore = tx.objectStore('reviews')
  const sectionStore = tx.objectStore('sections')
  const actionStore = tx.objectStore('actions')

  let allReviews: Review[] = []

  // Apply filters
  if (params?.category) {
    const index = reviewStore.index('category')
    allReviews = await index.getAll(params.category) as Review[]
  } else {
    allReviews = await reviewStore.getAll() as Review[]
  }

  // Search filter
  if (params?.search) {
    const q = params.search.toLowerCase()
    allReviews = allReviews.filter((r) => {
      if (r.title.toLowerCase().includes(q)) return true
      // Will search sections after loading
      return false
    })
  }

  // Sort by date descending
  allReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const total = allReviews.length

  // Paginate
  const limit = params?.limit || 20
  const offset = params?.offset || 0
  const paged = allReviews.slice(offset, offset + limit)

  // Attach sections and actions
  for (const review of paged) {
    review.sections = (await sectionStore.index('reviewId').getAll(review.id)) as ReviewSection[]
    review.sections.sort((a: ReviewSection, b: ReviewSection) => a.order - b.order)
    review.actions = (await actionStore.index('reviewId').getAll(review.id)) as ActionItem[]
    review.actions.sort((a: ActionItem, b: ActionItem) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  // Apply search on sections if needed
  if (params?.search) {
    const q = params.search.toLowerCase()
    return {
      reviews: paged.filter((r) =>
        r.title.toLowerCase().includes(q) ||
        r.sections.some((s) => s.content.toLowerCase().includes(q))
      ),
      total,
    }
  }

  return { reviews: paged, total }
}

export async function getReviewById(id: string): Promise<Review | null> {
  const db = await getDB()
  const tx = db.transaction(['reviews', 'sections', 'actions'], 'readonly')
  const review = await tx.objectStore('reviews').get(id) as Review | undefined
  if (!review) return null

  review.sections = (await tx.objectStore('sections').index('reviewId').getAll(id)) as ReviewSection[]
  review.sections.sort((a: ReviewSection, b: ReviewSection) => a.order - b.order)
  review.actions = (await tx.objectStore('actions').index('reviewId').getAll(id)) as ActionItem[]
  review.actions.sort((a: ActionItem, b: ActionItem) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return review
}

export async function createReview(data: {
  title: string
  category: string
  sections: { sectionTitle: string; content: string; order: number }[]
}): Promise<Review> {
  const db = await getDB()
  const tx = db.transaction(['reviews', 'sections'], 'readwrite')
  const now = new Date().toISOString()
  const reviewId = crypto.randomUUID()

  const review: Review = {
    id: reviewId,
    title: data.title,
    date: now,
    category: data.category,
    tags: '[]',
    sections: [],
    actions: [],
    createdAt: now,
    updatedAt: now,
  }

  await tx.objectStore('reviews').add(review)

  for (const sec of data.sections) {
    const section: ReviewSection = {
      id: crypto.randomUUID(),
      reviewId,
      sectionTitle: sec.sectionTitle,
      content: sec.content,
      order: sec.order,
    }
    await tx.objectStore('sections').add(section)
    review.sections.push(section)
  }

  await tx.done
  return review
}

export async function updateReview(id: string, data: {
  title?: string
  category?: string
  sections?: { id?: string; sectionTitle: string; content: string; order: number }[]
}): Promise<Review | null> {
  const db = await getDB()
  const tx = db.transaction(['reviews', 'sections'], 'readwrite')
  const review = await tx.objectStore('reviews').get(id)
  if (!review) return null

  if (data.title !== undefined) review.title = data.title
  if (data.category !== undefined) review.category = data.category
  review.updatedAt = new Date().toISOString()

  await tx.objectStore('reviews').put(review)

  if (data.sections) {
    // Delete old sections
    const oldSections = await tx.objectStore('sections').index('reviewId').getAll(id)
    for (const s of oldSections) {
      await tx.objectStore('sections').delete(s.id)
    }

    // Create new sections
    review.sections = []
    for (const sec of data.sections) {
      const section: ReviewSection = {
        id: sec.id || crypto.randomUUID(),
        reviewId: id,
        sectionTitle: sec.sectionTitle,
        content: sec.content,
        order: sec.order,
      }
      await tx.objectStore('sections').add(section)
      review.sections.push(section)
    }
    review.sections.sort((a: ReviewSection, b: ReviewSection) => a.order - b.order)
  }

  await tx.done
  return review
}

export async function deleteReview(id: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['reviews', 'sections', 'actions'], 'readwrite')

  await tx.objectStore('reviews').delete(id)

  const oldSections = await tx.objectStore('sections').index('reviewId').getAll(id)
  for (const s of oldSections) {
    await tx.objectStore('sections').delete(s.id)
  }

  const oldActions = await tx.objectStore('actions').index('reviewId').getAll(id)
  for (const a of oldActions) {
    await tx.objectStore('actions').delete(a.id)
  }

  await tx.done
}

// ==================== Actions ====================

export async function createAction(data: {
  reviewId: string
  content: string
  dueDate: string | null
}): Promise<ActionItem> {
  const db = await getDB()
  const tx = db.transaction('actions', 'readwrite')
  const now = new Date().toISOString()
  const action: ActionItem = {
    id: crypto.randomUUID(),
    reviewId: data.reviewId,
    content: data.content,
    status: 'pending',
    dueDate: data.dueDate,
    createdAt: now,
    completedAt: null,
  }
  await tx.objectStore('actions').add(action)
  await tx.done
  return action
}

export async function updateAction(id: string, data: {
  content?: string
  status?: 'pending' | 'done' | 'deferred'
  dueDate?: string | null
}): Promise<ActionItem | null> {
  const db = await getDB()
  const tx = db.transaction('actions', 'readwrite')
  const action = await tx.objectStore('actions').get(id)
  if (!action) return null

  if (data.content !== undefined) action.content = data.content
  if (data.status !== undefined) {
    action.status = data.status
    action.completedAt = data.status === 'done' ? new Date().toISOString() : null
  }
  if (data.dueDate !== undefined) action.dueDate = data.dueDate

  await tx.objectStore('actions').put(action)
  await tx.done
  return action
}

export async function deleteAction(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('actions', id)
}

export async function getAllActions(): Promise<{
  pending: ActionItem[]
  overdue: ActionItem[]
  dueSoon: ActionItem[]
  stats: { total: number; overdue: number; dueSoon: number }
}> {
  const db = await getDB()
  const allActions = await db.getAll('actions')
  const now = new Date()

  const pending = allActions
    .filter((a) => a.status === 'pending')
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))

  // Attach review info
  const reviews = await db.getAll('reviews')
  const reviewMap = new Map(reviews.map((r) => [r.id, r]))

  const pendingWithReview = pending.map((a) => ({
    ...a,
    review: {
      title: reviewMap.get(a.reviewId)?.title || '',
      date: reviewMap.get(a.reviewId)?.date || '',
      category: reviewMap.get(a.reviewId)?.category || '',
    },
  }))

  // Overload as any to include review info
  const overdue = pendingWithReview.filter((a) => a.dueDate && new Date(a.dueDate) < now) as any
  const dueSoon = pendingWithReview.filter((a) => {
    if (!a.dueDate) return false
    const due = new Date(a.dueDate)
    const threeDays = 3 * 24 * 60 * 60 * 1000
    return due > now && due.getTime() - now.getTime() < threeDays
  }) as any

  return {
    pending: pendingWithReview as any,
    overdue,
    dueSoon,
    stats: {
      total: pending.length,
      overdue: overdue.length,
      dueSoon: dueSoon.length,
    },
  }
}

// ==================== Stats ====================

export async function getStats(): Promise<{
  totalReviews: number
  categoryStats: Record<string, number>
  totalActions: number
  doneActions: number
  pendingActions: number
  completionRate: number
  dailyData: { date: string; count: number }[]
  monthlyData: { month: string; count: number }[]
  streak: number
}> {
  const db = await getDB()
  const reviews = await db.getAll('reviews')
  const allActions = await db.getAll('actions')
  const now = new Date()

  // Category stats
  const categoryStats: Record<string, number> = {}
  reviews.forEach((r) => {
    categoryStats[r.category] = (categoryStats[r.category] || 0) + 1
  })

  // Action stats
  const totalActions = allActions.length
  const doneActions = allActions.filter((a) => a.status === 'done').length
  const pendingActions = allActions.filter((a) => a.status === 'pending').length

  // Daily data (last 30 days)
  const dailyCounts: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    dailyCounts[key] = 0
  }
  reviews.forEach((r) => {
    const key = new Date(r.date).toISOString().slice(0, 10)
    if (key in dailyCounts) dailyCounts[key]++
  })
  const dailyData = Object.entries(dailyCounts).map(([date, count]) => ({
    date: date.slice(5),
    count,
  }))

  // Streak
  let streak = 0
  const reviewDates = new Set(
    reviews.map((r) => new Date(r.date).toISOString().slice(0, 10))
  )
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  for (let i = 0; i < 365; i++) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    if (reviewDates.has(key)) {
      streak++
    } else if (i > 0) {
      break
    }
  }

  // Monthly (last 6 months)
  const monthlyStats: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyStats[key] = 0
  }
  reviews.forEach((r) => {
    const d = new Date(r.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (key in monthlyStats) monthlyStats[key]++
  })
  const monthlyData = Object.entries(monthlyStats).map(([month, count]) => ({
    month,
    count,
  }))

  return {
    totalReviews: reviews.length,
    categoryStats,
    totalActions,
    doneActions,
    pendingActions,
    completionRate: totalActions > 0 ? Math.round((doneActions / totalActions) * 100) : 0,
    dailyData,
    monthlyData,
    streak,
  }
}

// ==================== Insights ====================

const STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一',
  '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着',
  '没有', '看', '好', '自己', '这', '他', '她', '它', '们', '那', '些',
  '什么', '这个', '那个', '可以', '已经', '还', '又', '把', '让', '给',
  '从', '但', '与', '为', '以', '对', '而', '及', '或', '被', '能',
  '如果', '因为', '所以', '然后', '之后', '之前', '现在', '已经', '下',
  '中', '个', '大', '小', '多', '少', '来', '做', '过', '得',
])

function extractKeywords(text: string): string[] {
  return text
    .replace(/[#*_\[\]()>`]/g, ' ')
    .split(/[\s,，。、；：！？\n]+/)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w))
}

export async function getInsights(period: 'week' | 'month' | 'quarter') {
  const db = await getDB()
  const now = new Date()

  const periodDays = { week: 7, month: 30, quarter: 90 }
  const days = periodDays[period]

  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  const prevStartDate = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000)

  const allReviews = await db.getAll('reviews')
  const allActions = await db.getAll('actions')

  // Filter by periods
  const currentReviews = allReviews.filter(
    (r) => new Date(r.date) >= startDate
  )
  const previousReviews = allReviews.filter(
    (r) => new Date(r.date) >= prevStartDate && new Date(r.date) < startDate
  )

  // Load sections for current reviews
  const tx = db.transaction('sections', 'readonly')
  const sectionStore = tx.objectStore('sections')

  const currentWithSections = await Promise.all(
    currentReviews.map(async (r) => {
      const sections = await sectionStore.index('reviewId').getAll(r.id)
      sections.sort((a: ReviewSection, b: ReviewSection) => a.order - b.order)
      return { ...r, sections }
    })
  )

  await tx.done

  // Load actions for current reviews
  const actionTx = db.transaction('actions', 'readonly')
  const actionStore = actionTx.objectStore('actions')
  const currentActions = await actionStore.index('reviewId').getAll(currentReviews.map((r) => r.id))
  const prevActions = await actionStore.index('reviewId').getAll(previousReviews.map((r) => r.id))

  const currentActionPairs = []
  for (const r of currentReviews) {
    const acts = await actionStore.index('reviewId').getAll(r.id)
    currentActionPairs.push(...acts)
  }

  const prevActionPairs = []
  for (const r of previousReviews) {
    const acts = await actionStore.index('reviewId').getAll(r.id)
    prevActionPairs.push(...acts)
  }
  await actionTx.done

  // Categories
  const categories: Record<string, number> = {}
  currentReviews.forEach((r) => {
    categories[r.category] = (categories[r.category] || 0) + 1
  })

  // Keywords
  const wordFreq: Record<string, number> = {}
  currentWithSections.forEach((r) => {
    r.sections.forEach((s) => {
      if (!s.content) return
      extractKeywords(s.content).forEach((w) => {
        wordFreq[w] = (wordFreq[w] || 0) + 1
      })
    })
  })

  const topKeywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }))

  // Recurring themes
  const keywordReviewMap: Record<string, Set<string>> = {}
  currentWithSections.forEach((r) => {
    const words = new Set<string>()
    r.sections.forEach((s) => {
      if (!s.content) return
      extractKeywords(s.content).forEach((w) => words.add(w))
    })
    words.forEach((w) => {
      if (!keywordReviewMap[w]) keywordReviewMap[w] = new Set()
      keywordReviewMap[w].add(r.id)
    })
  })

  const recurringThemes = Object.entries(keywordReviewMap)
    .filter(([, ids]) => ids.size >= 2)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 10)
    .map(([keyword, ids]) => ({ keyword, reviewCount: ids.size }))

  // Daily trend
  const dailyTrend: Record<string, number> = {}
  currentReviews.forEach((r) => {
    const d = new Date(r.date)
    const key = d.toISOString().slice(5, 10)
    dailyTrend[key] = (dailyTrend[key] || 0) + 1
  })

  // Action rates
  const currentActionDone = currentActionPairs.filter((a) => a.status === 'done').length
  const currentActionTotal = currentActionPairs.length
  const prevActionDone = prevActionPairs.filter((a) => a.status === 'done').length
  const prevActionTotal = prevActionPairs.length

  // Streak
  let streak = 0
  const dates = new Set(currentReviews.map((r) => new Date(r.date).toISOString().slice(0, 10)))
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  for (let i = 0; i < 90; i++) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
    if (dates.has(d.toISOString().slice(0, 10))) streak++
    else if (i > 0) break
  }

  return {
    period,
    summary: {
      currentCount: currentReviews.length,
      previousCount: previousReviews.length,
      changePercent:
        previousReviews.length > 0
          ? Math.round(((currentReviews.length - previousReviews.length) / previousReviews.length) * 100)
          : 0,
      streak,
      actionCompletionRate:
        currentActionTotal > 0 ? Math.round((currentActionDone / currentActionTotal) * 100) : 0,
      prevActionCompletionRate:
        prevActionTotal > 0 ? Math.round((prevActionDone / prevActionTotal) * 100) : 0,
    },
    categories,
    topKeywords,
    recurringThemes,
    dailyTrend: Object.entries(dailyTrend)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count })),
  }
}

// ==================== Graph ====================

export async function getGraphData() {
  const db = await getDB()
  const reviews = await db.getAll('reviews')
  const allSections = await db.getAll('sections')
  const allActions = await db.getAll('actions')

  const recentReviews = reviews.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 100)

  // Build keywords per review
  const reviewKeywordMap: Record<string, { keywords: string[]; date: string; category: string }> = {}
  const keywordCount: Record<string, number> = {}
  const keywordCoOccur: Record<string, Record<string, number>> = {}

  recentReviews.forEach((r) => {
    const rs = allSections.filter((s) => s.reviewId === r.id)
    const words = new Set<string>()
    rs.forEach((s) => {
      if (!s.content) return
      s.content
        .replace(/[#*_\[\]()>`]/g, ' ')
        .split(/[\s,，。、；：！？\n]+/)
        .filter((w) => w.length >= 2 && w.length <= 6 && !STOP_WORDS.has(w))
        .forEach((w) => words.add(w))
    })

    const keywordList = Array.from(words)
    reviewKeywordMap[r.id] = {
      keywords: keywordList,
      date: new Date(r.date).toISOString().slice(0, 10),
      category: r.category,
    }

    keywordList.forEach((w) => {
      keywordCount[w] = (keywordCount[w] || 0) + 1
    })

    for (let i = 0; i < keywordList.length; i++) {
      for (let j = i + 1; j < keywordList.length; j++) {
        const a = keywordList[i]
        const b = keywordList[j]
        if (!keywordCoOccur[a]) keywordCoOccur[a] = {}
        if (!keywordCoOccur[b]) keywordCoOccur[b] = {}
        keywordCoOccur[a][b] = (keywordCoOccur[a][b] || 0) + 1
        keywordCoOccur[b][a] = (keywordCoOccur[b][a] || 0) + 1
      }
    }
  })

  // Build nodes
  const topKeywords = Object.entries(keywordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word, count]) => ({
      id: `kw-${word}`,
      label: word,
      type: 'keyword' as const,
      count,
    }))

  const reviewNodes = recentReviews.slice(0, 50).map((r) => ({
    id: `rv-${r.id}`,
    label: r.title,
    type: 'review' as const,
    category: r.category,
    date: new Date(r.date).toISOString().slice(0, 10),
  }))

  // Build edges
  const topKeywordSet = new Set(topKeywords.map((k) => k.label))
  const edges: { source: string; target: string; weight: number }[] = []
  const edgeSet = new Set<string>()

  Object.entries(keywordCoOccur).forEach(([a, neighbors]) => {
    if (!topKeywordSet.has(a)) return
    Object.entries(neighbors).forEach(([b, weight]) => {
      if (!topKeywordSet.has(b) || weight < 2) return
      const key = [a, b].sort().join('---')
      if (!edgeSet.has(key)) {
        edgeSet.add(key)
        edges.push({ source: `kw-${a}`, target: `kw-${b}`, weight })
      }
    })
  })

  // Keyword-review links
  recentReviews.slice(0, 50).forEach((r) => {
    const info = reviewKeywordMap[r.id]
    if (!info) return
    info.keywords.forEach((kw) => {
      if (topKeywordSet.has(kw)) {
        const key = [`rv-${r.id}`, `kw-${kw}`].sort().join('---')
        if (!edgeSet.has(key)) {
          edgeSet.add(key)
          edges.push({ source: `rv-${r.id}`, target: `kw-${kw}`, weight: 1 })
        }
      }
    })
  })

  return {
    nodes: [...topKeywords, ...reviewNodes],
    edges,
    stats: {
      totalReviews: reviews.length,
      totalKeywords: Object.keys(keywordCount).length,
      topKeywords: topKeywords.slice(0, 10).map((k) => ({ word: k.label, count: k.count })),
    },
  }
}
