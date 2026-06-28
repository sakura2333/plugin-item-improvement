# Data package and route-aware UI

## Runtime data

The plugin consumes the versioned npm dependency `@sakura2333/kancolle-data`:

- `improvement/list.json`: compact all + seven-day list projection.
- `improvement/detail.nedb`: full equipment detail and recipe routes.
- `assets/useitems/*.png`: shared use-item icons.

The plugin no longer downloads GitHub files at runtime and no longer carries duplicate
improvement datasets. `assets/icon/useitem.svg` remains the generic fallback; the legacy
`71.png` is temporarily retained until it is present in the data package.

## Responsibility boundary

- Spider collects and validates sources, normalizes assistant IDs, splits concrete recipes,
  and publishes `@sakura2333/kancolle-data`.
- The data package exposes stable local paths and dataset manifests.
- The plugin reads the installed package, validates the supported improvement schema, and
  maps the data into UI view models.
- The list page reads backend-provided `[itemId, assistantTexts]` rows.
- The detail page displays every `improvementList[]` entry as one independent route.

## Multiple route support

`DetailRow` renders one table per improvement route. Each table uses its own base resources,
stage costs, consumables, MAX target, and assistant schedule. This supports assistant-specific
recipes such as the `玉波改二` route for `12.7cm連装砲D型改二`.

## Publish order

1. Build and publish `@sakura2333/kancolle-data` from the Spider repository.
2. Install development dependencies for this plugin.
3. Run tests and publish the official or beta plugin.

```bash
npm ci --include=dev
npm test
npm publish
# or
npm run publish:beta
```
