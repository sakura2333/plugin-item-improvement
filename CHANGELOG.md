# Changelog

All notable changes to `poi-plugin-item-improvement2` are documented here.

## [Unreleased]

### Planned

- Add consumer views for equipment acquisition sources and special ship bonuses from `@sakura2333/kancolle-data`.
- Remove the remaining local compatibility icon after the shared data package contains it.

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
