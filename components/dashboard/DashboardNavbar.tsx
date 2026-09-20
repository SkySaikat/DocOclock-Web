/**
 * Navbar - Dashboard (Figma 396:12116): 49px tall bar, `Logo` left / white `Navlinks` pill centred in the remaining space / white `Misc. Icons` pill right.
 * Sticky (the static Figma frames can't express scrolling; the previous app kept navigation reachable, so we do too): at md+ the 48px top gutter scrolls away
 * (top:-36px) and the pills stay 12px from the viewport top; content scrolling underneath is blurred.
 * <DashboardNavbar onLogoClick navItems activeId onSelectNav hideWordmarkOnLg>{misc cells}</DashboardNavbar>
 * `children` fill the 96x49 Misc pill (two `flex-1` 44px cells: bell + avatar, see NotificationBell variant="dashboard" and AvatarMenu).
 * Below `lg` the Navlinks pill is hidden (phones/tablets use BottomTabBar). Page gutters follow Figma's Body: padding 48/64 (16/24 on phones).
 * It is a <nav> so index.css's modal-open rule hides it while a modal is open.
 */
import React from 'react';
import { NavLinksPill, NavLinkItem } from './NavLink';
import { DS_ICONS } from './assets';

interface DashboardNavbarProps {
  onLogoClick: () => void;
  navItems?: NavLinkItem[];
  activeId?: string | null;
  onSelectNav?: (id: string) => void;
  navAriaLabel?: string;
  /** Hide the "Dococlock" wordmark between lg and xl (only needed when the Navlinks pill is wide, e.g. the 6-tab doctor bar). */
  hideWordmarkOnLg?: boolean;
  children?: React.ReactNode;
}

export const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ onLogoClick, navItems, activeId, onSelectNav, navAriaLabel = 'Primary', hideWordmarkOnLg = false, children }) => (
  <nav aria-label="Main" className="sticky top-0 md:top-[-36px] z-[55] w-full max-w-[1440px] mx-auto px-6 md:px-16 pt-4 md:pt-12 backdrop-blur-md">
    <div className="flex items-center justify-between gap-4 h-[49px]">
      <button
        type="button"
        onClick={onLogoClick}
        aria-label="Dococlock home"
        className="flex items-center gap-2 shrink-0 cursor-pointer rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      >
        <img src={DS_ICONS.logoFavicon} alt="" width={40} height={40} className="size-10" />
        <span className={`font-inter text-[16px] leading-[normal] text-ink-800 ${hideWordmarkOnLg ? 'lg:max-xl:hidden' : ''}`}>Dococlock</span>
      </button>
      {navItems && navItems.length > 0 && onSelectNav && (
        <NavLinksPill className="hidden lg:flex" items={navItems} activeId={activeId} onSelect={onSelectNav} ariaLabel={navAriaLabel} />
      )}
      <div className="bg-white rounded-2xl flex items-center gap-2 w-24 h-full shrink-0">{children}</div>
    </div>
  </nav>
);
