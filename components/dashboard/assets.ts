// Path helpers for the exported Figma assets used by the dashboard chrome.
// Files live in public/assets/figma/dashboard-components/ (see docs/figma/specs/dashboard-components.md §6).
export const DS_ASSET_BASE = '/assets/figma/dashboard-components/';
export const dsAsset = (file: string) => `${DS_ASSET_BASE}${file}`;

export const DS_ICONS = {
  add: dsAsset('icon-add.svg'),
  tick: dsAsset('icon-tick.svg'),
  close: dsAsset('icon-close.svg'),
  filter: dsAsset('icon-filter.svg'),
  grid: dsAsset('icon-grid.svg'),
  calendar: dsAsset('icon-calendar.svg'),
  listView: dsAsset('icon-list-view.svg'),
  pill: dsAsset('icon-pill.svg'),
  change: dsAsset('icon-change.svg'),
  dropdown: dsAsset('icon-dropdown-arrow-up.svg'), // arrow-UP asset; flip with `-scale-y-100` for "down"
  queue: dsAsset('phone-bottom-bar-icon-queue.svg'),
  prescriptions: dsAsset('phone-bottom-bar-icon-prescriptions.svg'),
  notification: dsAsset('navbar-icon-notification.svg'),
  searchMagnifier: dsAsset('search-icon-magnifier.svg'),
  searchFilter: dsAsset('search-icon-filter.svg'),
  menuAccount: dsAsset('profile-menu-icon-account.svg'),
  menuActivity: dsAsset('profile-menu-icon-activity.svg'),
  menuPayment: dsAsset('profile-menu-icon-payment.svg'),
  menuHelp: dsAsset('profile-menu-icon-help.svg'),
  menuPrivacy: dsAsset('profile-menu-icon-privacy.svg'),
  menuCalendar: dsAsset('profile-menu-icon-calendar.svg'),
  menuLogout: dsAsset('profile-menu-icon-logout.svg'),
  logoFavicon: dsAsset('navbar-logo-favicon.svg'),
} as const;
