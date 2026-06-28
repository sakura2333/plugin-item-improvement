const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const {
  buildAssistantTextByDay,
  buildImprovementItem,
  createShipNameResolver,
  normalizeAssistant,
  normalizeListProjection,
  normalizeShipIds,
} = require('../views/improvement-data.js')


const {
  CHANGELOG,
  compareVersions,
  getChangelogEntriesSince,
} = require('../views/changelog.js')

assert.strictEqual(compareVersions('1.0.22', '1.0.21'), 1)
assert.strictEqual(compareVersions('1.0.21', '1.0.21'), 0)
assert.strictEqual(compareVersions('1.0.20', '1.0.21'), -1)
assert.deepStrictEqual(
  getChangelogEntriesSince('1.0.21').map(entry => entry.version),
  ['1.0.27', '1.0.26', '1.0.25', '1.0.24', '1.0.23', '1.0.22']
)
assert.deepStrictEqual(
  getChangelogEntriesSince(null).map(entry => entry.version),
  ['1.0.27', '1.0.26', '1.0.25', '1.0.24', '1.0.23', '1.0.22', '1.0.21']
)

const localeNames = ['zh-CN', 'zh-TW', 'ja-JP', 'en-US']
const locales = localeNames.reduce((result, localeName) => {
  const localePath = path.join(__dirname, '..', 'i18n', `${localeName}.json`)
  result[localeName] = JSON.parse(fs.readFileSync(localePath, 'utf8'))
  return result
}, {})

const changelogKeys = CHANGELOG.reduce(
  (keys, entry) => keys.concat(entry.items),
  []
)

localeNames.forEach(localeName => {
  changelogKeys.forEach(key => {
    assert.strictEqual(
      typeof locales[localeName][key],
      'string',
      `${localeName} is missing changelog entry ${key}`
    )
    assert.ok(
      locales[localeName][key].trim().length > 0,
      `${localeName} has an empty changelog entry ${key}`
    )
  })
})

const technicalTerms = [
  '@sakura2333/kancolle-data',
  'npm',
  'Schema',
  '0.1.x',
  'PNG',
  'GitHub',
]
const simplifiedChineseNotes = changelogKeys
  .map(key => locales['zh-CN'][key])
  .join('\n')
technicalTerms.forEach(term => {
  assert.strictEqual(
    simplifiedChineseNotes.includes(term),
    false,
    `user-facing changelog should not contain technical term: ${term}`
  )
})

const projectRoot = path.join(__dirname, '..')
const compatibilityIconPath = path.join(projectRoot, 'assets', 'icon', '71.png')
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
assert.ok(fs.existsSync(compatibilityIconPath), 'compatibility icon 71.png is missing')
assert.ok(
  fs.readFileSync(compatibilityIconPath).subarray(0, 8).equals(pngSignature),
  'compatibility icon 71.png is not a valid PNG'
)

const dryRunOutput = execFileSync(
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['pack', '--dry-run', '--json', '--ignore-scripts'],
  { cwd: projectRoot, encoding: 'utf8' }
)
const dryRun = JSON.parse(dryRunOutput)
const packedFiles = new Set(dryRun[0].files.map(file => file.path))
assert.ok(
  packedFiles.has('assets/icon/71.png'),
  'npm package is missing assets/icon/71.png'
)

for (const developmentOnlyPath of [
  'CHANGELOG.md',
  'REFACTOR_NOTES.md',
  'scripts/publish-beta.js',
  'tests/improvement-data.test.js',
]) {
  assert.strictEqual(
    packedFiles.has(developmentOnlyPath),
    false,
    `npm package should not contain development-only file: ${developmentOnlyPath}`
  )
}


const ships = {
  89: { api_id: 89, api_name: '鳳翔' },
  622: { api_id: 622, api_name: '夕張改二' },
  623: { api_id: 623, api_name: '夕張改二特' },
  624: { api_id: 624, api_name: '夕張改二丁' },
  718: { api_id: 718, api_name: '玉波改' },
  1033: { api_id: 1033, api_name: '玉波改二' },
}

const resolveShipName = createShipNameResolver(ships, name => `local:${name}`)

const exact = normalizeAssistant({
  id: [89],
  text: '鳳翔',
  week: [true, false, false, false, false, false, false],
}, resolveShipName)
assert.deepStrictEqual(exact.shipIds, [89])
assert.strictEqual(exact.idsComplete, true)
assert.strictEqual(exact.displayText, 'local:鳳翔')

const legacyIrregular = normalizeAssistant({
  id: [622],
  text: '夕張改二/特/丁',
  week: [true, true, true, true, true, true, true],
}, resolveShipName)
assert.strictEqual(legacyIrregular.idsComplete, false)
assert.strictEqual(legacyIrregular.displayText, '夕張改二/特/丁')

const generatedButNotConnected = normalizeAssistant({
  id: [622],
  shipIdList: [622, 623, 624],
  text: '夕張改二/特/丁',
  parseStatus: 'resolved',
  week: [true, true, true, true, true, true, true],
}, resolveShipName)
assert.strictEqual(generatedButNotConnected.idsComplete, false)
assert.strictEqual(generatedButNotConnected.displayText, '夕張改二/特/丁')

const resolvedMultiple = normalizeAssistant({
  id: [622, 623, 624],
  text: '夕張改二/特/丁',
  week: [true, true, true, true, true, true, true],
}, resolveShipName)
assert.strictEqual(resolvedMultiple.idsComplete, true)
assert.strictEqual(
  resolvedMultiple.displayText,
  'local:夕張改二 / local:夕張改二特 / local:夕張改二丁'
)

const explicitSingle = normalizeAssistant({
  id: [622],
  text: '夕張改二のみ',
  idsComplete: true,
  week: [true, true, true, true, true, true, true],
}, resolveShipName)
assert.strictEqual(explicitSingle.displayText, 'local:夕張改二')

const unknown = normalizeAssistant({
  shipIds: [9999],
  resolved: true,
  week: [true],
}, resolveShipName)
assert.strictEqual(unknown.displayText, '#9999')

assert.deepStrictEqual(normalizeShipIds({ id: ['89', 89, 0, 'bad'] }), [89])


const noSpecificAssistant = normalizeAssistant({
  id: [0],
  text: '',
  week: [true, true, false, false, false, false, false],
}, resolveShipName)
assert.deepStrictEqual(noSpecificAssistant.shipIds, [])
assert.strictEqual(noSpecificAssistant.displayText, '')
assert.deepStrictEqual(noSpecificAssistant.days, [0, 1])

const improvementList = [
  {
    assistantList: [exact, legacyIrregular],
  },
]
const textByDay = buildAssistantTextByDay(improvementList)
assert.strictEqual(textByDay[0], 'local:鳳翔 / 夕張改二/特/丁')
assert.strictEqual(textByDay[1], '夕張改二/特/丁')
assert.strictEqual(textByDay[-1], 'local:鳳翔 / 夕張改二/特/丁')

const item = buildImprovementItem({
  id: 19,
  improvementList: [
    {
      shipWeekList: [
        {
          id: [89],
          text: '鳳翔',
          week: [true, false, false, false, false, false, false],
        },
      ],
    },
  ],
}, { api_name: '九六式艦戦' }, resolveShipName)
assert.strictEqual(item.api_name, '九六式艦戦')
assert.strictEqual(item.improvementList[0].assistantList[0].displayText, 'local:鳳翔')
assert.strictEqual(item.assistantTextByDay[0], 'local:鳳翔')
assert.strictEqual(item.assistantTextByDay[1], '')


const listProjection = normalizeListProjection({
  metadata: { schemaVersion: 2 },
  data: [
    [[19, ['鳳翔', '鳳翔改二']]],
    [[19, ['鳳翔']]],
    [], [], [], [], [], [],
  ],
})
assert.deepStrictEqual(listProjection.itemIdsByDay[-1], [19])
assert.deepStrictEqual(listProjection.itemIdsByDay[0], [19])
assert.strictEqual(listProjection.assistantTextByItemId[19][-1], '鳳翔 / 鳳翔改二')
assert.strictEqual(listProjection.assistantTextByItemId[19][0], '鳳翔')

const kancolleData = require('@sakura2333/kancolle-data')

const {
  DATA_PACKAGE_NAME,
  SUPPORTED_IMPROVEMENT_LIST_SCHEMA_VERSION,
  SUPPORTED_IMPROVEMENT_SCHEMA_VERSION,
  getDataPackageManifest,
  getImprovementDataPaths,
  getUseitemIconPath,
  validateSchemaVersion,
} = require('../views/data-package.js')

const packageManifest = getDataPackageManifest()
assert.strictEqual(DATA_PACKAGE_NAME, '@sakura2333/kancolle-data')
assert.strictEqual(packageManifest.datasets.improvement.schemaVersion, 3)
assert.strictEqual(SUPPORTED_IMPROVEMENT_SCHEMA_VERSION, 3)
assert.strictEqual(SUPPORTED_IMPROVEMENT_LIST_SCHEMA_VERSION, 2)
assert.doesNotThrow(() => validateSchemaVersion(3, 3, 'fixture'))
for (const invalid of [undefined, null, NaN, 0, 1, 2, 4, 'abc']) {
  assert.throws(
    () => validateSchemaVersion(invalid, 3, 'fixture'),
    /Unsupported fixture schema/
  )
}
assert.ok(fs.existsSync(getImprovementDataPaths().listPath))
assert.ok(fs.existsSync(getImprovementDataPaths().detailPath))
assert.ok(fs.existsSync(getUseitemIconPath(57)))
const listAsset = JSON.parse(fs.readFileSync(kancolleData.improvement.listPath, 'utf8'))
const detailIds = new Set(
  fs.readFileSync(kancolleData.improvement.detailPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line).id)
)
assert.strictEqual(listAsset.metadata.schemaVersion, 2)
assert.deepStrictEqual(listAsset.metadata.rowSchema, ['itemId', 'assistantTexts'])
assert.ok(fs.existsSync(kancolleData.manifestPath))
assert.ok(fs.existsSync(kancolleData.assets.useitemPath(57)))
assert.strictEqual(listAsset.data.length, 8)
listAsset.data.forEach(rows => rows.forEach(([itemId]) => assert.ok(detailIds.has(itemId))))


const detailRows = fs.readFileSync(kancolleData.improvement.detailPath, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map(line => JSON.parse(line))
const tamanamiRouteItem = detailRows.find(row => row.id === 267)
assert.ok(tamanamiRouteItem)
assert.strictEqual(tamanamiRouteItem.improvementList.length, 2)
const normalRoute = tamanamiRouteItem.improvementList.find(route => route.routeType === 'default')
const specialRoute = tamanamiRouteItem.improvementList.find(route => route.routeType === 'assistant-specific')
assert.ok(normalRoute)
assert.ok(specialRoute)
assert.deepStrictEqual(specialRoute.routeShipIds, [1033])
assert.deepStrictEqual(specialRoute.stageList[0].consumables, [{ id: 10, count: 3, type: 0 }])
assert.deepStrictEqual(normalRoute.stageList[0].consumables, [{ id: 3, count: 2, type: 0 }])
const normalizedTamanami = buildImprovementItem(tamanamiRouteItem, { api_name: tamanamiRouteItem.name }, resolveShipName)
assert.strictEqual(normalizedTamanami.improvementList.length, 2)
assert.strictEqual(
  normalizedTamanami.improvementList.find(route => route.routeType === 'assistant-specific').assistantList[0].displayText,
  'local:玉波改二'
)

console.log('improvement-data tests passed')
