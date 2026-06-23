import _ from 'lodash'

const PLUGIN_KEY = 'plugin.poi-plugin-starcraft'
const keyPlans = `${PLUGIN_KEY}.plans`

const { config } = window
const { __ } = window.i18n['poi-plugin-item-improvement2']
export const infinityNum = 10000

const normalizeNumberKey = value => {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : null
  }

  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return null
  }

  return parseInt(value, 10)
}

const normalizePlanId = id => {
  const parsed = normalizeNumberKey(id)
  return parsed > 0 ? `${parsed}` : null
}

const normalizePlanStar = star => {
  const parsed = normalizeNumberKey(star)
  return parsed !== null && parsed >= 0 && parsed <= 10 ? `${parsed}` : null
}

const normalizePlanCount = count => {
  return Number.isInteger(count) && count > 0 ? count : null
}

export const isValidPlanCount = count => normalizePlanCount(count) !== null

const normalizeSinglePlan = (plan, { emptyAsDefault = false } = {}) => {
  if (!_.isPlainObject(plan)) {
    return null
  }

  const normalized = {}
  const stars = Object.keys(plan)

  if (stars.length === 0 && emptyAsDefault) {
    normalized[0] = infinityNum
    return normalized
  }

  stars.forEach(star => {
    const starKey = normalizePlanStar(star)
    const count = normalizePlanCount(plan[star])
    if (starKey && count) {
      normalized[starKey] = count
    }
  })

  return normalized
}

export const normalizePlans = (plans, options = {}) => {
  const normalized = {}

  if (!_.isPlainObject(plans)) {
    return normalized
  }

  Object.keys(plans || {}).forEach(id => {
    const idKey = normalizePlanId(id)
    if (!idKey) {
      return
    }

    const plan = normalizeSinglePlan(plans[id], options)
    if (plan && Object.keys(plan).length > 0) {
      normalized[idKey] = plan
    }
  })

  return normalized
}

export const normalizeStoredPlans = plans =>
  normalizePlans(plans, { emptyAsDefault: true })

export const getRawStarcraftPlans = () => config.get(keyPlans, {})

export const getStarcraftPlans = () =>
  normalizeStoredPlans(getRawStarcraftPlans())

export const migrateStarcraftPlans = () => {
  const rawPlans = getRawStarcraftPlans()
  const normalizedPlans = normalizeStoredPlans(rawPlans)

  if (!_.isEqual(rawPlans, normalizedPlans)) {
    config.set(keyPlans, normalizedPlans)
  }

  return normalizedPlans
}

const modifyPlans = modify => {
  const oldPlans = getStarcraftPlans()
  const newPlans = normalizePlans(modify(oldPlans))
  config.set( keyPlans, newPlans )
}

export const setEquipPlan = (id, star, count) => {
  const planId = normalizePlanId(id)
  const planStar = normalizePlanStar(star)
  const planCount = normalizePlanCount(count)
  if (!planId || !planStar || !planCount) {
    console.error('Invalid equipment plan:', id, star, count)
    return
  }

  modifyPlans(plans => {
    const newPlans = { ...plans }
    newPlans[planId] = { ...(plans[planId] || {}) }
    newPlans[planId][planStar] = planCount
    return newPlans
  })
}

export const removeEquipPlan = (id, star) => {
  const planId = normalizePlanId(id)
  const planStar = normalizePlanStar(star)
  if (!planId || !planStar) {
    console.error('Invalid equipment plan:', id, star)
    return
  }

  modifyPlans(plans => {
    if (!plans[planId]) {
      return plans
    }

    const newPlans = { ...plans }
    newPlans[planId] = { ...plans[planId] }
    delete newPlans[planId][planStar]
    return newPlans
  })
}

export const removeEquipPlans = id => {
  const planId = normalizePlanId(id)
  if (!planId) {
    console.error('Invalid equipment id:', id)
    return
  }

  modifyPlans(plans => {
    const newPlans = { ...plans }
    delete newPlans[planId]
    return newPlans
  })
}

// 新增单个装备计划
export const addNewEquipPlan = id => {
  setEquipPlan(id, 0, infinityNum)
}

// 通用的初始化 plan 第一条记录
const initFirstPlan = (plans, id) => {
  const planId = normalizePlanId(id)
  if (!planId) {
    return plans
  }

  plans[planId] = normalizeSinglePlan(plans[planId])
  if (!plans[planId]) {
    plans[planId] = {}
  }

  if (Object.keys(plans[planId]).length === 0) {
    plans[planId][0] = infinityNum
  }
  return plans
}

const starText = star =>
  star === 0 ? __('Owned')
  : star === 10 ? '★+max'
  : `★+${star}`

const simplifyEquips = $equips => {
  const ret = {}

  Object.keys( $equips ).map( k => {
    const {api_type, api_name, api_id} = $equips[k]
    ret[k] = { api_type, api_name, api_id}
  })
  return ret
}

const isEquipMasterEqual = (a,b) =>
  _.isEqual( simplifyEquips(a), simplifyEquips(b) )

export {
  PLUGIN_KEY,
  keyPlans,

  modifyPlans,
  initFirstPlan,
  starText,
  isEquipMasterEqual,
}
