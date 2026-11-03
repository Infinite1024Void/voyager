import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

/** Read a JSON file, falling back when missing or corrupted. */
export function readJsonFile<T>(path: string, fallback: T): T {
  try {
    if (existsSync(path)) {
      return JSON.parse(readFileSync(path, 'utf-8')) as T
    }
  } catch {
    // Corrupt or unreadable files fall through to the fallback.
  }
  return fallback
}

/** Write a JSON file atomically (temp file + rename) to avoid partial writes. */
export function writeJsonFile(path: string, data: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  const content = JSON.stringify(data, null, 2)
  const tempPath = `${path}.tmp`
  writeFileSync(tempPath, content, 'utf-8')
  renameSync(tempPath, path)
}
