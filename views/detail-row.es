import React from 'react'
import PropTypes from 'prop-types'
import { Table } from 'react-bootstrap'
import _ from 'lodash'
import { connect } from 'react-redux'

import { MaterialIcon } from 'views/components/etc/icon'
import { constSelector } from 'views/utils/selectors'
import { MatRow } from './mat-row'
import {
  adjustedRemodelChainsSelector,
  shipUniqueMapSelector,
  equipAvailableSelector,
} from './selectors'

const { __ } = window.i18n['poi-plugin-item-improvement2']
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const isAvailableOnDay = (improvement, day) =>
  day === -1 || (improvement.shipWeekList || []).some(shipWeek => (shipWeek.week || [])[day])

const fallbackName = itemId => `#${itemId}`

const parseItem = ($equips, $useitems, itemId, count, type, useitemAvailable, available) => {
  // console.log('availableitem',available[itemId])
  //type 0 武器
  //type 1 useitem
  if (type === 1) {
    // console.log('itemstring', itemId)
    return {
      icon: itemId,
      name: _.get($useitems, [itemId, 'api_name']) || fallbackName(itemId),
      count,
      id: itemId,
      type: 'useitem',
      available: useitemAvailable[itemId] ? useitemAvailable[itemId].api_count : 0,
    }
  }
  else {
    return {
      icon: _.get($equips, [itemId, 'api_type', 3]) || null,
      name: _.get($equips, [itemId, 'api_name']) || fallbackName(itemId),
      count,
      id: itemId,
      type: 'item',
      available: available[itemId] ? available[itemId].length : 0,
    }
  }
}


const DetailRow = connect(state =>
  ({
    $const: constSelector(state) || {},
    chains: adjustedRemodelChainsSelector(state),
    uniqMap: shipUniqueMapSelector(state),
    useitemAvailable: _.get(state, 'info.useitems', {}),
    available: equipAvailableSelector(state),
  })
)(({ row: row, day, $const: { $equips, $useitems }, useitemAvailable, available }) => {
  const result = []
  const visibleImprovements = (row.improvementList || [])
    .filter(improvement => isAvailableOnDay(improvement, day))

  visibleImprovements.forEach((improvement, improvementIndex) => {
    const { stageList, shipWeekList } = improvement
    const assistants = shipWeekList.map(shipWeek => {
      const days = shipWeek.week
          .map((v, i) => (v ? i : null))
          .filter(v => v !== null);

      const fullWeek = days.length === 7;

      return {
        name: shipWeek.text,
        days,
        dayText: fullWeek
            ? ''
            : `(${days.map(i => __(WEEKDAY[i])).join(' / ')})`
      };
    });

    // skip if no ships
    if (assistants.length === 0) {
      return
    }

    const rowCnt = stageList.length

    stageList.forEach((stage, index, arr) => {
      const isFirst = index === 0
      const isLast = index === arr.length - 1

      const items = (stage.consumables || []).map(consumable =>
          parseItem(
              $equips,
              $useitems,
              consumable.id,
              consumable.count,
              consumable.type,
              useitemAvailable,
              available
          )
      )
      const upgradeInfo = {
        icon: 0,
        id: 0,
        level: 0,
        name: '',
      }

      if (stage.targetWeapon.id >0 ){
        const itemId = stage.targetWeapon.id
        upgradeInfo.id = stage.targetWeapon.id
        upgradeInfo.level = stage.targetWeapon.level
        upgradeInfo.icon = _.get($equips, [itemId, 'api_type', 3]) || null
        upgradeInfo.name = _.get($equips, [itemId, 'api_name']) || fallbackName(itemId)
      }

      result.push(
          <MatRow
              isFirst={isFirst}
              isLast={isLast}
              rowCnt={rowCnt}
              stageText={stage.stageText}
              development={[stage.industryResource[0], stage.industryResource[1]]}
              improvement={[stage.industryResource[2], stage.industryResource[3]]}
              items={items}
              upgrade={upgradeInfo}
              assistants={assistants}
              day={day}
              key={`${stage.stageText}-${improvementIndex}-${index}`}
          />
      )
    })
  })
  if (visibleImprovements.length === 0 || result.length === 0) {
    return null
  }

  const [fuel, ammo, steel, bauxite] = visibleImprovements[0].baseResource

  return (
    <div>
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
        <tbody>
          {result}
        </tbody>
      </Table>
    </div>
  )
})

DetailRow.propTypes = {
  id: PropTypes.number.isRequired,
}

export { DetailRow }
