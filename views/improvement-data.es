import _ from 'lodash'

const WEEKDAY_COUNT = 7
const ALL_DAYS = _.range(WEEKDAY_COUNT)
const SUMMARY_DAYS = ALL_DAYS.concat(-1)
const DEFAULT_NAME_SEPARATOR = ' / '

const normalizePositiveInteger = value => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

const normalizeText = value => typeof value === 'string' ? value.trim() : ''

export const normalizeWeek = week => ALL_DAYS.map(day => Boolean((week || [])[day]))

export const normalizeShipIds = shipWeek => {
  const rawIds = shipWeek.shipIds || shipWeek.ids || shipWeek.id || []
  const values = Array.isArray(rawIds) ? rawIds : [rawIds]

  return _(values)
    .map(normalizePositiveInteger)
    .filter(id => id !== null)
    .uniq()
    .value()
}

const isExplicitlyResolved = shipWeek => shipWeek.idsComplete === true
  || shipWeek.resolved === true

const isSingleIdTextExact = (sourceText, ships) => (
  ships.length === 1 && sourceText === ships[0].canonicalName
)

export const createShipNameResolver = ($ships = {}, localizeName = name => name) => shipId => {
  const ship = $ships[shipId] || {}
  const canonicalName = normalizeText(ship.api_name)
  const localizedName = canonicalName ? normalizeText(localizeName(canonicalName)) : ''

  return {
    id: shipId,
    canonicalName: canonicalName || null,
    displayName: localizedName || canonicalName || `#${shipId}`,
    found: Boolean(canonicalName),
  }
}

export const normalizeAssistant = (shipWeek = {}, resolveShipName) => {
  const shipIds = normalizeShipIds(shipWeek)
  const ships = shipIds.map(resolveShipName)
  const sourceText = normalizeText(shipWeek.rawText || shipWeek.text)
  const canonicalText = ships.map(ship => ship.canonicalName || `#${ship.id}`).join(DEFAULT_NAME_SEPARATOR)
  const localText = ships.map(ship => ship.displayName).join(DEFAULT_NAME_SEPARATOR)
  const idsComplete = isExplicitlyResolved(shipWeek)
    || shipIds.length > 1
    || !sourceText
    || isSingleIdTextExact(sourceText, ships)
  const displayText = idsComplete && localText ? localText : sourceText || localText
  const week = normalizeWeek(shipWeek.week)
  const days = ALL_DAYS.filter(day => week[day])
  const identity = idsComplete && shipIds.length > 0
    ? `ids:${shipIds.join(',')}`
    : `source:${sourceText || shipIds.join(',')}`

  return {
    source: shipWeek,
    sourceText,
    shipIds,
    ships,
    canonicalText,
    localText,
    displayText,
    idsComplete,
    week,
    days,
    fullWeek: days.length === WEEKDAY_COUNT,
    identity,
  }
}

export const normalizeImprovement = (improvement = {}, resolveShipName) => ({
  ...improvement,
  assistantList: (improvement.shipWeekList || [])
    .map(shipWeek => normalizeAssistant(shipWeek, resolveShipName)),
})

export const isAssistantAvailableOnDay = (assistant, day) => (
  day === -1 || Boolean((assistant.week || [])[day])
)

export const isImprovementAvailableOnDay = (improvement, day) => (
  (improvement.assistantList || [])
    .some(assistant => isAssistantAvailableOnDay(assistant, day))
)

export const buildAssistantTextByDay = improvementList => _(SUMMARY_DAYS)
  .map(day => {
    const text = _(improvementList || [])
      .flatMap(improvement => improvement.assistantList || [])
      .filter(assistant => isAssistantAvailableOnDay(assistant, day))
      .uniqBy('identity')
      .map('displayText')
      .filter(Boolean)
      .join(DEFAULT_NAME_SEPARATOR)

    return [day, text]
  })
  .fromPairs()
  .value()

export const buildImprovementItem = (item = {}, equip = {}, resolveShipName) => {
  const improvementList = (item.improvementList || [])
    .map(improvement => normalizeImprovement(improvement, resolveShipName))

  return {
    ...equip,
    ...item,
    improvementList,
    priority: 0,
    assistantTextByDay: buildAssistantTextByDay(improvementList),
  }
}

export const listViewIndexForDay = day => day === -1 ? 0 : day + 1

export const normalizeListProjection = (listData = {}) => {
  const views = Array.isArray(listData.data) ? listData.data : []
  const itemIdsByDay = {}
  const assistantTextByItemId = {}

  SUMMARY_DAYS.forEach(day => {
    const viewIndex = listViewIndexForDay(day)
    const rows = Array.isArray(views[viewIndex]) ? views[viewIndex] : []
    itemIdsByDay[day] = []

    rows.forEach(row => {
      const itemId = normalizePositiveInteger(row && row[0])
      const assistantTexts = row && Array.isArray(row[1]) ? row[1] : []
      if (itemId === null) {
        return
      }

      itemIdsByDay[day].push(itemId)
      if (!assistantTextByItemId[itemId]) {
        assistantTextByItemId[itemId] = {}
      }
      assistantTextByItemId[itemId][day] = assistantTexts
        .map(normalizeText)
        .filter(Boolean)
        .join(DEFAULT_NAME_SEPARATOR)
    })
  })

  return {
    metadata: listData.metadata || null,
    itemIdsByDay,
    assistantTextByItemId,
  }
}
