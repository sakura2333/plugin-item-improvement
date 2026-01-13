import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { SlotitemIcon } from 'views/components/etc/icon'
import FontAwesome from 'react-fontawesome'
import {
  Button,
  Collapse,
} from 'react-bootstrap'
import _ from 'lodash'

import { EquipListView } from './equip-list-view'
import { isEquipMasterEqual } from './utils'

// props:
// - collapsed
// - equipLevels
// - equipType
// - onToggle
// - plans
// - viewMode
class EquipCategoryView extends Component {
  static propTypes = {
    collapsed: PropTypes.bool.isRequired,
    viewMode: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired,
    equipType: PropTypes.shape({
      api_id: PropTypes.number.isRequired,
      api_name: PropTypes.string.isRequired,
      equips: PropTypes.arrayOf(PropTypes.object).isRequired,
    }).isRequired,
    plans: PropTypes.object.isRequired,
  }

  render() {
    const { equipType: et, collapsed, viewMode, plans } = this.props

    return (
        <div>
          <Button
              onClick={this.props.onToggle}
              style={{ width: '100%', margin: '2px', display: 'flex', alignItems: 'center' }}
          >
            {!viewMode && (
                <FontAwesome
                    className="eqcat-collapse-toggle"
                    style={{ marginRight: '10px' }}
                    name={collapsed ? 'chevron-right' : 'chevron-down'}
                />
            )}
            <div style={{ flex: 1, textAlign: 'left' }}>{et.api_name}</div>
            <div>
              {Array.from(new Set(et.equips.map(e => e.iconId))).map(iconId => (
                  <SlotitemIcon key={iconId} slotitemId={iconId} className="equip-icon" />
              ))}
            </div>
          </Button>

          <Collapse timeout={100} in={!collapsed}>
            <div style={{ paddingLeft: '20px' }}>
              <EquipListView
                  viewMode={viewMode}
                  plans={plans}
                  equips={et.equips}
              />
            </div>
          </Collapse>
        </div>
    )
  }
}

export { EquipCategoryView }
