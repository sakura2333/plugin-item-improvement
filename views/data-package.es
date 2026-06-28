import fs from 'fs'

const PACKAGE_NAME = '@sakura2333/kancolle-data'
const IMPROVEMENT_SCHEMA_VERSION = 3
const IMPROVEMENT_LIST_SCHEMA_VERSION = 2

let dataPackage = null
let manifest = null

function loadDataPackage() {
  if (dataPackage) return dataPackage

  try {
    // Keep this as CommonJS so the published data package can expose stable paths
    // without being bundled into the plugin JavaScript output.
    dataPackage = require(PACKAGE_NAME)
  }
  catch (error) {
    throw new Error(
      `Missing required data package ${PACKAGE_NAME}: ${error.message}`
    )
  }

  return dataPackage
}

function requireExactSchema(value, expected, label) {
  const schemaVersion = Number(value)
  if (!Number.isInteger(schemaVersion) || schemaVersion !== expected) {
    throw new Error(
      `Unsupported ${label} schema ${value}; supported version is ${expected}`
    )
  }
}

function readManifest() {
  if (manifest) return manifest

  const pkg = loadDataPackage()
  if (!pkg.manifestPath || !fs.existsSync(pkg.manifestPath)) {
    throw new Error(`${PACKAGE_NAME} manifest not found`)
  }

  manifest = JSON.parse(fs.readFileSync(pkg.manifestPath, 'utf8'))
  const improvement = manifest.datasets && manifest.datasets.improvement
  if (!improvement) {
    throw new Error(`${PACKAGE_NAME} does not contain the improvement dataset`)
  }

  requireExactSchema(
    improvement.schemaVersion,
    IMPROVEMENT_SCHEMA_VERSION,
    'improvement detail'
  )

  if (improvement.listSchemaVersion != null) {
    requireExactSchema(
      improvement.listSchemaVersion,
      IMPROVEMENT_LIST_SCHEMA_VERSION,
      'improvement list'
    )
  }

  return manifest
}

export const getDataPackageManifest = () => readManifest()

export const getImprovementDataPaths = () => {
  readManifest()
  const pkg = loadDataPackage()

  if (!pkg.improvement || !pkg.improvement.listPath || !pkg.improvement.detailPath) {
    throw new Error(`${PACKAGE_NAME} improvement paths are incomplete`)
  }
  if (!fs.existsSync(pkg.improvement.listPath) || !fs.existsSync(pkg.improvement.detailPath)) {
    throw new Error(`${PACKAGE_NAME} improvement files are missing`)
  }

  return {
    listPath: pkg.improvement.listPath,
    detailPath: pkg.improvement.detailPath,
  }
}

export const getUseitemIconPath = id => {
  const pkg = loadDataPackage()
  return pkg.assets && typeof pkg.assets.useitemPath === 'function'
    ? pkg.assets.useitemPath(id)
    : null
}

export const DATA_PACKAGE_NAME = PACKAGE_NAME
export const SUPPORTED_IMPROVEMENT_SCHEMA_VERSION = IMPROVEMENT_SCHEMA_VERSION
export const SUPPORTED_IMPROVEMENT_LIST_SCHEMA_VERSION = IMPROVEMENT_LIST_SCHEMA_VERSION

export const validateSchemaVersion = requireExactSchema
