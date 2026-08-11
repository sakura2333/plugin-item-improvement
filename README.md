# Plugin Item Improvement

Poi plugin for viewing KanColle equipment improvement schedules, complete recipe routes, costs, and required materials.

## Usage

Install the plugin through Poi, or place the package in Poi's plugin directory.

The plugin ships with a validated improvement-data snapshot for immediate offline startup. After startup it checks the `@sakura2333/kancolle-data` `improvement2` channel in the npm registry at most once per hour, downloads an exact package tarball when the channel changes, verifies package integrity plus the supported data schemas/content, and atomically activates the new cached snapshot. Failed or incompatible updates never replace the currently usable data.

## Development

```bash
npm install --include=dev
npm test
npm pack --dry-run
```

The runtime plugin no longer installs `@sakura2333/kancolle-data` as an npm dependency. Development tests validate the bundled compatibility snapshot and the updater/cache contract.

## Publishing

Publish compatible data to the `@sakura2333/kancolle-data` `improvement2` dist-tag. Plugin releases and data releases are independent after 1.1.9.

Official package:

```bash
npm test
npm publish --registry=https://registry.npmjs.org/
```

Beta package:

```bash
npm run publish:beta:dry-run
npm run publish:beta
```

The beta script temporarily changes the package and runtime namespace to `poi-plugin-item-improvement2-beta`, publishes it, and restores the source tree even when publication fails.
