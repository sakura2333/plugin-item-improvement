import React from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import { SlotitemIcon } from 'views/components/etc/icon'
import { UseitemIcon } from './useitem-icon'

const { __ } = window.i18n['poi-plugin-item-improvement2']
const { __: __r } = window.i18n.resources


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
const MatRow = ({ stageText,rowCnt,isFirst,isLast, day, assistants, upgrade, items, development, improvement }) => {

    let hishoCol = assistants.map(hisho => (
        <div className="hisho-col" key={hisho.name}>
            {hisho.name}
            {day === -1 && (
                <>
                    <br />
                    <span className="available-days">
          {hisho.dayText}
        </span>
                </>
            )}
        </div>
    ));

  let stageRow = ''
  let star = ''

   if (stageText) {
      stageRow = <span>{stageText} </span>
   }else if(upgrade.name) {
      if (upgrade.level) {
        star = <span> <FontAwesome name="star" />{` ${upgrade.level}`}</span>
      }
      stageRow = (<div>
        <SlotitemIcon slotitemId={upgrade.icon} className="equip-icon" />
        {window.i18n.resources.__(upgrade.name)}
        {star}
      </div>)
   } else {
       return ""
   }


  return (
    <tr>
      {
        isFirst &&
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
    stageText: PropTypes.string.isRequired,
    rowCnt: PropTypes.number,
    day: PropTypes.number.isRequired,
    development: PropTypes.arrayOf(PropTypes.number).isRequired,
    improvement: PropTypes.arrayOf(PropTypes.number).isRequired,
    items: PropTypes.arrayOf(PropTypes.object).isRequired,
    upgrade: PropTypes.shape({
        level: PropTypes.number.isRequired,
        icon: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
    }).isRequired,
    assistants: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            days: PropTypes.arrayOf(PropTypes.number).isRequired,
            fullWeek: PropTypes.bool,
            dayText: PropTypes.string.isRequired,
        })
    ).isRequired,
}

export { MatRow }
