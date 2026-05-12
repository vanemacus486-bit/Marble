import DOMPurify from 'dompurify'

const BLOCK_TAGS = [
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code', 'hr', 'br',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'details', 'summary',
]

const INLINE_TAGS = [
  'a', 'img', 'span', 'div',
  'strong', 'em', 'u', 's', 'mark', 'sub', 'sup',
  'del', 'ins', 'small', 'big',
]

const ALLOWED_TAGS = [...BLOCK_TAGS, ...INLINE_TAGS]

const ALLOWED_ATTRS = [
  'href', 'target', 'rel', 'title',
  'src', 'alt', 'width', 'height',
  'class', 'id',
  'data-type', 'data-checked', 'data-internal-link',
  'loading', 'decoding',
  'colspan', 'rowspan',
  'start', 'reversed',
  'open',
]

const FORBID_TAGS = ['script', 'style', 'object', 'embed', 'applet', 'font']
const FORBID_ATTR = ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit']

function createBaseConfig() {
  return {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTRS,
    ALLOW_DATA_ATTR: true,
    FORBID_TAGS,
    FORBID_ATTR,
  }
}

export function sanitizePastedHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ...createBaseConfig(),
    ALLOWED_ATTR: ALLOWED_ATTRS.filter((a) => a !== 'style'),
  })
}

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ...createBaseConfig(),
    ALLOWED_TAGS: [...ALLOWED_TAGS, 'style', 'iframe', 'video', 'figure', 'figcaption', 'section', 'nav', 'article', 'html', 'head', 'body', 'meta', 'link'],
    ALLOWED_ATTR: [...ALLOWED_ATTRS, 'style', 'sandbox', 'allowfullscreen', 'controls', 'poster', 'autoplay', 'loop', 'muted', 'charset', 'name', 'content'],
    FORBID_TAGS: ['script', 'object', 'embed', 'applet'],
    FORBID_ATTR,
    ADD_TAGS: ['style'],
    ADD_ATTR: ['target'],
    WHOLE_DOCUMENT: true,
  })
}
