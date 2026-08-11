const pluginPackage = require('../package.json')

export const CURRENT_VERSION = pluginPackage.version
export const CHANGELOG_CONFIG_KEY = 'poi-plugin-item-improvement2.lastSeenChangelogVersion'
export const CHANGELOG_BASELINE_VERSION = '1.0.20'

// Keep in-app notes focused on user-visible behavior. Engineering details belong in CHANGELOG.md.
export const CHANGELOG = [
  {
    version: '1.1.4',
    items: [
      'changelog_1_1_4_auto_data_update',
    ],
  },
  {
    version: '1.0.27',
    items: [
      'changelog_1_0_27_data_safety',
    ],
  },
  {
    version: '1.0.26',
    items: [
      'changelog_1_0_26_useitem_icon',
    ],
  },
  {
    version: '1.0.25',
    items: [
      'changelog_1_0_25_user_focused',
    ],
  },
  {
    version: '1.0.24',
    items: [
      'changelog_1_0_24_compatible_data_updates',
    ],
  },
  {
    version: '1.0.23',
    items: [
      'changelog_1_0_23_offline_ready',
      'changelog_1_0_23_network_resilience',
      'changelog_1_0_23_consistent_data',
    ],
  },
  {
    version: '1.0.22',
    items: [
      'changelog_1_0_22_auto_notes',
      'changelog_1_0_22_reopen_notes',
    ],
  },
  {
    version: '1.0.21',
    items: [
      'changelog_1_0_21_stable_data',
      'changelog_1_0_21_separate_routes',
      'changelog_1_0_21_tamanami_route',
    ],
  },
]

const normalizeVersion = version => String(version || '')
  .replace(/^v/i, '')
  .split('.')
  .map(part => Number.parseInt(part, 10) || 0)

export const compareVersions = (left, right) => {
  const a = normalizeVersion(left)
  const b = normalizeVersion(right)
  const length = Math.max(a.length, b.length)

  for (let index = 0; index < length; index += 1) {
    const leftPart = a[index] || 0
    const rightPart = b[index] || 0

    if (leftPart > rightPart) return 1
    if (leftPart < rightPart) return -1
  }

  return 0
}

export const getChangelogEntriesSince = lastSeenVersion => {
  const baseline = lastSeenVersion || CHANGELOG_BASELINE_VERSION

  return CHANGELOG.filter(entry => (
    compareVersions(entry.version, baseline) > 0
    && compareVersions(entry.version, CURRENT_VERSION) <= 0
  ))
}
