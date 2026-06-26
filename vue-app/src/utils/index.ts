export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function exportToMarkdown(review: {
  title: string
  date: string
  category: string
  sections: { sectionTitle: string; content: string }[]
  actions: { content: string; status: string }[]
}): void {
  const categoryLabels: Record<string, string> = {
    work: '工作',
    project: '项目',
    personal: '个人',
    custom: '自定义',
  }

  const lines: string[] = [
    `# ${review.title}`,
    '',
    `> 分类: ${categoryLabels[review.category] || review.category} | 日期: ${formatDate(review.date)}`,
    '',
    '---',
    '',
  ]

  review.sections.forEach((s) => {
    lines.push(`## ${s.sectionTitle}`, '')
    lines.push(s.content || '_未填写_')
    lines.push('')
  })

  if (review.actions.length > 0) {
    lines.push('## 行动项', '')
    review.actions.forEach((a) => {
      const status = a.status === 'done' ? 'x' : ' '
      lines.push(`- [${status}] ${a.content}`)
    })
    lines.push('')
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${review.title}.md`
  link.click()
  URL.revokeObjectURL(url)
}
