import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { ListGroup, ListGroupItem } from 'react-bootstrap'

import { EquipView } from './equip-view'
import { AddNewEquipView } from './add-new-equip-view'

class EquipListView extends Component {
  static propTypes = {
    viewMode: PropTypes.bool.isRequired,
    equips: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      iconId: PropTypes.number.isRequired,
    })).isRequired,
    plans: PropTypes.object.isRequired, // 保留，用于判断哪些有计划
  }

  shouldComponentUpdate(nextProps) {
    return this.props.viewMode !== nextProps.viewMode ||
        !_.isEqual(this.props.equips, nextProps.equips) ||
        !_.isEqual(this.props.plans, nextProps.plans)
  }

  render() {
    const { equips, plans, viewMode } = this.props

    const equipList = []
    const equipListNoPlan = []

    equips.forEach(e => {
      if (plans[e.id]) {
        equipList.push({ ...e, plans: plans[e.id] })
      } else {
        equipListNoPlan.push(e)
      }
    })

    return (
        <ListGroup style={{ marginBottom: 0 }}>
          {equipList.map(e => (
              <ListGroupItem style={{ padding: 0 }} key={e.id}>
                <EquipView
                    viewMode={viewMode}
                    mstId={e.id}        // 保持原始mstId
                    name={e.name}
                    iconId={e.iconId}
                    plans={plans[e.id]} // 单独传入对应的计划
                />
              </ListGroupItem>
          ))}
          {!viewMode && equipListNoPlan.length > 0 && (
              <ListGroupItem style={{ padding: 0 }} key="noplan">
                <AddNewEquipView equips={equipListNoPlan} />
              </ListGroupItem>
          )}
        </ListGroup>
    )
  }
}

export { EquipListView }
