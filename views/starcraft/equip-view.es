import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { Button } from 'react-bootstrap'
import { SlotitemIcon } from 'views/components/etc/icon'

import { PlanView } from './plan-view'
import { PlanModifyControl } from './plan-modify-control'
import { modifyPlans } from './utils'
import { itemLevelStatFactory } from '../selectors'

const { __ } = window.i18n['poi-plugin-item-improvement2-beta']

// props:
// - mstId, name, iconId, plans, viewMode
const EquipView = connect(
  (state, { mstId }) => ({
    levels: itemLevelStatFactory(mstId)(state),
  })
)(class EquipView extends Component {
  static propTypes = {
    mstId: PropTypes.number.isRequired,
    iconId: PropTypes.number.isRequired,
    viewMode: PropTypes.bool.isRequired,
    name: PropTypes.string.isRequired,
    levels: PropTypes.arrayOf(PropTypes.number).isRequired,
    plans: PropTypes.object.isRequired,
    hideTitle: PropTypes.bool,
  }

  static defaultProps = {
    hideTitle: false,
  }

  handleRemove = mstId => () => {
    modifyPlans( plans => {
      const newPlans = { ...plans }
      delete newPlans[mstId]
      return newPlans
    })
  }

  render() {
    const {mstId, name, iconId, plans, levels, viewMode} = this.props
    // sort plans because its is not guaranteed to be ordered.
    const planArr = Object.keys( plans ).map( k => {
      const star = parseInt(k,10)
      const planCount = plans[k]
      const actualCount = levels.filter( lvl => lvl >= star ).length
      return {star, planCount, actualCount}
    })
    planArr.sort( (x,y) => x.star - y.star )

    if (viewMode && planArr.length === 0)
      return null

    return (
      <div>
        {
          !this.props.hideTitle && (
            <div style={{
              display: 'flex',
              borderBottom: 'solid 1px #666',
              alignItems: 'center'}}>
              <SlotitemIcon
                  slotitemId={iconId} className="equip-icon" />
              <div style={{flex: 1}}>{name}</div>
              {
                // allow an equipment entity to be removed when it's empty
                planArr.length === 0 && (
                  <Button
                      onClick={this.handleRemove(mstId)}
                      style={{margin: '5px'}}
                      bsStyle="warning" >
                    {__('Remove')}
                  </Button>)
              }
            </div>
          )
        }
        <div onClick={e => e.stopPropagation()} style={{
          width: '80%', maxWidth: '500px',
          margin: 'auto', marginBottom: '2px', marginTop: '2px'}} >
          {
            planArr.map( args => (
              <PlanView
                  viewMode={this.props.viewMode}
                  mstId={mstId}
                  key={`plan-${mstId}-${args.star}`}
                  { ... args } />
            ))
          }
          { !this.props.viewMode &&
            (
              <PlanModifyControl
                  mstId={mstId}
                  plans={plans} />)
          }
        </div>
      </div>)
  }
})


export { EquipView }
