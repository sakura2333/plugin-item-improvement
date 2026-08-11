const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const zlib = require('zlib')
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
  ['1.1.3', '1.1.2', '1.1.1', '1.0.27', '1.0.26', '1.0.25', '1.0.24', '1.0.23', '1.0.22']
)
assert.deepStrictEqual(
  getChangelogEntriesSince(null).map(entry => entry.version),
  ['1.1.3', '1.1.2', '1.1.1', '1.0.27', '1.0.26', '1.0.25', '1.0.24', '1.0.23', '1.0.22', '1.0.21']
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
const compatibilityIconPath = path.join(projectRoot, 'assets', 'icon', '71.webp')
const compatibilityIconBytes = fs.readFileSync(compatibilityIconPath)
assert.ok(fs.existsSync(compatibilityIconPath), 'compatibility icon 71.webp is missing')
assert.strictEqual(compatibilityIconBytes.subarray(0, 4).toString('ascii'), 'RIFF')
assert.strictEqual(compatibilityIconBytes.subarray(8, 12).toString('ascii'), 'WEBP')

const dryRunOutput = execFileSync(
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['pack', '--dry-run', '--json', '--ignore-scripts'],
  { cwd: projectRoot, encoding: 'utf8' }
)
const dryRun = JSON.parse(dryRunOutput)
const packedFiles = new Set(dryRun[0].files.map(file => file.path))
assert.ok(
  packedFiles.has('assets/icon/71.webp'),
  'npm package is missing assets/icon/71.webp'
)
assert.ok(
  packedFiles.has('data/kancolle-data/manifest.json'),
  'npm package is missing bundled data manifest'
)
assert.ok(
  packedFiles.has('data/kancolle-data/improvement/list.json'),
  'npm package is missing bundled improvement list'
)
assert.ok(
  packedFiles.has('data/kancolle-data/improvement/detail.nedb'),
  'npm package is missing bundled improvement detail'
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

const pluginPackage = require('../package.json')
assert.strictEqual(pluginPackage.version, '1.1.3')
assert.strictEqual(
  Object.prototype.hasOwnProperty.call(pluginPackage.dependencies, '@sakura2333/kancolle-data'),
  false,
  'runtime data package must not remain an npm dependency'
)

const {
  DATA_PACKAGE_NAME,
  DATA_PACKAGE_TAG,
  SUPPORTED_IMPROVEMENT_LIST_SCHEMA_VERSION,
  SUPPORTED_IMPROVEMENT_SCHEMA_VERSION,
  getBundledDataRoot,
  getDataPackageManifest,
  getDataPackageVersion,
  getImprovementDataPaths,
  getUseitemIconPath,
  validateSchemaVersion,
} = require('../views/data-package.js')

const packageManifest = getDataPackageManifest()
assert.strictEqual(DATA_PACKAGE_NAME, '@sakura2333/kancolle-data')
assert.strictEqual(DATA_PACKAGE_TAG, 'improvement2')
assert.strictEqual(packageManifest.datasets.improvement.schemaVersion, 3)
assert.strictEqual(SUPPORTED_IMPROVEMENT_SCHEMA_VERSION, 3)
assert.strictEqual(SUPPORTED_IMPROVEMENT_LIST_SCHEMA_VERSION, 2)
assert.strictEqual(getDataPackageVersion(), packageManifest.packageVersion)
assert.doesNotThrow(() => validateSchemaVersion(3, 3, 'fixture'))
for (const invalid of [undefined, null, NaN, 0, 1, 2, 4, 'abc']) {
  assert.throws(
    () => validateSchemaVersion(invalid, 3, 'fixture'),
    /Unsupported fixture schema/
  )
}
const dataPaths = getImprovementDataPaths()
assert.ok(dataPaths.listPath.startsWith(getBundledDataRoot()))
assert.ok(dataPaths.detailPath.startsWith(getBundledDataRoot()))
assert.ok(fs.existsSync(dataPaths.listPath))
assert.ok(fs.existsSync(dataPaths.detailPath))
assert.ok(fs.existsSync(getUseitemIconPath(57)))
const listAsset = JSON.parse(fs.readFileSync(dataPaths.listPath, 'utf8'))
const detailIds = new Set(
  fs.readFileSync(dataPaths.detailPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line).id)
)
assert.strictEqual(listAsset.metadata.schemaVersion, 2)
assert.deepStrictEqual(listAsset.metadata.rowSchema, ['itemId', 'assistantTexts'])
assert.ok(fs.existsSync(require('path').join(getBundledDataRoot(), 'manifest.json')))
assert.strictEqual(listAsset.data.length, 8)
listAsset.data.forEach(rows => rows.forEach(([itemId]) => assert.ok(detailIds.has(itemId))))

const { validateDataRoot } = require('../views/data-package-validator.js')
assert.doesNotThrow(() => validateDataRoot(getBundledDataRoot()))


const legacyPngFixtureRoot = fs.mkdtempSync(path.join(require('os').tmpdir(), 'improvement-data-png-'))
try {
  copyTree(getBundledDataRoot(), legacyPngFixtureRoot)
  const legacyManifestPath = path.join(legacyPngFixtureRoot, 'manifest.json')
  const legacyManifest = JSON.parse(fs.readFileSync(legacyManifestPath, 'utf8'))
  Object.keys(legacyManifest.files || {}).forEach(relativePath => {
    if (!/^assets\/useitems\/[^/]+\.webp$/i.test(relativePath)) return
    const pngRelativePath = relativePath.replace(/\.webp$/i, '.png')
    const webpPath = path.join(legacyPngFixtureRoot, relativePath)
    const pngPath = path.join(legacyPngFixtureRoot, pngRelativePath)
    fs.renameSync(webpPath, pngPath)
    legacyManifest.files[pngRelativePath] = legacyManifest.files[relativePath]
    delete legacyManifest.files[relativePath]
  })
  fs.writeFileSync(legacyManifestPath, JSON.stringify(legacyManifest))
  const validatedLegacyPng = validateDataRoot(legacyPngFixtureRoot)
  assert.ok(validatedLegacyPng.useitemPath(2).endsWith(`${path.sep}2.png`))
  assert.ok(fs.existsSync(validatedLegacyPng.useitemPath(2)))
} finally {
  fs.rmSync(legacyPngFixtureRoot, { recursive: true, force: true })
}

const stalePngManifestFixtureRoot = fs.mkdtempSync(path.join(require('os').tmpdir(), 'improvement-data-stale-png-manifest-'))
try {
  copyTree(getBundledDataRoot(), stalePngManifestFixtureRoot)
  const staleManifestPath = path.join(stalePngManifestFixtureRoot, 'manifest.json')
  const staleManifest = JSON.parse(fs.readFileSync(staleManifestPath, 'utf8'))
  Object.keys(staleManifest.files || {}).forEach(relativePath => {
    if (!/^assets\/useitems\/[^/]+\.webp$/i.test(relativePath)) return
    const pngRelativePath = relativePath.replace(/\.webp$/i, '.png')
    staleManifest.files[pngRelativePath] = staleManifest.files[relativePath]
    delete staleManifest.files[relativePath]
  })
  fs.writeFileSync(staleManifestPath, JSON.stringify(staleManifest))
  const validatedStaleManifest = validateDataRoot(stalePngManifestFixtureRoot)
  assert.ok(validatedStaleManifest.useitemPath(2).endsWith(`${path.sep}2.webp`))
} finally {
  fs.rmSync(stalePngManifestFixtureRoot, { recursive: true, force: true })
}

function copyTree(source, destination) {
  fs.mkdirSync(destination, { recursive: true })
  fs.readdirSync(source).forEach(name => {
    const sourcePath = path.join(source, name)
    const destinationPath = path.join(destination, name)
    if (fs.statSync(sourcePath).isDirectory()) copyTree(sourcePath, destinationPath)
    else fs.copyFileSync(sourcePath, destinationPath)
  })
}

const cacheHome = fs.mkdtempSync(path.join(require('os').tmpdir(), 'improvement-data-cache-'))
try {
  const cacheRoot = path.join(
    cacheHome,
    'plugin-data',
    'poi-plugin-item-improvement2',
    'kancolle-data'
  )
  const cachedVersionRoot = path.join(
    cacheRoot,
    'versions',
    packageManifest.packageVersion
  )
  copyTree(getBundledDataRoot(), cachedVersionRoot)
  fs.writeFileSync(
    path.join(cacheRoot, 'active.json'),
    JSON.stringify({ version: packageManifest.packageVersion })
  )

  const probe = `
    const dataPackage = require(${JSON.stringify(path.join(projectRoot, 'views', 'data-package.js'))});
    process.stdout.write(dataPackage.getImprovementDataPaths().listPath);
  `
  const cachedListPath = execFileSync(process.execPath, ['-e', probe], {
    encoding: 'utf8',
    env: { ...process.env, POI_ITEM_IMPROVEMENT_DATA_HOME: cacheHome },
  })
  assert.ok(cachedListPath.startsWith(cachedVersionRoot))

  const cachedManifestPath = path.join(cachedVersionRoot, 'manifest.json')
  const incompatibleManifest = JSON.parse(fs.readFileSync(cachedManifestPath, 'utf8'))
  incompatibleManifest.datasets.improvement.schemaVersion = 999
  fs.writeFileSync(cachedManifestPath, JSON.stringify(incompatibleManifest))
  const fallbackListPath = execFileSync(process.execPath, ['-e', probe], {
    encoding: 'utf8',
    env: { ...process.env, POI_ITEM_IMPROVEMENT_DATA_HOME: cacheHome },
  })
  assert.ok(fallbackListPath.startsWith(getBundledDataRoot()))
} finally {
  fs.rmSync(cacheHome, { recursive: true, force: true })
}

const { extractRequiredFilesFromTarGz } = require('../views/data-updater.js')

function tarOctal(value, width) {
  return `${value.toString(8).padStart(width - 1, '0')}\0`
}

function buildTarEntry(name, content) {
  const header = Buffer.alloc(512)
  header.write(name, 0, 100, 'utf8')
  header.write(tarOctal(0o644, 8), 100, 8, 'ascii')
  header.write(tarOctal(0, 8), 108, 8, 'ascii')
  header.write(tarOctal(0, 8), 116, 8, 'ascii')
  header.write(tarOctal(content.length, 12), 124, 12, 'ascii')
  header.write(tarOctal(Math.floor(Date.now() / 1000), 12), 136, 12, 'ascii')
  header.fill(0x20, 148, 156)
  header[156] = '0'.charCodeAt(0)
  header.write('ustar', 257, 5, 'ascii')
  let checksum = 0
  for (let index = 0; index < header.length; index += 1) checksum += header[index]
  header.write(`${checksum.toString(8).padStart(6, '0')}\0 `, 148, 8, 'ascii')
  const padding = Buffer.alloc((512 - (content.length % 512)) % 512)
  return Buffer.concat([header, content, padding])
}

const tarEntries = [
  'manifest.json',
  'improvement/list.json',
  'improvement/detail.nedb',
].concat(
  fs.readdirSync(path.join(getBundledDataRoot(), 'assets', 'useitems'))
    .map(name => `assets/useitems/${name}`)
)
const tarBuffer = Buffer.concat(
  tarEntries.map(relativePath => buildTarEntry(
    `package/${relativePath}`,
    fs.readFileSync(path.join(getBundledDataRoot(), relativePath))
  )).concat([Buffer.alloc(1024)])
)
const extractionRoot = fs.mkdtempSync(path.join(require('os').tmpdir(), 'improvement-data-extract-'))
try {
  const extracted = extractRequiredFilesFromTarGz(zlib.gzipSync(tarBuffer), extractionRoot)
  assert.ok(extracted.has('manifest.json'))
  assert.ok(extracted.has('improvement/list.json'))
  assert.ok(extracted.has('improvement/detail.nedb'))
  assert.doesNotThrow(() => validateDataRoot(extractionRoot))
} finally {
  fs.rmSync(extractionRoot, { recursive: true, force: true })
}

const webpExtractionRoot = fs.mkdtempSync(path.join(require('os').tmpdir(), 'improvement-data-webp-extract-'))
try {
  const extracted = extractRequiredFilesFromTarGz(zlib.gzipSync(tarBuffer), webpExtractionRoot)
  assert.ok(extracted.has('assets/useitems/2.webp'))
  assert.strictEqual(extracted.has('assets/useitems/2.png'), false)
} finally {
  fs.rmSync(webpExtractionRoot, { recursive: true, force: true })
}


const detailRows = fs.readFileSync(dataPaths.detailPath, 'utf8')
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
