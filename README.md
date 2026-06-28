# Plugin Item Improvement

Poi plugin for viewing KanColle equipment improvement schedules, complete recipe routes, costs, and required materials.

## Usage

Install the plugin through Poi, or place the package in Poi's plugin directory.

Improvement data and use-item assets are supplied by the local npm dependency `@sakura2333/kancolle-data`; the plugin does not download GitHub data at runtime.

## Development

```bash
npm ci --include=dev
npm test
npm pack --dry-run
```

The committed lockfile keeps the legacy Poi transpilation toolchain reproducible. CI tests both the locked minimum-compatible data package and the latest compatible data package.

## Publishing

Publish a compatible `@sakura2333/kancolle-data` release before publishing a plugin version that depends on it.

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
