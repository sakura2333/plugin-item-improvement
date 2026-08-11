import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

export const SUPPORTED_IMPROVEMENT_SCHEMA_VERSION = 3
export const SUPPORTED_IMPROVEMENT_LIST_SCHEMA_VERSION = 2

export function validateSchemaVersion(value, expected, label) {
  const schemaVersion = Number(value)
  if (!Number.isInteger(schemaVersion) || schemaVersion !== expected) {
    throw new Error(
      `Unsupported ${label} schema ${value}; supported version is ${expected}`
    )
  }
}

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    throw new Error(`Invalid ${label}: ${error.message}`)
  }
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}

function validateManifestFile(rootPath, manifest, relativePath) {
  const normalizedRelativePath = String(relativePath).replace(/\\/g, '/')
  if (path.isAbsolute(normalizedRelativePath)
    || normalizedRelativePath.split('/').some(part => part === '..')) {
    throw new Error(`Unsafe data file path: ${relativePath}`)
  }
  const filePath = path.join(rootPath, normalizedRelativePath)
  if (!fs.existsSync(filePath)) {
    throw new Error(`Data file is missing: ${relativePath}`)
  }

  const expected = manifest.files && manifest.files[normalizedRelativePath]
  if (expected) {
    const stat = fs.statSync(filePath)
    if (Number.isFinite(Number(expected.bytes)) && stat.size !== Number(expected.bytes)) {
      throw new Error(`Data file size mismatch: ${relativePath}`)
    }
    if (expected.sha256 && sha256(filePath) !== expected.sha256) {
      throw new Error(`Data file checksum mismatch: ${relativePath}`)
    }
  }

  return filePath
}

export function validateImprovementListData(data) {
  if (!data || !data.metadata || !Array.isArray(data.data) || data.data.length !== 8) {
    throw new Error('Invalid improvement list data')
  }
  if (Number(data.metadata.schemaVersion) !== SUPPORTED_IMPROVEMENT_LIST_SCHEMA_VERSION
    || !Array.isArray(data.metadata.rowSchema)
    || data.metadata.rowSchema.length !== 2
    || data.metadata.rowSchema[0] !== 'itemId'
    || data.metadata.rowSchema[1] !== 'assistantTexts') {
    throw new Error('Unsupported improvement list schema')
  }

  data.data.forEach((rows, viewIndex) => {
    if (!Array.isArray(rows)) {
      throw new Error(`Invalid improvement list view: ${viewIndex}`)
    }
    rows.forEach(row => {
      if (!Array.isArray(row)
        || row.length !== 2
        || !Number.isInteger(Number(row[0]))
        || !Array.isArray(row[1])) {
        throw new Error(`Invalid improvement list row: ${JSON.stringify(row)}`)
      }
    })
  })

  return data
}

function readDetailIds(detailPath) {
  const ids = new Set()
  fs.readFileSync(detailPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .forEach(line => {
      const row = JSON.parse(line)
      if (!Number.isInteger(Number(row.id))) {
        throw new Error('Invalid improvement detail row')
      }
      ids.add(Number(row.id))
    })
  return ids
}

export function validateDataRoot(rootPath) {
  const manifestPath = path.join(rootPath, 'manifest.json')
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Data manifest not found')
  }

  const manifest = readJson(manifestPath, 'data manifest')
  if (!manifest.packageVersion || !/^[A-Za-z0-9._-]+$/.test(String(manifest.packageVersion))) {
    throw new Error('Data manifest has an invalid package version')
  }
  const improvement = manifest.datasets && manifest.datasets.improvement
  if (!improvement) {
    throw new Error('Data package does not contain the improvement dataset')
  }

  validateSchemaVersion(
    improvement.schemaVersion,
    SUPPORTED_IMPROVEMENT_SCHEMA_VERSION,
    'improvement detail'
  )
  validateSchemaVersion(
    improvement.listSchemaVersion,
    SUPPORTED_IMPROVEMENT_LIST_SCHEMA_VERSION,
    'improvement list'
  )

  const listRelativePath = improvement.list || 'improvement/list.json'
  const detailRelativePath = improvement.detail || 'improvement/detail.nedb'
  const listPath = validateManifestFile(rootPath, manifest, listRelativePath)
  const detailPath = validateManifestFile(rootPath, manifest, detailRelativePath)
  const list = validateImprovementListData(readJson(listPath, 'improvement list'))
  const detailIds = readDetailIds(detailPath)

  list.data.forEach(rows => rows.forEach(row => {
    if (!detailIds.has(Number(row[0]))) {
      throw new Error(`Improvement list references missing item: ${row[0]}`)
    }
  }))

  const iconDataset = manifest.datasets && manifest.datasets.useitemIcons
  const iconDirectory = (iconDataset && iconDataset.directory) || 'assets/useitems'
  const resolveUseitemRelativePath = id => `${iconDirectory}/${id}.png`
  const requiredIconIds = (iconDataset && iconDataset.requiredIds) || []
  requiredIconIds.forEach(id => {
    validateManifestFile(rootPath, manifest, resolveUseitemRelativePath(id))
  })

  return {
    rootPath,
    manifestPath,
    manifest,
    version: String(manifest.packageVersion || ''),
    listPath,
    detailPath,
    useitemPath: id => path.join(rootPath, resolveUseitemRelativePath(id)),
  }
}
