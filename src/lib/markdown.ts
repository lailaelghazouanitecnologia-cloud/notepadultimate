// Zarnetti Markdown Engine v2
// Supports: all standard markdown + wiki-links + callouts + directives

import DOMPurify from 'dompurify'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function parseAttrs(str: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const regex = /(\w+)="([^"]*)"/g
  let m
  while ((m = regex.exec(str)) !== null) attrs[m[1]] = m[2]
  return attrs
}

function parseInline(text: string): string {
  let r = escapeHtml(text)

  // Wiki-links [[Note Name]]
  r = r.replace(/\[\[([^\]]+)\]\]/g, '<span class="zn-wikilink" data-link="$1">$1</span>')

  // Inline badge :badge[text]{color="blue"}
  r = r.replace(/:badge\[([^\]]+)\]\{([^}]*)\}/g, (_m, label, attrStr) => {
    const attrs = parseAttrs(attrStr)
    return `<span class="zn-badge" style="${attrs.color ? `color:${attrs.color}` : ''}">${label}</span>`
  })

  // Images
  r = r.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
  // Links
  r = r.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  // Inline code (must come before bold/italic to avoid conflicts)
  r = r.replace(/`([^`]+)`/g, '<code>$1</code>')
  // Bold+italic
  r = r.replace(/\*{3}(.+?)\*{3}/g, '<strong><em>$1</em></strong>')
  // Bold
  r = r.replace(/\*{2}(.+?)\*{2}/g, '<strong>$1</strong>')
  // Italic
  r = r.replace(/\*(.+?)\*/g, '<em>$1</em>')
  // Strikethrough
  r = r.replace(/~~(.+?)~~/g, '<del>$1</del>')
  // Highlight
  r = r.replace(/==(.+?)==/g, '<mark>$1</mark>')

  return r
}

interface Block {
  type: string
  content: string
  lang?: string
  items?: Block[]
  rows?: string[][]
  header?: string[]
  level?: number
  checked?: boolean | null
  attrs?: Record<string, string>
  lines?: string[]
  children?: Block[]
}

function parseListItems(lines: string[], startIdx: number, marker: RegExp): { items: Block[], nextIdx: number } {
  const items: Block[] = []
  let i = startIdx

  while (i < lines.length) {
    const match = lines[i].match(marker)
    if (!match) break

    const indent = lines[i].search(/\S/)
    const text = lines[i].replace(marker, '')

    // Check for task
    const taskMatch = text.match(/^\[([xX ])\]\s*(.*)/)
    const item: Block = taskMatch
      ? { type: 'task', checked: taskMatch[1].toLowerCase() === 'x', content: taskMatch[2] }
      : { type: 'li', content: text }

    // Gather continuation lines (indented more than the marker)
    i++
    const contLines: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].match(marker) && lines[i].search(/\S/) > indent) {
      contLines.push(lines[i].trim())
      i++
    }
    if (contLines.length > 0) {
      item.content += '\n' + contLines.join('\n')
    }

    items.push(item)
  }

  return { items, nextIdx: i }
}

function tokenize(markdown: string): Block[] {
  const lines = markdown.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Directive :::type{attrs}
    const dirMatch = line.match(/^:::(\w+)(?:\{([^}]*)\})?/)
    if (dirMatch && line.trim() !== ':::') {
      const dtype = dirMatch[1]
      const attrs = dirMatch[2] ? parseAttrs(dirMatch[2]) : {}
      const content: string[] = []
      i++
      while (i < lines.length && lines[i].trim() !== ':::') {
        content.push(lines[i])
        i++
      }
      if (i < lines.length) i++ // skip closing :::
      blocks.push({ type: 'directive', content: dtype, attrs, lines: content })
      continue
    }

    // Code block
    if (line.trimStart().startsWith('```')) {
      const lang = line.trimStart().slice(3).trim()
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        code.push(lines[i])
        i++
      }
      if (i < lines.length) i++
      blocks.push({ type: 'code', content: code.join('\n'), lang })
      continue
    }

    // Heading
    const headMatch = line.match(/^(#{1,6})\s+(.+)/)
    if (headMatch) {
      blocks.push({ type: 'heading', level: headMatch[1].length, content: headMatch[2] })
      i++
      continue
    }

    // HR
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push({ type: 'hr', content: '' })
      i++
      continue
    }

    // Blockquote
    if (line.startsWith('>')) {
      const qlines: string[] = []
      while (i < lines.length && (lines[i].startsWith('>') || (lines[i].trim() !== '' && qlines.length > 0 && !lines[i].startsWith('#')))) {
        if (lines[i].startsWith('>')) {
          qlines.push(lines[i].replace(/^>\s?/, ''))
        } else {
          qlines.push(lines[i])
        }
        i++
      }
      blocks.push({ type: 'blockquote', content: qlines.join('\n') })
      continue
    }

    // Table
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?\s*[-:]+[-| :]*$/.test(lines[i + 1])) {
      const hdr = line.split('|').map(c => c.trim()).filter(Boolean)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        rows.push(lines[i].split('|').map(c => c.trim()).filter(Boolean))
        i++
      }
      blocks.push({ type: 'table', content: '', header: hdr, rows })
      continue
    }

    // Unordered list (handles - * +)
    if (/^\s*[-*+]\s/.test(line)) {
      const { items, nextIdx } = parseListItems(lines, i, /^\s*[-*+]\s/)
      i = nextIdx
      blocks.push({ type: 'ul', content: '', items })
      continue
    }

    // Ordered list
    if (/^\s*\d+[.)]\s/.test(line)) {
      const { items, nextIdx } = parseListItems(lines, i, /^\s*\d+[.)]\s/)
      i = nextIdx
      blocks.push({ type: 'ol', content: '', items })
      continue
    }

    // Empty line
    if (line.trim() === '') {
      i++
      continue
    }

    // Paragraph - collect until empty line or block element
    const plines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('>') &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith(':::') &&
      !/^\s*[-*+]\s/.test(lines[i]) &&
      !/^\s*\d+[.)]\s/.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i])
    ) {
      plines.push(lines[i])
      i++
    }
    if (plines.length > 0) {
      blocks.push({ type: 'paragraph', content: plines.join('\n') })
    }
  }

  return blocks
}

function renderDirective(block: Block): string {
  const dtype = block.content
  const attrs = block.attrs || {}
  const lines = block.lines || []

  switch (dtype) {
    case 'card': {
      const title = lines[0] || ''
      const desc = lines[1] || ''
      const tags = lines.find(l => l.startsWith('#'))?.match(/#\w+/g)?.map(t => t.slice(1)) || []
      const href = attrs.href || ''
      const icon = attrs.icon || ''
      const Tag = href ? 'a' : 'div'
      const hrefAttr = href ? ` href="${escapeHtml(href)}" target="_blank"` : ''
      return `<${Tag}${hrefAttr} class="zn-card"><div class="zn-card-inner">${icon ? `<div class="zn-card-icon">${escapeHtml(icon)}</div>` : ''}<div><div class="zn-card-title">${escapeHtml(title)}</div>${desc ? `<div class="zn-card-desc">${escapeHtml(desc)}</div>` : ''}${tags.length ? `<div class="zn-card-tags">${tags.map(t => `<span class="zn-badge">${escapeHtml(t)}</span>`).join('')}</div>` : ''}</div></div></${Tag}>`
    }
    case 'button': {
      const text = lines[0] || 'Button'
      const variant = attrs.variant || 'default'
      const href = attrs.href || '#'
      return `<a href="${escapeHtml(href)}" target="_blank" class="zn-button zn-button-${variant}">${escapeHtml(text)}</a>`
    }
    case 'callout': {
      const ctype = attrs.type || 'info'
      const title = lines[0] || ctype
      const body = lines.slice(1).join('\n')
      return `<div class="zn-callout zn-callout-${ctype}"><div><div class="zn-callout-title">${escapeHtml(title)}</div>${body ? `<div class="zn-callout-body">${parseInline(body)}</div>` : ''}</div></div>`
    }
    case 'grid': {
      const cols = attrs.cols || '2'
      const inner = tokenize(lines.join('\n'))
      return `<div class="zn-grid" style="grid-template-columns:repeat(${cols},1fr)">${inner.map(renderBlock).join('')}</div>`
    }
    default:
      return `<div class="zn-card">${lines.map(l => parseInline(l)).join('<br />')}</div>`
  }
}

function renderBlock(block: Block): string {
  switch (block.type) {
    case 'heading':
      return `<h${block.level} class="zn-heading zn-h${block.level}">${parseInline(block.content)}</h${block.level}>`

    case 'paragraph':
      return `<p class="zn-p">${parseInline(block.content).replace(/\n/g, '<br />')}</p>`

    case 'code':
      return `<div class="zn-codeblock"><div class="zn-codeblock-lang">${escapeHtml(block.lang || 'text')}</div><pre><code>${escapeHtml(block.content)}</code></pre></div>`

    case 'blockquote': {
      const cm = block.content.match(/^\[!(\w+)\]\s*(.*)/)
      if (cm) {
        const ctype = cm[1].toLowerCase()
        const title = cm[2] || ctype
        const body = block.content.split('\n').slice(1).join('\n')
        return `<div class="zn-callout zn-callout-${ctype}"><div><div class="zn-callout-title">${escapeHtml(title)}</div>${body ? `<div class="zn-callout-body">${parseInline(body)}</div>` : ''}</div></div>`
      }
      return `<blockquote class="zn-blockquote">${parseInline(block.content).replace(/\n/g, '<br />')}</blockquote>`
    }

    case 'ul':
      return `<ul class="zn-ul">${(block.items || []).map(item => {
        if (item.type === 'task') {
          return `<li class="zn-task"><label><input type="checkbox" ${item.checked ? 'checked' : ''} disabled /><span${item.checked ? ' class="zn-task-done"' : ''}>${parseInline(item.content)}</span></label></li>`
        }
        return `<li>${parseInline(item.content)}</li>`
      }).join('')}</ul>`

    case 'ol':
      return `<ol class="zn-ol">${(block.items || []).map(item => `<li>${parseInline(item.content)}</li>`).join('')}</ol>`

    case 'hr':
      return '<hr class="zn-hr" />'

    case 'table':
      return `<div class="zn-table-wrap"><table class="zn-table"><thead><tr>${(block.header || []).map(h => `<th>${parseInline(h)}</th>`).join('')}</tr></thead><tbody>${(block.rows || []).map(row => `<tr>${row.map(c => `<td>${parseInline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`

    case 'directive':
      return renderDirective(block)

    default:
      return `<p>${parseInline(block.content)}</p>`
  }
}

export function renderMarkdown(markdown: string): string {
  if (!markdown.trim()) return ''
  const raw = tokenize(markdown).map(renderBlock).join('\n')
  return DOMPurify.sanitize(raw, {
    ADD_TAGS: ['mark'],
    ADD_ATTR: ['data-link', 'target', 'rel', 'loading'],
  })
}

// Extract wiki-links from markdown
export function extractLinks(markdown: string): string[] {
  const matches = markdown.match(/\[\[([^\]]+)\]\]/g)
  if (!matches) return []
  return [...new Set(matches.map(m => m.slice(2, -2)))]
}
