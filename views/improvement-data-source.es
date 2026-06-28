import fs from 'fs'
import _ from 'lodash'
import { getImprovementDataPaths } from './data-package'

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

function validateListData(data) {
  if (!data || !data.metadata || !Array.isArray(data.data) || data.data.length !== 8) {
    throw new Error('Invalid improvement list data')
  }
  if (Number(data.metadata.schemaVersion) !== 2
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

function loadListData(jsonPath) {
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Improvement list file not found: ${jsonPath}`)
  }

  return validateListData(JSON.parse(fs.readFileSync(jsonPath, 'utf8')))
}

function loadImprovementData() {
  const { detailPath, listPath } = getImprovementDataPaths()
  return {
    items: loadNedbAsMap(detailPath, 'id'),
    list: loadListData(listPath),
  }
}

const localImprovementData = loadImprovementData()

export function getLocalImprovementData() {
  return localImprovementData
}
