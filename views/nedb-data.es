import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'
import _ from 'lodash'

export const ASSETS_DIR = path.join(__dirname, '../assets/db')

const REMOTE_NEDB_DIR_API = 'https://api.github.com/repos/sakura2333/kancolle-item-improvement-spider/contents/data/improvement?ref=main'
const GITHUB_HEADERS = {
  'User-Agent': 'poi-plugin-item-improvement2',
  Accept: 'application/vnd.github.v3+json',
}

let dataVersion = 0
let syncPromise = null
let syncStarted = false
let localNedbData = null
const listeners = []

function loadNedbAsMap(nedbPath, key = 'id') {
  try {
    if (!fs.existsSync(nedbPath)) {
      console.warn('[nedb] file not found:', nedbPath)
      return {}
    }
    const content = fs.readFileSync(nedbPath, 'utf-8')
    return _(content.split('\n'))
      .filter(Boolean)
      .map(line => { try { return JSON.parse(line) } catch (e) { return null } })
      .filter(Boolean)
      .keyBy(key)
      .value()
  } catch (e) {
    console.error('[nedb] load failed:', e)
    return {}
  }
}

function loadLocalNedbData() {
  return {
    arsenal: loadNedbAsMap(path.join(ASSETS_DIR, 'arsenal_all.nedb'), 'id'),
    items: loadNedbAsMap(path.join(ASSETS_DIR, 'items.nedb'), 'id'),
    arsenalWeekday: loadNedbAsMap(path.join(ASSETS_DIR, 'arsenal_weekday.nedb'), 'weekday'),
  }
}

function notifyNedbDataChange() {
  listeners.forEach(listener => {
    try {
      listener(dataVersion)
    } catch (e) {
      console.error('[nedb] listener failed:', e)
    }
  })
}

function reloadLocalNedbData() {
  localNedbData = loadLocalNedbData()
  dataVersion += 1
  notifyNedbDataChange()
}

function requestText(url, redirectCount = 0) {
  const transport = url.startsWith('https:') ? https : http

  return new Promise((resolve, reject) => {
    const req = transport.get(url, { headers: GITHUB_HEADERS }, res => {
      const { statusCode, headers } = res

      if (statusCode >= 300 && statusCode < 400 && headers.location) {
        res.resume()
        if (redirectCount >= 5) {
          reject(new Error(`Too many redirects: ${url}`))
          return
        }
        resolve(requestText(headers.location, redirectCount + 1))
        return
      }

      if (statusCode !== 200) {
        res.resume()
        reject(new Error(`Request failed with status ${statusCode}: ${url}`))
        return
      }

      res.setEncoding('utf8')
      let raw = ''
      res.on('data', chunk => {
        raw += chunk
      })
      res.on('end', () => resolve(raw))
    })

    req.on('error', reject)
    req.setTimeout(15000, () => {
      req.abort()
      reject(new Error(`Request timeout: ${url}`))
    })
  })
}

function validateNedbContent(name, content) {
  const lines = content.split('\n').filter(Boolean)
  if (lines.length === 0) {
    throw new Error(`Empty nedb file: ${name}`)
  }

  lines.forEach(line => JSON.parse(line))
}

function writeFileIfChanged(name, content) {
  const safeName = path.basename(name)
  const targetPath = path.join(ASSETS_DIR, safeName)

  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR)
  }

  if (fs.existsSync(targetPath) && fs.readFileSync(targetPath, 'utf-8') === content) {
    return false
  }

  const tempPath = path.join(ASSETS_DIR, `.${safeName}.${Date.now()}.tmp`)
  fs.writeFileSync(tempPath, content, 'utf-8')
  fs.renameSync(tempPath, targetPath)
  return true
}

function getRemoteNedbFiles() {
  return requestText(REMOTE_NEDB_DIR_API)
    .then(content => {
      const entries = JSON.parse(content)
      return entries
        .filter(entry => entry.type === 'file' && /\.nedb$/.test(entry.name) && entry.download_url)
        .map(entry => ({
          name: entry.name,
          downloadUrl: entry.download_url,
        }))
    })
}

function syncRemoteNedbData() {
  return getRemoteNedbFiles()
    .then(files => {
      if (files.length === 0) {
        throw new Error('No remote nedb files found')
      }

      return Promise.all(files.map(file => requestText(file.downloadUrl).then(content => {
        validateNedbContent(file.name, content)
        return writeFileIfChanged(file.name, content)
      })))
    })
    .then(results => {
      if (results.some(Boolean)) {
        reloadLocalNedbData()
      }
    })
}

localNedbData = loadLocalNedbData()

export function getLocalNedbData() {
  return localNedbData
}

export function getNedbDataVersion() {
  return dataVersion
}

export function subscribeNedbDataChange(listener) {
  listeners.push(listener)

  return () => {
    const index = listeners.indexOf(listener)
    if (index >= 0) {
      listeners.splice(index, 1)
    }
  }
}

export function startNedbDataSync() {
  if (!syncStarted) {
    syncStarted = true
    syncPromise = syncRemoteNedbData()
      .catch(e => {
        console.warn('[nedb] sync failed:', e)
      })
      .then(() => {
        syncPromise = null
      })
  }

  return syncPromise || Promise.resolve()
}
