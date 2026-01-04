import React, { Component } from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import {
  Button,
  FormControl,
} from 'react-bootstrap'

import { modifyPlans } from './utils'

const { __ } = window.i18n['poi-plugin-item-improvement2-beta']

class AddNewEquipView extends Component {
  static propTypes = {
    equips: PropTypes.arrayOf(PropTypes.shape({
      iconId: PropTypes.number.isRequired,
      mstId: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    })).isRequired,
  }

  constructor() {
    super()
    this.state = {
      selected: 'none',
    }
  }
  handleChange = e => {
    this.setState( { selected: e.target.value } )
  }
  handleAddItem = () => {
    const { selected } = this.state
    if (selected !== 'none') {
      modifyPlans(plans => ({ ...plans, [selected]: {} }))
    } else {
      console.error( 'trying adding an invaid equipment' )
    }
  }

  render() {
    return (
      <div style={{
        display: 'flex',
        margin: '5px',
        fontSize: '12px',
        alignItems: 'center'}} >
        <FontAwesome
            style={{marginRight: '10px'}}
            name="plus"
        />
        <FormControl
            style={{marginRight: '10px',fontSize: '14px'}}
            onChange={this.handleChange}
            value={this.state.selected}
            componentClass="select">
          <option key="none" value="none">{__('New equipment plan')}</option>
          {
            this.props.equips.map(equip =>
              <option
                  key={equip.mstId} value={equip.mstId}>
                {`${equip.mstId}: ${equip.name}`}
              </option>
            )
          }
        </FormControl>
        <Button
            disabled={this.state.selected === 'none'}
            onClick={this.handleAddItem}
            bsStyle="primary">{__('Add')}</Button>
      </div>
    )
  }
}

export { AddNewEquipView }
