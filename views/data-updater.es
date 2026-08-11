import crypto from 'crypto'
import fs from 'fs'
import https from 'https'
import path from 'path'
import zlib from 'zlib'
import { resolve as resolveUrl } from 'url'
import {
  DATA_PACKAGE_NAME,
  DATA_PACKAGE_TAG,
  getActivePointerPath,
  getCachedVersionRoot,
  getDataCacheRoot,
  getDataPackageVersion,
  resetDataPackageResolution,
} from './data-package'
import { validateDataRoot } from './data-package-validator'

const REGISTRY_ORIGIN = 'https://registry.npmjs.org'
const PLUGIN_VERSION = require('../package.json').version

export const DATA_UPDATED_EVENT = 'poi-plugin-item-improvement2:data-updated'
const CHECK_INTERVAL_MS = 60 * 60 * 1000
const REQUEST_TIMEOUT_MS = 15000
const MAX_METADATA_BYTES = 2 * 1024 * 1024
const MAX_TARBALL_BYTES = 16 * 1024 * 1024
const REQUIRED_ARCHIVE_PATHS = [
  'manifest.json',
  'improvement/list.json',
  'improvement/detail.nedb',
]
const OPTIONAL_ARCHIVE_PREFIX = 'assets/useitem/'
let updateScheduled = false

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

function removeTree(target) {
  if (!fs.existsSync(target)) return
  const stat = fs.lstatSync(target)
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    fs.unlinkSync(target)
    return
  }
  fs.readdirSync(target).forEach(name => removeTree(path.join(target, name)))
  fs.rmdirSync(target)
}

function requestBufferWithXhr(url, maxBytes) {
  return new Promise((resolve, reject) => {
    const xhr = new window.XMLHttpRequest()
    xhr.open('GET', url, true)
    xhr.responseType = 'arraybuffer'
    xhr.timeout = REQUEST_TIMEOUT_MS
    xhr.setRequestHeader('Accept', 'application/json, application/octet-stream;q=0.9, */*;q=0.8')
    xhr.onprogress = event => {
      if (event.loaded > maxBytes) {
        xhr.abort()
        reject(new Error('Downloaded data exceeds size limit'))
      }
    }
    xhr.onload = () => {
      if (xhr.status !== 200) {
        reject(new Error(`Data request failed with HTTP ${xhr.status}`))
        return
      }
      const buffer = Buffer.from(new Uint8Array(xhr.response || new ArrayBuffer(0)))
      if (buffer.length > maxBytes) {
        reject(new Error('Downloaded data exceeds size limit'))
        return
      }
      resolve(buffer)
    }
    xhr.onerror = () => reject(new Error('Browser data request failed'))
    xhr.ontimeout = () => reject(new Error('Data request timed out'))
    xhr.send()
  })
}

function requestBufferWithHttps(url, maxBytes, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) {
      reject(new Error('Too many redirects while downloading data'))
      return
    }

    const request = https.get(url, {
      headers: {
        'User-Agent': `poi-plugin-item-improvement2/${PLUGIN_VERSION}`,
        Accept: 'application/json, application/octet-stream;q=0.9, */*;q=0.8',
      },
    }, response => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume()
        const nextUrl = resolveUrl(url, response.headers.location)
        requestBufferWithHttps(nextUrl, maxBytes, redirects + 1).then(resolve, reject)
        return
      }
      if (response.statusCode !== 200) {
        response.resume()
        reject(new Error(`Data request failed with HTTP ${response.statusCode}`))
        return
      }

      const chunks = []
      let size = 0
      response.on('data', chunk => {
        size += chunk.length
        if (size > maxBytes) {
          request.destroy(new Error('Downloaded data exceeds size limit'))
          return
        }
        chunks.push(chunk)
      })
      response.on('end', () => resolve(Buffer.concat(chunks)))
    })

    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error('Data request timed out'))
    })
    request.on('error', reject)
  })
}

function requestBuffer(url, maxBytes) {
  if (typeof window !== 'undefined' && typeof window.XMLHttpRequest === 'function') {
    return requestBufferWithXhr(url, maxBytes)
      .catch(() => requestBufferWithHttps(url, maxBytes))
  }
  return requestBufferWithHttps(url, maxBytes)
}

function verifyIntegrity(buffer, integrity) {
  if (!integrity) return
  const parts = String(integrity).split('-')
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error('Unsupported package integrity value')
  }
  const actual = crypto.createHash(parts[0]).update(buffer).digest('base64')
  if (actual !== parts[1]) {
    throw new Error('Downloaded data package integrity mismatch')
  }
}

function parseTarString(buffer, start, length) {
  return buffer.toString('utf8', start, start + length).replace(/\0.*$/, '')
}

function parseTarOctal(buffer, start, length) {
  const value = parseTarString(buffer, start, length).trim()
  return value ? parseInt(value, 8) : 0
}

function isAllowedArchivePath(relativePath) {
  return REQUIRED_ARCHIVE_PATHS.indexOf(relativePath) >= 0
    || (relativePath.indexOf(OPTIONAL_ARCHIVE_PREFIX) === 0 && /\.webp$/i.test(relativePath))
}

export function extractRequiredFilesFromTarGz(tarGzBuffer, destinationRoot) {
  const tarBuffer = zlib.gunzipSync(tarGzBuffer)
  let offset = 0
  const extracted = new Set()

  while (offset + 512 <= tarBuffer.length) {
    const header = tarBuffer.slice(offset, offset + 512)
    let zeroBlock = true
    for (let index = 0; index < header.length; index += 1) {
      if (header[index] !== 0) {
        zeroBlock = false
        break
      }
    }
    if (zeroBlock) break

    const name = parseTarString(header, 0, 100)
    const prefix = parseTarString(header, 345, 155)
    const archivePath = prefix ? `${prefix}/${name}` : name
    const size = parseTarOctal(header, 124, 12)
    const type = String.fromCharCode(header[156] || 48)
    const dataStart = offset + 512
    const dataEnd = dataStart + size

    if (dataEnd > tarBuffer.length) {
      throw new Error('Truncated data package archive')
    }

    const relativePath = archivePath.indexOf('package/') === 0
      ? archivePath.slice('package/'.length)
      : archivePath

    if ((type === '0' || type === '\0') && isAllowedArchivePath(relativePath)) {
      if (relativePath.indexOf('..') >= 0 || path.isAbsolute(relativePath)) {
        throw new Error('Unsafe data package path')
      }
      const outputPath = path.join(destinationRoot, relativePath)
      ensureDir(path.dirname(outputPath))
      fs.writeFileSync(outputPath, tarBuffer.slice(dataStart, dataEnd))
      extracted.add(relativePath)
    }

    offset = dataStart + (Math.ceil(size / 512) * 512)
  }

  REQUIRED_ARCHIVE_PATHS.forEach(requiredPath => {
    if (!extracted.has(requiredPath)) {
      throw new Error(`Data package archive is missing ${requiredPath}`)
    }
  })

  return extracted
}

function readUpdateState() {
  const statePath = path.join(getDataCacheRoot(), 'update-state.json')
  if (!fs.existsSync(statePath)) return {}
  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf8')) || {}
  } catch (error) {
    return {}
  }
}

function writeJsonAtomic(filePath, value) {
  ensureDir(path.dirname(filePath))
  const temporaryPath = `${filePath}.tmp-${process.pid}-${Date.now()}`
  fs.writeFileSync(temporaryPath, JSON.stringify(value, null, 2))
  try {
    fs.renameSync(temporaryPath, filePath)
  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    fs.renameSync(temporaryPath, filePath)
  }
}

function writeUpdateState(patch) {
  const statePath = path.join(getDataCacheRoot(), 'update-state.json')
  writeJsonAtomic(statePath, {
    ...readUpdateState(),
    ...patch,
  })
}

function shouldCheckNow(force) {
  if (force) return true
  const state = readUpdateState()
  if (state.lastError) return true
  return !Number.isFinite(Number(state.checkedAt))
    || Date.now() - Number(state.checkedAt) >= CHECK_INTERVAL_MS
}

function registryMetadataUrl() {
  const packageName = encodeURIComponent(DATA_PACKAGE_NAME)
  return `${REGISTRY_ORIGIN}/${packageName}/${encodeURIComponent(DATA_PACKAGE_TAG)}`
}

async function fetchRemotePackageMetadata() {
  const metadataBuffer = await requestBuffer(registryMetadataUrl(), MAX_METADATA_BYTES)
  const metadata = JSON.parse(metadataBuffer.toString('utf8'))
  if (!metadata.version || !metadata.dist || !metadata.dist.tarball) {
    throw new Error('Registry metadata is missing version or tarball information')
  }
  return metadata
}

function installTarball(version, tarballBuffer) {
  const cacheRoot = getDataCacheRoot()
  const versionsRoot = path.join(cacheRoot, 'versions')
  ensureDir(versionsRoot)

  const finalRoot = getCachedVersionRoot(version)
  try {
    return validateDataRoot(finalRoot)
  } catch (error) {
    if (fs.existsSync(finalRoot)) removeTree(finalRoot)
  }

  const stagingRoot = path.join(
    versionsRoot,
    `.staging-${String(version).replace(/[^A-Za-z0-9._-]/g, '_')}-${process.pid}-${Date.now()}`
  )
  removeTree(stagingRoot)
  ensureDir(stagingRoot)

  try {
    extractRequiredFilesFromTarGz(tarballBuffer, stagingRoot)
    const validated = validateDataRoot(stagingRoot)
    if (validated.version && validated.version !== String(version)) {
      throw new Error(`Downloaded data version mismatch: ${validated.version} != ${version}`)
    }
    if (fs.existsSync(finalRoot)) {
      try {
        const existing = validateDataRoot(finalRoot)
        removeTree(stagingRoot)
        return existing
      } catch (error) {
        removeTree(finalRoot)
      }
    }
    fs.renameSync(stagingRoot, finalRoot)
    return validateDataRoot(finalRoot)
  } catch (error) {
    removeTree(stagingRoot)
    throw error
  }
}

function activateVersion(version) {
  const previousVersion = getDataPackageVersion()
  writeJsonAtomic(getActivePointerPath(), {
    version: String(version),
    activatedAt: Date.now(),
  })

  const keep = new Set([String(version), String(previousVersion)])
  const versionsRoot = path.join(getDataCacheRoot(), 'versions')
  if (fs.existsSync(versionsRoot)) {
    const now = Date.now()
    const versionDirectories = []
    fs.readdirSync(versionsRoot).forEach(name => {
      const target = path.join(versionsRoot, name)
      if (name.indexOf('.staging-') === 0) {
        const age = now - fs.statSync(target).mtimeMs
        if (age > 24 * 60 * 60 * 1000) removeTree(target)
        return
      }
      versionDirectories.push({ name, mtimeMs: fs.statSync(target).mtimeMs })
    })
    versionDirectories
      .sort((left, right) => right.mtimeMs - left.mtimeMs)
      .slice(0, 8)
      .forEach(entry => keep.add(entry.name))
    versionDirectories.forEach(entry => {
      if (!keep.has(entry.name)) removeTree(path.join(versionsRoot, entry.name))
    })
  }
  resetDataPackageResolution()
}

export async function checkForDataUpdate(force = false) {
  if (!shouldCheckNow(force)) {
    return { status: 'skipped', version: getDataPackageVersion() }
  }

  try {
    const metadata = await fetchRemotePackageMetadata()
    const remoteVersion = String(metadata.version)
    const currentVersion = String(getDataPackageVersion() || '')

    if (remoteVersion === currentVersion) {
      writeUpdateState({
        checkedAt: Date.now(),
        lastRemoteVersion: remoteVersion,
        lastError: null,
      })
      return { status: 'current', version: currentVersion }
    }

    const tarball = await requestBuffer(metadata.dist.tarball, MAX_TARBALL_BYTES)
    const legacyIntegrity = metadata.dist.shasum
      ? `sha1-${Buffer.from(metadata.dist.shasum, 'hex').toString('base64')}`
      : null
    verifyIntegrity(tarball, metadata.dist.integrity || legacyIntegrity)
    installTarball(remoteVersion, tarball)
    activateVersion(remoteVersion)
    writeUpdateState({
      checkedAt: Date.now(),
      lastRemoteVersion: remoteVersion,
      lastInstalledVersion: remoteVersion,
      lastError: null,
    })
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      const event = document.createEvent('Event')
      event.initEvent(DATA_UPDATED_EVENT, false, false)
      window.dispatchEvent(event)
    }
    return { status: 'updated', version: remoteVersion }
  } catch (error) {
    writeUpdateState({
      checkedAt: Date.now(),
      lastError: error.message,
    })
    return { status: 'error', version: getDataPackageVersion(), error }
  }
}

export function scheduleDataUpdate() {
  if (updateScheduled || typeof window === 'undefined') return
  updateScheduled = true
  const runCheck = () => checkForDataUpdate(false).catch(() => {})
  setTimeout(runCheck, 1000)
  setInterval(runCheck, CHECK_INTERVAL_MS)
}
