import React from 'react'
import PropTypes from 'prop-types'
import { Table } from 'react-bootstrap'
import _ from 'lodash'
import { connect } from 'react-redux'

import { MaterialIcon } from 'views/components/etc/icon'
import { constSelector } from 'views/utils/selectors'
import { MatRow } from './mat-row'
import { equipAvailableSelector } from './selectors'
import { isImprovementAvailableOnDay } from './improvement-data'

const { __ } = window.i18n['poi-plugin-item-improvement2']
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const fallbackName = itemId => `#${itemId}`

const parseItem = ($equips, $useitems, itemId, count, type, useitemAvailable, available) => {
  if (type === 1) {
    return {
      icon: itemId,
      name: _.get($useitems, [itemId, 'api_name']) || fallbackName(itemId),
      count,
      id: itemId,
      type: 'useitem',
      available: useitemAvailable[itemId] ? useitemAvailable[itemId].api_count : 0,
    }
  }
  return {
    icon: _.get($equips, [itemId, 'api_type', 3]) || null,
    name: _.get($equips, [itemId, 'api_name']) || fallbackName(itemId),
    count,
    id: itemId,
    type: 'item',
    available: available[itemId] ? available[itemId].length : 0,
  }
}

const buildAssistants = assistantList => (assistantList || []).map(assistant => ({
  key: assistant.identity,
  name: assistant.displayText,
  days: assistant.days,
  dayText: assistant.fullWeek
    ? ''
    : `(${assistant.days.map(i => __(WEEKDAY[i])).join(' / ')})`,
}))

const ImprovementRouteTable = ({
  improvement,
  routeIndex,
  day,
  $equips,
  $useitems,
  useitemAvailable,
  available,
}) => {
  const { stageList = [], assistantList = [], baseResource = [] } = improvement
  const assistants = buildAssistants(assistantList)
  if (assistants.length === 0 || stageList.length === 0) {
    return null
  }

  const rows = stageList.map((stage, index, arr) => {
    const items = (stage.consumables || []).map(consumable => parseItem(
      $equips,
      $useitems,
      consumable.id,
      consumable.count,
      consumable.type,
      useitemAvailable,
      available
    ))
    const itemId = _.get(stage, 'targetWeapon.id', 0)
    const upgradeInfo = {
      icon: itemId > 0 ? _.get($equips, [itemId, 'api_type', 3]) || null : 0,
      id: itemId,
      level: _.get(stage, 'targetWeapon.level', 0),
      name: itemId > 0 ? _.get($equips, [itemId, 'api_name']) || fallbackName(itemId) : '',
    }

    return (
      <MatRow
        isFirst={index === 0}
        isLast={index === arr.length - 1}
        rowCnt={stageList.length}
        stageText={stage.stageText}
        development={[stage.industryResource[0], stage.industryResource[1]]}
        improvement={[stage.industryResource[2], stage.industryResource[3]]}
        items={items}
        upgrade={upgradeInfo}
        assistants={assistants}
        day={day}
        key={`${improvement.routeId || routeIndex}-${stage.stageText}-${index}`}
      />
    )
  })

  const [fuel = 0, ammo = 0, steel = 0, bauxite = 0] = baseResource
  return (
    <div className="improvement-route-table" key={improvement.routeId || routeIndex}>
      <Table width="100%" bordered condensed className="detail-table">
        <thead>
          <tr>
            <th style={{ width: '20%' }} />
            <th style={{ width: '33%' }}>
              <span>
                <MaterialIcon materialId={1} className="equip-icon" />
                {fuel}
              </span>
              <span>
                <MaterialIcon materialId={2} className="equip-icon" />
                {ammo}
              </span>
              <span>
                <MaterialIcon materialId={3} className="equip-icon" />
                {steel}
              </span>
              <span>
                <MaterialIcon materialId={4} className="equip-icon" />
                {bauxite}
              </span>
            </th>
            <th style={{ width: '7%' }}><MaterialIcon materialId={7} className="equip-icon" /></th>
            <th style={{ width: '7%' }}><MaterialIcon materialId={8} className="equip-icon" /></th>
            <th style={{ width: '33%' }}>{__('Equipment')}</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Table>
    </div>
  )
}

ImprovementRouteTable.propTypes = {
  improvement: PropTypes.object.isRequired,
  routeIndex: PropTypes.number.isRequired,
  day: PropTypes.number.isRequired,
  $equips: PropTypes.object.isRequired,
  $useitems: PropTypes.object.isRequired,
  useitemAvailable: PropTypes.object.isRequired,
  available: PropTypes.object.isRequired,
}

const DetailRow = connect(state => ({
  $const: constSelector(state) || {},
  useitemAvailable: _.get(state, 'info.useitems', {}),
  available: equipAvailableSelector(state),
}))(({ row, day, $const: { $equips = {}, $useitems = {} }, useitemAvailable, available }) => {
  const visibleImprovements = (row.improvementList || [])
    .filter(improvement => isImprovementAvailableOnDay(improvement, day))

  if (visibleImprovements.length === 0) {
    return null
  }

  return (
    <div className="improvement-route-list">
      {visibleImprovements.map((improvement, routeIndex) => (
        <ImprovementRouteTable
          improvement={improvement}
          routeIndex={routeIndex}
          day={day}
          $equips={$equips}
          $useitems={$useitems}
          useitemAvailable={useitemAvailable}
          available={available}
          key={improvement.routeId || routeIndex}
        />
      ))}
    </div>
  )
})

DetailRow.propTypes = {
  id: PropTypes.number.isRequired,
}

export { DetailRow }
