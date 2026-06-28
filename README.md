# Plugin-Item-Improvement
Show improvable items of the day
#### Usage
Put the folder into /path/to/poi/resources/app/plugins.

#### Data source
The plugin makes use of equipment improvement data from [Akashi List](https://akashi-list.me/).

## Publishing the beta package

The beta package uses a separate npm package name while keeping the source tree on the official namespace.

```bash
npm run publish:beta:dry-run
npm run publish:beta
```

`publish:beta` temporarily replaces every runtime occurrence of
`poi-plugin-item-improvement2` with `poi-plugin-item-improvement2-beta`, runs
`npm publish`, and restores the original files even when publishing fails.
Arguments after `--` are forwarded to `npm publish`.

## Data package

Improvement data and use-item PNG assets are supplied by the versioned npm dependency
`@sakura2333/kancolle-data`. The plugin no longer downloads data from GitHub at runtime.
Publish the data package before publishing a plugin version that depends on it.
