import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const frontendDir = join(__dirname, '..', 'frontend')

console.log('Setting up telemetry frontend...')

if (!existsSync(join(frontendDir, 'node_modules'))) {
  console.log('Installing dependencies...')
  execSync('npm install', { cwd: frontendDir, stdio: 'inherit' })
}

console.log('Frontend ready! Run: cd frontend && npm run dev')
