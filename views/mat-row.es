import React from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import { SlotitemIcon } from 'views/components/etc/icon'
import { UseitemIcon } from './useitem-icon'

const { __ } = window.i18n['poi-plugin-item-improvement2']
const { __: __r } = window.i18n.resources


const ItemIcon = ({ item, ...props }) => {
  if (item.type === 'useitem') {
    return (
      <UseitemIcon
        useitemId={item.icon}
        className="useitem"
        {...props}
      />
    )
  }

  if (item.icon) {
    return (
      <SlotitemIcon
        slotitemId={item.icon}
        className="equip-icon"
        {...props}
      />
    )
  }

  return <span className="missing-equip-icon">{`#${item.id}`}</span>
}

ItemIcon.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    icon: PropTypes.number,
  }).isRequired,
}

// React Elements
const MatRow = ({ stageText,rowCnt,isFirst, day, assistants, upgrade, items, development, improvement }) => {

    let hishoCol = assistants.map(assistant => (
        (assistant.days.includes(day) || day === -1) && (<div className="hisho-col" key={assistant.name}>
            {assistant.name}
            {day === -1 && (
                <>
                    <br />
                    <span className="available-days">
          {assistant.dayText}
        </span>
                </>
            )}
        </div>)
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
        {!!upgrade.icon && <SlotitemIcon slotitemId={upgrade.icon} className="equip-icon" />}
        {window.i18n.resources.__(upgrade.name)}
        {star}
      </div>)
   } else {
       return null
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
              <div key={`${item.type}-${item.id}`}>
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
        icon: PropTypes.number,
        id: PropTypes.number.isRequired,
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
