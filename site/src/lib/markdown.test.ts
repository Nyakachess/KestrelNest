import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown.js'

describe('renderMarkdown', () => {
  it('renders paragraphs, lists, links, emphasis and code', () => {
    const html = renderMarkdown(
      'First **bold** and *em* with `code`.\n\n- one [link](https://example.test/x)\n- two\n',
    )
    expect(html).toBe(
      '<p>First <strong>bold</strong> and <em>em</em> with <code>code</code>.</p>\n<ul><li>one <a href="https://example.test/x">link</a></li><li>two</li></ul>',
    )
  })

  it('escapes HTML and ignores links that are not https', () => {
    expect(renderMarkdown('<script>x</script> [a](javascript:alert(1))')).toBe(
      '<p>&lt;script&gt;x&lt;/script&gt; [a](javascript:alert(1))</p>',
    )
  })

  it('joins wrapped lines inside a paragraph', () => {
    expect(renderMarkdown('one\ntwo')).toBe('<p>one two</p>')
  })
})
