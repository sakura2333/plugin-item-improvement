# Self-managed data cache and route-aware UI

## Runtime data

The plugin does not install `@sakura2333/kancolle-data` as a runtime npm dependency.
It owns the consumer-side lifecycle for the `improvement2` compatibility channel:

- `data/kancolle-data/`: bundled validated snapshot used for first launch and offline fallback.
- Poi user-data cache: downloaded exact package versions stored under the plugin's own cache namespace.
- `active.json`: atomic pointer to the validated cached version currently selected by the plugin.

The runtime only consumes:

- `improvement/list.json`: compact all + seven-day list projection.
- `improvement/detail.nedb`: full equipment detail and recipe routes.
- `assets/useitems/*.webp`: shared use-item icons, preserving the upstream package path.

The updater checks the npm registry in the background, follows the `improvement2` dist-tag to an exact
version, verifies package integrity, extracts only the allowlisted files, validates the supported schemas
and content hashes/references, then atomically activates the cache. Network, integrity, extraction, or
compatibility failures leave the current data untouched.

## Responsibility boundary

- Spider collects and validates sources, normalizes assistant IDs, splits concrete recipes, and publishes
  the compatibility projection to `@sakura2333/kancolle-data` under the `improvement2` channel.
- The plugin owns download timing, cache persistence, compatibility validation, activation, fallback, and
  hot refresh of the open improvement window.
- The list page reads backend-provided `[itemId, assistantTexts]` rows.
- The detail page displays every `improvementList[]` entry as one independent route.

## Multiple route support

`DetailRow` renders one table per improvement route. Each table uses its own base resources,
stage costs, consumables, MAX target, and assistant schedule. This supports assistant-specific
recipes such as the `玉波改二` route for `12.7cm連装砲D型改二`.

## Publish order

Data and plugin releases are independent. A compatible data release can move the
`improvement2` dist-tag without publishing a new plugin version.

Plugin release:

```bash
npm install --include=dev
npm test
npm publish
# or
npm run publish:beta
```
