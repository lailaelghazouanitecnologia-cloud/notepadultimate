// Zarnetti Custom Markdown Engine
// Standard: headings, bold, italic, strikethrough, code, links, images,
//           blockquotes, lists, task lists, tables, highlights, HR
// Extended: callouts, cards, buttons, badges via :::directive syntax
//
// Custom components syntax:
//   :::card{icon="MessageSquare"}
//   Title text
//   Description text
//   #tag1 #tag2
//   :::
//
//   :::button{href="/link" variant="outline"}
//   Button text
//   :::
//
//   Inline: :badge[text]{color="blue"}

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
  let match
  while ((match = regex.exec(str)) !== null) {
    attrs[match[1]] = match[2]
  }
  return attrs
}

function parseInline(text: string): string {
  let result = escapeHtml(text)

  // Inline badge :badge[text]{color="blue"}
  result = result.replace(/:badge\[([^\]]+)\]\{([^}]*)\}/g, (_m, label, attrStr) => {
    const attrs = parseAttrs(attrStr)
    const color = attrs.color || 'gray'
    return `<span class="zn-badge zn-badge-${color}">${label}</span>`
  })

  // Images ![alt](src)
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')

  // Links [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

  // Inline code `code`
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Bold + italic
  result = result.replace(/\*{3}(.+?)\*{3}/g, '<strong><em>$1</em></strong>')
  result = result.replace(/_{3}(.+?)_{3}/g, '<strong><em>$1</em></strong>')

  // Bold
  result = result.replace(/\*{2}(.+?)\*{2}/g, '<strong>$1</strong>')
  result = result.replace(/_{2}(.+?)_{2}/g, '<strong>$1</strong>')

  // Italic
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>')
  result = result.replace(/(?<!\w)_(.+?)_(?!\w)/g, '<em>$1</em>')

  // Strikethrough
  result = result.replace(/~~(.+?)~~/g, '<del>$1</del>')

  // Highlight ==text==
  result = result.replace(/==(.+?)==/g, '<mark>$1</mark>')

  return result
}

interface Block {
  type: string
  content: string
  lang?: string
  items?: Block[]
  ordered?: boolean
  rows?: string[][]
  header?: string[]
  level?: number
  checked?: boolean | null
  attrs?: Record<string, string>
  lines?: string[]
}

function tokenize(markdown: string): Block[] {
  const lines = markdown.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Directive block :::type{attrs}
    const directiveMatch = line.match(/^:::(\w+)(?:\{([^}]*)\})?/)
    if (directiveMatch && !line.match(/^:::$/)) {
      const dtype = directiveMatch[1]
      const attrs = directiveMatch[2] ? parseAttrs(directiveMatch[2]) : {}
      const contentLines: string[] = []
      i++
      while (i < lines.length && lines[i].trim() !== ':::') {
        contentLines.push(lines[i])
        i++
      }
      i++ // skip closing :::
      blocks.push({ type: 'directive', content: dtype, attrs, lines: contentLines })
      continue
    }

    // Code block ```
    if (line.trimStart().startsWith('```')) {
      const lang = line.trimStart().slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++
      blocks.push({ type: 'code', content: codeLines.join('\n'), lang })
      continue
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/)
    if (headingMatch) {
      blocks.push({ type: 'heading', level: headingMatch[1].length, content: headingMatch[2] })
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
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      blocks.push({ type: 'blockquote', content: quoteLines.join('\n') })
      continue
    }

    // Table
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?\s*[-:]+[-| :]*$/.test(lines[i + 1])) {
      const headerCells = line.split('|').map((c) => c.trim()).filter(Boolean)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && lines[i].includes('|')) {
        rows.push(lines[i].split('|').map((c) => c.trim()).filter(Boolean))
        i++
      }
      blocks.push({ type: 'table', content: '', header: headerCells, rows })
      continue
    }

    // Unordered list
    if (/^\s*[-*+]\s/.test(line)) {
      const items: Block[] = []
      while (i < lines.length && /^\s*[-*+]\s/.test(lines[i])) {
        const text = lines[i].replace(/^\s*[-*+]\s/, '')
        const taskMatch = text.match(/^\[([xX ])\]\s*(.*)/)
        if (taskMatch) {
          items.push({ type: 'task', checked: taskMatch[1].toLowerCase() === 'x', content: taskMatch[2] })
        } else {
          items.push({ type: 'li', content: text })
        }
        i++
      }
      blocks.push({ type: 'ul', content: '', items })
      continue
    }

    // Ordered list
    if (/^\s*\d+\.\s/.test(line)) {
      const items: Block[] = []
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) {
        items.push({ type: 'li', content: lines[i].replace(/^\s*\d+\.\s/, '') })
        i++
      }
      blocks.push({ type: 'ol', content: '', items, ordered: true })
      continue
    }

    // Empty line
    if (line.trim() === '') {
      i++
      continue
    }

    // Paragraph
    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('>') &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith(':::') &&
      !/^\s*[-*+]\s/.test(lines[i]) &&
      !/^\s*\d+\.\s/.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i])
    ) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', content: paraLines.join('\n') })
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
      const tagsLine = lines.find((l) => l.startsWith('#'))
      const tags = tagsLine
        ? tagsLine.match(/#\w+/g)?.map((t) => t.slice(1)) || []
        : []
      const href = attrs.href || ''
      const icon = attrs.icon || 'FileText'
      const Tag = href ? 'a' : 'div'
      const hrefAttr = href ? ` href="${escapeHtml(href)}" target="_blank" rel="noopener"` : ''
      return `<${Tag}${hrefAttr} class="zn-card">
        <div class="zn-card-inner">
          <div class="zn-card-icon">${escapeHtml(icon)}</div>
          <div class="zn-card-content">
            <p class="zn-card-title">${escapeHtml(title)}</p>
            ${desc ? `<p class="zn-card-desc">${escapeHtml(desc)}</p>` : ''}
            ${tags.length > 0 ? `<div class="zn-card-tags">${tags.map((t) => `<span class="zn-badge zn-badge-gray">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
          </div>
        </div>
      </${Tag}>`
    }

    case 'button': {
      const text = lines[0] || 'Button'
      const href = attrs.href || '#'
      const variant = attrs.variant || 'default'
      return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener" class="zn-button zn-button-${variant}">${escapeHtml(text)}</a>`
    }

    case 'callout': {
      const ctype = attrs.type || 'info'
      const title = lines[0] || ctype
      const body = lines.slice(1).join('\n')
      return `<div class="zn-callout zn-callout-${ctype}">
        <div class="zn-callout-title">${escapeHtml(title)}</div>
        ${body ? `<div class="zn-callout-body">${parseInline(body)}</div>` : ''}
      </div>`
    }

    case 'grid': {
      const cols = attrs.cols || '2'
      // Re-tokenize inner content as blocks
      const innerMd = lines.join('\n')
      const innerBlocks = tokenize(innerMd)
      const innerHtml = innerBlocks.map(renderBlock).join('\n')
      return `<div class="zn-grid" style="grid-template-columns: repeat(${escapeHtml(cols)}, 1fr);">${innerHtml}</div>`
    }

    default:
      return `<div class="zn-directive">${lines.map((l) => parseInline(l)).join('<br />')}</div>`
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
      const calloutMatch = block.content.match(/^\[!(\w+)\]\s*(.*)/)
      if (calloutMatch) {
        const ctype = calloutMatch[1].toLowerCase()
        const title = calloutMatch[2] || ctype
        const body = block.content.split('\n').slice(1).join('\n')
        return `<div class="zn-callout zn-callout-${ctype}"><div class="zn-callout-title">${escapeHtml(title)}</div>${body ? `<div class="zn-callout-body">${parseInline(body)}</div>` : ''}</div>`
      }
      return `<blockquote class="zn-blockquote">${parseInline(block.content).replace(/\n/g, '<br />')}</blockquote>`
    }

    case 'ul':
      return `<ul class="zn-ul">${(block.items || []).map((item) => {
        if (item.type === 'task') {
          return `<li class="zn-task"><label><input type="checkbox" ${item.checked ? 'checked' : ''} disabled /><span${item.checked ? ' class="zn-task-done"' : ''}>${parseInline(item.content)}</span></label></li>`
        }
        return `<li>${parseInline(item.content)}</li>`
      }).join('')}</ul>`

    case 'ol':
      return `<ol class="zn-ol">${(block.items || []).map((item) => `<li>${parseInline(item.content)}</li>`).join('')}</ol>`

    case 'hr':
      return '<hr class="zn-hr" />'

    case 'table':
      return `<div class="zn-table-wrap"><table class="zn-table"><thead><tr>${(block.header || []).map((h) => `<th>${parseInline(h)}</th>`).join('')}</tr></thead><tbody>${(block.rows || []).map((row) => `<tr>${row.map((c) => `<td>${parseInline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`

    case 'directive':
      return renderDirective(block)

    default:
      return `<p>${parseInline(block.content)}</p>`
  }
}

export function renderMarkdown(markdown: string): string {
  if (!markdown.trim()) return ''
  const blocks = tokenize(markdown)
  return blocks.map(renderBlock).join('\n')
}
