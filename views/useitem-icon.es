import classnames from 'classnames'
import fs from 'fs'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { resolve } from 'path'
import { connect } from 'react-redux'
import { configSelector } from 'views/utils/selectors'
import _ from 'lodash'
import { getUseitemIconPath } from './data-package'

const fallback = resolve(__dirname, '../assets/icon/useitem.svg')
const legacyIcon = id => resolve(__dirname, `../assets/icon/${id}.webp`)

class StaticUseitemIcon extends Component {
  static propTypes = {
    useitemId: PropTypes.number.isRequired,
    className: PropTypes.string.isRequired,
    useSVGIcon: PropTypes.bool.isRequired,
  }

  shouldComponentUpdate = nextProps =>
    !_.isEqual(nextProps, this.props)

  render() {
    const { useitemId, className, useSVGIcon } = this.props
    const classNames = classnames(
      useSVGIcon ? 'svg' : 'webp',
      className
    )
    const packageIcon = getUseitemIconPath(useitemId)
    const legacyPath = legacyIcon(useitemId)
    const src = packageIcon && fs.existsSync(packageIcon)
      ? packageIcon
      : (fs.existsSync(legacyPath) ? legacyPath : fallback)

    return (
      <img
        src={src}
        alt={`useitem #${useitemId}`}
        className={classNames}
      />
    )
  }
}

const UseitemIcon = connect(
  state => (
    { useSVGIcon: _.get(configSelector(state), 'poi.useSVGIcon') }
  )
)(StaticUseitemIcon)

export { UseitemIcon }
