import fs from 'fs'
import _ from 'lodash'
import { getImprovementDataPaths } from './data-package'
import { DATA_UPDATED_EVENT, scheduleDataUpdate } from './data-updater'
import { validateImprovementListData } from './data-package-validator'

function loadNedbAsMap(nedbPath, key = 'id') {
  if (!fs.existsSync(nedbPath)) {
    throw new Error(`Improvement detail file not found: ${nedbPath}`)
  }

  const content = fs.readFileSync(nedbPath, 'utf8')
  return _(content.split('\n'))
    .filter(Boolean)
    .map(line => JSON.parse(line))
    .keyBy(key)
    .value()
}

function loadListData(jsonPath) {
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Improvement list file not found: ${jsonPath}`)
  }

  return validateImprovementListData(JSON.parse(fs.readFileSync(jsonPath, 'utf8')))
}

function loadImprovementData() {
  const { detailPath, listPath } = getImprovementDataPaths()
  return {
    items: loadNedbAsMap(detailPath, 'id'),
    list: loadListData(listPath),
  }
}

let localImprovementData = loadImprovementData()

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener(DATA_UPDATED_EVENT, () => {
    localImprovementData = loadImprovementData()
  })
}

scheduleDataUpdate()

export function getLocalImprovementData() {
  return localImprovementData
}
