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

const getTypeId = $equip => $equip.api_type[2]
const getIconId = $equip => $equip.api_type[3]

// prepare equipment type related information for further processing
const prepareEquipTypeInfo = (equips, rawTypes) => {
  const mergedTypes = {}

  // 遍历装备，生成对应的 typeEntry
  Object.values(equips).forEach(equip => {
    const typeId = getTypeId(equip)

    // 如果 typeEntry 还没生成，从 rawTypes 中找值
    if (!mergedTypes[typeId]) {
      // 在 rawTypes 中找对应 type
      const rawType = Object.values(rawTypes).find(t => t.api_id === typeId)
      if (!rawType) return

      mergedTypes[typeId] = {
        ...rawType,
        equips: []
      }
    }

    // 推入装备信息
    const iconId = getIconId(equip)
    mergedTypes[typeId].equips.push({
      id: equip.api_id,
      name: equip.api_name,
      iconId,
    })
  })

  return mergedTypes
}


export {
  getIconId,
  prepareEquipTypeInfo,
}
