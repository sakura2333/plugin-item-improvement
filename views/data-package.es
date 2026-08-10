import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  SUPPORTED_IMPROVEMENT_LIST_SCHEMA_VERSION,
  SUPPORTED_IMPROVEMENT_SCHEMA_VERSION,
  validateDataRoot,
  validateSchemaVersion,
} from './data-package-validator'

const PACKAGE_NAME = '@sakura2333/kancolle-data'
const PACKAGE_TAG = 'improvement2'
const BUNDLED_ROOT = path.resolve(__dirname, '../data/kancolle-data')

let resolvedPackage = null

function ensureDir(directory) {
  if (fs.existsSync(directory)) return
  const parent = path.dirname(directory)
  if (parent !== directory) ensureDir(parent)
  try {
    fs.mkdirSync(directory)
  } catch (error) {
    if (!fs.existsSync(directory)) throw error
  }
}

function getPoiUserDataPath() {
  if (process.env.POI_ITEM_IMPROVEMENT_DATA_HOME) {
    return process.env.POI_ITEM_IMPROVEMENT_DATA_HOME
  }

  try {
    // eslint-disable-next-line global-require
    const electron = require('electron')
    const app = electron.remote && electron.remote.app
      ? electron.remote.app
      : electron.app
    if (app && typeof app.getPath === 'function') {
      return app.getPath('userData')
    }
  } catch (error) {
    // Node-based tests and non-Electron tooling use the fallback below.
  }

  return path.join(os.homedir(), '.poi')
}

export function getDataCacheRoot() {
  const root = path.join(
    getPoiUserDataPath(),
    'plugin-data',
    'poi-plugin-item-improvement2',
    'kancolle-data'
  )
  ensureDir(root)
  return root
}

export function getBundledDataRoot() {
  return BUNDLED_ROOT
}

export function getActivePointerPath() {
  return path.join(getDataCacheRoot(), 'active.json')
}

export function getCachedVersionRoot(version) {
  const normalizedVersion = String(version || '')
  if (!normalizedVersion || !/^[A-Za-z0-9._-]+$/.test(normalizedVersion)) {
    throw new Error(`Unsafe data package version: ${version}`)
  }
  return path.join(getDataCacheRoot(), 'versions', normalizedVersion)
}

function readActiveVersion() {
  const pointerPath = getActivePointerPath()
  if (!fs.existsSync(pointerPath)) return null
  try {
    const pointer = JSON.parse(fs.readFileSync(pointerPath, 'utf8'))
    return pointer && pointer.version ? String(pointer.version) : null
  } catch (error) {
    return null
  }
}

function resolveDataPackage() {
  if (resolvedPackage) return resolvedPackage

  const activeVersion = readActiveVersion()
  if (activeVersion) {
    try {
      resolvedPackage = validateDataRoot(getCachedVersionRoot(activeVersion))
      return resolvedPackage
    } catch (error) {
      // A partial/corrupt cache must never prevent the bundled snapshot from loading.
    }
  }

  resolvedPackage = validateDataRoot(BUNDLED_ROOT)
  return resolvedPackage
}


export function resetDataPackageResolution() {
  resolvedPackage = null
}

export const getDataPackageManifest = () => resolveDataPackage().manifest

export const getDataPackageVersion = () => resolveDataPackage().version

export const getImprovementDataPaths = () => {
  const pkg = resolveDataPackage()
  return {
    listPath: pkg.listPath,
    detailPath: pkg.detailPath,
  }
}

export const getUseitemIconPath = id => {
  const iconPath = resolveDataPackage().useitemPath(id)
  return fs.existsSync(iconPath) ? iconPath : null
}

export const DATA_PACKAGE_NAME = PACKAGE_NAME
export const DATA_PACKAGE_TAG = PACKAGE_TAG
export { SUPPORTED_IMPROVEMENT_SCHEMA_VERSION }
export { SUPPORTED_IMPROVEMENT_LIST_SCHEMA_VERSION }
export { validateSchemaVersion }
