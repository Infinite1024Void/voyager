import { execFileSync } from 'node:child_process'

export default function globalSetup(): void {
  execFileSync('npm', ['run', 'build'], { stdio: 'inherit' })
}
