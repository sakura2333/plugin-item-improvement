import { ItemInfoArea } from './views/item-info-area'

const { config } = window


export const windowMode = true
export const reactClass = ItemInfoArea
export const windowOptions = {
  x: config.get('poi.window.x', 0),
  y: config.get('poi.window.y', 0),
  width: 820,
  height: 650,
}
