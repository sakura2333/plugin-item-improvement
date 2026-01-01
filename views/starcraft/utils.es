import _ from 'lodash'

const PLUGIN_KEY = 'plugin.poi-plugin-starcraft'
const keyPlans = `${PLUGIN_KEY}.plans`

const { config } = window
const { __ } = window.i18n['poi-plugin-item-improvement2']

const modifyPlans = modify => {
  const oldPlans = config.get( keyPlans, {} )
  config.set( keyPlans, modify(oldPlans) )
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

  starText,
  isEquipMasterEqual,
}
