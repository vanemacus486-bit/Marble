export function sanitizePastedHtml(html: string): string {
  let cleaned = html
  // Remove script and style tags
  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, '')
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '')
  // Remove event handlers
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '')
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*'[^']*'/gi, '')
  // Remove iframe and object tags
  cleaned = cleaned.replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
  cleaned = cleaned.replace(/<object[\s\S]*?<\/object>/gi, '')
  // Remove inline style attributes (keep class and standard attributes)
  cleaned = cleaned.replace(/\s+style\s*=\s*"[^"]*"/gi, '')
  // Remove font tags
  cleaned = cleaned.replace(/<\/?font[^>]*>/gi, '')
  // Remove empty paragraphs
  cleaned = cleaned.replace(/<p>\s*(<br\s*\/?>\s*)*<\/p>/gi, '')
  // Remove empty span tags
  cleaned = cleaned.replace(/<span>\s*<\/span>/gi, '')
  // Remove Office XML garbage (mso-*)
  cleaned = cleaned.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '')
  cleaned = cleaned.replace(/<o:p>\s*<\/o:p>/gi, '')
  return cleaned
}

export function sanitizeHtml(html: string): string {
  // Strip script tags (for source mode safety)
  let cleaned = html
  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, '')
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '')
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*'[^']*'/gi, '')
  return cleaned
}
