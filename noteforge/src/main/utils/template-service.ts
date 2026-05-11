function isoNow(): string {
  return new Date().toISOString()
}

export function getDefaultTemplate(title: string): string {
  const escaped = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="created" content="${isoNow()}">
<meta name="modified" content="${isoNow()}">
<title>${escaped}</title>
</head>
<body>

</body>
</html>`
}

export function getDailyNoteTemplate(date: Date, title: string): string {
  const escaped = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const dateStr = date.toISOString().slice(0, 10)
  const sections = [
    'Today',
    'Goals',
    'Notes',
    'Tasks'
  ]
  const sectionHtml = sections.map(s => `<h2>${s}</h2>\n<p></p>`).join('\n')
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="created" content="${dateStr}">
<meta name="modified" content="${isoNow()}">
<meta name="tags" content="daily-note">
<title>${escaped}</title>
</head>
<body>
<h1>${escaped}</h1>
<p>${dateStr}</p>
${sectionHtml}
</body>
</html>`
}
