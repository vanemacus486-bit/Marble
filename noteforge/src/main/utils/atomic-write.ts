import { writeFile, rename, mkdir, unlink } from 'fs/promises'
import { dirname } from 'path'

export async function atomicWrite(filePath: string, content: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  const tmpPath = filePath + '.tmp.' + Date.now()
  try {
    await writeFile(tmpPath, content, 'utf-8')
    await rename(tmpPath, filePath)
  } catch (err) {
    try {
      await unlink(tmpPath)
    } catch {}
    throw err
  }
}
