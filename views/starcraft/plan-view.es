import React, { Component } from 'react'
import PropTypes from 'prop-types'

import {
  Button,
} from 'react-bootstrap'
import { starText, modifyPlans } from './utils'

const { __ } = window.i18n['poi-plugin-item-improvement2']

class PlanView extends Component {
  static propTypes = {
    mstId: PropTypes.number.isRequired,
    star: PropTypes.number.isRequired,
    planCount: PropTypes.number.isRequired,
    actualCount: PropTypes.number.isRequired,
    viewMode: PropTypes.bool.isRequired,
  }

  handleRemove = () => {
    const { mstId, star } = this.props
    modifyPlans( plans => {
      const newPlans = { ...plans }
      newPlans[mstId] = { ...plans[mstId] }
      delete newPlans[mstId][star]
      if (Object.keys(newPlans[mstId]).length === 0) {
        delete newPlans[mstId]
      }
      return newPlans
    })
  }
  render() {
    const { star, planCount, actualCount, viewMode } = this.props
    const done = actualCount >= planCount
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        fontSize: '16px'}}>
        <div key="1" style={{flex: 1}} className="star-text">{starText(star)}</div>
        <div key="2" style={{
          flex: 1, display: 'flex',
          justifyContent: viewMode ? 'flex-end' : 'flex-start'}}>
          <div className={done ? 'text-success' : 'text-danger'}>{actualCount}</div>
          <div style={{marginLeft: '2px'}}>/{planCount < 9999 ? planCount : '∞'}</div>
        </div>
        { ! viewMode &&
          (
            <div key="3">
              <Button
                  onClick={this.handleRemove}
                  bsStyle="warning">{__('Remove')}
              </Button>
            </div>
          )
        }
      </div>)
  }
}

export {
  PlanView,
}
