const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')

// This is intentionally a live integration test. Do not replace it with a mocked tarball:
// the purpose is to catch contract drift in the package actually published under improvement2.
const dataHome = fs.mkdtempSync(path.join(os.tmpdir(), 'poi-improvement-live-data-'))
process.env.POI_ITEM_IMPROVEMENT_DATA_HOME = dataHome

const {
  DATA_PACKAGE_TAG,
  getCachedVersionRoot,
} = require('../views/data-package.js')
const {
  downloadAndInstallRemoteDataPackage,
  fetchRemotePackageMetadata,
} = require('../views/data-updater.js')
const { validateDataRoot } = require('../views/data-package-validator.js')

async function main() {
  assert.strictEqual(DATA_PACKAGE_TAG, 'improvement2')

  const metadata = await fetchRemotePackageMetadata()
  assert.ok(metadata.version, 'live improvement2 metadata is missing version')
  assert.ok(metadata.dist && metadata.dist.tarball, 'live improvement2 metadata is missing tarball')

  const result = await downloadAndInstallRemoteDataPackage(metadata)
  assert.strictEqual(result.version, String(metadata.version))

  const versionRoot = getCachedVersionRoot(result.version)
  assert.ok(fs.existsSync(versionRoot), `downloaded version directory is missing: ${versionRoot}`)

  const validated = validateDataRoot(versionRoot)
  assert.strictEqual(validated.version, result.version)
  assert.strictEqual(result.validated.version, result.version)

  process.stdout.write(`live improvement2 package PASS: ${result.version}\n`)
}

main()
  .finally(() => fs.rmSync(dataHome, { recursive: true, force: true }))
  .catch(error => {
    console.error(`live @sakura2333/kancolle-data@improvement2 contract failed: ${error.stack || error.message || error}`)
    process.exitCode = 1
  })
