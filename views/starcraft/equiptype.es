/*

   Equipment type related functions

   - Overview

   In "api_mst_slotitem" of "api_start2", equipment type is defined by "api_type",
   which is an array of length 5 - so there are really 5 different equipment types
   that one equipment can have.

     - api_type[0]

         Gives a general equipment type, without getting too much into finer details.
         for example it doesn't distinguish main gun and secondary gun.

     - api_type[1]

         A little more precise than api_type[0]. it distinguishes main
         and secondary gun, but does not distinguish between seaplanes.
         (however seaplane fighter does has its own type in this one)

     - api_type[2]: "category"

         One of the most commonly used equipment type, we will be referring to this
         using term "category". It's the category used in in-game picture book.

     - api_type[3]: "icon"

         Another most commonly used equipment type. Will be referring to this using "icon"
         This is the equipment icon id used in game.

         Despite that some equipment has the same icon, game mechanism treats them differently.
         For example some high-angle gun mounts (abbr. HA) are actually
         small-caliber main guns while other HAs are secondary guns.
         This is where having notions of both "Category" and "Icon" could be useful.

     - api_type[4]

         Mainly used by aircrafts. Currently I see no need of getting into this.

   - Terms

     - category: api_type[2], see above.
     - icon: api_type[3], see above.

     - EquipTypeInfo: a structured data

       - catInfo: an object indexed by api_type[2]. its element has the following structure:

         - group: a collection of master ids of equipments of having that icon
         - icons: all icon ids used by this group of equipments

       - iconInfo: an object indexed by api_type[3], with each element
         being a collection of master ids of equipments of having that icon

 */

const getCatId = $equip => $equip.api_type[2]
const getIconId = $equip => $equip.api_type[3]

// prepare equipment type related information for further processing
const prepareEquipTypeInfo = ($equips , improvableIds) => {
  const catInfo = {}
  const iconInfo = {}

  // first pass, sets everything but "catInfo[?].icons"
  Object.keys( $equips ).map( k => {
    const equip = $equips[k]
    // excluding abyssal equipments
    if (improvableIds && !improvableIds.has(Number(equip.api_id))) {
      return;
    }
    const catId = getCatId( equip )
    const iconId = getIconId( equip )

    let cat = catInfo[catId]
    if (typeof cat === 'undefined')
      cat = {group: []}
    let icon = iconInfo[iconId]
    if (typeof icon === 'undefined')
      icon = []

    cat.group.push( equip.api_id )
    icon.push( equip.api_id )

    catInfo[catId] = cat
    iconInfo[iconId] = icon
  })

  // second pass, finishing "catInfo[?].icons"
  Object.keys( catInfo ).map( k => {
    const cat = catInfo[k]
    const icons = []
    cat.group.map( mstId => {
      const equip = $equips[mstId]
      const iconId = getIconId( equip )
      if (icons.indexOf( iconId ) === -1)
        icons.push( iconId )
    })
    cat.icons = icons.sort()
  })

  return {
    catInfo,
    iconInfo,
  }
}

export {
  getCatId,
  getIconId,
  prepareEquipTypeInfo,
}
