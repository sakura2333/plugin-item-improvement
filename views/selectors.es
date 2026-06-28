import _ from 'lodash'
import { createSelector } from 'reselect'
import {
  constSelector,
  configSelector,
  equipsSelector,
  createDeepCompareArraySelector,
} from 'views/utils/selectors'
import { keyPlans, normalizeStoredPlans } from './starcraft/utils'
import { getLocalImprovementData } from './improvement-data-source'
import {
  buildImprovementItem,
  createShipNameResolver,
  normalizeListProjection,
} from './improvement-data'

const localImprovementDataSelector = () => getLocalImprovementData()

export const $shipsSelector = createSelector(
  [
    constSelector,
  ], $const => _.get($const, '$ships', {})
)

const localizeResourceName = name => window.i18n.resources.__(name)

const shipNameResolverSelector = createSelector(
  [
    $shipsSelector,
  ], $ships => createShipNameResolver($ships, localizeResourceName)
)

const listProjectionSelector = createSelector(
  [
    localImprovementDataSelector,
  ], ({ list }) => normalizeListProjection(list)
)

export const starCraftPlanSelector = createSelector(
  [
    configSelector,
  ], config => normalizeStoredPlans(_.get(config, keyPlans, {}))
)

export const equipAvailableSelector = createSelector(
  [
    equipsSelector,
  ], equips => _(equips)
    .filter({ api_level: 0 })
    .groupBy('api_slotitem_id')
    .value()
)

export const equipLevelStatSelector = createSelector(
  [
    equipsSelector,
  ], equips => _(equips)
    .groupBy('api_slotitem_id')
    .mapValues(items => _(items).map(item => item.api_level || 0).value())
    .value()
)

// Detail normalization remains compatible with the legacy anchor ID + Wiki text shape.
// The list summary itself is supplied by the backend list projection.
export const baseImprovementDataSelector = createSelector(
  [
    constSelector,
    localImprovementDataSelector,
    shipNameResolverSelector,
    listProjectionSelector,
  ], ($const, { items }, resolveShipName, listProjection) => _(items)
    .values()
    .map(item => {
      const normalized = buildImprovementItem(
        item,
        _.get($const, ['$equips', item.id], {}),
        resolveShipName
      )
      return {
        ...normalized,
        assistantTextByDay: listProjection.assistantTextByItemId[item.id]
          || normalized.assistantTextByDay,
      }
    })
    .value()
)

export const improvementDataSelector = createSelector(
  [
    baseImprovementDataSelector,
    starCraftPlanSelector,
    equipLevelStatSelector,
  ], (data, plans, levels) => _(data).map(item => {
    const { id } = item
    if (!plans[id] || _.keys(plans[id]).length === 0) {
      return item
    }
    const itemLevels = levels[id] || []
    const isNotFull = _(plans[id])
      .entries()
      .some(([star, count]) => (
        count > itemLevels.filter(lv => lv >= parseInt(star, 10)).length
      ))
    return {
      ...item,
      priority: isNotFull ? 2 : 1,
    }
  })
    .value()
)

// The backend owns the list projection. The selector only exposes its item IDs.
export const improveItemIdsByDaySelector = createSelector(
  [
    listProjectionSelector,
  ], projection => projection.itemIdsByDay
)

const arrayResultWrapper = selector => createDeepCompareArraySelector(selector, result => result)

export const itemLevelStatFactory = _.memoize(id => arrayResultWrapper(createSelector(
  [
    equipLevelStatSelector,
  ], equipLevels => equipLevels[id] || []
)))
