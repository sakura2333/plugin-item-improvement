import domtoimage from 'dom-to-image'
import _ from 'lodash'
import { remote } from 'electron'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { store } from 'views/create-store'

import { prepareEquipTypeInfo } from './equiptype'
import { EquipCategoryView } from './equip-category-view'
import { ControlPanel } from './control-panel'
import { Divider } from '../divider'
import { keyPlans } from './utils'
import {improvableIdSetSelector} from '../selectors'
const { $ } = window

window.store = store

$('#fontawesome-css')
  .setAttribute('href', require.resolve('font-awesome/css/font-awesome.css'))

class Main extends Component {
  static propTypes = {
    $equips: PropTypes.object.isRequired,
    equipTypes: PropTypes.object.isRequired,
    plans: PropTypes.object.isRequired,
    equipTypeInfo: PropTypes.shape( {
      catInfo: PropTypes.object.isRequired,
      iconInfo: PropTypes.object.isRequired,
    }).isRequired,
  }

  static prepareAutoCollapse(props) {
    const equipTypeCollapsed = {}
    const {equipTypes, equipTypeInfo, plans} = props
    Object.keys( equipTypes ).map( k => {
      const et = equipTypes[k]
      const ci = equipTypeInfo.catInfo[et.api_id]
      equipTypeCollapsed[k] =
        ! ci.group.some( mstId => plans[mstId])
    })

    return { equipTypeCollapsed }
  }

  constructor(props) {
    super()
    this.state = { ...Main.prepareAutoCollapse(props), viewMode: false }
    this.viewRef = null
  }

  handleToggle = k => () => {
    this.setState( prevState => {
      const newState = { ...prevState }
      newState.equipTypeCollapsed = { ...prevState.equipTypeCollapsed }
      newState.equipTypeCollapsed[k] = ! prevState.equipTypeCollapsed[k]
      return newState
    })
  }

  handleControlAction = action => {
    const { equipTypes } = this.props
    if (action === 'Auto') {
      this.setState( Main.prepareAutoCollapse(this.props) )
      return
    }

    if (action === 'ExpandAll' || action === 'CollapseAll') {
      const collapsed = action === 'CollapseAll'
      const equipTypeCollapsed = {}
      Object.keys( equipTypes ).map( k => {
        equipTypeCollapsed[k] = collapsed
      })

      this.setState( { equipTypeCollapsed } )
      return
    }

    console.error( `undefined action: ${action}` )
  }

  handleToggleViewMode = () => {
    this.setState( { viewMode: ! this.state.viewMode } )
  }

  updateRef = newRef => { this.viewRef = newRef }

  handleRefToImage = () => {
    if (this.viewRef) {
      domtoimage
        .toPng(this.viewRef)
        .then( dataUrl => {
          remote.getCurrentWebContents().downloadURL(dataUrl)
        })
    }
  }

  render() {
    const { equipTypes, equipTypeInfo, plans, $equips } = this.props
    const { equipTypeCollapsed, viewMode } = this.state
    return (
      <div
          id="starcraft-root"
          style={{margin: '5px 10px 5px 5px'}} >
        <ControlPanel
            viewMode={viewMode}
            onToggleViewMode={this.handleToggleViewMode}
            onControlAction={this.handleControlAction}
            onExportAsImage={this.handleRefToImage}
        />
        <Divider />
        <div ref={this.updateRef}>
          {
            Object.keys(equipTypes).map( k => {
              const et = equipTypes[k]
              const ci = equipTypeInfo.catInfo[et.api_id]
              return (
                <EquipCategoryView
                    viewMode={viewMode}
                    key={et.api_id}
                    collapsed={equipTypeCollapsed[k]}
                    onToggle={this.handleToggle(k)}
                    equipType={et}
                    catInfo={ci}
                    plans={plans}
                    $equips={$equips}
                />)
            })
          }
        </div>
      </div>
    )
  }
}

const StarcraftArea = connect(
  state => {
    const improvableIds = improvableIdSetSelector(state)
    const equipTypeInfo = prepareEquipTypeInfo( state.const.$equips,improvableIds  )
    const equipTypesRaw = state.const.$equipTypes

    const { $equips } = state.const

    // plans[<equipment master id>] = undefined or object
    // plans[...][0 .. 10] = number of planned count
    // connected plans:
    const plans = _.get(state,`config.${keyPlans}`, {})

    // filter equipTypes to remove empty categories
    // before any UI rendering happens
    const equipTypes = {}
    Object.keys(equipTypesRaw).map( k => {
      const et = equipTypesRaw[k]
      const ci = equipTypeInfo.catInfo[et.api_id]
      if (ci && ci.group.length > 0)
        equipTypes[k] = et
    })

    return {
      equipTypeInfo,
      equipTypes,
      plans,
      $equips,
    }
  })(Main)

export { StarcraftArea }
