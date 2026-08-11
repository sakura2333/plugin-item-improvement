## [Unreleased]

### Planned

- Add consumer views for equipment acquisition sources and special ship bonuses when their compatibility contracts are frozen.

## [1.1.2] - 2026-08-11

### Fixed

- Updated the independent data updater to accept both WebP and legacy PNG use-item assets.
- Resolved use-item icon paths from the downloaded manifest instead of assuming a `.png` extension, so current `improvement2` releases can pass validation and activate normally.
- A previous data-update error now triggers an immediate retry on the next plugin/Poi startup instead of waiting for the normal one-hour interval.

## [1.1.1] - 2026-08-10

### Changed

- Removed `@sakura2333/kancolle-data` from the plugin's runtime npm dependencies.
- Added a bundled, validated `improvement2` snapshot so first launch and offline launch always have compatible local data.
- Added an independent background updater that resolves the npm `improvement2` dist-tag, downloads the exact tarball, verifies registry integrity, extracts only the improvement dataset and use-item icons, validates exact schema/content contracts, and atomically switches the active cache.
- Data update checks are rate-limited to once per hour and do not block plugin startup. A validated update is hot-reloaded into the open improvement window through a lightweight Redux refresh event.
- Updated CI to test the self-contained bundled-data/updater model instead of reinstalling an external data dependency.

### Safety

- Incompatible, incomplete, corrupted, oversized, timed-out, or unreachable updates leave the current dataset untouched.
- Cache activation uses a validated version directory plus an atomic pointer file; a missing or corrupt active cache falls back to the bundled snapshot.
- The updater keeps the newly active cache and the previously used version while pruning older cached versions.

## [1.0.27] - 2026-06-28

### Added

- Added GitHub Actions coverage for reproducible dependency installation, transpilation, tests, official package inspection, beta dry-run, and latest compatible data-package verification.
- Added exact validation for improvement detail schema 3 and list schema 2.
- Added package tests that reject accidentally published development scripts, tests, and engineering notes.

### Changed

- Expanded the compatible data-package range to `>=0.1.0 <0.3.0`, allowing the plugin to use data package 0.2.x while still rejecting the next compatibility boundary.
- Started tracking `package-lock.json` for reproducible legacy build-tool installation.
- Updated the npm package description to explain the user-facing plugin purpose.
- Reduced the published package allowlist to runtime JavaScript, assets, localization files, and the user README; technical `CHANGELOG.md` and refactor notes remain in the source repository only.

### Fixed

- Fixed missing, non-numeric, zero, older, or otherwise incompatible improvement schema values being accepted because the previous check rejected only values greater than 3.
- Fixed list data accepting an unexpected row schema before normalization.

## [1.0.26] - 2026-06-28

### Fixed

- Ensured the local use-item 71 compatibility PNG is explicitly included in official and beta npm packages.
- Re-encoded the unchanged icon pixels so Git patches and repository updates physically carry the binary asset instead of relying on an existing working-tree copy.

### Changed

- Added an explicit npm `files` allowlist covering runtime JavaScript, localized resources, styles, and all icon assets.

### Validation

- Added a package dry-run assertion that fails when `assets/icon/71.png` is absent from the npm tarball file list.
- Added PNG signature validation for the compatibility icon.

## [1.0.25] - 2026-06-28

### Changed

- Rewrote the in-app release notes to describe user-visible behavior instead of npm, schema, repository, and packaging implementation details.
- Added localized user-facing release-note copy for Simplified Chinese, Traditional Chinese, Japanese, and English.
- Kept detailed engineering changes in this repository `CHANGELOG.md` for development and release auditing.

### Validation

- Added coverage that every in-app changelog key exists in all supported locales.
- Added coverage preventing technical package terminology from leaking back into the Simplified Chinese in-app release notes.

## [1.0.24] - 2026-06-28

### Changed

- Relaxed the shared data dependency from exact `0.1.0` to the compatible `^0.1.0` range.
- New plugin installs and dependency refreshes can now consume automatically published `0.1.x` data-only patch releases without requiring a plugin release for every dataset refresh.

### Compatibility

- Data package minor/schema releases remain blocked until the plugin explicitly updates its supported dependency range and schema checks.
- Existing installed plugins still need their dependency installation to be refreshed before npm can resolve a newer data patch.

## [1.0.23] - 2026-06-28

### Added

- Added the versioned `@sakura2333/kancolle-data@0.1.0` runtime dependency.
- Added a data-package adapter that exposes improvement list/detail paths and validates the supported improvement schema.
- Added shared use-item icon lookup through the data package.

### Changed

- Moved improvement list data, improvement detail data, and most use-item PNG assets out of the plugin package.
- Removed runtime GitHub data synchronization; all required data is installed locally by npm.
- Changed official and beta builds to consume the same versioned data package.
- Reduced the plugin tarball from the historical embedded-data size to a lightweight code package.
- Kept the local `71.png` and generic SVG as temporary compatibility assets.

### Fixed

- Fixed plugin startup being dependent on GitHub Raw availability and network conditions.
- Fixed data and PNG updates requiring duplicate copies in the Spider and plugin repositories.

### Compatibility

- Requires `@sakura2333/kancolle-data` with a supported improvement schema.
- Publish the data package before publishing a plugin version that depends on it.

## [1.0.22] - 2026-06-28

### Added

- Added a localized release-notes dialog shown once after a version change.
- Added a toolbar entry for reopening the release notes manually.
- Added `publish:beta` and `publish:beta:dry-run` scripts.

### Changed

- Beta publishing temporarily changes package and runtime namespaces to `poi-plugin-item-improvement2-beta` and always restores the working tree afterward.

## [1.0.21] - 2026-06-28

### Added

- Added separate list and detail data projections.
- Added support for multiple independent improvement recipe routes.
- Added the Tamanami Kai Ni assistant-specific material route.

### Changed

- Changed the detail UI to render one table per complete recipe route.
- Unified list and detail assistant presentation through normalized view models.

### Fixed

- Fixed routes with different materials, costs, or upgrade targets sharing the first route's table header.
- Fixed the default route and Tamanami Kai Ni route being merged back together in the UI.
