import _ from 'lodash'

const PLUGIN_KEY = 'plugin.poi-plugin-starcraft'
const keyPlans = `${PLUGIN_KEY}.plans`

const { config } = window
const { __ } = window.i18n['poi-plugin-item-improvement2']
export const infinityNum = 10000

export const getStarcraftPlans = () => config.get(keyPlans, {})

const modifyPlans = modify => {
  const oldPlans = config.get( keyPlans, {} )
  config.set( keyPlans, modify(oldPlans) )
}

// 新增单个装备计划
export const addNewEquipPlan = id => {
  if (!id) {
    console.error('Invalid equipment id:', id)
    return
  }

  modifyPlans(plans => {
    const newPlans = { ...plans }

    // 如果这个装备没有 plan，就先创建空对象
    if (!newPlans[id]) {
      newPlans[id] = {}
    }

    // 初始化第一条 plan
    initFirstPlan(newPlans, id)

    return newPlans
  })
}

// 通用的初始化 plan 第一条记录
const initFirstPlan = (plans, id) => {
  if (Object.keys(plans[id]).length === 0) {
    plans[id][0] = infinityNum
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
