import React from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import { SlotitemIcon } from 'views/components/etc/icon'
import { UseitemIcon } from './useitem-icon'

const { __ } = window.i18n['poi-plugin-item-improvement2']
const { __: __r } = window.i18n.resources

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const ItemIcon = ({ item, ...props }) => item.type === 'useitem'
  ? <UseitemIcon
    useitemId={item.icon}
    className={'useitem'}
    {...props}
  />
  : <SlotitemIcon
    slotitemId={item.icon}
    className="equip-icon"
    {...props}
  />

ItemIcon.propTypes = {
  item: PropTypes.shape({
    type: PropTypes.string.isRequired,
    icon: PropTypes.number.isRequired,
  }).isRequired,
}

// React Elements
const MatRow = ({ stage, day, assistants, upgrade, items, development, improvement }) => {
  const rowCnt = upgrade.icon ? 3 : 2

  let hishoCol = ''
  if (day === -1) {
    hishoCol = assistants.map(hisho => {
      let days = []
      hisho.day.forEach((v, i) => {
        if (v) days.push(__(WEEKDAY[i]))
      })
      if (days.length === 7) {
        days = ''
      } else {
        days = `(${days.join(' / ')})`
      }
      return (
        <div className="hisho-col" key={hisho.name}>
          {hisho.name}<br />
          <span className="available-days">{days}</span>
        </div>
      )
    })
  } else {
    hishoCol = assistants.map(hisho => <div key={hisho.name}>{hisho.name}</div>)
  }

  let stageRow = ''
  let star = ''
  switch (stage) {
    case 0:
      stageRow = <span><FontAwesome name="star" /> 1 ~ <FontAwesome name="star" /> 6 </span>
      break
    case 1:
      stageRow = <span><FontAwesome name="star" /> 6 ~ <FontAwesome name="star" /> MAX </span>
      break
    case 2:
      if (upgrade.level) {
        star = <span> <FontAwesome name="star" />{` ${upgrade.level}`}</span>
      }
      stageRow = (<div>
        <SlotitemIcon slotitemId={upgrade.icon} className="equip-icon" />
        {window.i18n.resources.__(upgrade.name)}
        {star}
      </div>)
      break
    default:
      console.error('unreachable code: stage is out of range')
  }

  return (
    <tr>
      {
        stage === 0 &&
          <td rowSpan={rowCnt}>{hishoCol}</td>
      }
      <td>
        {stageRow}
      </td>
      <td>
        {development[0]}({development[1]})
      </td>
      <td>
        {improvement[0]}({improvement[1]})
      </td>
      <td>
        <div>
          {
            items.map(item => (
              !!item.icon &&
              <div key={item.icon}>
                {item.count} ×
              <ItemIcon
                item={item}
              />
              {__r(item.name)}{typeof item.available === 'number' &&
__('Available', item.available)}
              </div>
            ))
          }
        </div>
      </td>
    </tr>
  )
}

MatRow.propTypes = {
  day: PropTypes.number.isRequired,
  development: PropTypes.arrayOf(PropTypes.number).isRequired,
  improvement: PropTypes.arrayOf(PropTypes.number).isRequired,
  stage: PropTypes.number.isRequired,
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  upgrade: PropTypes.shape({
    level: PropTypes.number.isRequired,
    icon: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  assistants: PropTypes.arrayOf(
    PropTypes.shape({
      day: PropTypes.arrayOf(PropTypes.bool).isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
}

export { MatRow }
