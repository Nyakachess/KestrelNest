/**
 * The small Markdown subset a contributor page needs: paragraphs, bullet lists, links to
 * https addresses, bold, italics and inline code. Everything is escaped first, so a page can
 * never inject markup into the site.
 */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
const CODE = /`([^`]+)`/g
const BOLD = /\*\*([^*]+)\*\*/g
const ITALIC = /(^|[^*])\*([^*]+)\*(?!\*)/g

export function inline(text: string): string {
  return escapeHtml(text)
    .replace(CODE, '<code>$1</code>')
    .replace(LINK, '<a href="$2">$1</a>')
    .replace(BOLD, '<strong>$1</strong>')
    .replace(ITALIC, '$1<em>$2</em>')
}

export function renderMarkdown(text: string): string {
  const blocks = text
    .replace(/\r\n/g, '\n')
    .trim()
    .split(/\n{2,}/)
  return blocks
    .map((block) => {
      const lines = block.split('\n')
      if (lines.every((l) => /^\s*-\s+/.test(l))) {
        return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*-\s+/, ''))}</li>`).join('')}</ul>`
      }
      return `<p>${lines.map(inline).join(' ')}</p>`
    })
    .join('\n')
}
