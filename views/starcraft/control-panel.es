import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button } from 'react-bootstrap'

const { __ } = window.i18n['poi-plugin-item-improvement2']

// 枚举：逻辑使用
const ActionTypes = {
  DEFAULT: 'DEFAULT',
  EXPAND_ALL: 'EXPAND_ALL',
  COLLAPSE_ALL: 'COLLAPSE_ALL'
}

// 显示文本：i18n 使用
const ActionLabels = {
  [ActionTypes.DEFAULT]: __('Default'),
  [ActionTypes.EXPAND_ALL]: __('Expand All'),
  [ActionTypes.COLLAPSE_ALL]: __('Collapse All')
}

class ControlPanel extends Component {
  static propTypes = {
    viewMode: PropTypes.bool.isRequired,
    onControlAction: PropTypes.func.isRequired,
    onToggleViewMode: PropTypes.func.isRequired,
    onExportAsImage: PropTypes.func.isRequired,
  }

  // 使用枚举触发操作
  handleAction = action => () => {
    this.props.onControlAction(action)
  }

  render() {
    const { viewMode } = this.props
    const btnStyle = { marginRight: '5px' }
    const labelStyle = {
      marginRight: '5px',
      marginLeft: '5px',
      paddingTop: '5px',
      width: '60px',
    }

    return (
        <div style={{ display: 'flex', marginBottom: '10px', flexDirection: 'column' }}>
          {/* 内容操作按钮 */}
          <div style={{ display: 'flex', marginBottom: '2px', alignItems: 'center' }}>
            <div style={{ ...labelStyle }}>{__('Content')}</div>

            <Button
                style={{ ...btnStyle }}
                onClick={this.handleAction(ActionTypes.DEFAULT)}
                title={__('Expand only non-empty categories')}
            >
              {ActionLabels[ActionTypes.DEFAULT]}
            </Button>

            <Button
                style={{ ...btnStyle }}
                onClick={this.handleAction(ActionTypes.EXPAND_ALL)}
            >
              {ActionLabels[ActionTypes.EXPAND_ALL]}
            </Button>

            <Button
                style={{ ...btnStyle }}
                onClick={this.handleAction(ActionTypes.COLLAPSE_ALL)}
            >
              {ActionLabels[ActionTypes.COLLAPSE_ALL]}
            </Button>
          </div>

          {/* 视图模式按钮 */}
          <div style={{ display: 'flex', marginBottom: '2px', alignItems: 'center' }}>
            <div style={{ ...labelStyle }}>{__('View')}</div>

            <Button
                style={{ ...btnStyle }}
                onClick={this.props.onToggleViewMode}
                active={viewMode}
            >
              {__('View Mode')}
            </Button>

            {viewMode && (
                <Button
                    style={{ ...btnStyle }}
                    onClick={this.props.onExportAsImage}
                >
                  {__('Export as Image')}
                </Button>
            )}
          </div>
        </div>
    )
  }
}

export {
  ControlPanel,
  ActionTypes,
  ActionLabels
}
