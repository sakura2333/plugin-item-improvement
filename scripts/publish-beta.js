#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const ROOT = path.resolve(__dirname, '..')
const OFFICIAL_NAME = 'poi-plugin-item-improvement2'
const BETA_NAME = 'poi-plugin-item-improvement2-beta'
const SELF_PATH = path.resolve(__filename)
const SKIP_DIRECTORIES = new Set(['.git', 'node_modules'])
const MAX_TEXT_FILE_SIZE = 5 * 1024 * 1024

function isProbablyText(buffer) {
  return !buffer.includes(0)
}

function collectFiles(directory, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRECTORIES.has(entry.name)) continue

    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      collectFiles(absolutePath, output)
    } else if (entry.isFile()) {
      output.push(absolutePath)
    }
  }
  return output
}

function buildReplacementPlan() {
  const replacements = []

  for (const filePath of collectFiles(ROOT)) {
    if (path.resolve(filePath) === SELF_PATH) continue

    const stat = fs.statSync(filePath)
    if (stat.size > MAX_TEXT_FILE_SIZE) continue

    const original = fs.readFileSync(filePath)
    if (!isProbablyText(original)) continue

    const originalText = original.toString('utf8')
    if (!originalText.includes(OFFICIAL_NAME)) continue

    const betaText = originalText.split(OFFICIAL_NAME).join(BETA_NAME)
    replacements.push({
      filePath,
      original,
      replacement: Buffer.from(betaText, 'utf8'),
    })
  }

  return replacements
}

function assertOfficialWorkspace() {
  const packageJsonPath = path.join(ROOT, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

  if (packageJson.name !== OFFICIAL_NAME) {
    throw new Error(
      `Expected package.json name to be ${OFFICIAL_NAME}, got ${packageJson.name}`
    )
  }
}

function applyReplacementPlan(plan) {
  for (const entry of plan) {
    fs.writeFileSync(entry.filePath, entry.replacement)
  }
}

function restoreReplacementPlan(plan) {
  for (const entry of plan) {
    fs.writeFileSync(entry.filePath, entry.original)
  }
}

function relative(filePath) {
  return path.relative(ROOT, filePath) || '.'
}

function runNpmPublish(args) {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

  return new Promise((resolve, reject) => {
    const child = spawn(npmCommand, ['publish', ...args], {
      cwd: ROOT,
      env: process.env,
      stdio: 'inherit',
    })

    const forwardSignal = signal => {
      if (!child.killed) child.kill(signal)
    }

    process.once('SIGINT', forwardSignal)
    process.once('SIGTERM', forwardSignal)

    child.once('error', error => {
      process.removeListener('SIGINT', forwardSignal)
      process.removeListener('SIGTERM', forwardSignal)
      reject(error)
    })

    child.once('exit', (code, signal) => {
      process.removeListener('SIGINT', forwardSignal)
      process.removeListener('SIGTERM', forwardSignal)

      if (signal) {
        reject(new Error(`npm publish terminated by ${signal}`))
      } else {
        resolve(code == null ? 1 : code)
      }
    })
  })
}

async function main() {
  assertOfficialWorkspace()

  const plan = buildReplacementPlan()
  if (plan.length === 0) {
    throw new Error(`No occurrences of ${OFFICIAL_NAME} were found`)
  }

  console.log(`Temporarily switching package namespace:`)
  console.log(`  ${OFFICIAL_NAME} -> ${BETA_NAME}`)
  console.log('Changed files:')
  for (const entry of plan) {
    console.log(`  - ${relative(entry.filePath)}`)
  }

  let exitCode = 1
  applyReplacementPlan(plan)

  try {
    const betaPackage = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')
    )
    if (betaPackage.name !== BETA_NAME) {
      throw new Error('Temporary beta package-name replacement failed')
    }

    exitCode = await runNpmPublish(process.argv.slice(2))
  } finally {
    restoreReplacementPlan(plan)
    console.log(`Restored workspace namespace to ${OFFICIAL_NAME}`)
  }

  if (exitCode !== 0) {
    throw new Error(`npm publish exited with code ${exitCode}`)
  }
}

main().catch(error => {
  console.error(`[publish:beta] ${error.message}`)
  process.exitCode = 1
})
