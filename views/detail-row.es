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

const parseItem = ($equips, $useitems, item, count, available) => {
  console.log('availableitem',available[item])
  if (_.isString(item)) {
    const icon = parseInt(item.replace(/\D/g, ''), 10)
    console.log('itemstring', item)
    return {
      icon,
      name: _.get($useitems, [icon, 'api_name']),
      count,
      id: icon,
      type: 'useitem',
    }
  }

  if (item) {
    return {
      icon: _.get($equips, [item, 'api_type', 3]),
      name: _.get($equips, [item, 'api_name']),
      count,
      id: item,
      type: 'item',
      available: available[item] ? available[item].length : 0,
    }
  }

  return {
    icon: 0,
    name: '',
    count: 0,
    id: 0,
    type: 'item',
    available: 0,
  }
}


const DetailRow = connect(state =>
  ({
    $const: constSelector(state) || {},
    chains: adjustedRemodelChainsSelector(state),
    uniqMap: shipUniqueMapSelector(state),
    available: equipAvailableSelector(state),
  })
)(({ row, day, $const: { $ships, $equips, $useitems }, chains, uniqMap, available }) => {
  const result = []
  row.improvement.forEach(({ req, resource, upgrade }) => {
    const assistants = _(req)
      .flatMap(([days, ships]) => ships
        ? _(ships)
          .filter(() => day === -1 || days[day])
          .groupBy(id => uniqMap[id])
          .mapValues(ids => _(ids)
            .sortBy(id => (chains[id] || []).indexOf(id))
            .take(1)
            .value()
          )
          .values()
          .flatten()
          .map(id => ({
            name: window.i18n['poi-plugin-item-improvement2'].__(window.i18n.resources.__(_.get($ships, [id, 'api_name'], 'None'))),
            day: days,
          }))
          .value()
        : ({
          name: window.i18n['poi-plugin-item-improvement2'].__('None'),
          day: days,
        })
      )
      .value()

    // skip the entry if no secretary availbale for chosen day
    if (assistants.length === 0) {
      return
    }

    const upgradeInfo = {
      icon: 0,
      id: 0,
      level: 0,
      name: '',
    }

    if (upgrade) {
      const [itemId, level] = upgrade
      upgradeInfo.id = itemId
      upgradeInfo.level = level
      upgradeInfo.icon = _.get($equips, [itemId, 'api_type', 3])
      upgradeInfo.name = _.get($equips, [itemId, 'api_name'])
    }
    const rowCnt = resource.length - 1
    resource.slice(1).forEach((res , index , arr)=> {
      const [dev, ensDev, imp, ensImp,stageText, extra] = res
      let items = []
      const isFirst = index === 0
      const isLast = index === arr.length - 1

      items = extra.map(([item, _count]) => parseItem($equips, $useitems, item, _count, available))

      result.push(
        <MatRow
          isFirst={isFirst}
          isLast={isLast}
          rowCnt={rowCnt}
          stageText={stageText}
          development={[dev, ensDev]}
          improvement={[imp, ensImp]}
          items={items}
          upgrade={upgradeInfo}
          assistants={assistants}
          day={day}
          key={`${stageText}-${day}-${upgradeInfo.id}`}
        />
      )
    })
  })
  const [fuel, ammo, steel, bauxite] = row.improvement[0].resource[0]

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
