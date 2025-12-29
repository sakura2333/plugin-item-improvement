"use strict";

exports.__esModule = true;
exports.windowOptions = exports.reactClass = exports.windowMode = void 0;

var _itemInfoArea = require("./views/item-info-area");

const {
  config
} = window;
const windowMode = true;
exports.windowMode = windowMode;
const reactClass = _itemInfoArea.ItemInfoArea;
exports.reactClass = reactClass;
const windowOptions = {
  x: config.get('poi.window.x', 0),
  y: config.get('poi.window.y', 0),
  width: 820,
  height: 650
};
exports.windowOptions = windowOptions;