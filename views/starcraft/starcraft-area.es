import domtoimage from 'dom-to-image'
import _ from 'lodash'
import {remote} from 'electron'
import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {store} from 'views/create-store'
import fp from 'lodash/fp'

import {prepareEquipTypeInfo} from './equiptype'
import {EquipCategoryView} from './equip-category-view'
import {ActionTypes, ControlPanel} from './control-panel'
import {Divider} from '../divider'
import {baseImprovementDataSelector, starCraftPlanSelector} from '../selectors'

const { $ } = window

window.store = store

$('#fontawesome-css')
  .setAttribute('href', require.resolve('font-awesome/css/font-awesome.css'))

class Starcraft extends Component {
  static propTypes = {
    $equips: PropTypes.object.isRequired,
    equipTypes: PropTypes.objectOf(PropTypes.shape({
      api_id: PropTypes.number.isRequired,
      api_name: PropTypes.string.isRequired,
      equips: PropTypes.arrayOf(PropTypes.object).isRequired,
    })).isRequired,
    plans: PropTypes.object.isRequired,
  }

  static prepareAutoCollapse(props) {
    const equipTypeCollapsed = {}
    const { equipTypes, plans } = props

    Object.keys(equipTypes).forEach(k => {
      const et = equipTypes[k]
      equipTypeCollapsed[k] = !et.equips.some(equip => plans[equip.id])
    })

    return { equipTypeCollapsed }
  }

  constructor(props) {
    super()
    this.state = { ...Starcraft.prepareAutoCollapse(props), viewMode: false }
    this.viewRef = null
  }

  componentDidUpdate(prevProps) {
    if (_.isEqual(prevProps.plans, this.props.plans) &&
        _.isEqual(prevProps.equipTypes, this.props.equipTypes)) {
      return
    }

    const prevAutoCollapsed = Starcraft.prepareAutoCollapse(prevProps).equipTypeCollapsed
    const nextAutoCollapsed = Starcraft.prepareAutoCollapse(this.props).equipTypeCollapsed

    this.setState(prevState => {
      const equipTypeCollapsed = { ...prevState.equipTypeCollapsed }
      let changed = false

      Object.keys(nextAutoCollapsed).forEach(k => {
        if (!(k in equipTypeCollapsed) || prevAutoCollapsed[k] !== nextAutoCollapsed[k]) {
          equipTypeCollapsed[k] = nextAutoCollapsed[k]
          changed = true
        }
      })

      Object.keys(equipTypeCollapsed).forEach(k => {
        if (!(k in nextAutoCollapsed)) {
          delete equipTypeCollapsed[k]
          changed = true
        }
      })

      return changed ? { equipTypeCollapsed } : null
    })
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
    if (action === ActionTypes.DEFAULT) {
      this.setState( Starcraft.prepareAutoCollapse(this.props) )
      return
    }

    if (action === ActionTypes.EXPAND_ALL || action === ActionTypes.COLLAPSE_ALL) {
      // 用枚举判断折叠状态
      const collapsed = action === ActionTypes.COLLAPSE_ALL

      const equipTypeCollapsed = {}
      Object.keys(equipTypes).forEach(k => {
        equipTypeCollapsed[k] = collapsed
      })

      this.setState({ equipTypeCollapsed })
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
    const { equipTypes, plans } = this.props
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
              return (
                <EquipCategoryView
                    viewMode={viewMode}
                    key={et.api_id}
                    collapsed={Boolean(equipTypeCollapsed[k])}
                    onToggle={this.handleToggle(k)}
                    equipType={et}
                    plans={plans}
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
    //sort item by normalType -> detailType -> nameString
    const rawData = baseImprovementDataSelector(state)

    const sortedEquip = fp.flow(
        fp.sortBy([
          row => row.api_type[2],
          row => row.api_type[3],
          row => row.api_name
        ]))(rawData)

    const mergedEquipTypes = prepareEquipTypeInfo(sortedEquip, state.const.$equipTypes)

    return {
      equipTypes: mergedEquipTypes,
      plans: starCraftPlanSelector(state),
      $equips: sortedEquip
    }
  })(Starcraft)

export { StarcraftArea }
