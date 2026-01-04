import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  Button,
} from 'react-bootstrap'

const { __ } = window.i18n['poi-plugin-item-improvement2-beta']

class ControlPanel extends Component {
  static propTypes = {
    viewMode: PropTypes.bool.isRequired,
    onControlAction: PropTypes.func.isRequired,
    onToggleViewMode: PropTypes.func.isRequired,
    onExportAsImage: PropTypes.func.isRequired,
  }

  handleAction = action => () => {
    this.props.onControlAction(action)
  }
  render() {
    const { viewMode } = this.props
    const btnStyle = {marginRight: '5px'}
    const labelStyle = {
      marginRight: '5px', marginLeft: '5px',
      paddingTop: '5px',
      width: '60px',
    }
    return (
      <div style={{display: 'flex', marginBottom: '10px', flexDirection: 'column'}}>
        <div style={{display: 'flex', marginBottom: '2px', alignItems: 'center'}}>
          <div style={{ ...labelStyle}} >{__('Content')}</div>
          <Button
              style={ {...btnStyle}}
              onClick={this.handleAction('Auto')}
              title={__('Expand only non-empty categories')}>{__('Default')}</Button>
          <Button
              onClick={this.handleAction('ExpandAll')}
              style={ {...btnStyle}}>{__('Expand All')}</Button>
          <Button
              onClick={this.handleAction('CollapseAll')}
              style={ {...btnStyle}}>{__('Collapse All')}</Button>
        </div>
        <div style={{display: 'flex', marginBottom: '2px', alignItems: 'center'}}>
          <div style={{ ...labelStyle}}>{__('View')}</div>
          <Button
              style={ {...btnStyle}}
              onClick={this.props.onToggleViewMode}
              active={this.props.viewMode}>{__('View Mode')}</Button>
          {
            viewMode && (
              <Button
                  onClick={this.props.onExportAsImage}
                  style={ {...btnStyle}}>
                {__('Export as Image')}
              </Button>)
          }
        </div>
      </div>
    )
  }
}

export {
  ControlPanel,
}
